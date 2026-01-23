import { Router } from "express";
import { PrismaClient } from "../generated/prisma/index.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();
const prisma = new PrismaClient();

// List vendors
router.get("/", authenticateToken, async (req: any, res) => {
    try {
        const vendors = await prisma.vendors.findMany({
            where: {
                company_id: req.user!.companyId,
            },
            orderBy: { name: 'asc' }
        });
        res.json({ data: vendors });
    } catch (error: any) {
        console.error("Error fetching vendors:", error);
        res.status(500).json({ error: error.message });
    }
});

// Create vendor
router.post("/", authenticateToken, async (req: any, res) => {
    try {
        const vendor = await prisma.vendors.create({
            data: {
                ...req.body,
                company_id: req.user!.companyId,
            }
        });
        res.json({ data: vendor });
    } catch (error: any) {
        console.error("Error creating vendor:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
