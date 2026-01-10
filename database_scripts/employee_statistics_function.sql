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
