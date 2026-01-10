-- Create device_assignments table for tracking assignment history
CREATE TABLE IF NOT EXISTS device_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_device_assignments_device ON device_assignments(device_id);
CREATE INDEX IF NOT EXISTS idx_device_assignments_assigned_to ON device_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_device_assignments_status ON device_assignments(status);
CREATE INDEX IF NOT EXISTS idx_device_assignments_assigned_at ON device_assignments(assigned_at DESC);

-- Enable Row Level Security
ALTER TABLE device_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins and managers can see all assignments
CREATE POLICY admin_view_all_assignments ON device_assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'warehouse_manager', 'repair_manager', 'super_admin')
    )
  );

-- RLS Policy: Employees can see their own assignments
CREATE POLICY employee_view_own_assignments ON device_assignments
  FOR SELECT
  USING (
    assigned_to = auth.uid()
    OR assigned_by = auth.uid()
  );

-- RLS Policy: Admins and managers can create assignments
CREATE POLICY admin_create_assignments ON device_assignments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'warehouse_manager', 'repair_manager', 'super_admin')
    )
  );

-- RLS Policy: Admins and managers can update assignments
CREATE POLICY admin_update_assignments ON device_assignments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'warehouse_manager', 'repair_manager', 'super_admin')
    )
  );

-- RLS Policy: Employees can update their own assignments (mark as completed)
CREATE POLICY employee_update_own_assignments ON device_assignments
  FOR UPDATE
  USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_device_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER device_assignments_updated_at
  BEFORE UPDATE ON device_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_device_assignments_updated_at();

-- Create trigger to update device.assigned_to when assignment is created
CREATE OR REPLACE FUNCTION sync_device_assignment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' THEN
    UPDATE devices
    SET assigned_to = NEW.assigned_to,
        updated_at = NOW()
    WHERE id = NEW.device_id;
  ELSIF NEW.status = 'completed' OR NEW.status = 'cancelled' THEN
    UPDATE devices
    SET assigned_to = NULL,
        updated_at = NOW()
    WHERE id = NEW.device_id
    AND assigned_to = NEW.assigned_to;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_device_assignment_trigger
  AFTER INSERT OR UPDATE ON device_assignments
  FOR EACH ROW
  EXECUTE FUNCTION sync_device_assignment();
