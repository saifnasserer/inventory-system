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
    Progress,
    Divider,
    Table,
    Collapse,
    Badge,
} from "antd";
import {
    EditOutlined,
    PrinterOutlined,
    ThunderboltOutlined,
    HddOutlined,
    DashboardOutlined,
    HistoryOutlined,
    FileSearchOutlined,
    InfoCircleOutlined,
    CheckCircleOutlined,
    CloudUploadOutlined,
    LaptopOutlined,
} from "@ant-design/icons";
import { Typography } from "antd";
import { Device } from "../../types";
import { InspectionSteps, MaintenanceWorkflow, DiagnosticReportViewer } from "./components";
import { DeviceLabel } from "../../components/DeviceLabel";
import { useState, useRef, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useReactToPrint } from "react-to-print";

export const DeviceShow: React.FC = () => {
    const { id } = useParams();
    const [printModalOpen, setPrintModalOpen] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    const { queryResult } = useShow<Device>({
        resource: "devices",
        id: id,
        meta: {
            select: "*,diagnostic_reports(*,diagnostic_test_results(*),hardware_specs(*)),branches(*)",
        }
    });
    const { data, isLoading } = queryResult;
    const device = data?.data;

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Label-${device?.asset_id || 'device'}`,
    });

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            ready_for_sale: "green",
            needs_repair: "orange",
            in_repair: "orange",
            in_branch: "geekblue",
            sold: "success",
            received: "blue",
            diagnosed: "cyan",
            returned: "volcano",
            scrap: "red",
        };
        return colors[status] || "default";
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            received: "تم الاستلام",
            diagnosed: "في انتظار المراجعة",
            ready_for_sale: "في المخزن",
            needs_repair: "في الصيانة",
            in_repair: "في الصيانة",
            in_branch: "في المبيعات",
            sold: "تم البيع",
            returned: "مرجع للمورد",
            scrap: "خردة",
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

    const { Title, Text } = Typography;

    const latestReport = useMemo(() => {
        if (device?.diagnostic_reports && device.diagnostic_reports.length > 0) {
            return device.diagnostic_reports[0];
        }
        return null;
    }, [device]);

    const dashboardCards = (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
            {/* Top Quick Info */}
            <Row gutter={[16, 16]}>
                <Col xs={24} md={18}>
                    <Card
                        bordered={false}
                        style={{
                            background: "linear-gradient(135deg, #001529 0%, #003a8c 100%)",
                            borderRadius: 16,
                            color: "white",
                        }}
                    >
                        <Row align="middle" gutter={24}>
                            <Col span={16}>
                                <Space direction="vertical" size={0}>
                                    <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>رقم الأصل</Text>
                                    <Title level={2} style={{ color: "white", margin: 0 }}>{device?.asset_id}</Title>
                                    <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 16 }}>{device?.manufacturer} {device?.model}</Text>
                                </Space>
                                <div style={{ marginTop: 24 }}>
                                    <Space size={24}>
                                        <div style={{ textAlign: "center" }}>
                                            <Statistic
                                                title={<Text style={{ color: "rgba(255,255,255,0.6)" }}>حالة الجهاز</Text>}
                                                value={getStatusLabel(device?.status || "")}
                                                valueStyle={{ color: "white", fontSize: 18 }}
                                            />
                                        </div>
                                        <Divider type="vertical" style={{ height: 40, backgroundColor: "rgba(255,255,255,0.2)" }} />
                                        <div style={{ textAlign: "center" }}>
                                            <Statistic
                                                title={<Text style={{ color: "rgba(255,255,255,0.6)" }}>الموقع</Text>}
                                                value={device?.current_location || "-"}
                                                valueStyle={{ color: "white", fontSize: 18 }}
                                            />
                                        </div>
                                    </Space>
                                </div>
                            </Col>
                            <Col span={8} style={{ textAlign: "center" }}>
                                {latestReport?.score_percent && (
                                    <Progress
                                        type="circle"
                                        percent={latestReport.score_percent}
                                        strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                                        width={120}
                                        format={(percent?: number) => (
                                            <div style={{ color: 'white' }}>
                                                <div style={{ fontSize: 24, fontWeight: 'bold' }}>{percent}</div>
                                                <div style={{ fontSize: 12 }}>التقييم</div>
                                            </div>
                                        )}
                                    />
                                )}
                            </Col>
                        </Row>
                    </Card>
                </Col>
                <Col xs={24} md={6}>
                    <Card bordered={false} style={{ borderRadius: 16, height: "100%" }} bodyStyle={{ padding: '20px' }}>
                        <Title level={5} style={{ marginBottom: 16 }}>الرقم التسلسلي</Title>
                        <Text copyable strong style={{ fontSize: 16 }}>{device?.serial_number || "-"}</Text>
                        <Divider style={{ margin: '16px 0' }} />
                        <Space direction="vertical" size={4}>
                            <Text type="secondary" style={{ fontSize: 12 }}>الفرع:</Text>
                            <Tag color="blue">{device?.branches?.name || "المخزن الرئيسي"}</Tag>
                        </Space>
                    </Card>
                </Col>
            </Row>

            {/* Detailed Hardware Specs (Moved from second tab) */}
            <Title level={4}><DashboardOutlined /> المواصفات التفصيلية</Title>

            {/* CPU Details */}
            <Card variant="outlined" size="small" style={{ borderRadius: 12 }}>
                <Descriptions title={<Space><ThunderboltOutlined style={{ color: '#faad14' }} /> المعالج</Space>} column={{ xs: 1, sm: 2, md: 3 }}>
                    <Descriptions.Item label="الموديل" span={2}>
                        <Text strong>{latestReport?.hardware_specs?.cpu_name || device?.cpu_model || "-"}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="الأنوية">
                        {latestReport?.hardware_specs?.cpu_physical_cores || "-"} فعلية / {latestReport?.hardware_specs?.cpu_logical_cores || "-"} مسار
                    </Descriptions.Item>
                </Descriptions>
            </Card>

            {/* RAM Details */}
            <Card variant="outlined" size="small" style={{ borderRadius: 12 }}>
                <Descriptions title={<Space><InfoCircleOutlined style={{ color: '#1890ff' }} /> الذاكرة العشوائية (RAM)</Space>} column={3}>
                    <Descriptions.Item label="الإجمالي">
                        <Text strong>{latestReport?.hardware_specs?.memory_total_gb ? `${latestReport.hardware_specs.memory_total_gb} GB` : device?.ram_size ? `${device.ram_size} GB` : "-"}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="النوع">
                        {latestReport?.hardware_specs?.memory_type || "DDR4"}
                    </Descriptions.Item>
                </Descriptions>
                {latestReport?.hardware_specs?.memory_slots && latestReport.hardware_specs.memory_slots.length > 0 && (
                    <Table
                        dataSource={latestReport.hardware_specs.memory_slots}
                        rowKey="bank"
                        size="small"
                        pagination={false}
                        bordered
                        style={{ marginTop: 8 }}
                        columns={[
                            { title: "الفتحة", dataIndex: "bank", key: "bank" },
                            { title: "السعة", dataIndex: "capacity", key: "capacity" },
                            { title: "السرعة", dataIndex: "speed", key: "speed" },
                            { title: "المصنع", dataIndex: "manufacturer", key: "manufacturer" },
                        ]}
                    />
                )}
            </Card>

            {/* Storage Details */}
            <Card variant="outlined" size="small" style={{ borderRadius: 12 }}>
                <Title level={5} style={{ marginBottom: 12 }}>
                    <Space><HddOutlined style={{ color: '#52c41a' }} /> وحدات التخزين</Space>
                </Title>
                <Table
                    dataSource={latestReport?.hardware_specs?.storage_devices || (device?.storage_size ? [{ size: `${device.storage_size} GB`, model: device.storage_models?.[0] || "SSD", type: device.storage_types?.[0] || "SSD" }] : [])}
                    rowKey={(record: any) => record.model || record.serial || Math.random()}
                    size="small"
                    pagination={false}
                    bordered
                    columns={[
                        { title: "الموديل", dataIndex: "model", key: "model" },
                        { title: "السعة", dataIndex: "size", key: "size" },
                        { title: "النوع", dataIndex: "type", key: "type" },
                        {
                            title: "الحالة",
                            dataIndex: "health_percent",
                            key: "health",
                            render: (v) => v !== undefined && v !== "N/A" ? <Progress percent={typeof v === 'string' ? parseFloat(v) : v} size="small" steps={5} strokeColor={v > 80 ? '#52c41a' : '#faad14'} /> : "-"
                        }
                    ]}
                />
            </Card>

            {/* GPU & Battery */}
            <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                    <Card title={<Space><LaptopOutlined /> كرت الشاشة</Space>} size="small" variant="outlined" style={{ borderRadius: 12 }}>
                        <Table
                            dataSource={latestReport?.hardware_specs?.gpus || (device?.gpu_model ? [{ name: device.gpu_model }] : [])}
                            rowKey={(record: any) => record.name + record.vram}
                            pagination={false}
                            size="small"
                            columns={[
                                { title: "الاسم", dataIndex: "name", key: "name" },
                                { title: "VRAM", dataIndex: "vram", key: "vram" }
                            ]}
                        />
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card title={<Space><CheckCircleOutlined /> البطارية </Space>} size="small" variant="outlined" style={{ borderRadius: 12 }}>
                        <Descriptions column={1} size="small">
                            <Descriptions.Item label="صحة البطارية">
                                <Badge status={parseFloat(latestReport?.hardware_specs?.battery_health_percent?.toString() || "0") > 80 ? "success" : "warning"} text={`${latestReport?.hardware_specs?.battery_health_percent || "-"}%`} />
                            </Descriptions.Item>
                            <Descriptions.Item label="نظام التشغيل">
                                {latestReport?.hardware_specs?.os || device?.os || "Windows 11 Pro"}
                            </Descriptions.Item>
                            <Descriptions.Item label="ملاحظات">
                                <Text type="warning" italic>{device?.notes || "لا يوجد ملاحظات مسجلة"}</Text>
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>
                </Col>
            </Row>
        </Space>
    );

    const tabItems = [
        {
            key: "dashboard",
            label: (
                <span>
                    <DashboardOutlined /> لوحة التحكم
                </span>
            ),
            children: dashboardCards,
        },
        {
            key: "diagnostics",
            label: (
                <span>
                    <FileSearchOutlined /> التقرير التفصيلي
                </span>
            ),
            children: device && <DiagnosticReportViewer deviceId={device.id} />,
        },
        {
            key: "history",
            label: (
                <span>
                    <HistoryOutlined /> السجل
                </span>
            ),
            children: (
                <Card variant="outlined" style={{ borderRadius: 12 }}>
                    <Timeline
                        items={[
                            {
                                color: "green",
                                children: (
                                    <>
                                        <p><strong>تم إضافة الجهاز للمخزن</strong></p>
                                        <p style={{ color: "#999" }}>
                                            {device?.created_at ? new Date(device.created_at).toLocaleString("ar-EG") : "-"}
                                        </p>
                                    </>
                                ),
                            },
                        ]}
                    />
                </Card>
            ),
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
            title={
                <Space>
                    <Title level={4} style={{ margin: 0 }}>بيانات الجهاز:</Title>
                    <Text type="secondary">{device?.asset_id}</Text>
                </Space>
            }
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
