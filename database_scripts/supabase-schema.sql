-- Users table with role-based access
CREATE TYPE user_role AS ENUM (
  'admin',
  'warehouse_manager',
  'warehouse_staff',
  'repair_manager',
  'technician',
  'branch_manager',
  'sales_staff'
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  branch_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Branches table
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  location VARCHAR(500),
  manager_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key to users table
ALTER TABLE users ADD CONSTRAINT fk_branch 
  FOREIGN KEY (branch_id) REFERENCES branches(id);

-- Shipments table
CREATE TABLE shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_code VARCHAR(100) UNIQUE NOT NULL,
  supplier_name VARCHAR(255) NOT NULL,
  supplier_contact VARCHAR(255),
  delivery_date DATE NOT NULL,
  device_count INTEGER NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Device status enum
CREATE TYPE device_status AS ENUM (
  'received',
  'pending_inspection',
  'in_physical_inspection',
  'in_technical_inspection',
  'ready_for_sale',
  'needs_repair',
  'in_repair',
  'in_branch',
  'sold'
);

-- Devices table
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id VARCHAR(100) UNIQUE NOT NULL,
  shipment_id UUID REFERENCES shipments(id),
  status device_status DEFAULT 'received',
  
  -- Device specifications (filled during technical inspection)
  model VARCHAR(255),
  serial_number VARCHAR(255),
  manufacturer VARCHAR(255),
  
  -- Hardware specs
  ram_size INTEGER, -- in GB
  ram_count INTEGER,
  ram_models TEXT[],
  storage_size INTEGER, -- in GB
  storage_count INTEGER,
  storage_types TEXT[],
  storage_models TEXT[],
  gpu_model VARCHAR(255),
  cpu_model VARCHAR(255),
  
  -- Current location
  current_location VARCHAR(50), -- 'warehouse', 'repair', 'branch'
  branch_id UUID REFERENCES branches(id),
  assigned_to UUID REFERENCES users(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Physical inspections table
CREATE TABLE physical_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES devices(id),
  inspector_id UUID REFERENCES users(id),
  
  -- Condition assessment
  has_scratches BOOLEAN DEFAULT FALSE,
  has_cracks BOOLEAN DEFAULT FALSE,
  has_dents BOOLEAN DEFAULT FALSE,
  overall_condition VARCHAR(50), -- 'excellent', 'good', 'fair', 'poor'
  
  notes TEXT,
  photos TEXT[], -- URLs to uploaded photos
  
  inspected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Technical inspections table
CREATE TABLE technical_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES devices(id),
  inspector_id UUID REFERENCES users(id),
  
  -- Performance metrics
  stress_test_passed BOOLEAN,
  max_temperature DECIMAL(5,2), -- in Celsius
  performance_score INTEGER, -- 0-100
  
  -- Decision
  ready_for_sale BOOLEAN DEFAULT FALSE,
  needs_repair BOOLEAN DEFAULT FALSE,
  repair_notes TEXT,
  
  notes TEXT,
  inspected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Repairs table
CREATE TABLE repairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES devices(id),
  assigned_to UUID REFERENCES users(id), -- technician
  assigned_by UUID REFERENCES users(id), -- repair manager
  
  issue_description TEXT,
  work_log TEXT[],
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'returned_to_inspection'
  
  assigned_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Spare parts requests table
CREATE TABLE spare_parts_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_id UUID REFERENCES repairs(id),
  requested_by UUID REFERENCES users(id), -- technician
  
  part_name VARCHAR(255) NOT NULL,
  part_description TEXT,
  quantity INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'delivered'
  
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transfers table
CREATE TABLE transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES devices(id),
  
  from_location VARCHAR(50), -- 'warehouse', 'repair', 'branch'
  to_location VARCHAR(50),
  from_branch_id UUID REFERENCES branches(id),
  to_branch_id UUID REFERENCES branches(id),
  
  initiated_by UUID REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_transit', 'completed'
  
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(100) UNIQUE NOT NULL,
  device_id UUID REFERENCES devices(id),
  branch_id UUID REFERENCES branches(id),
  
  customer_name VARCHAR(255) NOT NULL,
  customer_contact VARCHAR(255),
  customer_email VARCHAR(255),
  
  sale_price DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2),
  total_amount DECIMAL(10,2) NOT NULL,
  
  sold_by UUID REFERENCES users(id),
  sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Announcements table
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  
  created_by UUID REFERENCES users(id),
  target_role user_role, -- NULL means all users
  target_branch_id UUID REFERENCES branches(id), -- NULL means all branches
  
  is_active BOOLEAN DEFAULT TRUE,
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_devices_status ON devices(status);
CREATE INDEX idx_devices_asset_id ON devices(asset_id);
CREATE INDEX idx_devices_branch ON devices(branch_id);
CREATE INDEX idx_devices_assigned ON devices(assigned_to);
CREATE INDEX idx_repairs_status ON repairs(status);
CREATE INDEX idx_repairs_assigned ON repairs(assigned_to);
CREATE INDEX idx_transfers_status ON transfers(status);
CREATE INDEX idx_announcements_active ON announcements(is_active);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE physical_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE technical_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE repairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE spare_parts_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policies (basic examples - customize based on requirements)
-- Admin can see everything
CREATE POLICY admin_all ON devices FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Warehouse staff can see devices in warehouse
CREATE POLICY warehouse_view ON devices FOR SELECT USING (
  current_location = 'warehouse' AND
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('warehouse_manager', 'warehouse_staff')
  )
);

-- Branch staff can see devices in their branch
CREATE POLICY branch_view ON devices FOR SELECT USING (
  current_location = 'branch' AND
  branch_id IN (
    SELECT branch_id FROM users WHERE users.id = auth.uid()
  )
);

-- Technicians can see devices assigned to them
CREATE POLICY technician_view ON devices FOR SELECT USING (
  current_location = 'repair' AND
  assigned_to = auth.uid()
);
