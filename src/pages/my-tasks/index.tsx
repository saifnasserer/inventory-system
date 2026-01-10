import React, { useState } from "react";
import { useGetIdentity, useList, useNavigation } from "@refinedev/core";
import { List, useTable, ShowButton } from "@refinedev/antd";
import { Table, Space, Tag, Button, Input, Select, Card, Row, Col, Statistic } from "antd";
import { SearchOutlined, EyeOutlined, PlayCircleOutlined, InboxOutlined } from "@ant-design/icons";
import { Device, DeviceStatus } from "../../types";

const { Option } = Select;

export const MyTasksPage: React.FC = () => {
    const { data: identity } = useGetIdentity<{ id: string; fullName: string }>();
    const { show } = useNavigation();
    const [statusFilter, setStatusFilter] = useState<DeviceStatus | "all">("all");

    const { tableProps, setFilters } = useTable<Device>({
        resource: "devices",
        syncWithLocation: true,
        pagination: { pageSize: 10 },
        filters: {
            permanent: [
                {
                    field: "assigned_to",
                    operator: "eq",
                    value: identity?.id,
                },
            ],
        },
    });

    const devices = (tableProps.dataSource || []) as Device[];

    // Apply status filter
    const filteredDevices = statusFilter === "all"
        ? devices
        : devices.filter((d) => d.status === statusFilter);

    const activeTasksCount = devices.filter((d) =>
        ["pending_inspection", "in_physical_inspection", "in_technical_inspection"].includes(d.status)
    ).length;

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            received: "default",
            pending_inspection: "orange",
            in_physical_inspection: "blue",
            in_technical_inspection: "cyan",
            ready_for_sale: "green",
            needs_repair: "red",
            in_repair: "purple",
        };
        return colors[status] || "default";
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            received: "مستلم",
            pending_inspection: "في انتظار الفحص",
            in_physical_inspection: "فحص فيزيائي",
            in_technical_inspection: "فحص تقني",
            ready_for_sale: "جاهز للبيع",
            needs_repair: "بحاجة للصيانة",
            in_repair: "قيد الصيانة",
        };
        return labels[status] || status;
    };

    const handleStartInspection = (deviceId: string) => {
        show("devices", deviceId);
    };

    return (
        <div style={{ padding: "24px" }}>
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
                {/* Quick Stats */}
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} lg={8}>
                        <Card hoverable>
                            <Statistic
                                title="إجمالي المهام"
                                value={devices.length}
                                prefix={<InboxOutlined />}
                                valueStyle={{ color: "#1890ff" }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={8}>
                        <Card hoverable>
                            <Statistic
                                title="المهام النشطة"
                                value={activeTasksCount}
                                prefix={<PlayCircleOutlined />}
                                valueStyle={{ color: "#52c41a" }}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* Filters */}
                <Card>
                    <Space wrap>
                        <Input.Search
                            placeholder="بحث برقم الأصل..."
                            allowClear
                            onSearch={(value) =>
                                setFilters([{ field: "asset_id", operator: "contains", value }], "merge")
                            }
                            style={{ width: 250 }}
                            prefix={<SearchOutlined />}
                        />
                        <Select
                            value={statusFilter}
                            onChange={setStatusFilter}
                            style={{ width: 200 }}
                            placeholder="تصفية حسب الحالة"
                        >
                            <Option value="all">جميع الحالات</Option>
                            <Option value="pending_inspection">في انتظار الفحص</Option>
                            <Option value="in_physical_inspection">فحص فيزيائي</Option>
                            <Option value="in_technical_inspection">فحص تقني</Option>
                            <Option value="ready_for_sale">جاهز للبيع</Option>
                            <Option value="needs_repair">بحاجة للصيانة</Option>
                        </Select>
                    </Space>
                </Card>

                {/* Tasks Table */}
                <List title="مهامي" breadcrumb={false}>
                    <Table
                        {...tableProps}
                        dataSource={filteredDevices}
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
                            title="الحالة"
                            render={(value) => (
                                <Tag color={getStatusColor(value)}>{getStatusLabel(value)}</Tag>
                            )}
                        />
                        <Table.Column
                            dataIndex="created_at"
                            title="تاريخ التعيين"
                            render={(value) =>
                                value ? new Date(value).toLocaleDateString("ar-EG") : "-"
                            }
                            sorter={(a: Device, b: Device) =>
                                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                            }
                            responsive={["md"]}
                        />
                        <Table.Column
                            title="الإجراءات"
                            dataIndex="actions"
                            fixed="left"
                            render={(_, record: Device) => (
                                <Space>
                                    {["pending_inspection", "in_physical_inspection", "in_technical_inspection"].includes(
                                        record.status
                                    ) && (
                                            <Button
                                                type="primary"
                                                size="small"
                                                icon={<PlayCircleOutlined />}
                                                onClick={() => handleStartInspection(record.id)}
                                            >
                                                بدء الفحص
                                            </Button>
                                        )}
                                    <ShowButton
                                        hideText
                                        size="small"
                                        recordItemId={record.id}
                                        resource="devices"
                                    />
                                </Space>
                            )}
                        />
                    </Table>
                </List>
            </Space>
        </div>
    );
};
