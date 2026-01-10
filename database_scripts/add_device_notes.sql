-- Add notes column to devices table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'notes') THEN
        ALTER TABLE devices ADD COLUMN notes TEXT;
    END IF;
END $$;
