import { Router, Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/repairs
 * List repairs with pagination and filtering
 */
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            page = '1',
            limit = '10',
            sort = 'created_at',
            order = 'desc',
            status,
            device_id,
        } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const where: any = {};

        if (status) {
            where.status = Array.isArray(status) ? { in: status } : status;
        }

        if (device_id) {
            where.device_id = Array.isArray(device_id) ? { in: device_id } : device_id;
        }

        // Filter by company through device relation
        where.devices = {
            company_id: req.user!.companyId,
        };

        const orderBy: any = {};
        orderBy[sort as string] = order;

        const [repairs, total] = await Promise.all([
            prisma.repairs.findMany({
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
                        },
                    },
                    users_repairs_assigned_toTousers: {
                        select: {
                            id: true,
                            full_name: true,
                            email: true,
                        },
                    },
                },
            }),
            prisma.repairs.count({ where }),
        ]);

        res.json({
            success: true,
            data: repairs,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        console.error('Error fetching repairs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch repairs',
        });
    }
});

/**
 * GET /api/repairs/:id
 * Get single repair by ID
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const repair = await prisma.repairs.findUnique({
            where: { id },
            include: {
                devices: true,
                users_repairs_assigned_toTousers: {
                    select: {
                        id: true,
                        full_name: true,
                        email: true,
                    },
                },
                spare_parts_requests: true,
            },
        });

        if (!repair) {
            res.status(404).json({
                success: false,
                error: 'Repair not found',
            });
            return;
        }

        // Check if repair's device belongs to user's company
        if (!repair.devices || repair.devices.company_id !== req.user!.companyId) {
            res.status(403).json({
                success: false,
                error: 'Access denied',
            });
            return;
        }

        res.json({
            success: true,
            data: repair,
        });
    } catch (error) {
        console.error('Error fetching repair:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch repair',
        });
    }
});

/**
 * POST /api/repairs
 * Create a new repair
 */
router.post('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            device_id,
            issue_description,
            assigned_to,
            priority,
            status,
        } = req.body;

        if (!device_id || !issue_description) {
            res.status(400).json({
                success: false,
                error: 'Device ID and issue description are required',
            });
            return;
        }

        // Verify device belongs to user's company
        const device = await prisma.devices.findUnique({
            where: { id: device_id },
        });

        if (!device || device.company_id !== req.user!.companyId) {
            res.status(403).json({
                success: false,
                error: 'Device not found or access denied',
            });
            return;
        }

        const repair = await prisma.repairs.create({
            data: {
                device_id,
                issue_description,
                assigned_to: assigned_to || null,
                status: status || 'pending',
            },
            include: {
                devices: {
                    select: {
                        id: true,
                        asset_id: true,
                        model: true,
                    },
                },
            },
        });

        res.status(201).json({
            success: true,
            data: repair,
        });
    } catch (error) {
        console.error('Error creating repair:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create repair',
        });
    }
});

/**
 * PUT /api/repairs/:id
 * Update a repair
 */
router.put('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const existingRepair = await prisma.repairs.findUnique({
            where: { id },
            include: {
                devices: true,
            },
        });

        if (!existingRepair) {
            res.status(404).json({
                success: false,
                error: 'Repair not found',
            });
            return;
        }

        if (!existingRepair.devices || existingRepair.devices.company_id !== req.user!.companyId) {
            res.status(403).json({
                success: false,
                error: 'Access denied',
            });
            return;
        }

        delete updateData.id;
        delete updateData.device_id;
        delete updateData.created_at;

        if (updateData.completed_at) {
            updateData.completed_at = new Date(updateData.completed_at);
        }

        const repair = await prisma.repairs.update({
            where: { id },
            data: updateData,
            include: {
                devices: {
                    select: {
                        id: true,
                        asset_id: true,
                        model: true,
                    },
                },
            },
        });

        res.json({
            success: true,
            data: repair,
        });
    } catch (error) {
        console.error('Error updating repair:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update repair',
        });
    }
});

/**
 * DELETE /api/repairs/:id
 * Delete a repair
 */
router.delete('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const existingRepair = await prisma.repairs.findUnique({
            where: { id },
            include: {
                devices: true,
            },
        });

        if (!existingRepair) {
            res.status(404).json({
                success: false,
                error: 'Repair not found',
            });
            return;
        }

        if (!existingRepair.devices || existingRepair.devices.company_id !== req.user!.companyId) {
            res.status(403).json({
                success: false,
                error: 'Access denied',
            });
            return;
        }

        await prisma.repairs.delete({
            where: { id },
        });

        res.json({
            success: true,
            message: 'Repair deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting repair:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete repair',
        });
    }
});

export default router;
