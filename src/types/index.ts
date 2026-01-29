export interface Device {
    id: string;
    asset_id: string;
    shipment_id: string;
    status: DeviceStatus;
    model?: string;
    serial_number?: string;
    manufacturer?: string;
    ram_size?: number;
    ram_count?: number;
    ram_models?: string[];
    storage_size?: number;
    storage_count?: number;
    storage_types?: string[];
    storage_models?: string[];
    gpu_model?: string;
    cpu_model?: string;
    current_location: string;
    branch_id?: string;
    assigned_to?: string;
    created_at: string;
    updated_at: string;
    company_id?: string;
    notes?: string;
    os?: string;
    battery_health_percent?: number | string;
    storage_health_percent?: number | string;
    latest_report_id?: string;
    diagnostic_reports?: any[];
    branches?: {
        id: string;
        name: string;
    };
}

export type DeviceStatus =
    | "received"
    | "diagnosed"
    | "pending_inspection"
    | "in_physical_inspection"
    | "in_technical_inspection"
    | "ready_for_sale"
    | "needs_repair"
    | "in_repair"
    | "in_branch"
    | "sold"
    | "returned"
    | "scrap";

export type UserRole =
    | "super_admin"
    | "admin"
    | "warehouse_manager"
    | "warehouse_staff"
    | "repair_manager"
    | "technician"
    | "branch_manager"
    | "sales_staff";

export interface Shipment {
    id: string;
    shipment_code: string;
    shipment_name?: string;
    vendor_id?: string;
    supplier_name: string;
    supplier_contact?: string;
    delivery_date: string;
    device_count: number;
    notes?: string;
    created_by?: string;
    created_at: string;
    updated_at: string;
    company_id?: string;
    vendors?: {
        name: string;
    };
    devices?: Device[];
}

export interface PhysicalInspection {
    id: string;
    device_id: string;
    inspector_id: string;
    has_scratches: boolean;
    has_cracks: boolean;
    has_dents: boolean;
    overall_condition: "excellent" | "good" | "fair" | "poor";
    notes?: string;
    photos?: string[];
    inspected_at: string;
    created_at: string;
}

export interface TechnicalInspection {
    id: string;
    device_id: string;
    inspector_id: string;
    stress_test_passed: boolean;
    max_temperature?: number;
    performance_score?: number;
    ready_for_sale: boolean;
    needs_repair: boolean;
    repair_notes?: string;
    notes?: string;
    inspected_at: string;
    created_at: string;
}

export interface Repair {
    id: string;
    device_id: string;
    assigned_to?: string;
    assigned_by?: string;
    issue_description?: string;
    work_log?: string[];
    status: "pending" | "diagnosing" | "waiting_for_parts" | "in_progress" | "completed" | "returned_to_inspection" | "testing";
    status_history?: Array<{ status: string; started_at: string; ended_at?: string }>;
    assigned_at?: string;
    completed_at?: string;
    created_at: string;
    updated_at: string;
}

export interface SparePartsRequest {
    id: string;
    repair_id: string;
    requested_by: string;
    part_name: string;
    part_description?: string;
    quantity: number;
    status: "pending" | "approved" | "rejected" | "delivered";
    approved_by?: string;
    approved_at?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface Invoice {
    id: string;
    invoice_number: string;
    branch_id: string;
    client_id?: string;
    customer_name?: string;
    customer_contact?: string;
    sale_price: number;
    tax_amount?: number;
    total_amount: number;
    amount_paid: number;
    payment_status: "paid" | "partial" | "pending";
    payment_method: "cash" | "credit";
    sold_by?: string;
    sale_date: string;
    notes?: string;
    created_at: string;
    updated_at: string;
    clients?: Client;
    invoice_payments?: InvoicePayment[];
    invoice_items?: InvoiceItem[];
}

export interface InvoiceItem {
    id: string;
    invoice_id: string;
    device_id?: string;
    item_name?: string;
    serial_number?: string;
    asset_id?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    device?: Device;
}

export interface Client {
    id: string;
    name: string;
    phone?: string;
    address?: string;
    company_id: string;
    balance: number;
    created_at: string;
    updated_at: string;
    _count?: {
        invoices: number;
    };
    invoices?: Invoice[];
}

export interface InvoicePayment {
    id: string;
    invoice_id: string;
    amount: number;
    payment_date: string;
    payment_method: string;
    received_by?: string;
    notes?: string;
    created_at: string;
}

export interface Announcement {
    id: string;
    title: string;
    content: string;
    created_by?: string;
    target_role?: UserRole;
    target_branch_id?: string;
    is_active: boolean;
    priority: "low" | "normal" | "high" | "urgent";
    expires_at?: string;
    created_at: string;
    updated_at: string;
}

export interface Company {
    id: string;
    name: string;
    status: "active" | "inactive";
    subscription_plan: "free" | "pro" | "enterprise";
    created_at: string;
    updated_at: string;
}

export interface DeviceAssignment {
    id: string;
    device_id: string;
    assigned_to: string;
    assigned_by: string;
    assigned_at: string;
    completed_at?: string;
    status: 'active' | 'completed' | 'cancelled';
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface EmployeeStatistics {
    total_processed: number;
    sent_to_warehouse: number;
    sent_to_maintenance: number;
    currently_assigned: number;
}

export interface WorkHistoryData {
    date: string;
    completed_count: number;
    to_warehouse_count: number;
    to_maintenance_count: number;
}

export interface MaintenanceFollowUp {
    device_id: string;
    asset_id: string;
    model: string;
    status: string;
    assigned_at: string;
    repair_status?: string;
    repair_assigned_to?: string;
}

export interface User {
    id: string;
    email: string;
    full_name: string;
    role: UserRole;
    branch_id?: string;
    company_id?: string;
    created_at: string;
    updated_at: string;
}
