import { Router, Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma/index';
import { authenticateToken } from '../middleware/auth';
import { transliterate } from '../utils/transliterate';

const router = Router();
const prisma = new PrismaClient();


/**
 * GET /api/shipments
 * List shipments with pagination and filtering
 */
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            page = '1',
            limit = '10',
            sort = 'created_at',
            order = 'desc',
            status,
        } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const where: any = {
            company_id: req.user!.companyId,
        };

        if (status) {
            where.status = status;
        }

        const orderBy: any = {};
        orderBy[sort as string] = order;

        const [shipments, total] = await Promise.all([
            prisma.shipments.findMany({
                where,
                skip,
                take: limitNum,
                orderBy,
                include: {
                    devices: {
                        select: {
                            id: true,
                            asset_id: true,
                            model: true,
                            serial_number: true,
                            status: true,
                        },
                    },
                    vendors: {
                        select: {
                            name: true,
                        },
                    },
                },
            }),
            prisma.shipments.count({ where }),
        ]);

        res.json({
            success: true,
            data: shipments,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        console.error('Error fetching shipments:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch shipments',
        });
    }
});

/**
 * GET /api/shipments/:id
 * Get single shipment by ID
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const shipment = await prisma.shipments.findUnique({
            where: { id },
            include: {
                devices: true,
            },
        });

        if (!shipment) {
            res.status(404).json({
                success: false,
                error: 'Shipment not found',
            });
            return;
        }

        if (shipment.company_id !== req.user!.companyId) {
            res.status(403).json({
                success: false,
                error: 'Access denied',
            });
            return;
        }

        res.json({
            success: true,
            data: shipment,
        });
    } catch (error) {
        console.error('Error fetching shipment:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch shipment',
        });
    }
});

router.post('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            shipment_name,
            vendor_id,
            delivery_date,
            device_count,
            notes,
        } = req.body;

        if (!shipment_name || !delivery_date || !device_count) {
            res.status(400).json({
                success: false,
                error: 'Missing required fields: shipment_name, delivery_date, device_count',
            });
            return;
        }

        // Generate shipment code
        const shipment_code = `SHP-${Date.now().toString().slice(-6)}`;

        // Get prefix for Asset ID
        let prefix = "D"; // Default
        if (vendor_id) {
            const vendor = await prisma.vendors.findUnique({ where: { id: vendor_id } });
            if (vendor) {
                prefix = transliterate(vendor.name);
            }
        } else {
            prefix = transliterate(shipment_name);
        }

        // Find highest existing sequence for this prefix
        // We look for IDs like "V-01", "V-02", etc.
        const latestDevices = await prisma.devices.findMany({
            where: {
                asset_id: {
                    startsWith: `${prefix}-`
                }
            },
            orderBy: {
                asset_id: 'desc'
            },
            take: 1
        });

        let nextSequence = 1;
        if (latestDevices.length > 0) {
            const lastAssetId = latestDevices[0].asset_id;
            const parts = lastAssetId.split('-');
            const lastNum = parseInt(parts[parts.length - 1]);
            if (!isNaN(lastNum)) {
                nextSequence = lastNum + 1;
            }
        }

        const count = parseInt(device_count);

        // Atomic transaction to create shipment and devices
        const result = await prisma.$transaction(async (tx) => {
            const shipment = await tx.shipments.create({
                data: {
                    shipment_code,
                    shipment_name,
                    vendor_id,
                    delivery_date: new Date(delivery_date),
                    device_count: count,
                    notes,
                    company_id: req.user!.companyId,
                    created_by: (req.user as any).userId || (req.user as any).id,
                },
            });

            // Create devices
            const devicesData = [];
            for (let i = 0; i < count; i++) {
                const assetId = `${prefix}-${String(nextSequence + i).padStart(2, '0')}`;
                devicesData.push({
                    asset_id: assetId,
                    shipment_id: shipment.id,
                    status: "received" as any,
                    current_location: "warehouse",
                    company_id: req.user!.companyId,
                    // Minimal required fields
                    model: "New Device",
                    serial_number: `GEN-${assetId}`,
                });
            }

            await tx.devices.createMany({
                data: devicesData,
            });

            return shipment;
        });

        res.status(201).json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        console.error('Error creating shipment:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create shipment',
        });
    }
});

/**
 * PUT /api/shipments/:id
 * Update a shipment
 */
router.put('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const existingShipment = await prisma.shipments.findUnique({
            where: { id },
        });

        if (!existingShipment) {
            res.status(404).json({
                success: false,
                error: 'Shipment not found',
            });
            return;
        }

        if (existingShipment.company_id !== req.user!.companyId) {
            res.status(403).json({
                success: false,
                error: 'Access denied',
            });
            return;
        }

        // Remove fields that shouldn't be updated directly
        delete updateData.id;
        delete updateData.company_id;
        delete updateData.created_at;
        delete updateData.updated_at;

        if (updateData.delivery_date) {
            updateData.delivery_date = new Date(updateData.delivery_date);
        }

        const shipment = await prisma.shipments.update({
            where: { id },
            data: updateData,
        });

        res.json({
            success: true,
            data: shipment,
        });
    } catch (error) {
        console.error('Error updating shipment:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update shipment',
        });
    }
});

/**
 * DELETE /api/shipments/:id
 * Delete a shipment
 */
router.delete('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const existingShipment = await prisma.shipments.findUnique({
            where: { id },
        });

        if (!existingShipment) {
            res.status(404).json({
                success: false,
                error: 'Shipment not found',
            });
            return;
        }

        if (existingShipment.company_id !== req.user!.companyId) {
            res.status(403).json({
                success: false,
                error: 'Access denied',
            });
            return;
        }

        await prisma.shipments.delete({
            where: { id },
        });

        res.json({
            success: true,
            message: 'Shipment deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting shipment:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete shipment',
        });
    }
});

export default router;
