import React from "react";
import { useList } from "@refinedev/core";
import {
    Card,
    Row,
    Col,
    Statistic,
    Table,
    Tag,
    Space,
    Typography,
    Descriptions,
    Alert,
    Progress,
    Empty,
    Collapse,
    Divider,
} from "antd";
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    WarningOutlined,
    ThunderboltOutlined,
    HddOutlined,
    LaptopOutlined,
    ClockCircleOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

interface DiagnosticReport {
    id: string;
    report_id: string;
    asset_id: string;
    timestamp: string;
    production_mode: boolean;
    upload_status: string;
    scan_started_at: string;
    scan_completed_at: string;
    scan_duration_seconds: number;
    agent_version: string;
    cosmetic_grade: string;
    cosmetic_comments: string;
    thermal_cpu_min: number;
    thermal_cpu_max: number;
    thermal_cpu_avg: number;
    thermal_gpu_min: number;
    thermal_gpu_max: number;
    thermal_gpu_avg: number;
    warnings: string[];
    total_tests: number;
    passed_tests: number;
    failed_tests: number;
    score_percent: number;
    created_at: string;
    test_results?: TestResult[];
    hardware_specs?: HardwareSpecs;
}

interface TestResult {
    id: string;
    test_id: string;
    test_name: string;
    status: "success" | "fail" | "warn";
    message: string;
    details?: Record<string, any>;
}

interface HardwareSpecs {
    cpu_name: string;
    cpu_physical_cores: number;
    cpu_logical_cores: number;
    memory_total_gb: number;
    memory_type: string;
    memory_slots: any[];
    gpus: any[];
    storage_devices: any[];
    battery_health_percent: number;
    monitors: any[];
}

interface DiagnosticReportViewerProps {
    deviceId: string;
}

const getGradeColor = (grade: string) => {
    const colors: Record<string, string> = {
        A: "green",
        B: "blue",
        C: "orange",
        D: "volcano",
        F: "red",
    };
    return colors[grade?.toUpperCase()] || "default";
};

const getStatusIcon = (status: string) => {
    switch (status) {
        case "success":
            return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
        case "fail":
            return <CloseCircleOutlined style={{ color: "#ff4d4f" }} />;
        case "warn":
            return <WarningOutlined style={{ color: "#faad14" }} />;
        default:
            return null;
    }
};

const getStatusColor = (status: string) => {
    switch (status) {
        case "success":
            return "success";
        case "fail":
            return "error";
        case "warn":
            return "warning";
        default:
            return "default";
    }
};

const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}م ${secs}ث`;
};

export const DiagnosticReportViewer: React.FC<DiagnosticReportViewerProps> = ({
    deviceId,
}) => {
    const { data, isLoading } = useList<DiagnosticReport>({
        resource: "diagnostic_reports",
        filters: [{ field: "device_id", operator: "eq", value: deviceId }],
        sorters: [{ field: "created_at", order: "desc" }],
        meta: {
            select: "*,test_results:diagnostic_test_results(*),hardware_specs:device_hardware_specs(*)",
        },
    });

    const reports = data?.data || [];
    const latestReport = reports[0];

    if (isLoading) {
        return <Card variant="outlined" loading />;
    }

    if (!latestReport) {
        return (
            <Card variant="outlined">
                <Empty
                    description="لا يوجد تقارير تشخيص لهذا الجهاز"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
                <div style={{ textAlign: "center", marginTop: 16 }}>
                    <Text type="secondary">
                        سيظهر التقرير هنا بعد تشغيل TechFlow Agent على الجهاز
                    </Text>
                </div>
            </Card>
        );
    }

    const testResults = Array.isArray(latestReport.test_results)
        ? latestReport.test_results
        : [];
    const hwSpecs = latestReport.hardware_specs;

    return (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
            {/* Summary Cards */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                    <Card variant="outlined">
                        <Statistic
                            title="نتيجة الفحص"
                            value={latestReport.score_percent}
                            suffix="%"
                            valueStyle={{
                                color:
                                    latestReport.score_percent >= 80
                                        ? "#52c41a"
                                        : latestReport.score_percent >= 60
                                            ? "#faad14"
                                            : "#ff4d4f",
                            }}
                        />
                        <Progress
                            percent={latestReport.score_percent}
                            showInfo={false}
                            status={
                                latestReport.score_percent >= 80
                                    ? "success"
                                    : latestReport.score_percent >= 60
                                        ? "normal"
                                        : "exception"
                            }
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card variant="outlined">
                        <Statistic
                            title="التقييم الخارجي"
                            value={latestReport.cosmetic_grade || "-"}
                            valueStyle={{
                                color:
                                    latestReport.cosmetic_grade === "A"
                                        ? "#52c41a"
                                        : latestReport.cosmetic_grade === "B"
                                            ? "#1890ff"
                                            : "#faad14",
                            }}
                        />
                        <Tag color={getGradeColor(latestReport.cosmetic_grade)}>
                            Grade {latestReport.cosmetic_grade}
                        </Tag>
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card variant="outlined">
                        <Statistic
                            title="الاختبارات"
                            value={`${latestReport.passed_tests}/${latestReport.total_tests}`}
                            prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
                        />
                        <Space>
                            <Tag color="success">{latestReport.passed_tests} نجح</Tag>
                            <Tag color="error">{latestReport.failed_tests} فشل</Tag>
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card variant="outlined">
                        <Statistic
                            title="مدة الفحص"
                            value={formatDuration(latestReport.scan_duration_seconds || 0)}
                            prefix={<ClockCircleOutlined />}
                        />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {new Date(latestReport.scan_completed_at).toLocaleDateString("ar-EG")}
                        </Text>
                    </Card>
                </Col>
            </Row>

            {/* Warnings */}
            {latestReport.warnings && latestReport.warnings.length > 0 && (
                <Alert
                    type="warning"
                    message="تحذيرات أثناء الفحص"
                    description={
                        <ul style={{ margin: 0, paddingRight: 20 }}>
                            {latestReport.warnings.map((warning, idx) => (
                                <li key={idx}>{warning}</li>
                            ))}
                        </ul>
                    }
                    showIcon
                />
            )}

            {/* Thermal Summary */}
            <Card variant="outlined" title="درجات الحرارة" size="small">
                <Row gutter={16}>
                    <Col span={12}>
                        <Descriptions
                            title={
                                <Space>
                                    <ThunderboltOutlined /> CPU
                                </Space>
                            }
                            column={3}
                            size="small"
                        >
                            <Descriptions.Item label="أدنى">
                                {latestReport.thermal_cpu_min}°C
                            </Descriptions.Item>
                            <Descriptions.Item label="متوسط">
                                {latestReport.thermal_cpu_avg}°C
                            </Descriptions.Item>
                            <Descriptions.Item label="أعلى">
                                <span
                                    style={{
                                        color:
                                            latestReport.thermal_cpu_max > 85
                                                ? "#ff4d4f"
                                                : undefined,
                                    }}
                                >
                                    {latestReport.thermal_cpu_max}°C
                                </span>
                            </Descriptions.Item>
                        </Descriptions>
                    </Col>
                    <Col span={12}>
                        <Descriptions
                            title={
                                <Space>
                                    <HddOutlined /> GPU
                                </Space>
                            }
                            column={3}
                            size="small"
                        >
                            <Descriptions.Item label="أدنى">
                                {latestReport.thermal_gpu_min}°C
                            </Descriptions.Item>
                            <Descriptions.Item label="متوسط">
                                {latestReport.thermal_gpu_avg}°C
                            </Descriptions.Item>
                            <Descriptions.Item label="أعلى">
                                {latestReport.thermal_gpu_max}°C
                            </Descriptions.Item>
                        </Descriptions>
                    </Col>
                </Row>
            </Card>

            {/* Test Results */}
            <Card variant="outlined" title="نتائج الاختبارات" size="small">
                <Table
                    dataSource={testResults}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    columns={[
                        {
                            title: "الاختبار",
                            dataIndex: "test_name",
                            key: "test_name",
                            render: (text, record) => (
                                <Space>
                                    {getStatusIcon(record.status)}
                                    <span>{text}</span>
                                </Space>
                            ),
                        },
                        {
                            title: "الحالة",
                            dataIndex: "status",
                            key: "status",
                            width: 100,
                            render: (status) => (
                                <Tag color={getStatusColor(status)}>
                                    {status === "success"
                                        ? "نجح"
                                        : status === "fail"
                                            ? "فشل"
                                            : "تحذير"}
                                </Tag>
                            ),
                        },
                        {
                            title: "الرسالة",
                            dataIndex: "message",
                            key: "message",
                            ellipsis: true,
                        },
                    ]}
                    expandable={{
                        expandedRowRender: (record) =>
                            record.details &&
                                Object.keys(record.details).length > 0 ? (
                                <pre
                                    style={{
                                        background: "#f5f5f5",
                                        padding: 12,
                                        borderRadius: 4,
                                        fontSize: 12,
                                        direction: "ltr",
                                        textAlign: "left",
                                        overflow: "auto",
                                        maxHeight: 200,
                                    }}
                                >
                                    {JSON.stringify(record.details, null, 2)}
                                </pre>
                            ) : null,
                        rowExpandable: (record) =>
                            !!(record.details && Object.keys(record.details).length > 0),
                    }}
                />
            </Card>

            {/* Hardware Specs */}
            {hwSpecs && (
                <Card variant="outlined" title="المواصفات التفصيلية" size="small">
                    <Collapse
                        items={[
                            {
                                key: "cpu",
                                label: (
                                    <Space>
                                        <ThunderboltOutlined /> المعالج
                                    </Space>
                                ),
                                children: (
                                    <Descriptions column={2} size="small">
                                        <Descriptions.Item label="النوع" span={2}>
                                            {hwSpecs.cpu_name}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="الأنوية الفعلية">
                                            {hwSpecs.cpu_physical_cores}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="الأنوية المنطقية">
                                            {hwSpecs.cpu_logical_cores}
                                        </Descriptions.Item>
                                    </Descriptions>
                                ),
                            },
                            {
                                key: "memory",
                                label: (
                                    <Space>
                                        <HddOutlined /> الذاكرة
                                    </Space>
                                ),
                                children: (
                                    <>
                                        <Descriptions column={2} size="small">
                                            <Descriptions.Item label="الإجمالي">
                                                {hwSpecs.memory_total_gb} GB
                                            </Descriptions.Item>
                                            <Descriptions.Item label="النوع">
                                                {hwSpecs.memory_type}
                                            </Descriptions.Item>
                                        </Descriptions>
                                        {hwSpecs.memory_slots && hwSpecs.memory_slots.length > 0 && (
                                            <Table
                                                dataSource={hwSpecs.memory_slots}
                                                rowKey="bank"
                                                size="small"
                                                pagination={false}
                                                style={{ marginTop: 8 }}
                                                columns={[
                                                    { title: "الفتحة", dataIndex: "bank" },
                                                    { title: "السعة", dataIndex: "capacity" },
                                                    { title: "السرعة", dataIndex: "speed" },
                                                    { title: "المصنع", dataIndex: "manufacturer" },
                                                ]}
                                            />
                                        )}
                                    </>
                                ),
                            },
                            {
                                key: "gpu",
                                label: (
                                    <Space>
                                        <LaptopOutlined /> كرت الشاشة
                                    </Space>
                                ),
                                children: hwSpecs.gpus && hwSpecs.gpus.length > 0 && (
                                    <Table
                                        dataSource={hwSpecs.gpus}
                                        rowKey="name"
                                        size="small"
                                        pagination={false}
                                        columns={[
                                            { title: "الاسم", dataIndex: "name" },
                                            { title: "VRAM", dataIndex: "vram" },
                                            { title: "إصدار Driver", dataIndex: "driver_version" },
                                        ]}
                                    />
                                ),
                            },
                            {
                                key: "storage",
                                label: (
                                    <Space>
                                        <HddOutlined /> التخزين
                                    </Space>
                                ),
                                children: hwSpecs.storage_devices &&
                                    hwSpecs.storage_devices.length > 0 && (
                                        <Table
                                            dataSource={hwSpecs.storage_devices}
                                            rowKey="model"
                                            size="small"
                                            pagination={false}
                                            columns={[
                                                { title: "الموديل", dataIndex: "model" },
                                                { title: "السعة", dataIndex: "size" },
                                                { title: "النوع", dataIndex: "type" },
                                                {
                                                    title: "الحالة",
                                                    dataIndex: "health_percent",
                                                    render: (v) =>
                                                        v !== undefined ? (
                                                            <Progress
                                                                percent={v}
                                                                size="small"
                                                                style={{ width: 80 }}
                                                            />
                                                        ) : (
                                                            "-"
                                                        ),
                                                },
                                            ]}
                                        />
                                    ),
                            },
                        ]}
                    />
                </Card>
            )}

            {/* Report History */}
            {reports.length > 1 && (
                <Card variant="outlined" title="سجل التقارير السابقة" size="small">
                    <Table
                        dataSource={reports.slice(1)}
                        rowKey="id"
                        size="small"
                        pagination={{ pageSize: 5 }}
                        columns={[
                            {
                                title: "التاريخ",
                                dataIndex: "scan_completed_at",
                                render: (date) =>
                                    new Date(date).toLocaleString("ar-EG"),
                            },
                            {
                                title: "النتيجة",
                                dataIndex: "score_percent",
                                render: (score) => <Tag>{score}%</Tag>,
                            },
                            {
                                title: "التقييم",
                                dataIndex: "cosmetic_grade",
                                render: (grade) => (
                                    <Tag color={getGradeColor(grade)}>Grade {grade}</Tag>
                                ),
                            },
                            {
                                title: "الاختبارات",
                                render: (_, record) =>
                                    `${record.passed_tests}/${record.total_tests}`,
                            },
                        ]}
                    />
                </Card>
            )}

            {/* Report Metadata */}
            <Card variant="outlined" size="small">
                <Descriptions size="small" column={3}>
                    <Descriptions.Item label="Report ID">
                        <Text code style={{ fontSize: 10 }}>
                            {latestReport.report_id}
                        </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Agent Version">
                        v{latestReport.agent_version}
                    </Descriptions.Item>
                    <Descriptions.Item label="Production Mode">
                        <Tag color={latestReport.production_mode ? "green" : "default"}>
                            {latestReport.production_mode ? "Yes" : "No"}
                        </Tag>
                    </Descriptions.Item>
                </Descriptions>
            </Card>
        </Space>
    );
};

export default DiagnosticReportViewer;
