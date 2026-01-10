-- SaaS Triggers Setup
-- This script creates triggers to automatically assign company_id to new records based on the creating user's company.

-- 1. Function to get current user's company_id
CREATE OR REPLACE FUNCTION get_current_user_company_id()
RETURNS UUID AS $$
DECLARE
    cid UUID;
BEGIN
    SELECT company_id INTO cid
    FROM users
    WHERE id = auth.uid();
    RETURN cid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger Function for Shipments
CREATE OR REPLACE FUNCTION set_shipment_company_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set if not already provided
    IF NEW.company_id IS NULL THEN
        NEW.company_id := get_current_user_company_id();
    END IF;
    
    -- Safety check: block insert if no company found (unless super admin override logic exists)
    IF NEW.company_id IS NULL THEN
        RAISE EXCEPTION 'User must belong to a company to create records.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply Trigger to Shipments
DROP TRIGGER IF EXISTS trg_set_shipment_company_id ON shipments;
CREATE TRIGGER trg_set_shipment_company_id
BEFORE INSERT ON shipments
FOR EACH ROW
EXECUTE FUNCTION set_shipment_company_id();


-- 3. Trigger Function for Devices
CREATE OR REPLACE FUNCTION set_device_company_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.company_id IS NULL THEN
        NEW.company_id := get_current_user_company_id();
    END IF;
    
    IF NEW.company_id IS NULL THEN
        RAISE EXCEPTION 'User must belong to a company to create records.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply Trigger to Devices
DROP TRIGGER IF EXISTS trg_set_device_company_id ON devices;
CREATE TRIGGER trg_set_device_company_id
BEFORE INSERT ON devices
FOR EACH ROW
EXECUTE FUNCTION set_device_company_id();

-- 4. Trigger for Invoices (if needed later)
-- Repeat pattern as needed for other tables
