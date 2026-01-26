-- Insert mock warehouse devices with multiple models
-- This will create devices with status 'ready_for_sale' for testing the grouped view

-- Insert devices for Dell Latitude 5420 (5 devices)
INSERT INTO devices (id, asset_id, model, serial_number, manufacturer, status, current_location, company_id, created_at, updated_at)
VALUES 
  ('mock-dev-001', 'DELL-LAT-001', 'Dell Latitude 5420', 'SN-LAT-001', 'Dell', 'ready_for_sale', 'رف A-1', (SELECT id FROM companies LIMIT 1), NOW(), NOW()),
  ('mock-dev-002', 'DELL-LAT-002', 'Dell Latitude 5420', 'SN-LAT-002', 'Dell', 'ready_for_sale', 'رف A-1', (SELECT id FROM companies LIMIT 1), NOW(), NOW()),
  ('mock-dev-003', 'DELL-LAT-003', 'Dell Latitude 5420', 'SN-LAT-003', 'Dell', 'ready_for_sale', 'رف A-2', (SELECT id FROM companies LIMIT 1), NOW(), NOW()),
  ('mock-dev-004', 'DELL-LAT-004', 'Dell Latitude 5420', 'SN-LAT-004', 'Dell', 'ready_for_sale', 'رف A-2', (SELECT id FROM companies LIMIT 1), NOW(), NOW()),
  ('mock-dev-005', 'DELL-LAT-005', 'Dell Latitude 5420', 'SN-LAT-005', 'Dell', 'ready_for_sale', 'رف A-3', (SELECT id FROM companies LIMIT 1), NOW(), NOW());

-- Insert devices for HP EliteBook 840 G8 (3 devices)
INSERT INTO devices (id, asset_id, model, serial_number, manufacturer, status, current_location, company_id, created_at, updated_at)
VALUES 
  ('mock-dev-006', 'HP-EB-001', 'HP EliteBook 840 G8', 'SN-HP-001', 'HP', 'ready_for_sale', 'رف B-1', (SELECT id FROM companies LIMIT 1), NOW(), NOW()),
  ('mock-dev-007', 'HP-EB-002', 'HP EliteBook 840 G8', 'SN-HP-002', 'HP', 'ready_for_sale', 'رف B-1', (SELECT id FROM companies LIMIT 1), NOW(), NOW()),
  ('mock-dev-008', 'HP-EB-003', 'HP EliteBook 840 G8', 'SN-HP-003', 'HP', 'ready_for_sale', 'رف B-2', (SELECT id FROM companies LIMIT 1), NOW(), NOW());

-- Insert devices for Lenovo ThinkPad X1 Carbon (4 devices)
INSERT INTO devices (id, asset_id, model, serial_number, manufacturer, status, current_location, company_id, created_at, updated_at)
VALUES 
  ('mock-dev-009', 'LEN-X1-001', 'Lenovo ThinkPad X1 Carbon', 'SN-LEN-001', 'Lenovo', 'ready_for_sale', 'رف C-1', (SELECT id FROM companies LIMIT 1), NOW(), NOW()),
  ('mock-dev-010', 'LEN-X1-002', 'Lenovo ThinkPad X1 Carbon', 'SN-LEN-002', 'Lenovo', 'ready_for_sale', 'رف C-1', (SELECT id FROM companies LIMIT 1), NOW(), NOW()),
  ('mock-dev-011', 'LEN-X1-003', 'Lenovo ThinkPad X1 Carbon', 'SN-LEN-003', 'Lenovo', 'ready_for_sale', 'رف C-2', (SELECT id FROM companies LIMIT 1), NOW(), NOW()),
  ('mock-dev-012', 'LEN-X1-004', 'Lenovo ThinkPad X1 Carbon', 'SN-LEN-004', 'Lenovo', 'ready_for_sale', 'رف C-2', (SELECT id FROM companies LIMIT 1), NOW(), NOW());

-- Insert devices for MacBook Pro 14" (2 devices)
INSERT INTO devices (id, asset_id, model, serial_number, manufacturer, status, current_location, company_id, created_at, updated_at)
VALUES 
  ('mock-dev-013', 'MAC-PRO-001', 'MacBook Pro 14"', 'SN-MAC-001', 'Apple', 'ready_for_sale', 'رف D-1', (SELECT id FROM companies LIMIT 1), NOW(), NOW()),
  ('mock-dev-014', 'MAC-PRO-002', 'MacBook Pro 14"', 'SN-MAC-002', 'Apple', 'ready_for_sale', 'رف D-1', (SELECT id FROM companies LIMIT 1), NOW(), NOW());

-- Insert device for Asus ROG Zephyrus (1 device - to test single item handling)
INSERT INTO devices (id, asset_id, model, serial_number, manufacturer, status, current_location, company_id, created_at, updated_at)
VALUES 
  ('mock-dev-015', 'ASUS-ROG-001', 'Asus ROG Zephyrus G14', 'SN-ASUS-001', 'Asus', 'ready_for_sale', 'رف E-1', (SELECT id FROM companies LIMIT 1), NOW(), NOW());
