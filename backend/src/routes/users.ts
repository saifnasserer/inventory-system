import { Router } from 'express';
import { PrismaClient } from '../generated/prisma/index.js';
import { authenticateToken } from '../middleware/auth.js';
import bcrypt from 'bcrypt';

const router = Router();
const prisma = new PrismaClient();

// Get all users (filtered by company for non-superadmins)
router.get('/', authenticateToken, async (req: any, res) => {
    try {
        const { _start, _end, _sort, _order, company_id } = req.query;

        const filters: any = {};
        if (req.user.role !== 'super_admin') {
            filters.company_id = req.user.companyId;
        } else if (company_id) {
            filters.company_id = company_id;
        }

        const users = await prisma.users.findMany({
            where: filters,
            skip: _start ? parseInt(_start) : undefined,
            take: (_end && _start) ? parseInt(_end) - parseInt(_start) : undefined,
            orderBy: _sort ? { [_sort]: _order?.toLowerCase() || 'asc' } : { created_at: 'desc' },
            select: {
                id: true,
                email: true,
                full_name: true,
                role: true,
                company_id: true,
                branch_id: true,
                created_at: true,
            }
        });

        const total = await prisma.users.count({ where: filters });

        res.header('x-total-count', total.toString());
        res.json({ data: users, total });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user
router.put('/:id', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;
        const { full_name, role, password } = req.body;

        const userToUpdate = await prisma.users.findUnique({ where: { id } });

        if (!userToUpdate) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Only super_admin or user from same company can update
        if (req.user.role !== 'super_admin' && userToUpdate.company_id !== req.user.companyId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const data: any = {
            full_name,
            role,
            updated_at: new Date(),
        };

        if (password) {
            data.password_hash = await bcrypt.hash(password, 10);
        }

        const updatedUser = await prisma.users.update({
            where: { id },
            data,
            select: {
                id: true,
                email: true,
                full_name: true,
                role: true,
                company_id: true,
            }
        });

        res.json({ data: updatedUser });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete user
router.delete('/:id', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;

        const userToDelete = await prisma.users.findUnique({ where: { id } });

        if (!userToDelete) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Only super_admin or user from same company can delete
        if (req.user.role !== 'super_admin' && userToDelete.company_id !== req.user.companyId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await prisma.users.delete({ where: { id } });

        res.json({ data: { id } });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
