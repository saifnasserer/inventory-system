import { Router, Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma/index';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/diagnostic-reports
 * List diagnostic reports with filtering
 */
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            page = '1',
            limit = '10',
            sort = 'created_at',
            order = 'desc',
            device_id,
        } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const where: any = {};
        if (device_id) {
            where.device_id = device_id as string;
        }

        // Filter by company through device relation
        where.devices = {
            company_id: req.user!.companyId,
        };

        const orderBy: any = {};
        orderBy[sort as string] = order;

        const [reports, total] = await Promise.all([
            prisma.diagnostic_reports.findMany({
                where,
                skip,
                take: limitNum,
                orderBy,
                include: {
                    test_results: true,
                    hardware_specs: true,
                },
            }),
            prisma.diagnostic_reports.count({ where }),
        ]);

        res.json({
            success: true,
            data: reports,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        console.error('Error fetching diagnostic reports:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch diagnostic reports',
        });
    }
});

/**
 * GET /api/diagnostic-reports/:id
 * Get single diagnostic report by ID
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const report = await prisma.diagnostic_reports.findUnique({
            where: { id },
            include: {
                test_results: true,
                hardware_specs: true,
                devices: true,
            },
        });

        if (!report) {
            res.status(404).json({
                success: false,
                error: 'Diagnostic report not found',
            });
            return;
        }

        // Check if report's device belongs to user's company
        if (report.devices.company_id !== req.user!.companyId) {
            res.status(403).json({
                success: false,
                error: 'Access denied',
            });
            return;
        }

        res.json({
            success: true,
            data: report,
        });
    } catch (error) {
        console.error('Error fetching diagnostic report:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch diagnostic report',
        });
    }
});

/**
 * POST /api/diagnostic_reports/upload/:asset_id
 * Upload a new diagnostic report for a device
 */
router.post('/upload/:asset_id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const { asset_id } = req.params;
        const reportData = req.body;

        if (!reportData || !reportData.metadata || !reportData.device) {
            res.status(400).json({
                success: false,
                error: 'Invalid report format. Missing metadata or device sections.',
            });
            return;
        }

        const { metadata, device, results } = reportData;

        // 1. Verify device exists and belongs to user's company
        const dbDevice = await prisma.devices.findUnique({
            where: { asset_id },
        });

        if (!dbDevice) {
            res.status(404).json({
                success: false,
                error: `Device with asset_id ${asset_id} not found.`,
            });
            return;
        }

        if (dbDevice.company_id !== req.user!.companyId) {
            res.status(403).json({
                success: false,
                error: 'Access denied: Device belongs to another company.',
            });
            return;
        }

        // 2. Process the report in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create the main report record
            const report = await tx.diagnostic_reports.create({
                data: {
                    device_id: dbDevice.id,
                    report_id: metadata.report_id,
                    asset_id: asset_id,
                    timestamp: reportData.timestamp,
                    production_mode: metadata.production_mode || false,
                    upload_status: "Uploaded",
                    scan_started_at: metadata.scan_started_at ? new Date(metadata.scan_started_at) : null,
                    scan_completed_at: metadata.scan_completed_at ? new Date(metadata.scan_completed_at) : null,
                    scan_duration_seconds: metadata.scan_duration_seconds || 0,
                    agent_version: metadata.agent_version || "unknown",
                    cosmetic_grade: metadata.cosmetic_grade || "N/A",
                    cosmetic_comments: metadata.cosmetic_comments || "",
                    thermal_cpu_min: metadata.thermal_summary?.cpu?.min || 0,
                    thermal_cpu_max: metadata.thermal_summary?.cpu?.max || 0,
                    thermal_cpu_avg: metadata.thermal_summary?.cpu?.avg || 0,
                    thermal_gpu_min: metadata.thermal_summary?.gpu?.min || 0,
                    thermal_gpu_max: metadata.thermal_summary?.gpu?.max || 0,
                    thermal_gpu_avg: metadata.thermal_summary?.gpu?.avg || 0,
                    warnings: metadata.warnings || [],
                    signature_algorithm: metadata.signature?.algorithm || "none",
                    signature_hash: metadata.signature?.hash || "",
                    signature_signed_at: metadata.signature?.signed_at ? new Date(metadata.signature?.signed_at) : null,
                    technician_id: req.user!.userId,
                    total_tests: results?.length || 0,
                    passed_tests: results?.filter((r: any) => r.status === 'success' || r.status === 'pass').length || 0,
                    failed_tests: results?.filter((r: any) => r.status === 'fail' || r.status === 'error').length || 0,
                    score_percent: 0, // Calculate if needed
                    raw_json: reportData,
                },
            });

            // Create test results
            if (results && results.length > 0) {
                await tx.diagnostic_test_results.createMany({
                    data: results.map((r: any) => ({
                        report_id: report.id,
                        test_id: r.id,
                        test_name: r.name,
                        status: r.status,
                        message: r.message,
                        details: r.details || {},
                    })),
                });
            }

            // Create hardware specs
            await tx.device_hardware_specs.create({
                data: {
                    report_id: report.id,
                    device_id: dbDevice.id,
                    bios_date: device.bios?.date || "",
                    bios_manufacturer: device.bios?.manufacturer || "",
                    bios_serial: device.bios?.serial || "",
                    bios_version: device.bios?.version || "",
                    manufacturer: device.manufacturer || "",
                    model: device.model || "",
                    os: device.os || "",
                    system_name: device.system_name || "",
                    uuid: device.uuid || "",
                    uptime: device.uptime || "",
                    tpm: device.tpm || "",
                    motherboard_manufacturer: device.motherboard?.manufacturer || "",
                    motherboard_product: device.motherboard?.product || "",
                    motherboard_serial: device.motherboard?.serial || "",
                    motherboard_version: device.motherboard?.version || "",
                    cpu_name: device.cpu?.name || "",
                    cpu_physical_cores: device.cpu?.physical_cores || 0,
                    cpu_logical_cores: device.cpu?.logical_cores || 0,
                    cpu_threads: device.cpu?.threads || 0,
                    cpu_base_speed_ghz: device.cpu?.base_speed_ghz || 0,
                    cpu_boost_speed_ghz: device.cpu?.boost_speed_ghz || 0,
                    cpu_l2_cache_mb: device.cpu?.l2_cache_mb || 0,
                    cpu_l3_cache_mb: device.cpu?.l3_cache_mb || 0,
                    cpu_socket: device.cpu?.socket || "",
                    cpu_virtualization: device.cpu?.virtualization || false,
                    cpu_features: Array.isArray(device.cpu?.features) ? device.cpu.features.join(', ') : (device.cpu?.features || ""),
                    memory_total_gb: device.memory?.total_gb || 0,
                    memory_type: device.memory?.type || "",
                    memory_max_capacity: device.memory?.max_capacity || "",
                    memory_channel_mode: device.memory?.channel_mode || "",
                    memory_slots_total: device.memory?.total_slots || 0,
                    memory_slots_used: device.memory?.used_slots || 0,
                    memory_slots: device.memory?.slots || [],
                    gpus: device.gpu || [],
                    storage_devices: device.storage || [],
                    battery_status: device.battery?.status || 0,
                    battery_health_percent: parseFloat(device.battery?.health_percent) || 0,
                    battery_cycle_count: parseInt(device.battery?.cycle_count) || 0,
                    battery_design_capacity: device.battery?.design_capacity || "",
                    battery_full_charge_capacity: device.battery?.full_charge_capacity || "",
                    battery_chemistry: device.battery?.chemistry || "",
                    network_adapters: device.network || [],
                    monitors: device.monitor || [],
                    usb_controllers: device.usb?.controllers || [],
                    usb_devices: device.usb?.devices || [],
                },
            });

            // 3. Update device with latest report info
            const score = results?.length > 0
                ? Math.round((results.filter((r: any) => r.status === 'success' || r.status === 'pass').length / results.length) * 100)
                : 0;

            await tx.devices.update({
                where: { id: dbDevice.id },
                data: {
                    latest_report_id: report.id,
                    last_diagnostic_at: new Date(),
                    diagnostic_score: score,
                    status: 'diagnosed' as any, // Cast to any if enum not yet updated in Prisma
                    // Optionally update basic info from report
                    model: device.model || dbDevice.model,
                    serial_number: device.serial_number || dbDevice.serial_number,
                    manufacturer: device.manufacturer || dbDevice.manufacturer,
                },
            });

            return { report_id: report.report_id, score };
        });

        res.status(200).json({
            success: true,
            report_id: result.report_id,
            summary: {
                score: result.score,
            },
        });

    } catch (error: any) {
        console.error('Error uploading diagnostic report:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to process diagnostic report upload',
        });
    }
});

export default router;
