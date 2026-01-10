-- SaaS Migration Script

-- 1. Create Companies Table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- active, inactive
    subscription_plan TEXT DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Insert Default Company (for backfilling)
INSERT INTO companies (name, status)
VALUES ('Demo Company', 'active')
ON CONFLICT DO NOTHING;

-- Store default company ID for backfill
DO $$
DECLARE
    default_company_id UUID;
BEGIN
    SELECT id INTO default_company_id FROM companies WHERE name = 'Demo Company' LIMIT 1;

    -- 3. Update Users Table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'company_id') THEN
        ALTER TABLE users ADD COLUMN company_id UUID REFERENCES companies(id);
        
        -- Backfill existing users (handle potential nulls carefully in prod, but for dev we assume all users go to demo)
        UPDATE users SET company_id = default_company_id WHERE company_id IS NULL;
        
        -- Make it required after backfill
        ALTER TABLE users ALTER COLUMN company_id SET NOT NULL;
    END IF;

    -- 4. Update Devices Table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'company_id') THEN
        ALTER TABLE devices ADD COLUMN company_id UUID REFERENCES companies(id);
        
        UPDATE devices SET company_id = default_company_id WHERE company_id IS NULL;
        
        ALTER TABLE devices ALTER COLUMN company_id SET NOT NULL;
    END IF;
    
    -- 5. Update Shipments Table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shipments' AND column_name = 'company_id') THEN
        ALTER TABLE shipments ADD COLUMN company_id UUID REFERENCES companies(id);
        
        UPDATE shipments SET company_id = default_company_id WHERE company_id IS NULL;
        
        ALTER TABLE shipments ALTER COLUMN company_id SET NOT NULL;
    END IF;

END $$;

-- 6. Enable RLS on Companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- 7. Create/Update RLS Policies

-- Helper function to get current user's company_id
-- Note: In Supabase, we can store company_id in app_metadata or user_metadata.
-- For now, we'll join with the public.users table (or auth.users if synchronized).
-- Since we are modifying 'users' table in public schema, we can query it.

-- COMPANIES Policies
DROP POLICY IF EXISTS "Users can view their own company" ON companies;
CREATE POLICY "Users can view their own company" ON companies
    FOR SELECT
    USING (
        id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

-- USERS Policies (Update existing to be company-aware)
DROP POLICY IF EXISTS "Users can view members of their own company" ON users;
CREATE POLICY "Users can view members of their own company" ON users
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

-- DEVICES Policies
DROP POLICY IF EXISTS "Users can view devices of their own company" ON devices;
CREATE POLICY "Users can view devices of their own company" ON devices
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert devices for their own company" ON devices;
CREATE POLICY "Users can insert devices for their own company" ON devices
    FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update devices of their own company" ON devices;
CREATE POLICY "Users can update devices of their own company" ON devices
    FOR UPDATE
    USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete devices of their own company" ON devices;
CREATE POLICY "Users can delete devices of their own company" ON devices
    FOR DELETE
    USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

-- SHIPMENTS Policies
DROP POLICY IF EXISTS "Users can view shipments of their own company" ON shipments;
CREATE POLICY "Users can view shipments of their own company" ON shipments
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert shipments for their own company" ON shipments;
CREATE POLICY "Users can insert shipments for their own company" ON shipments
    FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update shipments of their own company" ON shipments;
CREATE POLICY "Users can update shipments of their own company" ON shipments
    FOR UPDATE
    USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete shipments of their own company" ON shipments;
CREATE POLICY "Users can delete shipments of their own company" ON shipments
    FOR DELETE
    USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );
