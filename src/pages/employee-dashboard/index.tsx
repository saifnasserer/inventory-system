import React from "react";
import { useGetIdentity, useCustom } from "@refinedev/core";
import { Card, Row, Col, Statistic, Typography, Spin, Space } from "antd";
import {
    CheckCircleOutlined,
    ShoppingOutlined,
    ToolOutlined,
    InboxOutlined,
} from "@ant-design/icons";
import { EmployeeStatistics, WorkHistoryData, MaintenanceFollowUp } from "../../types";
import { WorkHistoryChart } from "./components/WorkHistoryChart";
import { MaintenanceFollowUpList } from "./components/MaintenanceFollowUpList";

const { Title, Text } = Typography;

export const EmployeeDashboard: React.FC = () => {
    const { data: identity, isLoading: identityLoading } = useGetIdentity<{
        id: string;
        fullName: string;
        role: string;
    }>();

    // Fetch employee statistics using the PostgreSQL function
    const { data: statsData, isLoading: statsLoading } = useCustom<EmployeeStatistics[]>({
        url: `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/get_employee_statistics`,
        method: "post",
        config: {
            headers: {
                "Content-Type": "application/json",
                "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
                "Prefer": "return=representation",
            },
            payload: {
                employee_id: identity?.id,
            },
        },
        queryOptions: {
            enabled: !!identity?.id,
        },
    });

    // Fetch work history for chart
    const { data: historyData, isLoading: historyLoading } = useCustom<WorkHistoryData[]>({
        url: `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/get_employee_work_history`,
        method: "post",
        config: {
            headers: {
                "Content-Type": "application/json",
                "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
                "Prefer": "return=representation",
            },
            payload: {
                employee_id: identity?.id,
                days_back: 30,
            },
        },
        queryOptions: {
            enabled: !!identity?.id,
        },
    });

    // Fetch maintenance follow-up devices
    const { data: maintenanceData, isLoading: maintenanceLoading } = useCustom<MaintenanceFollowUp[]>({
        url: `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/get_employee_maintenance_followup`,
        method: "post",
        config: {
            headers: {
                "Content-Type": "application/json",
                "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
                "Prefer": "return=representation",
            },
            payload: {
                employee_id: identity?.id,
            },
        },
        queryOptions: {
            enabled: !!identity?.id,
        },
    });

    if (identityLoading) {
        return (
            <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <Spin size="large" />
            </div>
        );
    }

    const stats = statsData?.data?.[0] || {
        total_processed: 0,
        sent_to_warehouse: 0,
        sent_to_maintenance: 0,
        currently_assigned: 0,
    };

    const workHistory = historyData?.data || [];
    const maintenanceFollowUp = maintenanceData?.data || [];

    return (
        <div style={{ padding: "24px" }}>
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
                {/* Header */}
                <div>
                    <Title level={2}>لوحة التحكم الخاصة بي</Title>
                    <Text type="secondary">
                        مرحباً، {identity?.fullName || "الموظف"}
                    </Text>
                </div>

                {/* Statistics Cards */}
                <Spin spinning={statsLoading}>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} lg={6}>
                            <Card hoverable>
                                <Statistic
                                    title="إجمالي الأجهزة المعالجة"
                                    value={stats.total_processed}
                                    prefix={<CheckCircleOutlined />}
                                    valueStyle={{ color: "#52c41a" }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card hoverable>
                                <Statistic
                                    title="أرسلت للمخزن"
                                    value={stats.sent_to_warehouse}
                                    prefix={<ShoppingOutlined />}
                                    valueStyle={{ color: "#1890ff" }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card hoverable>
                                <Statistic
                                    title="أرسلت للصيانة"
                                    value={stats.sent_to_maintenance}
                                    prefix={<ToolOutlined />}
                                    valueStyle={{ color: "#faad14" }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card hoverable>
                                <Statistic
                                    title="المهام الحالية"
                                    value={stats.currently_assigned}
                                    prefix={<InboxOutlined />}
                                    valueStyle={{ color: "#722ed1" }}
                                />
                            </Card>
                        </Col>
                    </Row>
                </Spin>

                {/* Work History Chart */}
                <Card title="سجل العمل (آخر 30 يوم)">
                    <Spin spinning={historyLoading}>
                        <WorkHistoryChart data={workHistory} />
                    </Spin>
                </Card>

                {/* Maintenance Follow-up */}
                {maintenanceFollowUp.length > 0 && (
                    <Card title="متابعة الصيانة">
                        <Spin spinning={maintenanceLoading}>
                            <MaintenanceFollowUpList data={maintenanceFollowUp} />
                        </Spin>
                    </Card>
                )}
            </Space>
        </div>
    );
};
