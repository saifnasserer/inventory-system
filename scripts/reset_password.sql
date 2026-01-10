-- Ensure pgcrypto is available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Update password to '123456'
UPDATE auth.users 
SET encrypted_password = crypt('123456', gen_salt('bf')) 
WHERE email = 'saifnasseryt@gmail.com';
