import React from "react";
import { List, useTable, ShowButton } from "@refinedev/antd";
import {
    Table,
    Space,
    Tag,
    Card,
    Row,
    Col,
    Statistic,
} from "antd";
import {
    ToolOutlined,
    WarningOutlined,
} from "@ant-design/icons";
import { Input } from "antd";
import { Device } from "../../types";
import { supabaseClient } from "../../utility/supabaseClient";


export const MaintenanceList: React.FC = () => {
    const { tableProps, setFilters } = useTable<Device>({
        resource: "devices",
        syncWithLocation: true,
        pagination: { pageSize: 10 },
        filters: {
            permanent: [
                {
                    field: "status",
                    operator: "in",
                    value: ["needs_repair", "in_repair"],
                },
            ],
        },
    });

    const devices = (tableProps.dataSource || []) as Device[];
    const [repairStatuses, setRepairStatuses] = React.useState<Record<string, string>>({});

    // Fetch repair statuses for all devices
    React.useEffect(() => {
        const fetchRepairStatuses = async () => {
            if (devices.length === 0) return;

            const deviceIds = devices.map(d => d.id);
            const { data } = await supabaseClient
                .from("repairs")
                .select("device_id, status")
                .in("device_id", deviceIds)
                .neq("status", "completed");

            if (data) {
                const statusMap: Record<string, string> = {};
                data.forEach(repair => {
                    statusMap[repair.device_id] = repair.status;
                });
                setRepairStatuses(statusMap);
            }
        };

        fetchRepairStatuses();
    }, [devices.length]);

    const needsRepairCount = devices.filter((d) => d.status === "needs_repair").length;
    const inRepairCount = devices.filter((d) => d.status === "in_repair").length;

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            needs_repair: "يحتاج صيانة",
            in_repair: "في الصيانة",
            // Repair workflow statuses
            pending: "في انتظار الفحص",
            diagnosing: "جاري التشخيص",
            waiting_for_parts: "في انتظار قطع الغيار",
            in_progress: "جاري الإصلاح",
            testing: "في الاختبار",
            completed: "تم الإصلاح",
        };
        return labels[status] || status;
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            needs_repair: "red",
            in_repair: "volcano",
            // Repair workflow statuses
            pending: "orange",
            diagnosing: "cyan",
            waiting_for_parts: "gold",
            in_progress: "blue",
            testing: "purple",
            completed: "green",
        };
        return colors[status] || "default";
    };

    return (
        <div style={{ padding: "24px" }}>
            {/* Quick Stats */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={8}>
                    <Card hoverable>
                        <Statistic
                            title="يحتاج صيانة"
                            value={needsRepairCount}
                            prefix={<WarningOutlined />}
                            valueStyle={{ color: "#ff4d4f" }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                    <Card hoverable>
                        <Statistic
                            title="في الصيانة"
                            value={inRepairCount}
                            prefix={<ToolOutlined />}
                            valueStyle={{ color: "#faad14" }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                    <Card hoverable>
                        <Statistic
                            title="إجمالي الأجهزة"
                            value={devices.length}
                            prefix={<ToolOutlined />}
                            valueStyle={{ color: "#722ed1" }}
                        />
                    </Card>
                </Col>
            </Row>

            <div style={{ marginBottom: 16 }}>
                <Input.Search
                    placeholder="بحث برقم الأصل..."
                    allowClear
                    onSearch={(value) => setFilters([{ field: "asset_id", operator: "contains", value: value }], "merge")}
                    style={{ maxWidth: 300 }}
                />
            </div>

            <List title="الصيانة - الأجهزة التي تحتاج إصلاح" breadcrumb={false}>
                <Table
                    {...tableProps}
                    rowKey="id"
                    pagination={{
                        ...tableProps.pagination,
                        showSizeChanger: true,
                        position: ["bottomCenter"],
                    }}
                >
                    <Table.Column
                        dataIndex="asset_id"
                        title="رقم الأصل"
                        render={(value) => <strong>{value}</strong>}
                        sorter={(a: Device, b: Device) => a.asset_id.localeCompare(b.asset_id)}
                    />
                    <Table.Column
                        dataIndex="model"
                        title="الموديل"
                        sorter={(a: Device, b: Device) =>
                            (a.model || "").localeCompare(b.model || "")
                        }
                    />

                    <Table.Column
                        dataIndex="status"
                        title="حالة الصيانة"
                        render={(_, record: Device) => {
                            const repairStatus = repairStatuses[record.id] || record.status;
                            return (
                                <Tag color={getStatusColor(repairStatus)}>{getStatusLabel(repairStatus)}</Tag>
                            );
                        }}
                        filters={[
                            { text: "يحتاج صيانة", value: "needs_repair" },
                            { text: "في الصيانة", value: "in_repair" },
                        ]}
                        onFilter={(value, record: Device) => record.status === value}
                    />
                    <Table.Column
                        dataIndex="current_location"
                        title="الموقع"
                        responsive={["md"]}
                    />
                    <Table.Column
                        dataIndex="updated_at"
                        title="آخر تحديث"
                        render={(value) =>
                            value ? new Date(value).toLocaleDateString("ar-EG") : "-"
                        }
                        sorter={(a: Device, b: Device) =>
                            new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
                        }
                        responsive={["lg"]}
                    />
                    <Table.Column
                        title="الإجراءات"
                        dataIndex="actions"
                        fixed="left"
                        render={(_, record: Device) => (
                            <Space>
                                <ShowButton hideText size="small" recordItemId={record.id} resource="maintenance" />
                            </Space>
                        )}
                    />
                </Table>
            </List>
        </div>
    );
};
