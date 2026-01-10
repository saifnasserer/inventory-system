-- Fix RLS Policies to strictuly enforce Tenant Isolation for 'admin' role
-- Limitation: The legacy 'admin_all' policy allowed admins to see EVERYTHING. We must remove it.

-- 1. Drop Legacy Policies that ignore company_id
DROP POLICY IF EXISTS admin_all ON devices;
DROP POLICY IF EXISTS admin_all ON shipments;
DROP POLICY IF EXISTS admin_all ON invoices;
DROP POLICY IF EXISTS admin_all ON users; -- Just in case

-- 2. Ensure "Demo Company" exists and clean up headless data
DO $$
DECLARE
    demo_company_id UUID;
BEGIN
    -- Get or Create Demo Company
    INSERT INTO companies (name, status, subscription_plan)
    VALUES ('Demo Company', 'active', 'enterprise')
    ON CONFLICT DO NOTHING;
    
    SELECT id INTO demo_company_id FROM companies WHERE name = 'Demo Company' LIMIT 1;
    
    -- Assign NULL company_id records to Demo Company
    UPDATE devices SET company_id = demo_company_id WHERE company_id IS NULL;
    UPDATE shipments SET company_id = demo_company_id WHERE company_id IS NULL;
    UPDATE users SET company_id = demo_company_id WHERE company_id IS NULL AND role != 'super_admin';
    
END $$;
