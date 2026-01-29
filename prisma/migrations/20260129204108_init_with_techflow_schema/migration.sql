-- CreateTable
CREATE TABLE `announcements` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `created_by` VARCHAR(191) NULL,
    `target_role` ENUM('admin', 'warehouse_manager', 'warehouse_staff', 'repair_manager', 'technician', 'branch_manager', 'sales_staff', 'super_admin') NULL,
    `target_branch_id` VARCHAR(191) NULL,
    `is_active` BOOLEAN NULL DEFAULT true,
    `priority` VARCHAR(20) NULL DEFAULT 'normal',
    `expires_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_announcements_active`(`is_active`),
    INDEX `announcements_created_by_fkey`(`created_by`),
    INDEX `announcements_target_branch_id_fkey`(`target_branch_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `branches` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `location` VARCHAR(500) NULL,
    `manager_id` VARCHAR(191) NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `branches_manager_id_fkey`(`manager_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendors` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `contact_person` VARCHAR(255) NULL,
    `contact_phone` VARCHAR(50) NULL,
    `contact_email` VARCHAR(255) NULL,
    `category` VARCHAR(100) NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `company_id` VARCHAR(191) NOT NULL DEFAULT 'default-company-id',

    INDEX `vendors_company_id_fkey`(`company_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `companies` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `subscription_plan` VARCHAR(191) NULL DEFAULT 'free',
    `subscription_expiry` DATETIME(0) NULL,
    `max_offline_devices` INTEGER NULL DEFAULT 5,
    `offline_scan_usage` INTEGER NULL DEFAULT 0,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `devices` (
    `id` VARCHAR(191) NOT NULL,
    `asset_id` VARCHAR(100) NOT NULL,
    `shipment_id` VARCHAR(191) NULL,
    `status` ENUM('received', 'diagnosed', 'pending_inspection', 'in_physical_inspection', 'in_technical_inspection', 'ready_for_sale', 'needs_repair', 'in_repair', 'in_branch', 'sold') NULL DEFAULT 'received',
    `model` VARCHAR(255) NULL,
    `serial_number` VARCHAR(255) NULL,
    `manufacturer` VARCHAR(255) NULL,
    `ram_size` INTEGER NULL,
    `ram_count` INTEGER NULL,
    `ram_models` JSON NULL,
    `storage_size` INTEGER NULL,
    `storage_count` INTEGER NULL,
    `storage_types` JSON NULL,
    `storage_models` JSON NULL,
    `gpu_model` VARCHAR(255) NULL,
    `cpu_model` VARCHAR(255) NULL,
    `current_location` VARCHAR(50) NULL,
    `branch_id` VARCHAR(191) NULL,
    `assigned_to` VARCHAR(191) NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `company_id` VARCHAR(191) NOT NULL,
    `latest_report_id` VARCHAR(191) NULL,
    `last_diagnostic_at` DATETIME(0) NULL,
    `diagnostic_score` INTEGER NULL,
    `bios_serial` VARCHAR(100) NULL,
    `os` VARCHAR(100) NULL,
    `battery_health_percent` DECIMAL(5, 2) NULL,
    `storage_health_percent` DECIMAL(5, 2) NULL,
    `purchase_price` DECIMAL(10, 2) NULL,

    UNIQUE INDEX `devices_asset_id_key`(`asset_id`),
    INDEX `idx_devices_asset_id`(`asset_id`),
    INDEX `idx_devices_assigned`(`assigned_to`),
    INDEX `idx_devices_branch`(`branch_id`),
    INDEX `idx_devices_status`(`status`),
    INDEX `devices_company_id_fkey`(`company_id`),
    INDEX `devices_latest_report_id_fkey`(`latest_report_id`),
    INDEX `devices_shipment_id_fkey`(`shipment_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `device_assignments` (
    `id` VARCHAR(191) NOT NULL,
    `device_id` VARCHAR(191) NOT NULL,
    `assigned_to` VARCHAR(191) NOT NULL,
    `assigned_by` VARCHAR(191) NOT NULL,
    `assigned_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `completed_at` DATETIME(0) NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'active',
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_device_assignments_device`(`device_id`),
    INDEX `idx_device_assignments_assigned_to`(`assigned_to`),
    INDEX `idx_device_assignments_status`(`status`),
    INDEX `idx_device_assignments_assigned_at`(`assigned_at` DESC),
    INDEX `device_assignments_assigned_by_fkey`(`assigned_by`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoices` (
    `id` VARCHAR(191) NOT NULL,
    `invoice_number` VARCHAR(100) NOT NULL,
    `branch_id` VARCHAR(191) NULL,
    `customer_name` VARCHAR(255) NULL,
    `customer_contact` VARCHAR(255) NULL,
    `sale_price` DECIMAL(10, 2) NOT NULL,
    `tax_amount` DECIMAL(10, 2) NULL,
    `total_amount` DECIMAL(10, 2) NOT NULL,
    `sold_by` VARCHAR(191) NULL,
    `sale_date` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `amount_paid` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `client_id` VARCHAR(191) NULL,
    `payment_method` ENUM('cash', 'credit') NOT NULL DEFAULT 'cash',
    `payment_status` ENUM('paid', 'partial', 'pending') NOT NULL DEFAULT 'pending',

    UNIQUE INDEX `invoices_invoice_number_key`(`invoice_number`),
    INDEX `invoices_branch_id_fkey`(`branch_id`),
    INDEX `invoices_sold_by_fkey`(`sold_by`),
    INDEX `invoices_client_id_fkey`(`client_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoice_items` (
    `id` VARCHAR(191) NOT NULL,
    `invoice_id` VARCHAR(191) NOT NULL,
    `device_id` VARCHAR(191) NULL,
    `item_name` VARCHAR(255) NULL,
    `serial_number` VARCHAR(255) NULL,
    `asset_id` VARCHAR(100) NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `unit_price` DECIMAL(10, 2) NOT NULL,
    `total_price` DECIMAL(10, 2) NOT NULL,

    INDEX `invoice_items_invoice_id_fkey`(`invoice_id`),
    INDEX `invoice_items_device_id_fkey`(`device_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clients` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(50) NULL,
    `email` VARCHAR(255) NULL,
    `address` VARCHAR(500) NULL,
    `company_id` VARCHAR(191) NOT NULL,
    `balance` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `clients_company_id_fkey`(`company_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoice_payments` (
    `id` VARCHAR(191) NOT NULL,
    `invoice_id` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `payment_date` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `payment_method` ENUM('cash', 'credit') NOT NULL DEFAULT 'cash',
    `received_by` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `invoice_payments_invoice_id_fkey`(`invoice_id`),
    INDEX `invoice_payments_received_by_fkey`(`received_by`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `physical_inspections` (
    `id` VARCHAR(191) NOT NULL,
    `device_id` VARCHAR(191) NULL,
    `inspector_id` VARCHAR(191) NULL,
    `has_scratches` BOOLEAN NULL DEFAULT false,
    `has_cracks` BOOLEAN NULL DEFAULT false,
    `has_dents` BOOLEAN NULL DEFAULT false,
    `overall_condition` VARCHAR(50) NULL,
    `notes` VARCHAR(191) NULL,
    `photos` JSON NULL,
    `inspected_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `physical_inspections_device_id_fkey`(`device_id`),
    INDEX `physical_inspections_inspector_id_fkey`(`inspector_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `repairs` (
    `id` VARCHAR(191) NOT NULL,
    `device_id` VARCHAR(191) NULL,
    `assigned_to` VARCHAR(191) NULL,
    `assigned_by` VARCHAR(191) NULL,
    `issue_description` VARCHAR(191) NULL,
    `work_log` JSON NULL,
    `status` VARCHAR(50) NULL DEFAULT 'pending',
    `assigned_at` DATETIME(0) NULL,
    `completed_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_repairs_assigned`(`assigned_to`),
    INDEX `idx_repairs_status`(`status`),
    INDEX `repairs_assigned_by_fkey`(`assigned_by`),
    INDEX `repairs_device_id_fkey`(`device_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shipments` (
    `id` VARCHAR(191) NOT NULL,
    `shipment_code` VARCHAR(100) NOT NULL,
    `supplier_name` VARCHAR(255) NULL,
    `supplier_contact` VARCHAR(255) NULL,
    `delivery_date` DATE NOT NULL,
    `device_count` INTEGER NOT NULL,
    `notes` VARCHAR(191) NULL,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `company_id` VARCHAR(191) NOT NULL,
    `shipment_name` VARCHAR(255) NULL,
    `vendor_id` VARCHAR(191) NULL,

    UNIQUE INDEX `shipments_shipment_code_key`(`shipment_code`),
    INDEX `shipments_company_id_fkey`(`company_id`),
    INDEX `shipments_created_by_fkey`(`created_by`),
    INDEX `shipments_vendor_id_fkey`(`vendor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `spare_parts_requests` (
    `id` VARCHAR(191) NOT NULL,
    `repair_id` VARCHAR(191) NULL,
    `requested_by` VARCHAR(191) NULL,
    `part_name` VARCHAR(255) NOT NULL,
    `part_description` VARCHAR(191) NULL,
    `quantity` INTEGER NULL DEFAULT 1,
    `status` VARCHAR(50) NULL DEFAULT 'pending',
    `approved_by` VARCHAR(191) NULL,
    `approved_at` DATETIME(0) NULL,
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `spare_parts_requests_approved_by_fkey`(`approved_by`),
    INDEX `spare_parts_requests_repair_id_fkey`(`repair_id`),
    INDEX `spare_parts_requests_requested_by_fkey`(`requested_by`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `technical_inspections` (
    `id` VARCHAR(191) NOT NULL,
    `device_id` VARCHAR(191) NULL,
    `inspector_id` VARCHAR(191) NULL,
    `stress_test_passed` BOOLEAN NULL,
    `max_temperature` DECIMAL(5, 2) NULL,
    `performance_score` INTEGER NULL,
    `ready_for_sale` BOOLEAN NULL DEFAULT false,
    `needs_repair` BOOLEAN NULL DEFAULT false,
    `repair_notes` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `inspected_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `technical_inspections_device_id_fkey`(`device_id`),
    INDEX `technical_inspections_inspector_id_fkey`(`inspector_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transfers` (
    `id` VARCHAR(191) NOT NULL,
    `device_id` VARCHAR(191) NULL,
    `from_location` VARCHAR(50) NULL,
    `to_location` VARCHAR(50) NULL,
    `from_branch_id` VARCHAR(191) NULL,
    `to_branch_id` VARCHAR(191) NULL,
    `initiated_by` VARCHAR(191) NULL,
    `status` VARCHAR(50) NULL DEFAULT 'pending',
    `requested_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `completed_at` DATETIME(0) NULL,
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_transfers_status`(`status`),
    INDEX `transfers_device_id_fkey`(`device_id`),
    INDEX `transfers_from_branch_id_fkey`(`from_branch_id`),
    INDEX `transfers_initiated_by_fkey`(`initiated_by`),
    INDEX `transfers_to_branch_id_fkey`(`to_branch_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(255) NOT NULL,
    `role` ENUM('admin', 'warehouse_manager', 'warehouse_staff', 'repair_manager', 'technician', 'branch_manager', 'sales_staff', 'super_admin') NOT NULL,
    `branch_id` VARCHAR(191) NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `company_id` VARCHAR(191) NULL,
    `password_hash` VARCHAR(255) NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `fk_branch`(`branch_id`),
    INDEX `users_company_id_fkey`(`company_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `diagnostic_reports` (
    `id` VARCHAR(191) NOT NULL,
    `device_id` VARCHAR(191) NOT NULL,
    `report_id` VARCHAR(191) NOT NULL,
    `asset_id` VARCHAR(100) NOT NULL,
    `timestamp` VARCHAR(50) NULL,
    `production_mode` BOOLEAN NULL DEFAULT false,
    `upload_status` VARCHAR(50) NULL,
    `scan_started_at` DATETIME(0) NULL,
    `scan_completed_at` DATETIME(0) NULL,
    `scan_duration_seconds` DECIMAL(10, 2) NULL,
    `agent_version` VARCHAR(20) NULL,
    `cosmetic_grade` VARCHAR(5) NULL,
    `cosmetic_comments` VARCHAR(191) NULL,
    `thermal_cpu_min` DECIMAL(5, 2) NULL,
    `thermal_cpu_max` DECIMAL(5, 2) NULL,
    `thermal_cpu_avg` DECIMAL(5, 2) NULL,
    `thermal_gpu_min` DECIMAL(5, 2) NULL,
    `thermal_gpu_max` DECIMAL(5, 2) NULL,
    `thermal_gpu_avg` DECIMAL(5, 2) NULL,
    `warnings` JSON NULL,
    `signature_algorithm` VARCHAR(20) NULL,
    `signature_hash` VARCHAR(100) NULL,
    `signature_signed_at` DATETIME(0) NULL,
    `technician_id` VARCHAR(191) NULL,
    `total_tests` INTEGER NULL,
    `passed_tests` INTEGER NULL,
    `failed_tests` INTEGER NULL,
    `score_percent` INTEGER NULL,
    `raw_json` JSON NOT NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `diagnostic_reports_report_id_key`(`report_id`),
    INDEX `idx_reports_device`(`device_id`),
    INDEX `idx_reports_asset`(`asset_id`),
    INDEX `idx_reports_created`(`created_at` DESC),
    INDEX `idx_reports_grade`(`cosmetic_grade`),
    INDEX `diagnostic_reports_technician_id_fkey`(`technician_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `diagnostic_test_results` (
    `id` VARCHAR(191) NOT NULL,
    `report_id` VARCHAR(191) NOT NULL,
    `test_id` VARCHAR(50) NOT NULL,
    `test_name` VARCHAR(100) NULL,
    `status` VARCHAR(20) NOT NULL,
    `message` VARCHAR(191) NULL,
    `details` JSON NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_test_results_report`(`report_id`),
    INDEX `idx_test_results_test_id`(`test_id`),
    INDEX `idx_test_results_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `device_hardware_specs` (
    `id` VARCHAR(191) NOT NULL,
    `report_id` VARCHAR(191) NOT NULL,
    `device_id` VARCHAR(191) NOT NULL,
    `bios_date` VARCHAR(50) NULL,
    `bios_manufacturer` VARCHAR(100) NULL,
    `bios_serial` VARCHAR(100) NULL,
    `bios_version` VARCHAR(50) NULL,
    `manufacturer` VARCHAR(100) NULL,
    `model` VARCHAR(100) NULL,
    `os` VARCHAR(100) NULL,
    `system_name` VARCHAR(100) NULL,
    `uuid` VARCHAR(100) NULL,
    `uptime` VARCHAR(50) NULL,
    `tpm` VARCHAR(50) NULL,
    `motherboard_manufacturer` VARCHAR(100) NULL,
    `motherboard_product` VARCHAR(100) NULL,
    `motherboard_serial` VARCHAR(100) NULL,
    `motherboard_version` VARCHAR(50) NULL,
    `cpu_name` VARCHAR(255) NULL,
    `cpu_physical_cores` INTEGER NULL,
    `cpu_logical_cores` INTEGER NULL,
    `cpu_threads` INTEGER NULL,
    `cpu_base_speed_ghz` DECIMAL(5, 2) NULL,
    `cpu_boost_speed_ghz` DECIMAL(5, 2) NULL,
    `cpu_l2_cache_mb` DECIMAL(5, 2) NULL,
    `cpu_l3_cache_mb` DECIMAL(5, 2) NULL,
    `cpu_socket` VARCHAR(50) NULL,
    `cpu_virtualization` BOOLEAN NULL,
    `cpu_features` VARCHAR(191) NULL,
    `memory_total_gb` DECIMAL(10, 2) NULL,
    `memory_type` VARCHAR(20) NULL,
    `memory_max_capacity` VARCHAR(20) NULL,
    `memory_channel_mode` VARCHAR(20) NULL,
    `memory_slots_total` INTEGER NULL,
    `memory_slots_used` INTEGER NULL,
    `memory_slots` JSON NULL,
    `gpus` JSON NULL,
    `storage_devices` JSON NULL,
    `battery_status` INTEGER NULL,
    `battery_health_percent` DECIMAL(5, 2) NULL,
    `battery_cycle_count` INTEGER NULL,
    `battery_design_capacity` VARCHAR(50) NULL,
    `battery_full_charge_capacity` VARCHAR(50) NULL,
    `battery_chemistry` VARCHAR(20) NULL,
    `network_adapters` JSON NULL,
    `monitors` JSON NULL,
    `usb_controllers` JSON NULL,
    `usb_devices` JSON NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `device_hardware_specs_report_id_key`(`report_id`),
    INDEX `idx_hw_specs_device`(`device_id`),
    INDEX `idx_hw_specs_report`(`report_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `announcements` ADD CONSTRAINT `announcements_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `announcements` ADD CONSTRAINT `announcements_target_branch_id_fkey` FOREIGN KEY (`target_branch_id`) REFERENCES `branches`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `branches` ADD CONSTRAINT `branches_manager_id_fkey` FOREIGN KEY (`manager_id`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `vendors` ADD CONSTRAINT `vendors_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `devices` ADD CONSTRAINT `devices_assigned_to_fkey` FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `devices` ADD CONSTRAINT `devices_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `devices` ADD CONSTRAINT `devices_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `devices` ADD CONSTRAINT `devices_latest_report_id_fkey` FOREIGN KEY (`latest_report_id`) REFERENCES `diagnostic_reports`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `devices` ADD CONSTRAINT `devices_shipment_id_fkey` FOREIGN KEY (`shipment_id`) REFERENCES `shipments`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `device_assignments` ADD CONSTRAINT `device_assignments_assigned_by_fkey` FOREIGN KEY (`assigned_by`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `device_assignments` ADD CONSTRAINT `device_assignments_assigned_to_fkey` FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `device_assignments` ADD CONSTRAINT `device_assignments_device_id_fkey` FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_sold_by_fkey` FOREIGN KEY (`sold_by`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `invoice_items` ADD CONSTRAINT `invoice_items_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice_items` ADD CONSTRAINT `invoice_items_device_id_fkey` FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clients` ADD CONSTRAINT `clients_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `invoice_payments` ADD CONSTRAINT `invoice_payments_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `invoice_payments` ADD CONSTRAINT `invoice_payments_received_by_fkey` FOREIGN KEY (`received_by`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `physical_inspections` ADD CONSTRAINT `physical_inspections_device_id_fkey` FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `physical_inspections` ADD CONSTRAINT `physical_inspections_inspector_id_fkey` FOREIGN KEY (`inspector_id`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `repairs` ADD CONSTRAINT `repairs_assigned_by_fkey` FOREIGN KEY (`assigned_by`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `repairs` ADD CONSTRAINT `repairs_assigned_to_fkey` FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `repairs` ADD CONSTRAINT `repairs_device_id_fkey` FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `shipments` ADD CONSTRAINT `shipments_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `shipments` ADD CONSTRAINT `shipments_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `shipments` ADD CONSTRAINT `shipments_vendor_id_fkey` FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `spare_parts_requests` ADD CONSTRAINT `spare_parts_requests_approved_by_fkey` FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `spare_parts_requests` ADD CONSTRAINT `spare_parts_requests_repair_id_fkey` FOREIGN KEY (`repair_id`) REFERENCES `repairs`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `spare_parts_requests` ADD CONSTRAINT `spare_parts_requests_requested_by_fkey` FOREIGN KEY (`requested_by`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `technical_inspections` ADD CONSTRAINT `technical_inspections_device_id_fkey` FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `technical_inspections` ADD CONSTRAINT `technical_inspections_inspector_id_fkey` FOREIGN KEY (`inspector_id`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `transfers` ADD CONSTRAINT `transfers_device_id_fkey` FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `transfers` ADD CONSTRAINT `transfers_from_branch_id_fkey` FOREIGN KEY (`from_branch_id`) REFERENCES `branches`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `transfers` ADD CONSTRAINT `transfers_initiated_by_fkey` FOREIGN KEY (`initiated_by`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `transfers` ADD CONSTRAINT `transfers_to_branch_id_fkey` FOREIGN KEY (`to_branch_id`) REFERENCES `branches`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `fk_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `diagnostic_reports` ADD CONSTRAINT `diagnostic_reports_device_id_fkey` FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `diagnostic_reports` ADD CONSTRAINT `diagnostic_reports_technician_id_fkey` FOREIGN KEY (`technician_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `diagnostic_test_results` ADD CONSTRAINT `diagnostic_test_results_report_id_fkey` FOREIGN KEY (`report_id`) REFERENCES `diagnostic_reports`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `device_hardware_specs` ADD CONSTRAINT `device_hardware_specs_device_id_fkey` FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `device_hardware_specs` ADD CONSTRAINT `device_hardware_specs_report_id_fkey` FOREIGN KEY (`report_id`) REFERENCES `diagnostic_reports`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
