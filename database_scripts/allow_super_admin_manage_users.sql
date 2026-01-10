-- Allow Super Admin to INSERT/UPDATE/DELETE users (public.users table)
DROP POLICY IF EXISTS "Super Admin can manage all users" ON users;

CREATE POLICY "Super Admin can manage all users" ON users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'super_admin'
        )
    );
