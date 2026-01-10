import React from "react";
import { useList } from "@refinedev/core";
import { Card, Row, Col, Statistic, Typography, Spin, Space, Table, Tag } from "antd";
import {
    ToolOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    WarningOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

export const MaintenanceDashboard: React.FC = () => {
    // Fetch devices in maintenance
    const { data: devicesData, isLoading: devicesLoading } = useList({
        resource: "devices",
        filters: [
            {
                field: "status",
                operator: "eq",
                value: "needs_repair",
            },
        ],
        pagination: {
            pageSize: 100,
        },
    });

    // Fetch repairs
    const { data: repairsData, isLoading: repairsLoading } = useList({
        resource: "repairs",
        pagination: {
            pageSize: 100,
        },
    });

    const devices = devicesData?.data || [];
    const repairs = repairsData?.data || [];

    // Calculate statistics
    const totalInMaintenance = devices.length;
    const pendingRepairs = repairs.filter((r: any) => r.status === "pending").length;
    const inProgressRepairs = repairs.filter((r: any) => r.status === "in_progress").length;
    const completedRepairs = repairs.filter((r: any) => r.status === "completed").length;

    // Recent devices in maintenance
    const recentDevices = devices.slice(0, 10);

    return (
        <div style={{ padding: "24px" }}>
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
                {/* Header */}
                <div>
                    <Title level={2}>لوحة تحكم الصيانة</Title>
                </div>

                {/* Statistics Cards */}
                <Spin spinning={devicesLoading || repairsLoading}>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} lg={6}>
                            <Card hoverable>
                                <Statistic
                                    title="إجمالي الأجهزة في الصيانة"
                                    value={totalInMaintenance}
                                    prefix={<ToolOutlined />}
                                    valueStyle={{ color: "#1890ff" }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card hoverable>
                                <Statistic
                                    title="إصلاحات معلقة"
                                    value={pendingRepairs}
                                    prefix={<ClockCircleOutlined />}
                                    valueStyle={{ color: "#faad14" }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card hoverable>
                                <Statistic
                                    title="إصلاحات قيد التنفيذ"
                                    value={inProgressRepairs}
                                    prefix={<WarningOutlined />}
                                    valueStyle={{ color: "#ff4d4f" }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card hoverable>
                                <Statistic
                                    title="إصلاحات مكتملة"
                                    value={completedRepairs}
                                    prefix={<CheckCircleOutlined />}
                                    valueStyle={{ color: "#52c41a" }}
                                />
                            </Card>
                        </Col>
                    </Row>
                </Spin>

                {/* Recent Devices in Maintenance */}
                <Card title="الأجهزة الأخيرة في الصيانة">
                    <Table
                        dataSource={recentDevices}
                        loading={devicesLoading}
                        rowKey="id"
                        pagination={false}
                        columns={[
                            {
                                title: "رقم التسلسل",
                                dataIndex: "serial_number",
                                key: "serial_number",
                            },
                            {
                                title: "النوع",
                                dataIndex: "device_type",
                                key: "device_type",
                            },
                            {
                                title: "الموديل",
                                dataIndex: "model",
                                key: "model",
                            },
                            {
                                title: "الحالة",
                                dataIndex: "status",
                                key: "status",
                                render: (_status: string) => (
                                    <Tag color="orange">يحتاج إصلاح</Tag>
                                ),
                            },
                            {
                                title: "تاريخ الإضافة",
                                dataIndex: "created_at",
                                key: "created_at",
                                render: (date: string) => new Date(date).toLocaleDateString("ar-EG"),
                            },
                        ]}
                    />
                </Card>
            </Space>
        </div>
    );
};
