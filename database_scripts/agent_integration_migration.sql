-- =====================================================
-- TechFlow Agent Integration - Database Migration
-- =====================================================
-- This migration adds tables to store diagnostic reports
-- from the TechFlow Hardware Agent
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. DIAGNOSTIC_REPORTS TABLE
-- Stores report metadata and summary
-- =====================================================
CREATE TABLE IF NOT EXISTS diagnostic_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    
    -- Metadata from Agent
    report_id UUID NOT NULL UNIQUE,
    asset_id VARCHAR(100) NOT NULL,
    timestamp VARCHAR(50),
    production_mode BOOLEAN DEFAULT false,
    upload_status VARCHAR(50),
    scan_started_at TIMESTAMPTZ,
    scan_completed_at TIMESTAMPTZ,
    scan_duration_seconds DECIMAL(10,2),
    agent_version VARCHAR(20),
    
    -- Cosmetic & Thermal Summary
    cosmetic_grade VARCHAR(5),
    cosmetic_comments TEXT,
    thermal_cpu_min DECIMAL(5,2),
    thermal_cpu_max DECIMAL(5,2),
    thermal_cpu_avg DECIMAL(5,2),
    thermal_gpu_min DECIMAL(5,2),
    thermal_gpu_max DECIMAL(5,2),
    thermal_gpu_avg DECIMAL(5,2),
    
    -- Warnings (stored as JSON array)
    warnings JSONB,
    
    -- Signature for integrity
    signature_algorithm VARCHAR(20),
    signature_hash VARCHAR(100),
    signature_signed_at TIMESTAMPTZ,
    
    -- Technician info
    technician_id UUID REFERENCES users(id),
    
    -- Overall test summary
    total_tests INT,
    passed_tests INT,
    failed_tests INT,
    score_percent INT,
    
    -- Full JSON payload for reference
    raw_json JSONB NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for diagnostic_reports
CREATE INDEX IF NOT EXISTS idx_reports_device ON diagnostic_reports(device_id);
CREATE INDEX IF NOT EXISTS idx_reports_asset ON diagnostic_reports(asset_id);
CREATE INDEX IF NOT EXISTS idx_reports_created ON diagnostic_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_grade ON diagnostic_reports(cosmetic_grade);

-- =====================================================
-- 2. DIAGNOSTIC_TEST_RESULTS TABLE
-- Individual test results from Agent's results array
-- =====================================================
CREATE TABLE IF NOT EXISTS diagnostic_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES diagnostic_reports(id) ON DELETE CASCADE,
    
    test_id VARCHAR(50) NOT NULL,
    test_name VARCHAR(100),
    status VARCHAR(20) NOT NULL,
    message TEXT,
    details JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for diagnostic_test_results
CREATE INDEX IF NOT EXISTS idx_test_results_report ON diagnostic_test_results(report_id);
CREATE INDEX IF NOT EXISTS idx_test_results_test_id ON diagnostic_test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_test_results_status ON diagnostic_test_results(status);

-- =====================================================
-- 3. DEVICE_HARDWARE_SPECS TABLE
-- Normalized hardware specs from Agent's device section
-- =====================================================
CREATE TABLE IF NOT EXISTS device_hardware_specs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES diagnostic_reports(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    
    -- BIOS
    bios_date VARCHAR(50),
    bios_manufacturer VARCHAR(100),
    bios_serial VARCHAR(100),
    bios_version VARCHAR(50),
    
    -- System
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    os VARCHAR(100),
    system_name VARCHAR(100),
    uuid VARCHAR(100),
    uptime VARCHAR(50),
    tpm VARCHAR(50),
    
    -- Motherboard
    motherboard_manufacturer VARCHAR(100),
    motherboard_product VARCHAR(100),
    motherboard_serial VARCHAR(100),
    motherboard_version VARCHAR(50),
    
    -- CPU (detailed)
    cpu_name VARCHAR(255),
    cpu_physical_cores INT,
    cpu_logical_cores INT,
    cpu_threads INT,
    cpu_base_speed_ghz DECIMAL(5,2),
    cpu_boost_speed_ghz DECIMAL(5,2),
    cpu_l2_cache_mb DECIMAL(5,2),
    cpu_l3_cache_mb DECIMAL(5,2),
    cpu_socket VARCHAR(50),
    cpu_virtualization BOOLEAN,
    cpu_features TEXT,
    
    -- Memory
    memory_total_gb DECIMAL(10,2),
    memory_type VARCHAR(20),
    memory_max_capacity VARCHAR(20),
    memory_channel_mode VARCHAR(20),
    memory_slots_total INT,
    memory_slots_used INT,
    memory_slots JSONB,
    
    -- GPUs (array)
    gpus JSONB,
    
    -- Storage (array)
    storage_devices JSONB,
    
    -- Battery
    battery_status INT,
    battery_health_percent DECIMAL(5,2),
    battery_cycle_count INT,
    battery_design_capacity VARCHAR(50),
    battery_full_charge_capacity VARCHAR(50),
    battery_chemistry VARCHAR(20),
    
    -- Network adapters (array)
    network_adapters JSONB,
    
    -- Monitor (array)
    monitors JSONB,
    
    -- USB
    usb_controllers JSONB,
    usb_devices JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(report_id)
);

-- Indexes for device_hardware_specs
CREATE INDEX IF NOT EXISTS idx_hw_specs_device ON device_hardware_specs(device_id);
CREATE INDEX IF NOT EXISTS idx_hw_specs_report ON device_hardware_specs(report_id);

-- =====================================================
-- 4. ALTER DEVICES TABLE
-- Add fields for latest diagnostic summary
-- =====================================================
ALTER TABLE devices ADD COLUMN IF NOT EXISTS latest_report_id UUID REFERENCES diagnostic_reports(id);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS last_diagnostic_at TIMESTAMPTZ;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS diagnostic_score INT;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS bios_serial VARCHAR(100);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS os VARCHAR(100);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS battery_health_percent DECIMAL(5,2);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS storage_health_percent DECIMAL(5,2);

-- =====================================================
-- 5. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE diagnostic_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_hardware_specs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view reports for devices in their company
CREATE POLICY "Users can view own company reports" ON diagnostic_reports
    FOR SELECT
    USING (
        device_id IN (
            SELECT id FROM devices 
            WHERE company_id = (
                SELECT company_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- Policy: Warehouse staff and above can insert reports
CREATE POLICY "Staff can insert reports" ON diagnostic_reports
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin', 'warehouse_manager', 'warehouse_staff', 'technician', 'repair_manager')
        )
    );

-- Policy: Test results inherit from parent report
CREATE POLICY "Users can view test results" ON diagnostic_test_results
    FOR SELECT
    USING (
        report_id IN (SELECT id FROM diagnostic_reports)
    );

CREATE POLICY "Staff can insert test results" ON diagnostic_test_results
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin', 'warehouse_manager', 'warehouse_staff', 'technician', 'repair_manager')
        )
    );

-- Policy: Hardware specs inherit from parent report
CREATE POLICY "Users can view hardware specs" ON device_hardware_specs
    FOR SELECT
    USING (
        report_id IN (SELECT id FROM diagnostic_reports)
    );

CREATE POLICY "Staff can insert hardware specs" ON device_hardware_specs
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin', 'warehouse_manager', 'warehouse_staff', 'technician', 'repair_manager')
        )
    );

-- =====================================================
-- 6. TRIGGER: Auto-update device on new report
-- =====================================================
CREATE OR REPLACE FUNCTION update_device_on_report()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE devices
    SET 
        latest_report_id = NEW.id,
        last_diagnostic_at = NEW.scan_completed_at,
        diagnostic_score = NEW.score_percent,
        updated_at = NOW()
    WHERE id = NEW.device_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_device_on_report ON diagnostic_reports;
CREATE TRIGGER trigger_update_device_on_report
    AFTER INSERT ON diagnostic_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_device_on_report();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
