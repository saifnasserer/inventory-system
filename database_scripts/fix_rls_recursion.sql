-- Fix RLS Infinite Recursion (500 Internal Server Error)
-- The previous policies caused infinite loops because they queried the 'users' table while ensuring permissions on the 'users' table.
-- Solution: Use SECURITY DEFINER functions to bypass RLS for permission checks.

-- 1. Helper Function: Check if user is Super Admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Helper Function: Get Current User's Company ID
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS UUID AS $$
DECLARE
    cid UUID;
BEGIN
    SELECT company_id INTO cid
    FROM users
    WHERE id = auth.uid();
    RETURN cid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Update COMPANIES Policies
DROP POLICY IF EXISTS "Super Admin can do everything on companies" ON companies;
DROP POLICY IF EXISTS "Users can view their own company" ON companies;

CREATE POLICY "Super Admin can do everything on companies" ON companies
    FOR ALL
    USING ( is_super_admin() );

CREATE POLICY "Users can view their own company" ON companies
    FOR SELECT
    USING ( id = get_my_company_id() );


-- 4. Update USERS Policies
DROP POLICY IF EXISTS "Super Admin can view all users" ON users;
DROP POLICY IF EXISTS "Users can view members of their own company" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to view users" ON users; -- Cleanup old ones

CREATE POLICY "Super Admin can view all users" ON users
    FOR SELECT
    USING ( is_super_admin() );

CREATE POLICY "Users can view members of their own company" ON users
    FOR SELECT
    USING ( company_id = get_my_company_id() );
    
-- Allow users to view THEMSELVES (important for initial load)
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT
    USING ( id = auth.uid() );


-- 5. Update DEVICES Policies
DROP POLICY IF EXISTS "Users can view devices of their own company" ON devices;
DROP POLICY IF EXISTS "Users can insert devices for their own company" ON devices;
DROP POLICY IF EXISTS "Users can update devices of their own company" ON devices;
DROP POLICY IF EXISTS "Users can delete devices of their own company" ON devices;

-- Admin View
CREATE POLICY "Super Admin all devices" ON devices
    FOR ALL
    USING ( is_super_admin() );

-- Standard User View
CREATE POLICY "Users can view devices of their own company" ON devices
    FOR SELECT
    USING ( company_id = get_my_company_id() );

CREATE POLICY "Users can insert devices for their own company" ON devices
    FOR INSERT
    WITH CHECK ( company_id = get_my_company_id() );

CREATE POLICY "Users can update devices of their own company" ON devices
    FOR UPDATE
    USING ( company_id = get_my_company_id() );

CREATE POLICY "Users can delete devices of their own company" ON devices
    FOR DELETE
    USING ( company_id = get_my_company_id() );


-- 6. Update SHIPMENTS Policies
DROP POLICY IF EXISTS "Users can view shipments of their own company" ON shipments;
DROP POLICY IF EXISTS "Users can insert shipments for their own company" ON shipments;
DROP POLICY IF EXISTS "Users can update shipments of their own company" ON shipments;
DROP POLICY IF EXISTS "Users can delete shipments of their own company" ON shipments;
DROP POLICY IF EXISTS "Allow authenticated users to view shipments" ON shipments; -- Cleanup

-- Admin View
CREATE POLICY "Super Admin all shipments" ON shipments
    FOR ALL
    USING ( is_super_admin() );

-- Standard User View
CREATE POLICY "Users can view shipments of their own company" ON shipments
    FOR SELECT
    USING ( company_id = get_my_company_id() );

CREATE POLICY "Users can insert shipments for their own company" ON shipments
    FOR INSERT
    WITH CHECK ( company_id = get_my_company_id() );

CREATE POLICY "Users can update shipments of their own company" ON shipments
    FOR UPDATE
    USING ( company_id = get_my_company_id() );

CREATE POLICY "Users can delete shipments of their own company" ON shipments
    FOR DELETE
    USING ( company_id = get_my_company_id() );
