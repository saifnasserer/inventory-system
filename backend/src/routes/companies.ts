import { Router, Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/companies
 * List companies (admin only)
 */
router.get('/', authenticateToken, requireRole(['super_admin']), async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            page = '1',
            limit = '10',
            search,
        } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const where: any = {};

        if (search) {
            where.OR = [
                { name: { contains: search as string } },
            ];
        }

        const [companies, total] = await Promise.all([
            prisma.companies.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { created_at: 'desc' },
                include: {
                    _count: {
                        select: {
                            devices: true,
                            users: true,
                        },
                    },
                },
            }),
            prisma.companies.count({ where }),
        ]);

        res.json({
            success: true,
            data: companies,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        console.error('Error fetching companies:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch companies',
        });
    }
});

/**
 * GET /api/companies/:id
 * Get single company by ID
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const company = await prisma.companies.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        devices: true,
                        users: true,
                        shipments: true,
                    },
                },
            },
        });

        if (!company) {
            res.status(404).json({
                success: false,
                error: 'Company not found',
            });
            return;
        }

        // Only admin or users from the same company can view
        if (req.user!.role !== 'admin' && company.id !== req.user!.companyId) {
            res.status(403).json({
                success: false,
                error: 'Access denied',
            });
            return;
        }

        res.json({
            success: true,
            data: company,
        });
    } catch (error) {
        console.error('Error fetching company:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch company',
        });
    }
});

/**
 * POST /api/companies
 * Create a new company (admin only)
 */
router.post('/', authenticateToken, requireRole(['super_admin']), async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            name,
            contact_email,
            contact_phone,
            address,
        } = req.body;

        if (!name) {
            res.status(400).json({
                success: false,
                error: 'Company name is required',
            });
            return;
        }

        const company = await prisma.companies.create({
            data: {
                name,
                contact_phone,
                address,
            } as any, // Temporary cast until schema is updated or fields removed
        });

        res.status(201).json({
            success: true,
            data: company,
        });
    } catch (error) {
        console.error('Error creating company:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create company',
        });
    }
});

/**
 * PUT /api/companies/:id
 * Update a company (admin only)
 */
router.put('/:id', authenticateToken, requireRole(['super_admin']), async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const existingCompany = await prisma.companies.findUnique({
            where: { id },
        });

        if (!existingCompany) {
            res.status(404).json({
                success: false,
                error: 'Company not found',
            });
            return;
        }

        delete updateData.id;
        delete updateData.created_at;

        const company = await prisma.companies.update({
            where: { id },
            data: updateData,
        });

        res.json({
            success: true,
            data: company,
        });
    } catch (error) {
        console.error('Error updating company:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update company',
        });
    }
});

/**
 * DELETE /api/companies/:id
 * Delete a company (admin only)
 */
router.delete('/:id', authenticateToken, requireRole(['super_admin']), async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const existingCompany = await prisma.companies.findUnique({
            where: { id },
        });

        if (!existingCompany) {
            res.status(404).json({
                success: false,
                error: 'Company not found',
            });
            return;
        }

        await prisma.companies.delete({
            where: { id },
        });

        res.json({
            success: true,
            message: 'Company deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting company:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete company',
        });
    }
});

export default router;
