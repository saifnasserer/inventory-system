import { Router, Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma/index';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/spare-parts-requests
 * List spare parts requests
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

        const where: any = {};

        if (status) {
            where.status = status;
        }

        // Filter by company through repair relation
        where.repairs = {
            devices: {
                company_id: req.user!.companyId,
            },
        };

        const orderBy: any = {};
        orderBy[sort as string] = order;

        const [requests, total] = await Promise.all([
            prisma.spare_parts_requests.findMany({
                where,
                skip,
                take: limitNum,
                orderBy,
                include: {
                    repairs: {
                        include: {
                            devices: {
                                select: {
                                    id: true,
                                    asset_id: true,
                                    model: true,
                                },
                            },
                        },
                    },
                },
            }),
            prisma.spare_parts_requests.count({ where }),
        ]);

        res.json({
            success: true,
            data: requests,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        console.error('Error fetching spare parts requests:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch spare parts requests',
        });
    }
});

/**
 * GET /api/spare-parts-requests/:id
 * Get single spare parts request by ID
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const request = await prisma.spare_parts_requests.findUnique({
            where: { id },
            include: {
                repairs: {
                    include: {
                        devices: true,
                    },
                },
            },
        });

        if (!request) {
            res.status(404).json({
                success: false,
                error: 'Spare parts request not found',
            });
            return;
        }

        // Check if request's repair's device belongs to user's company
        if (!request.repairs || !request.repairs.devices || request.repairs.devices.company_id !== req.user!.companyId) {
            res.status(403).json({
                success: false,
                error: 'Access denied',
            });
            return;
        }

        res.json({
            success: true,
            data: request,
        });
    } catch (error) {
        console.error('Error fetching spare parts request:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch spare parts request',
        });
    }
});

/**
 * POST /api/spare-parts-requests
 * Create a new spare parts request
 */
router.post('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            repair_id,
            part_name,
            part_number,
            quantity,
            estimated_cost,
            supplier,
            notes,
        } = req.body;

        if (!repair_id || !part_name) {
            res.status(400).json({
                success: false,
                error: 'Repair ID and part name are required',
            });
            return;
        }

        // Verify repair belongs to user's company
        const repair = await prisma.repairs.findUnique({
            where: { id: repair_id },
            include: {
                devices: true,
            },
        });

        if (!repair || !repair.devices || repair.devices.company_id !== req.user!.companyId) {
            res.status(403).json({
                success: false,
                error: 'Repair not found or access denied',
            });
            return;
        }

        const request = await prisma.spare_parts_requests.create({
            data: {
                repair_id,
                part_name,
                part_description: part_number,
                quantity: quantity || 1,
                notes: notes || `Supplier: ${supplier || 'N/A'}${estimated_cost ? `, Est. Cost: ${estimated_cost}` : ''}`,
                status: 'pending',
            } as any,
            include: {
                repairs: {
                    include: {
                        devices: {
                            select: {
                                id: true,
                                asset_id: true,
                                model: true,
                            },
                        },
                    },
                },
            },
        });

        res.status(201).json({
            success: true,
            data: request,
        });
    } catch (error) {
        console.error('Error creating spare parts request:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create spare parts request',
        });
    }
});

/**
 * PUT /api/spare-parts-requests/:id
 * Update a spare parts request
 */
router.put('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const existingRequest = await prisma.spare_parts_requests.findUnique({
            where: { id },
            include: {
                repairs: {
                    include: {
                        devices: true,
                    },
                },
            },
        });

        if (!existingRequest) {
            res.status(404).json({
                success: false,
                error: 'Spare parts request not found',
            });
            return;
        }

        if (!existingRequest.repairs || !existingRequest.repairs.devices || existingRequest.repairs.devices.company_id !== req.user!.companyId) {
            res.status(403).json({
                success: false,
                error: 'Access denied',
            });
            return;
        }

        delete updateData.id;
        delete updateData.repair_id;
        delete updateData.created_at;

        if (updateData.estimated_cost) {
            updateData.estimated_cost = parseFloat(updateData.estimated_cost);
        }

        const request = await prisma.spare_parts_requests.update({
            where: { id },
            data: updateData,
        });

        res.json({
            success: true,
            data: request,
        });
    } catch (error) {
        console.error('Error updating spare parts request:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update spare parts request',
        });
    }
});

/**
 * DELETE /api/spare-parts-requests/:id
 * Delete a spare parts request
 */
router.delete('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const existingRequest = await prisma.spare_parts_requests.findUnique({
            where: { id },
            include: {
                repairs: {
                    include: {
                        devices: true,
                    },
                },
            },
        });

        if (!existingRequest) {
            res.status(404).json({
                success: false,
                error: 'Spare parts request not found',
            });
            return;
        }

        if (!existingRequest.repairs || !existingRequest.repairs.devices || existingRequest.repairs.devices.company_id !== req.user!.companyId) {
            res.status(403).json({
                success: false,
                error: 'Access denied',
            });
            return;
        }

        await prisma.spare_parts_requests.delete({
            where: { id },
        });

        res.json({
            success: true,
            message: 'Spare parts request deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting spare parts request:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete spare parts request',
        });
    }
});

export default router;
