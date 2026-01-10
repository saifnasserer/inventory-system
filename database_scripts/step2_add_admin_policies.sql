-- Step 2: Add Policies for Super Admin
-- Run this script SECOND (after step1_add_enum_value.sql is committed).

-- 1. Grant Super Admin access to COMPANIES table
DROP POLICY IF EXISTS "Super Admin can do everything on companies" ON companies;

CREATE POLICY "Super Admin can do everything on companies" ON companies
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'super_admin'
        )
    );

-- 2. Grant Super Admin access to USERS table (to see company admins)
DROP POLICY IF EXISTS "Super Admin can view all users" ON users;
CREATE POLICY "Super Admin can view all users" ON users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'super_admin'
        )
    );

-- 3. Reminder: Explicitly set your user to super_admin
-- UPDATE users SET role = 'super_admin' WHERE email = 'your_email';
