import { Router } from 'express';
import { PrismaClient } from '../generated/prisma/index';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all physical inspections
router.get('/', authenticateToken, async (req: any, res) => {
    try {
        const { _start, _end, _sort, _order, device_id } = req.query;

        const filters: any = {};
        if (device_id) {
            filters.device_id = device_id;
        }

        const inspections = await prisma.physical_inspections.findMany({
            where: filters,
            skip: _start ? parseInt(_start) : undefined,
            take: (_end && _start) ? parseInt(_end) - parseInt(_start) : undefined,
            orderBy: _sort ? { [_sort]: _order?.toLowerCase() || 'asc' } : { inspected_at: 'desc' },
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

        const total = await prisma.physical_inspections.count({ where: filters });

        res.header('x-total-count', total.toString());
        res.json({ data: inspections, total });
    } catch (error) {
        console.error('Error fetching physical inspections:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create physical inspection
router.post('/', authenticateToken, async (req: any, res) => {
    try {
        const {
            device_id,
            has_scratches,
            has_cracks,
            has_dents,
            overall_condition,
            notes,
            photos
        } = req.body;

        const inspection = await prisma.physical_inspections.create({
            data: {
                device_id,
                inspector_id: req.user.id,
                has_scratches,
                has_cracks,
                has_dents,
                overall_condition,
                notes,
                photos,
            }
        });

        // Update device status to next step (technical inspection)
        await prisma.devices.update({
            where: { id: device_id },
            data: {
                status: 'in_technical_inspection',
                updated_at: new Date(),
            }
        });

        res.status(201).json({ data: inspection });
    } catch (error) {
        console.error('Error creating physical inspection:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
