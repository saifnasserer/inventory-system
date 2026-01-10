-- FIX RLS POLICIES FOR SHIPMENTS AND USERS
-- Run this script in the Supabase SQL Editor to fix the 403 and 406 errors.

-- 1. Fix SHIPMENTS Table Policies
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to view shipments" ON shipments;
DROP POLICY IF EXISTS "Allow authenticated users to insert shipments" ON shipments;
DROP POLICY IF EXISTS "Allow authenticated users to update shipments" ON shipments;
DROP POLICY IF EXISTS "Allow authenticated users to delete shipments" ON shipments;

CREATE POLICY "Allow authenticated users to view shipments" ON shipments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert shipments" ON shipments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update shipments" ON shipments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users to delete shipments" ON shipments FOR DELETE TO authenticated USING (true);

-- 2. Fix USERS Table Policies (Fixes the 406 error)
-- Note: This assumes you have a public.users table. If you rely on auth.users, you might need a different approach,
-- but based on your code (useGetIdentity), you seem to be querying a users table.

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Allow authenticated users to view users" ON users;
        
        CREATE POLICY "Allow authenticated users to view users" ON users FOR SELECT TO authenticated USING (true);
        -- Add other user policies if needed, but SELECT is usually sufficient for looking up user details
    END IF;
END $$;
