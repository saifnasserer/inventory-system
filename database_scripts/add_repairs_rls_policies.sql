-- Add RLS Policies for Repairs and Spare Parts Requests

-- Enable RLS if not already enabled
ALTER TABLE repairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE spare_parts_requests ENABLE ROW LEVEL SECURITY;

-- REPAIRS Policies
-- Users can view repairs for devices in their company
DROP POLICY IF EXISTS "Users can view repairs of their company devices" ON repairs;
CREATE POLICY "Users can view repairs of their company devices" ON repairs
    FOR SELECT
    USING (
        device_id IN (
            SELECT id FROM devices WHERE company_id IN (
                SELECT company_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- Users can create repairs for devices in their company
DROP POLICY IF EXISTS "Users can create repairs for their company devices" ON repairs;
CREATE POLICY "Users can create repairs for their company devices" ON repairs
    FOR INSERT
    WITH CHECK (
        device_id IN (
            SELECT id FROM devices WHERE company_id IN (
                SELECT company_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- Users can update repairs for devices in their company
DROP POLICY IF EXISTS "Users can update repairs of their company devices" ON repairs;
CREATE POLICY "Users can update repairs of their company devices" ON repairs
    FOR UPDATE
    USING (
        device_id IN (
            SELECT id FROM devices WHERE company_id IN (
                SELECT company_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- SPARE PARTS REQUESTS Policies
-- Users can view spare parts requests for repairs in their company
DROP POLICY IF EXISTS "Users can view spare parts requests of their company" ON spare_parts_requests;
CREATE POLICY "Users can view spare parts requests of their company" ON spare_parts_requests
    FOR SELECT
    USING (
        repair_id IN (
            SELECT id FROM repairs WHERE device_id IN (
                SELECT id FROM devices WHERE company_id IN (
                    SELECT company_id FROM users WHERE id = auth.uid()
                )
            )
        )
    );

-- Users can create spare parts requests for repairs in their company
DROP POLICY IF EXISTS "Users can create spare parts requests for their company" ON spare_parts_requests;
CREATE POLICY "Users can create spare parts requests for their company" ON spare_parts_requests
    FOR INSERT
    WITH CHECK (
        repair_id IN (
            SELECT id FROM repairs WHERE device_id IN (
                SELECT id FROM devices WHERE company_id IN (
                    SELECT company_id FROM users WHERE id = auth.uid()
                )
            )
        )
    );

-- Set requested_by to current user automatically
DROP POLICY IF EXISTS "Users can update spare parts requests of their company" ON spare_parts_requests;
CREATE POLICY "Users can update spare parts requests of their company" ON spare_parts_requests
    FOR UPDATE
    USING (
        repair_id IN (
            SELECT id FROM repairs WHERE device_id IN (
                SELECT id FROM devices WHERE company_id IN (
                    SELECT company_id FROM users WHERE id = auth.uid()
                )
            )
        )
    );
