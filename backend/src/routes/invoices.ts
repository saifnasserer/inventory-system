import { Router } from "express";
import { PrismaClient } from "../generated/prisma/index.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/invoices
 * List all invoices for the company
 */
router.get("/", authenticateToken, async (req: any, res) => {
    try {
        const companyId = req.user!.companyId;
        const invoices = await prisma.invoices.findMany({
            where: {
                branch_id: req.user!.role === 'admin' ? undefined : req.user!.branchId
            },
            include: {
                invoice_items: {
                    include: {
                        device: {
                            select: {
                                model: true,
                                asset_id: true,
                            }
                        }
                    }
                },
                clients: true,
                invoice_payments: true
            },
            orderBy: { sale_date: 'desc' }
        });
        res.json({ data: invoices });
    } catch (error: any) {
        console.error("Error fetching invoices:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/invoices/:id
 * Get detailed invoice
 */
router.get("/:id", authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;
        const invoice = await prisma.invoices.findUnique({
            where: { id },
            include: {
                invoice_items: {
                    include: {
                        device: true
                    }
                },
                clients: true,
                invoice_payments: {
                    include: {
                        users: {
                            select: { full_name: true }
                        }
                    }
                }
            }
        });

        if (!invoice) return res.status(404).json({ error: "Invoice not found" });
        res.json({ data: invoice });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/invoices
 * Create a new sale (Invoice) with multiple items
 */
router.post("/", authenticateToken, async (req: any, res) => {
    const {
        invoice_number,
        items, // Array of { device_id?, item_name?, quantity, unit_price, total_price }
        client_id,
        customer_name,
        customer_phone,
        tax_amount,
        total_amount,
        amount_paid,
        payment_method,
        notes
    } = req.body;

    if (!invoice_number || !items || !items.length || !total_amount) {
        return res.status(400).json({ error: "Required fields missing" });
    }

    try {
        const companyId = req.user!.companyId;

        const result = await prisma.$transaction(async (tx) => {
            // 1. Resolve Client
            let finalClientId = client_id;
            if (!finalClientId && customer_name) {
                // Check if client exists by phone
                let client = await tx.clients.findFirst({
                    where: {
                        company_id: companyId,
                        phone: customer_phone || undefined,
                        name: customer_name
                    }
                });

                if (!client) {
                    client = await tx.clients.create({
                        data: {
                            name: customer_name,
                            phone: customer_phone,
                            company_id: companyId,
                        }
                    });
                }
                finalClientId = client.id;
            }

            // 2. Create the invoice
            const invoice = await tx.invoices.create({
                data: {
                    invoice_number,
                    client_id: finalClientId,
                    customer_name: customer_name,
                    customer_contact: customer_phone,
                    sale_price: total_amount, // Sum of items
                    tax_amount: tax_amount || 0,
                    total_amount,
                    amount_paid: amount_paid || 0,
                    payment_method: payment_method || 'cash',
                    payment_status: (amount_paid >= total_amount) ? 'paid' : (amount_paid > 0 ? 'partial' : 'pending'),
                    sold_by: req.user!.userId,
                    notes,
                    branch_id: req.user!.branchId || null
                }
            });

            // 3. Handle items
            for (const item of items) {
                const { device_id, item_name, quantity, unit_price, total_price } = item;
                let serialNumber = null;
                let assetId = null;

                // Check device if provided
                if (device_id) {
                    const device = await tx.devices.findUnique({ where: { id: device_id } });
                    if (!device || device.status === 'sold') {
                        throw new Error(`Device ${device_id} is not available for sale`);
                    }

                    serialNumber = device.serial_number;
                    assetId = device.asset_id;

                    // Update device status to 'sold'
                    await tx.devices.update({
                        where: { id: device_id },
                        data: { status: 'sold' }
                    });
                }

                // Create invoice item
                await tx.invoice_items.create({
                    data: {
                        invoice_id: invoice.id,
                        device_id: device_id || null,
                        item_name: item_name || null,
                        serial_number: serialNumber,
                        asset_id: assetId,
                        quantity: Number(quantity) || 1,
                        unit_price: Number(unit_price),
                        total_price: Number(total_price)
                    }
                });
            }

            // 4. If credit sale, update client balance
            if (payment_method === 'credit' && finalClientId) {
                const unpaidAmount = Number(total_amount) - Number(amount_paid || 0);
                if (unpaidAmount > 0) {
                    await tx.clients.update({
                        where: { id: finalClientId },
                        data: { balance: { increment: unpaidAmount } }
                    });
                }
            }

            // 5. Record the initial payment if any
            if (amount_paid > 0) {
                await tx.invoice_payments.create({
                    data: {
                        invoice_id: invoice.id,
                        amount: amount_paid,
                        payment_method: 'cash', // Initial payments are usually cash
                        received_by: req.user!.userId,
                        notes: 'Initial payment'
                    }
                });
            }

            return invoice;
        });

        res.json({ data: result });
    } catch (error: any) {
        console.error("Error creating sale:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/invoices/:id/payments
 * Record a payment for an invoice (installment)
 */
router.post("/:id/payments", authenticateToken, async (req: any, res) => {
    const { id } = req.params;
    const { amount, payment_method, notes } = req.body;

    if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Valid amount is required" });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            const invoice = await tx.invoices.findUnique({
                where: { id },
                include: { clients: true }
            });

            if (!invoice) throw new Error("Invoice not found");

            const remainingBalance = Number(invoice.total_amount) - Number(invoice.amount_paid);
            if (amount > remainingBalance + 0.01) { // Small buffer for floats
                throw new Error(`Payment amount exceeds remaining balance (${remainingBalance})`);
            }

            // 1. Record payment
            const payment = await tx.invoice_payments.create({
                data: {
                    invoice_id: id,
                    amount,
                    payment_method: payment_method || 'cash',
                    received_by: req.user!.userId,
                    notes
                }
            });

            // 2. Update invoice
            const newAmountPaid = Number(invoice.amount_paid) + Number(amount);
            const newStatus = (newAmountPaid >= Number(invoice.total_amount) - 0.01) ? 'paid' : 'partial';

            await tx.invoices.update({
                where: { id },
                data: {
                    amount_paid: newAmountPaid,
                    payment_status: newStatus
                }
            });

            // 3. Update client balance
            if (invoice.client_id) {
                await tx.clients.update({
                    where: { id: invoice.client_id },
                    data: { balance: { decrement: amount } }
                });
            }

            return payment;
        });

        res.json({ data: result });
    } catch (error: any) {
        console.error("Error recording payment:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
