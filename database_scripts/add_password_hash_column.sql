-- Migration: Add password_hash to users table for self-hosted auth
-- This allows us to store hashed passwords directly instead of relying on Supabase Auth

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Add comment
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password for self-hosted authentication';
