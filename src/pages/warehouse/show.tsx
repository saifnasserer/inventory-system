import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import {
    Card,
    Descriptions,
    Tag,
    Space,
    Button,
    Tabs,
    Timeline,
    Empty,
    Row,
    Col,
    Statistic,
    Alert,
    Modal,
} from "antd";
import {
    EditOutlined,
    PrinterOutlined,
} from "@ant-design/icons";
import { Device } from "../../types";
import { InspectionSteps, MaintenanceWorkflow, DiagnosticReportViewer } from "./components";
import { DeviceLabel } from "../../components/DeviceLabel";
import { useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useReactToPrint } from "react-to-print";

export const DeviceShow: React.FC = () => {
    const { id } = useParams();
    const [printModalOpen, setPrintModalOpen] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    const { queryResult } = useShow<Device>({
        resource: "devices",
        id: id,
    });
    const { data, isLoading } = queryResult;
    const device = data?.data;

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Label-${device?.asset_id || 'device'}`,
    });

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            received: "purple",
            pending_inspection: "orange",
            in_physical_inspection: "cyan",
            in_technical_inspection: "blue",
            ready_for_sale: "green",
            needs_repair: "red",
            in_repair: "volcano",
            in_branch: "geekblue",
            sold: "success",
        };
        return colors[status] || "default";
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            received: "في المخزن",
            pending_inspection: "في انتظار الفحص",
            in_physical_inspection: "في الفحص الخارجي",
            in_technical_inspection: "في الفحص الفني",
            ready_for_sale: "جاهز للبيع",
            needs_repair: "يحتاج صيانة",
            in_repair: "في الصيانة",
            in_branch: "في الفرع",
            sold: "تم البيع",
        };
        return labels[status] || status;
    };

    // Check if device is in inspection status
    const isInInspection = device && [
        "received", // Added received status here
        "pending_inspection",
        "in_physical_inspection",
        "in_technical_inspection",
    ].includes(device.status);

    // Check if device is in maintenance status for Workflow View
    const isInMaintenance = device && [
        "needs_repair",
        "in_repair",
        "diagnosing", // Added these virtual statuses just in case we update device status to match repair status later
        "waiting_for_parts",
        "testing"
    ].includes(device.status);

    const tabItems = [
        {
            key: "overview",
            label: "نظرة عامة",
            children: (
                <Card>
                    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                        <Col xs={24} md={8}>
                            <Card>
                                <Statistic
                                    title="الحالة"
                                    value={device ? getStatusLabel(device.status) : "-"}
                                    valueStyle={{
                                        color: device ? getStatusColor(device.status) : undefined,
                                    }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} md={8}>
                            <Card>
                                <Statistic
                                    title="الموقع الحالي"
                                    value={device?.current_location || "-"}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} md={8}>
                            <Card>
                                <Statistic
                                    title="تاريخ الإضافة"
                                    value={
                                        device?.created_at
                                            ? new Date(device.created_at).toLocaleDateString("ar-EG")
                                            : "-"
                                    }
                                />
                            </Card>
                        </Col>
                    </Row>

                    <Descriptions bordered column={{ xs: 1, sm: 2 }}>
                        <Descriptions.Item label="رقم الأصل">
                            <strong>{device?.asset_id}</strong>
                        </Descriptions.Item>
                        <Descriptions.Item label="رقم الشحنة">
                            {device?.shipment_id || "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="الموديل">
                            {device?.model || "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="الرقم التسلسلي">
                            {device?.serial_number || "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="الشركة المصنعة">
                            {device?.manufacturer || "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="الحالة">
                            {device && (
                                <Tag color={getStatusColor(device.status)}>
                                    {getStatusLabel(device.status)}
                                </Tag>
                            )}
                        </Descriptions.Item>
                        <Descriptions.Item label="ملاحظات / سبب العطل" span={2}>
                            <span style={{ color: "#d46b08", fontStyle: "italic" }}>{device?.notes || "-"}</span>
                        </Descriptions.Item>
                    </Descriptions>
                </Card>
            ),
        },
        {
            key: "specs",
            label: "المواصفات",
            children: (
                <Card>
                    <Descriptions bordered column={{ xs: 1, sm: 2 }}>
                        <Descriptions.Item label="المعالج (CPU)">
                            {device?.cpu_model || "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="كرت الشاشة (GPU)">
                            {device?.gpu_model || "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="الرامات">
                            {device?.ram_size && device?.ram_count
                                ? `${device.ram_count}x ${device.ram_size}GB`
                                : "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="موديلات الرامات">
                            {device?.ram_models && device.ram_models.length > 0
                                ? device.ram_models.join(", ")
                                : "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="التخزين">
                            {device?.storage_size && device?.storage_count
                                ? `${device.storage_count}x ${device.storage_size}GB`
                                : "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="أنواع التخزين">
                            {device?.storage_types && device.storage_types.length > 0
                                ? device.storage_types.join(", ")
                                : "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="موديلات التخزين" span={2}>
                            {device?.storage_models && device.storage_models.length > 0
                                ? device.storage_models.join(", ")
                                : "-"}
                        </Descriptions.Item>
                    </Descriptions>
                </Card>
            ),
        },
        {
            key: "history",
            label: "السجل",
            children: (
                <Card>
                    <Timeline
                        items={[
                            {
                                color: "green",
                                children: (
                                    <>
                                        <p>
                                            <strong>تم إضافة الجهاز</strong>
                                        </p>
                                        <p style={{ color: "#999" }}>
                                            {device?.created_at
                                                ? new Date(device.created_at).toLocaleString("ar-EG")
                                                : "-"}
                                        </p>
                                    </>
                                ),
                            },
                        ]}
                    />
                    <Empty
                        description="لا توجد أحداث إضافية"
                        style={{ marginTop: 24 }}
                    />
                </Card>
            ),
        },
        {
            key: "diagnostics",
            label: "تقرير الفحص",
            children: device && <DiagnosticReportViewer deviceId={device.id} />,
        },
    ];

    if (isInInspection && device) {
        return (
            <div style={{ padding: "24px" }}>
                <InspectionSteps device={device} />
            </div>
        );
    }

    // Render Maintenance Workflow for devices in repair
    if (isInMaintenance && device) {
        return (
            <div style={{ padding: "24px" }}>
                <MaintenanceWorkflow device={device} />
            </div>
        );
    }

    return (
        <Show
            isLoading={isLoading}
            headerButtons={({ editButtonProps }) => (
                <Space>
                    <Button
                        icon={<PrinterOutlined />}
                        onClick={() => setPrintModalOpen(true)}
                    >
                        طباعة الملصق
                    </Button>
                    {!isInInspection && (
                        <Button
                            type="primary"
                            icon={<EditOutlined />}
                            {...editButtonProps}
                        >
                            تعديل
                        </Button>
                    )}
                </Space>
            )}
            breadcrumb={false}
        >
            <Tabs items={tabItems} defaultActiveKey="overview" />

            {/* Print Modal */}
            <Modal
                title="معاينة الملصق"
                open={printModalOpen}
                onCancel={() => setPrintModalOpen(false)}
                footer={[
                    <Button key="cancel" onClick={() => setPrintModalOpen(false)}>
                        إلغاء
                    </Button>,
                    <Button
                        key="print"
                        type="primary"
                        icon={<PrinterOutlined />}
                        onClick={() => {
                            handlePrint();
                            setPrintModalOpen(false);
                        }}
                    >
                        طباعة
                    </Button>,
                ]}
                width={600}
            >
                <div ref={printRef} style={{ padding: "20px", display: "flex", justifyContent: "center" }}>
                    {device && (
                        <DeviceLabel
                            assetId={device.asset_id}
                            deviceType={device.manufacturer}
                            model={device.model}
                            serialNumber={device.serial_number}
                        />
                    )}
                </div>
            </Modal>
        </Show>
    );
};
