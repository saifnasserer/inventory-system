import { Router } from "express";
import { PrismaClient } from "../generated/prisma/index.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/finance/dashboard
 * Aggregate financial data for the dashboard
 */
router.get("/dashboard", authenticateToken, async (req: any, res) => {
    try {
        const companyId = req.user!.companyId;

        // 1. Get all invoices
        // Note: Relation filtering is done through devices check or company check if added
        const invoices = await prisma.invoices.findMany({
            include: {
                devices: {
                    select: { purchase_price: true }
                }
            }
        });

        // 2. Aggregate Invoices logic
        let totalRevenue = 0;
        let totalCost = 0;
        let totalProfit = 0;
        let totalCollected = 0;

        invoices.forEach(inv => {
            const total = Number(inv.total_amount);
            const cost = Number(inv.devices?.purchase_price || 0);

            totalRevenue += total;
            totalCost += cost;
            totalProfit += (total - cost);
            totalCollected += Number(inv.amount_paid);
        });

        // 3. Get outstanding balances from all clients
        const clientsAgg = await prisma.clients.aggregate({
            where: { company_id: companyId },
            _sum: { balance: true }
        });

        // 4. Monthly trends (simplified logic for last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentInvoices = await prisma.invoices.findMany({
            where: {
                sale_date: { gte: thirtyDaysAgo }
            },
            select: { total_amount: true, sale_date: true }
        });

        res.json({
            data: {
                summary: {
                    totalRevenue: totalRevenue.toFixed(2),
                    totalCost: totalCost.toFixed(2),
                    totalProfit: totalProfit.toFixed(2),
                    totalCollected: totalCollected.toFixed(2),
                    totalOutstanding: Number(clientsAgg._sum.balance || 0).toFixed(2),
                    invoiceCount: invoices.length
                },
                recentActivity: recentInvoices
            }
        });
    } catch (error: any) {
        console.error("Finance Dashboard Error:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
