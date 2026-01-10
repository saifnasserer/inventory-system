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

const { Title } = Typography;

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
            <Title level={2}>
                مرحباً، {identity?.fullName || "المستخدم"}
            </Title>
            <Title level={4} type="secondary">
                الدور: {getRoleLabel(identity?.role)}
            </Title>

            <Spin spinning={isLoading}>
                <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                    <Col xs={24} sm={12} lg={6}>
                        <Card hoverable>
                            <Statistic
                                title="في الفحص"
                                value={inInspectionCount}
                                prefix={<SearchOutlined />}
                                valueStyle={{ color: "#1890ff" }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card hoverable>
                            <Statistic
                                title="في المخزن"
                                value={inWarehouseCount}
                                prefix={<InboxOutlined />}
                                valueStyle={{ color: "#722ed1" }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card hoverable>
                            <Statistic
                                title="في الصيانة"
                                value={inMaintenanceCount}
                                prefix={<ToolOutlined />}
                                valueStyle={{ color: "#faad14" }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card hoverable>
                            <Statistic
                                title="جاهز للبيع"
                                value={readyForSaleCount}
                                prefix={<ShoppingOutlined />}
                                valueStyle={{ color: "#52c41a" }}
                            />
                        </Card>
                    </Col>
                </Row>
            </Spin>

            <Card style={{ marginTop: 24 }}>
                <Title level={4}>ملخص النظام</Title>
                <Row gutter={[16, 16]}>
                    <Col span={24}>
                        <p>
                            <strong>إجمالي الأجهزة:</strong> {devices.length}
                        </p>
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
