-- Fix User Constraints for Super Admin
-- Allows super_admin to have NULL company_id

-- 1. Drop the strict NOT NULL constraint
ALTER TABLE users ALTER COLUMN company_id DROP NOT NULL;

-- 2. Add a CHECK constraint
-- "If role is NOT super_admin, then company_id MUST NOT be null"
-- This ensures regular users and admins still need a company.
ALTER TABLE users ADD CONSTRAINT users_company_id_check 
    CHECK (
        role = 'super_admin' OR company_id IS NOT NULL
    );

-- 3. Update the Triggers (Optional but good practice)
-- If super_admin creates data without specifying company_id, we might want to allow it 
-- (global data?) or still enforce it for data records.
-- For now, this script only fixes the USERS table constraint.
