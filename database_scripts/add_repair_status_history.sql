-- Add status_history column to repairs table to track timestamps for each status

ALTER TABLE repairs ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]'::jsonb;

-- Add a comment explaining the structure
COMMENT ON COLUMN repairs.status_history IS 'Array of status change events with timestamps: [{"status": "diagnosing", "started_at": "2024-01-01T10:00:00Z", "ended_at": "2024-01-01T11:00:00Z"}]';
