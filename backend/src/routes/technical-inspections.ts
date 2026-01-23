import { Router } from 'express';
import { PrismaClient } from '../generated/prisma/index';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all technical inspections
router.get('/', authenticateToken, async (req: any, res) => {
    try {
        const { _start, _end, _sort, _order, device_id } = req.query;

        const filters: any = {};
        if (device_id) {
            filters.device_id = device_id;
        }

        const inspections = await prisma.technical_inspections.findMany({
            where: filters,
            skip: _start ? parseInt(_start) : undefined,
            take: (_end && _start) ? parseInt(_end) - parseInt(_start) : undefined,
            orderBy: _sort ? { [_sort]: _order?.toLowerCase() || 'asc' } : { created_at: 'desc' },
            include: {
                devices: true,
                users: {
                    select: {
                        id: true,
                        full_name: true,
                        email: true,
                    }
                }
            }
        });

        const total = await prisma.technical_inspections.count({ where: filters });

        res.header('x-total-count', total.toString());
        res.json({ data: inspections, total });
    } catch (error) {
        console.error('Error fetching technical inspections:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create technical inspection
router.post('/', authenticateToken, async (req: any, res) => {
    try {
        const {
            device_id,
            stress_test_passed,
            max_temperature,
            performance_score,
            ready_for_sale,
            needs_repair,
            repair_notes,
            notes
        } = req.body;

        const inspection = await prisma.technical_inspections.create({
            data: {
                device_id,
                inspector_id: req.user.id,
                stress_test_passed,
                max_temperature,
                performance_score,
                ready_for_sale,
                needs_repair,
                repair_notes,
                notes,
            }
        });

        // Update device status and technical specs
        await prisma.devices.update({
            where: { id: device_id },
            data: {
                status: ready_for_sale ? 'ready_for_sale' : 'needs_repair',
                updated_at: new Date(),
            }
        });

        res.status(201).json({ data: inspection });
    } catch (error) {
        console.error('Error creating technical inspection:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
