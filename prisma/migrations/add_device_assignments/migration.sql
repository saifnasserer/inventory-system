-- CreateTable
CREATE TABLE IF NOT EXISTS "device_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "device_id" UUID NOT NULL,
    "assigned_to" UUID NOT NULL,
    "assigned_by" UUID NOT NULL,
    "assigned_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_device_assignments_device" ON "device_assignments"("device_id");
CREATE INDEX "idx_device_assignments_assigned_to" ON "device_assignments"("assigned_to");
CREATE INDEX "idx_device_assignments_status" ON "device_assignments"("status");
CREATE INDEX "idx_device_assignments_assigned_at" ON "device_assignments"("assigned_at" DESC);

-- AddForeignKey
ALTER TABLE "device_assignments" ADD CONSTRAINT "device_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "device_assignments" ADD CONSTRAINT "device_assignments_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "device_assignments" ADD CONSTRAINT "device_assignments_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- Enable Row Level Security
ALTER TABLE "device_assignments" ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins and managers can see all assignments
CREATE POLICY "admin_view_all_assignments" ON "device_assignments"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'warehouse_manager', 'repair_manager', 'super_admin')
    )
  );

-- RLS Policy: Employees can see their own assignments
CREATE POLICY "employee_view_own_assignments" ON "device_assignments"
  FOR SELECT
  USING (
    assigned_to = auth.uid()
    OR assigned_by = auth.uid()
  );

-- RLS Policy: Admins and managers can create assignments
CREATE POLICY "admin_create_assignments" ON "device_assignments"
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'warehouse_manager', 'repair_manager', 'super_admin')
    )
  );

-- RLS Policy: Admins and managers can update assignments
CREATE POLICY "admin_update_assignments" ON "device_assignments"
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'warehouse_manager', 'repair_manager', 'super_admin')
    )
  );

-- RLS Policy: Employees can update their own assignments (mark as completed)
CREATE POLICY "employee_update_own_assignments" ON "device_assignments"
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

-- Function to get employee statistics
CREATE OR REPLACE FUNCTION get_employee_statistics(employee_id UUID)
RETURNS TABLE (
  total_processed BIGINT,
  sent_to_warehouse BIGINT,
  sent_to_maintenance BIGINT,
  currently_assigned BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Total devices processed (completed assignments)
    (SELECT COUNT(*)
     FROM device_assignments
     WHERE assigned_to = employee_id
     AND status = 'completed') AS total_processed,
    
    -- Devices sent to warehouse (ready_for_sale)
    (SELECT COUNT(*)
     FROM device_assignments da
     JOIN devices d ON da.device_id = d.id
     WHERE da.assigned_to = employee_id
     AND da.status = 'completed'
     AND d.status = 'ready_for_sale') AS sent_to_warehouse,
    
    -- Devices sent to maintenance (needs_repair or in_repair)
    (SELECT COUNT(*)
     FROM device_assignments da
     JOIN devices d ON da.device_id = d.id
     WHERE da.assigned_to = employee_id
     AND da.status = 'completed'
     AND d.status IN ('needs_repair', 'in_repair')) AS sent_to_maintenance,
    
    -- Currently assigned devices
    (SELECT COUNT(*)
     FROM device_assignments
     WHERE assigned_to = employee_id
     AND status = 'active') AS currently_assigned;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_employee_statistics(UUID) TO authenticated;

-- Function to get employee work history (for charts)
CREATE OR REPLACE FUNCTION get_employee_work_history(
  employee_id UUID,
  days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  date DATE,
  completed_count BIGINT,
  to_warehouse_count BIGINT,
  to_maintenance_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(
      CURRENT_DATE - (days_back || ' days')::INTERVAL,
      CURRENT_DATE,
      '1 day'::INTERVAL
    )::DATE AS date
  )
  SELECT
    ds.date,
    COALESCE(COUNT(da.id) FILTER (WHERE da.status = 'completed'), 0) AS completed_count,
    COALESCE(COUNT(da.id) FILTER (WHERE da.status = 'completed' AND d.status = 'ready_for_sale'), 0) AS to_warehouse_count,
    COALESCE(COUNT(da.id) FILTER (WHERE da.status = 'completed' AND d.status IN ('needs_repair', 'in_repair')), 0) AS to_maintenance_count
  FROM date_series ds
  LEFT JOIN device_assignments da ON DATE(da.completed_at) = ds.date
    AND da.assigned_to = employee_id
  LEFT JOIN devices d ON da.device_id = d.id
  GROUP BY ds.date
  ORDER BY ds.date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_employee_work_history(UUID, INTEGER) TO authenticated;

-- Function to get devices in maintenance that employee sent
CREATE OR REPLACE FUNCTION get_employee_maintenance_followup(employee_id UUID)
RETURNS TABLE (
  device_id UUID,
  asset_id VARCHAR,
  model VARCHAR,
  status VARCHAR,
  assigned_at TIMESTAMP WITH TIME ZONE,
  repair_status VARCHAR,
  repair_assigned_to UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id AS device_id,
    d.asset_id,
    d.model,
    d.status::VARCHAR,
    da.assigned_at,
    r.status::VARCHAR AS repair_status,
    r.assigned_to AS repair_assigned_to
  FROM device_assignments da
  JOIN devices d ON da.device_id = d.id
  LEFT JOIN repairs r ON r.device_id = d.id AND r.status NOT IN ('completed', 'returned_to_inspection')
  WHERE da.assigned_to = employee_id
  AND da.status = 'completed'
  AND d.status IN ('needs_repair', 'in_repair')
  ORDER BY da.completed_at DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_employee_maintenance_followup(UUID) TO authenticated;
