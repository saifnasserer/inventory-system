-- Step 1: Add the new enum value
-- Run this script FIRST.
-- After running this, simple 'Success' or no error should appear.
-- Then run step2_add_admin_policies.sql.

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';
