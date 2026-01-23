import { Router, Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/branches
 * List all branches
 */
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            page = '1',
            limit = '10',
            sort = 'created_at',
            order = 'desc',
        } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const orderBy: any = {};
        orderBy[sort as string] = order;

        const [branches, total] = await Promise.all([
            prisma.branches.findMany({
                skip,
                take: limitNum,
                orderBy,
            }),
            prisma.branches.count(),
        ]);

        res.json({
            success: true,
            data: branches,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        console.error('Error fetching branches:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch branches',
        });
    }
});

/**
 * GET /api/branches/:id
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const branch = await prisma.branches.findUnique({
            where: { id },
        });

        if (!branch) {
            res.status(404).json({
                success: false,
                error: 'Branch not found',
            });
            return;
        }

        res.json({
            success: true,
            data: branch,
        });
    } catch (error) {
        console.error('Error fetching branch:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch branch',
        });
    }
});

/**
 * POST /api/branches
 */
router.post('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, location, manager_id } = req.body;

        if (!name) {
            res.status(400).json({
                success: false,
                error: 'Branch name is required',
            });
            return;
        }

        const branch = await prisma.branches.create({
            data: {
                name,
                location,
                manager_id,
            },
        });

        res.status(201).json({
            success: true,
            data: branch,
        });
    } catch (error) {
        console.error('Error creating branch:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create branch',
        });
    }
});

export default router;
