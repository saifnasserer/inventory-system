import { Router } from "express";
import { PrismaClient } from "../generated/prisma/index.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();
const prisma = new PrismaClient();

router.get("/", authenticateToken, async (req: any, res) => {
    try {
        const { search } = req.query;

        const where: any = {
            company_id: req.user!.companyId,
        };

        if (search) {
            where.OR = [
                { name: { contains: search as string } },
                { phone: { contains: search as string } },
            ];
        }

        const clients = await prisma.clients.findMany({
            where,
            include: {
                _count: {
                    select: { invoices: true }
                }
            },
            orderBy: { name: 'asc' }
        });
        res.json({ data: clients });
    } catch (error: any) {
        console.error("Error fetching clients:", error);
        res.status(500).json({ error: error.message });
    }
});

// Get single client profile with history
router.get("/:id", authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;
        const client = await prisma.clients.findUnique({
            where: { id },
            include: {
                invoices: {
                    include: {
                        invoice_payments: true,
                        invoice_items: {
                            include: {
                                device: true
                            }
                        }
                    },
                    orderBy: { sale_date: 'desc' }
                }
            }
        });

        if (!client) {
            return res.status(404).json({ error: "Client not found" });
        }

        res.json({ data: client });
    } catch (error: any) {
        console.error("Error fetching client profile:", error);
        res.status(500).json({ error: error.message });
    }
});

// Create new client
router.post("/", authenticateToken, async (req: any, res) => {
    try {
        const { name, phone, address } = req.body;

        if (!name) {
            return res.status(400).json({ error: "Client name is required" });
        }

        const client = await prisma.clients.create({
            data: {
                name,
                phone,
                address,
                company_id: req.user!.companyId,
                balance: 0
            }
        });
        res.json({ data: client });
    } catch (error: any) {
        console.error("Error creating client:", error);
        res.status(500).json({ error: error.message });
    }
});

// Update client
router.put("/:id", authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;
        const { name, phone, address } = req.body;

        const client = await prisma.clients.update({
            where: { id },
            data: {
                name,
                phone,
                address,
                updated_at: new Date()
            }
        });
        res.json({ data: client });
    } catch (error: any) {
        console.error("Error updating client:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
