-- Simplified RLS Policies for Repairs - Grant access to all authenticated users for now

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view repairs of their company devices" ON repairs;
DROP POLICY IF EXISTS "Users can create repairs for their company devices" ON repairs;
DROP POLICY IF EXISTS "Users can update repairs of their company devices" ON repairs;
DROP POLICY IF EXISTS "Users can view spare parts requests of their company" ON spare_parts_requests;
DROP POLICY IF EXISTS "Users can create spare parts requests for their company" ON spare_parts_requests;
DROP POLICY IF EXISTS "Users can update spare parts requests of their company" ON spare_parts_requests;

-- Simple policies: All authenticated users can access
CREATE POLICY "Authenticated users can view all repairs" ON repairs
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create repairs" ON repairs
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update repairs" ON repairs
    FOR UPDATE
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete repairs" ON repairs
    FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Spare Parts Requests
CREATE POLICY "Authenticated users can view spare parts requests" ON spare_parts_requests
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create spare parts requests" ON spare_parts_requests
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update spare parts requests" ON spare_parts_requests
    FOR UPDATE
    USING (auth.uid() IS NOT NULL);
