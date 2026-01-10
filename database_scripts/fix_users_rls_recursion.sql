-- Fix infinite recursion by using a SECURITY DEFINER function

-- 1. Create function to check super admin status securely
-- SECURITY DEFINER makes it run with privileges of the creator (bypass RLS)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'super_admin'
  );
END;
$$;

-- 2. Drop the problematic recursive policies
DROP POLICY IF EXISTS "Super Admin can manage all users" ON users;
DROP POLICY IF EXISTS "Super Admin can view all users" ON users;

-- 3. Re-create the Super Admin policy using the function
CREATE POLICY "Super Admin can manage all users" ON users
    FOR ALL
    USING (
        is_super_admin()
    );

-- 4. Ensure users can see their own profile (standard non-recursive policy)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT
    USING (
        auth.uid() = id
    );
