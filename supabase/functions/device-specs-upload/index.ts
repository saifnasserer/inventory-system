// Supabase Edge Function: device-specs-upload
// Receives diagnostic reports from TechFlow Hardware Agent
// 
// POST /device-specs-upload/{asset_id}
// Headers: Authorization: Bearer {token}
// Body: Agent JSON payload

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AgentPayload {
    timestamp: string;
    metadata: {
        report_id: string;
        asset_id: string;
        production_mode: boolean;
        upload_status: string;
        scan_started_at: string;
        scan_completed_at: string;
        scan_duration_seconds: number;
        technician?: { id?: string };
        thermal_summary?: {
            cpu?: { min: number; max: number; avg: number };
            gpu?: { min: number; max: number; avg: number };
        };
        warnings?: string[];
        cosmetic_grade?: string;
        cosmetic_comments?: string;
        agent_version?: string;
        signature?: {
            algorithm: string;
            hash: string;
            signed_at: string;
        };
    };
    device: {
        bios?: { date: string; manufacturer: string; serial: string; version: string };
        manufacturer?: string;
        model?: string;
        motherboard?: { manufacturer: string; product: string; serial: string; version: string };
        os?: string;
        system_name?: string;
        tpm?: string;
        uuid?: string;
        uptime?: string;
        cpu?: any;
        memory?: any;
        gpu?: any[];
        storage?: any[];
        battery?: any;
    };
    results: Array<{
        id: string;
        name: string;
        status: 'success' | 'fail' | 'warn';
        message: string;
        details?: any;
    }>;
}

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    // Only accept POST
    if (req.method !== 'POST') {
        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    try {
        // Extract asset_id from URL path
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/');
        const assetId = pathParts[pathParts.length - 1];

        if (!assetId || assetId === 'device-specs-upload') {
            return new Response(
                JSON.stringify({ error: 'asset_id is required in path: /device-specs-upload/{asset_id}' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Verify auth token
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(
                JSON.stringify({ error: 'Missing or invalid Authorization header' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const token = authHeader.substring(7);
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

        // Verify token with anon key first
        const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: 'Invalid or expired token' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Use service role for database operations
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Parse request body
        const payload: AgentPayload = await req.json();

        // Validate payload has required fields
        if (!payload.metadata?.report_id || !payload.results) {
            return new Response(
                JSON.stringify({ error: 'Invalid payload: missing metadata.report_id or results' }),
                { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Check if asset_id in URL matches payload
        if (payload.metadata.asset_id && payload.metadata.asset_id !== assetId) {
            return new Response(
                JSON.stringify({ error: `asset_id mismatch: URL has ${assetId}, payload has ${payload.metadata.asset_id}` }),
                { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Find device by asset_id
        const { data: device, error: deviceError } = await supabase
            .from('devices')
            .select('id, company_id')
            .eq('asset_id', assetId)
            .single();

        if (deviceError || !device) {
            return new Response(
                JSON.stringify({ error: `Device not found with asset_id: ${assetId}` }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Get user's company to verify access
        const { data: userData } = await supabase
            .from('users')
            .select('company_id, id')
            .eq('id', user.id)
            .single();

        if (userData?.company_id !== device.company_id) {
            return new Response(
                JSON.stringify({ error: 'Access denied: device belongs to a different company' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Calculate test summary
        const totalTests = payload.results.length;
        const passedTests = payload.results.filter(r => r.status === 'success').length;
        const failedTests = payload.results.filter(r => r.status === 'fail').length;
        const scorePercent = Math.round((passedTests / totalTests) * 100);

        // Create diagnostic_report
        const reportData = {
            device_id: device.id,
            report_id: payload.metadata.report_id,
            asset_id: assetId,
            timestamp: payload.timestamp,
            production_mode: payload.metadata.production_mode || false,
            upload_status: 'Uploaded',
            scan_started_at: payload.metadata.scan_started_at,
            scan_completed_at: payload.metadata.scan_completed_at,
            scan_duration_seconds: payload.metadata.scan_duration_seconds,
            agent_version: payload.metadata.agent_version,
            cosmetic_grade: payload.metadata.cosmetic_grade,
            cosmetic_comments: payload.metadata.cosmetic_comments,
            thermal_cpu_min: payload.metadata.thermal_summary?.cpu?.min,
            thermal_cpu_max: payload.metadata.thermal_summary?.cpu?.max,
            thermal_cpu_avg: payload.metadata.thermal_summary?.cpu?.avg,
            thermal_gpu_min: payload.metadata.thermal_summary?.gpu?.min,
            thermal_gpu_max: payload.metadata.thermal_summary?.gpu?.max,
            thermal_gpu_avg: payload.metadata.thermal_summary?.gpu?.avg,
            warnings: payload.metadata.warnings || [],
            signature_algorithm: payload.metadata.signature?.algorithm,
            signature_hash: payload.metadata.signature?.hash,
            signature_signed_at: payload.metadata.signature?.signed_at,
            technician_id: userData?.id,
            total_tests: totalTests,
            passed_tests: passedTests,
            failed_tests: failedTests,
            score_percent: scorePercent,
            raw_json: payload,
        };

        const { data: report, error: reportError } = await supabase
            .from('diagnostic_reports')
            .insert(reportData)
            .select('id')
            .single();

        if (reportError) {
            console.error('Error creating report:', reportError);
            return new Response(
                JSON.stringify({ error: 'Failed to create diagnostic report', details: reportError.message }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Create test results
        const testResultsData = payload.results.map(result => ({
            report_id: report.id,
            test_id: result.id,
            test_name: result.name,
            status: result.status,
            message: result.message,
            details: result.details || {},
        }));

        const { error: testsError } = await supabase
            .from('diagnostic_test_results')
            .insert(testResultsData);

        if (testsError) {
            console.error('Error creating test results:', testsError);
        }

        // Extract hardware specs from sys_info test or device section
        const sysInfoResult = payload.results.find(r => r.id === 'sys_info');
        const sysInfoDetails = sysInfoResult?.details || {};
        const deviceInfo = payload.device || {};

        const hwSpecsData = {
            report_id: report.id,
            device_id: device.id,
            // BIOS
            bios_date: deviceInfo.bios?.date,
            bios_manufacturer: deviceInfo.bios?.manufacturer,
            bios_serial: deviceInfo.bios?.serial,
            bios_version: deviceInfo.bios?.version,
            // System
            manufacturer: deviceInfo.manufacturer,
            model: deviceInfo.model,
            os: deviceInfo.os,
            system_name: deviceInfo.system_name,
            uuid: deviceInfo.uuid,
            uptime: deviceInfo.uptime,
            tpm: deviceInfo.tpm,
            // Motherboard
            motherboard_manufacturer: deviceInfo.motherboard?.manufacturer,
            motherboard_product: deviceInfo.motherboard?.product,
            motherboard_serial: deviceInfo.motherboard?.serial,
            motherboard_version: deviceInfo.motherboard?.version,
            // CPU (from sys_info details or device)
            cpu_name: sysInfoDetails.cpu?.name || deviceInfo.cpu?.name,
            cpu_physical_cores: sysInfoDetails.cpu?.physical_cores,
            cpu_logical_cores: sysInfoDetails.cpu?.logical_cores || deviceInfo.cpu?.cores,
            cpu_threads: sysInfoDetails.cpu?.threads || deviceInfo.cpu?.threads,
            cpu_base_speed_ghz: sysInfoDetails.cpu?.base_speed_ghz,
            cpu_boost_speed_ghz: sysInfoDetails.cpu?.boost_speed_ghz,
            cpu_l2_cache_mb: sysInfoDetails.cpu?.l2_cache_mb,
            cpu_l3_cache_mb: sysInfoDetails.cpu?.l3_cache_mb,
            cpu_socket: sysInfoDetails.cpu?.socket,
            cpu_virtualization: sysInfoDetails.cpu?.virtualization,
            cpu_features: sysInfoDetails.cpu?.features,
            // Memory
            memory_total_gb: sysInfoDetails.memory?.total_gb || deviceInfo.memory?.total_gb,
            memory_type: deviceInfo.memory?.type,
            memory_max_capacity: sysInfoDetails.memory?.max_capacity,
            memory_channel_mode: sysInfoDetails.memory?.channel_mode,
            memory_slots_total: sysInfoDetails.memory?.total_slots,
            memory_slots_used: sysInfoDetails.memory?.used_slots,
            memory_slots: sysInfoDetails.memory?.slots || [],
            // GPUs
            gpus: sysInfoDetails.gpu || deviceInfo.gpu || [],
            // Storage
            storage_devices: sysInfoDetails.storage || deviceInfo.storage || [],
            // Battery
            battery_status: sysInfoDetails.battery?.[0]?.status || deviceInfo.battery?.status,
            battery_health_percent: sysInfoDetails.battery?.[0]?.health_percentage,
            battery_cycle_count: parseInt(sysInfoDetails.battery?.[0]?.cycle_count || '0'),
            battery_design_capacity: sysInfoDetails.battery?.[0]?.design_capacity || deviceInfo.battery?.design_capacity,
            battery_full_charge_capacity: sysInfoDetails.battery?.[0]?.full_charge_capacity,
            battery_chemistry: sysInfoDetails.battery?.[0]?.chemistry,
            // Network
            network_adapters: sysInfoDetails.network || [],
            // Monitors
            monitors: sysInfoDetails.monitor || [],
            // USB
            usb_controllers: sysInfoDetails.usb?.controllers || [],
            usb_devices: sysInfoDetails.usb?.devices || [],
        };

        const { error: hwError } = await supabase
            .from('device_hardware_specs')
            .insert(hwSpecsData);

        if (hwError) {
            console.error('Error creating hardware specs:', hwError);
        }

        // Update device with basic info from report
        const deviceUpdate: Record<string, any> = {
            model: deviceInfo.model || undefined,
            serial_number: deviceInfo.bios?.serial,
            manufacturer: deviceInfo.manufacturer,
            cpu_model: hwSpecsData.cpu_name,
            ram_size: Math.round(hwSpecsData.memory_total_gb || 0),
            bios_serial: deviceInfo.bios?.serial,
            os: deviceInfo.os,
            battery_health_percent: hwSpecsData.battery_health_percent,
            updated_at: new Date().toISOString(),
        };

        // Extract storage health if available
        const storageDevices = hwSpecsData.storage_devices as any[];
        if (storageDevices && storageDevices.length > 0) {
            const primaryStorage = storageDevices[0];
            if (primaryStorage.health_percent !== undefined) {
                deviceUpdate.storage_health_percent = primaryStorage.health_percent;
            }
            deviceUpdate.storage_size = Math.round(primaryStorage.capacity_gb || primaryStorage.size_gb || 0);
        }

        // Extract GPU model
        const gpus = hwSpecsData.gpus as any[];
        if (gpus && gpus.length > 0) {
            // Prefer discrete GPU over integrated
            const discreteGpu = gpus.find(g => !g.name?.toLowerCase().includes('intel') && !g.name?.toLowerCase().includes('integrated'));
            deviceUpdate.gpu_model = discreteGpu?.name || gpus[0]?.name;
        }

        await supabase
            .from('devices')
            .update(deviceUpdate)
            .eq('id', device.id);

        return new Response(
            JSON.stringify({
                success: true,
                report_id: report.id,
                summary: {
                    total_tests: totalTests,
                    passed: passedTests,
                    failed: failedTests,
                    score: scorePercent,
                },
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
