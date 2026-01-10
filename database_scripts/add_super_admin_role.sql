-- Add super_admin role and permissions

-- 1. Add 'super_admin' to user_role enum
-- Note: 'ALTER TYPE ... ADD VALUE' cannot be run inside a transaction block in some Postgres versions/clients, 
-- so if this fails, run it separately.
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';

-- 2. Grant Super Admin access to COMPANIES table
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

-- 3. Grant Super Admin access to USERS table (to see company admins)
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
    
-- Note for User: You will need to manually set one user to 'super_admin' in the database to start using this.
