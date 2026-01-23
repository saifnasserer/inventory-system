import { Navigate } from "react-router-dom";

import { useGetIdentity, useList } from "@refinedev/core";
import { Card, Row, Col, Statistic, Typography, Spin } from "antd";
import {
    ShoppingOutlined,
    ToolOutlined,
    InboxOutlined,
    SearchOutlined,
} from "@ant-design/icons";
import { Device } from "../../types";

const { Title, Text } = Typography;

export const DashboardPage: React.FC = () => {
    const { data: identity, isLoading: identityLoading } = useGetIdentity<{
        fullName: string;
        role: string;
    }>();

    // Fetch all devices
    // MOVED UP to avoid "Rendered more hooks than during the previous render" error
    const { data: devicesData, isLoading } = useList<Device>({
        resource: "devices",
        pagination: {
            mode: "off",
        },
        queryOptions: {
            // Only fetch if identity is loaded and NOT super_admin (since they get redirected)
            enabled: !!identity && identity.role !== "super_admin",
        }
    });

    // Instant redirect for Super Admin (using cached identity)
    if (identity?.role === "super_admin") {
        return <Navigate to="/companies" replace />;
    }

    // Show loading only if we really don't know yet and it's taking time
    // (With cache, this shouldn't flash for long)
    if (identityLoading) {
        return (
            <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <Spin size="large" />
            </div>
        );
    }

    const devices = devicesData?.data || [];

    // Calculate counts for each status category
    const inInspectionCount = devices.filter((device) =>
        ["pending_inspection", "in_physical_inspection", "in_technical_inspection"].includes(
            device.status
        )
    ).length;

    const inWarehouseCount = devices.filter(
        (device) => device.status === "received"
    ).length;

    const inMaintenanceCount = devices.filter((device) =>
        ["needs_repair", "in_repair"].includes(device.status)
    ).length;

    const readyForSaleCount = devices.filter(
        (device) => device.status === "ready_for_sale"
    ).length;

    return (
        <div style={{ padding: "24px" }}>
            <div style={{ marginBottom: 24 }}>
                <Title level={3} style={{ fontWeight: 400, margin: 0 }}>
                    مرحباً بك، <span style={{ fontWeight: 700 }}>{identity?.fullName || "المستخدم"}</span>
                </Title>
                <Text type="secondary" style={{ fontSize: 16 }}>
                    ملخص سريع لنشاط المخزون اليوم
                </Text>
            </div>

            <Spin spinning={isLoading}>
                <Row gutter={[24, 24]}>
                    <Col xs={24} sm={12} lg={6}>
                        <Card
                            variant="borderless"
                            style={{ boxShadow: "none", height: '100%', borderRadius: 24, background: "#f9f9f9" }}
                            styles={{ body: { padding: 24 } }}
                        >
                            <Statistic
                                title={<Text type="secondary">في الفحص</Text>}
                                value={inInspectionCount}
                                prefix={<SearchOutlined style={{ color: "#1890ff", background: "#e6f7ff", padding: 8, borderRadius: 8 }} />}
                                valueStyle={{ fontSize: 32, fontWeight: 700, marginTop: 8 }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card
                            variant="borderless"
                            style={{ boxShadow: "none", height: '100%', borderRadius: 24, background: "#f9f9f9" }}
                            styles={{ body: { padding: 24 } }}
                        >
                            <Statistic
                                title={<Text type="secondary">في المخزن</Text>}
                                value={inWarehouseCount}
                                prefix={<InboxOutlined style={{ color: "#722ed1", background: "#f9f0ff", padding: 8, borderRadius: 8 }} />}
                                valueStyle={{ fontSize: 32, fontWeight: 700, marginTop: 8 }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card
                            variant="borderless"
                            style={{ boxShadow: "none", height: '100%', borderRadius: 24, background: "#f9f9f9" }}
                            styles={{ body: { padding: 24 } }}
                        >
                            <Statistic
                                title={<Text type="secondary">في الصيانة</Text>}
                                value={inMaintenanceCount}
                                prefix={<ToolOutlined style={{ color: "#faad14", background: "#fffbe6", padding: 8, borderRadius: 8 }} />}
                                valueStyle={{ fontSize: 32, fontWeight: 700, marginTop: 8 }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card
                            variant="borderless"
                            style={{ boxShadow: "none", height: '100%', borderRadius: 24, background: "#f9f9f9" }}
                            styles={{ body: { padding: 24 } }}
                        >
                            <Statistic
                                title={<Text type="secondary">جاهز للبيع</Text>}
                                value={readyForSaleCount}
                                prefix={<ShoppingOutlined style={{ color: "#52c41a", background: "#f6ffed", padding: 8, borderRadius: 8 }} />}
                                valueStyle={{ fontSize: 32, fontWeight: 700, marginTop: 8 }}
                            />
                        </Card>
                    </Col>
                </Row>
            </Spin>

            <Card variant="borderless" style={{ marginTop: 24, boxShadow: "none", borderRadius: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Title level={4} style={{ margin: 0, fontWeight: 600 }}>نظرة عامة على النظام</Title>
                </div>

                <Row gutter={[24, 24]}>
                    <Col span={24}>
                        <div style={{ display: 'flex', alignItems: 'center', fontSize: 16 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1890ff', marginLeft: 8 }}></div>
                            <Text type="secondary" style={{ marginLeft: 8 }}>إجمالي الأجهزة المسجلة:</Text>
                            <Text strong>{devices.length}</Text>
                        </div>
                    </Col>
                </Row>
            </Card>
        </div>
    );
};

function getRoleLabel(role?: string): string {
    const roleLabels: Record<string, string> = {
        admin: "مدير عام",
        warehouse_manager: "مسؤول المخزن",
        warehouse_staff: "موظف مخزن",
        repair_manager: "مدير صيانة",
        technician: "فني صيانة",
        branch_manager: "مدير فرع",
        sales_staff: "موظف مبيعات",
        super_admin: "مدير النظام (Super Admin)",
    };
    return roleLabels[role || ""] || role || "";
}
