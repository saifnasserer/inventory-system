import { Router, Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma/index';
import { authenticateToken, requireSameCompany } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/devices
 * List devices with pagination, filtering, and sorting
 */
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            page = '1',
            limit = '10',
            sort = 'created_at',
            order = 'desc',
            status,
            category,
            branch_id,
            shipment_id,
            search,
        } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        // Build where clause
        const where: any = {
            company_id: req.user!.companyId,
        };

        if (status) {
            where.status = Array.isArray(status) ? { in: status } : status;
        }

        if (branch_id) {
            where.branch_id = Array.isArray(branch_id) ? { in: branch_id } : branch_id;
        }

        if (shipment_id) {
            where.shipment_id = Array.isArray(shipment_id) ? { in: shipment_id } : shipment_id;
        }

        if (search) {
            where.OR = [
                { serial_number: { contains: search as string } },
                { model: { contains: search as string } },
                { manufacturer: { contains: search as string } },
                { asset_id: { contains: search as string } },
            ];
        }

        // Build orderBy clause
        const orderBy: any = {};
        orderBy[sort as string] = order;

        // Fetch devices and total count
        const [devices, total] = await Promise.all([
            prisma.devices.findMany({
                where,
                skip,
                take: limitNum,
                orderBy,
                include: {
                    branches: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    shipments: {
                        include: {
                            vendors: true,
                        }
                    },
                    diagnostic_reports: {
                        orderBy: {
                            created_at: 'desc',
                        },
                        take: 1,
                        include: {
                            hardware_specs: true,
                        },
                    },
                },
            }),
            prisma.devices.count({ where }),
        ]);

        res.json({
            success: true,
            data: devices,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        console.error('Error fetching devices:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch devices',
        });
    }
});

/**
 * GET /api/devices/:id
 * Get single device by ID
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const device = await prisma.devices.findUnique({
            where: { id },
            include: {
                branches: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                repairs: {
                    orderBy: {
                        created_at: 'desc',
                    },
                    take: 10,
                },
                diagnostic_reports: {
                    orderBy: {
                        created_at: 'desc',
                    },
                    include: {
                        test_results: true,
                        hardware_specs: true,
                    },
                },
            },
        });

        if (!device) {
            res.status(404).json({
                success: false,
                error: 'Device not found',
            });
            return;
        }

        // Check if device belongs to user's company
        if (device.company_id !== req.user!.companyId) {
            res.status(403).json({
                success: false,
                error: 'Access denied',
            });
            return;
        }

        res.json({
            success: true,
            data: device,
        });
    } catch (error) {
        console.error('Error fetching device:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch device',
        });
    }
});

/**
 * POST /api/devices
 * Create a new device
 */
router.post('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            serial_number,
            model,
            manufacturer,
            status,
            branch_id,
            asset_id,
            shipment_id,
            ram_size,
            ram_count,
            storage_size,
            storage_count,
            gpu_model,
            cpu_model,
            current_location,
        } = req.body;

        if (!serial_number || !model) {
            res.status(400).json({
                success: false,
                error: 'Serial number and model are required',
            });
            return;
        }

        // Generate asset_id if not provided
        const generatedAssetId = asset_id || `DEV-${Date.now()}`;

        // Check if device with same serial number already exists
        const existingDevice = await prisma.devices.findFirst({
            where: {
                serial_number,
                company_id: req.user!.companyId,
            },
        });

        if (existingDevice) {
            res.status(409).json({
                success: false,
                error: 'Device with this serial number already exists',
            });
            return;
        }

        const device = await prisma.devices.create({
            data: {
                asset_id: generatedAssetId,
                serial_number,
                model,
                manufacturer,
                status: status || 'received',
                company_id: req.user!.companyId,
                branch_id: branch_id || null,
                shipment_id: shipment_id || null,
                ram_size: ram_size ? parseInt(ram_size) : null,
                ram_count: ram_count ? parseInt(ram_count) : null,
                storage_size: storage_size ? parseInt(storage_size) : null,
                storage_count: storage_count ? parseInt(storage_count) : null,
                gpu_model,
                cpu_model,
                current_location,
            },
            include: {
                branches: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        res.status(201).json({
            success: true,
            data: device,
        });
    } catch (error) {
        console.error('Error creating device:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create device',
        });
    }
});

/**
 * PUT /api/devices/:id
 * Update a device
 */
router.put('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const rawData = req.body;

        // Check if device exists and belongs to user's company
        const existingDevice = await prisma.devices.findUnique({
            where: { id },
        });

        if (!existingDevice) {
            res.status(404).json({
                success: false,
                error: 'Device not found',
            });
            return;
        }

        if (existingDevice.company_id !== req.user!.companyId) {
            res.status(403).json({
                success: false,
                error: 'Access denied',
            });
            return;
        }

        // Define valid fields based on Prisma schema to prevent validation errors
        const validFields = [
            'asset_id', 'shipment_id', 'status', 'model', 'serial_number',
            'manufacturer', 'ram_size', 'ram_count', 'ram_models',
            'storage_size', 'storage_count', 'storage_types', 'storage_models',
            'gpu_model', 'cpu_model', 'current_location', 'branch_id',
            'assigned_to', 'updated_at', 'latest_report_id', 'last_diagnostic_at',
            'diagnostic_score', 'bios_serial', 'os', 'battery_health_percent',
            'storage_health_percent'
        ];

        const updateData: any = {};
        Object.keys(rawData).forEach(key => {
            if (validFields.includes(key)) {
                updateData[key] = rawData[key];
            }
        });

        // Convert types if necessary
        if (updateData.updated_at) {
            updateData.updated_at = new Date(updateData.updated_at);
        }

        const device = await prisma.devices.update({
            where: { id },
            data: updateData,
            include: {
                branches: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        res.json({
            success: true,
            data: device,
        });
    } catch (error) {
        console.error('Error updating device:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update device',
        });
    }
});

/**
 * DELETE /api/devices/:id
 * Delete a device
 */
router.delete('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Check if device exists and belongs to user's company
        const existingDevice = await prisma.devices.findUnique({
            where: { id },
        });

        if (!existingDevice) {
            res.status(404).json({
                success: false,
                error: 'Device not found',
            });
            return;
        }

        if (existingDevice.company_id !== req.user!.companyId) {
            res.status(403).json({
                success: false,
                error: 'Access denied',
            });
            return;
        }

        await prisma.devices.delete({
            where: { id },
        });

        res.json({
            success: true,
            message: 'Device deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting device:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete device',
        });
    }
});

export default router;
