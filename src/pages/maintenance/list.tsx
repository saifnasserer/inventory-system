import React, { useState, useEffect } from "react";
import { List, useTable, ShowButton } from "@refinedev/antd";
import {
    Table,
    Space,
    Tag,
    Card,
    Row,
    Col,
    Statistic,
    Spin
} from "antd";
import {
    ToolOutlined,
    WarningOutlined,
    SearchOutlined,
    UserAddOutlined,
    UserOutlined,
    EditOutlined
} from "@ant-design/icons";
import { Input, Typography, Tooltip, Button } from "antd";
import { Device, User, Repair } from "../../types";
import InfiniteScroll from "react-infinite-scroll-component";
import { DeviceAssignmentModal } from "../warehouse/components/DeviceAssignmentModal";
import { useList } from "@refinedev/core";


export const MaintenanceList: React.FC = () => {
    const { tableProps, setFilters, tableQueryResult, current, setCurrent } = useTable<Device>({
        resource: "devices",
        syncWithLocation: false,
        pagination: { pageSize: 20 },
        filters: {
            permanent: [
                {
                    field: "status",
                    operator: "in",
                    value: ["needs_repair", "in_repair"],
                },
            ],
        },
        queryOptions: {
            onSuccess: (data) => {
                if (current === 1) {
                    setAllDevices((data.data as Device[]) || []);
                } else {
                    setAllDevices((prev) => [...prev, ...((data.data as Device[]) || [])]);
                }
            }
        }
    });

    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    // Assignment State
    const [assignmentModalVisible, setAssignmentModalVisible] = useState(false);
    const [deviceToAssign, setDeviceToAssign] = useState<string[]>([]);

    // Fetch users for assignment display
    const { data: usersData } = useList<User>({
        resource: "users",
        pagination: { mode: "off" },
    });
    const users = usersData?.data || [];
    const getUserName = (userId: string) => {
        const user = users.find(u => u.id === userId);
        return user ? user.full_name : "Unknown";
    };

    const handleAssignDevice = (deviceId: string) => {
        setDeviceToAssign([deviceId]);
        setAssignmentModalVisible(true);
    };

    const handleAssignmentSuccess = () => {
        setSelectedRowKeys([]);
        setCurrent(1);
        tableQueryResult?.refetch();
    };

    const handleBulkAssign = () => {
        setDeviceToAssign(selectedRowKeys as string[]);
        setAssignmentModalVisible(true);
    };

    // Search state
    const [searchText, setSearchText] = useState("");

    // Debounced Search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchText) {
                setFilters([
                    {
                        operator: "or",
                        value: [
                            {
                                field: "asset_id",
                                operator: "contains",
                                value: searchText,
                            },
                            {
                                field: "serial_number",
                                operator: "contains",
                                value: searchText,
                            },
                            {
                                field: "model",
                                operator: "contains",
                                value: searchText,
                            },
                        ],
                    },
                ], "merge");
            } else {
                setFilters([], "merge");
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchText, setFilters]);

    const [allDevices, setAllDevices] = useState<Device[]>([]);


    const devices = allDevices;
    const total = tableQueryResult?.data?.total || 0;
    const hasMore = devices.length < total;

    const loadMoreData = () => {
        if (!tableQueryResult?.isFetching) {
            setCurrent(current + 1);
        }
    };

    const [repairStatuses, setRepairStatuses] = React.useState<Record<string, string>>({});





    // Fetch repair statuses for all devices
    const { data: repairsData } = useList<Repair>({
        resource: "repairs",
        filters: [
            {
                field: "device_id",
                operator: "in",
                value: devices.map(d => d.id),
            },
            {
                field: "status",
                operator: "ne",
                value: "completed",
            }
        ],
        pagination: { mode: "off" },
        queryOptions: {
            enabled: devices.length > 0,
        }
    });

    React.useEffect(() => {
        if (repairsData?.data) {
            const statusMap: Record<string, string> = {};
            repairsData.data.forEach(repair => {
                statusMap[repair.device_id] = repair.status;
            });
            setRepairStatuses(statusMap);
        }
    }, [repairsData]);

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
        <div style={{ padding: "0px" }}>
            {/* Custom Header Area */}
            <div style={{
                marginBottom: 24,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#fff",
                padding: "16px 24px",
                borderBottom: "1px solid #f0f0f0",
            }}>
                <div>
                    <h2 style={{ fontSize: "20px", fontWeight: 600, margin: 0 }}>الصيانة</h2>
                </div>
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                    <Input
                        placeholder="بحث (رقم الأصل، السيريال، الموديل)..."
                        allowClear
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        prefix={<SearchOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
                        style={{ width: 300, borderRadius: "50px" }}
                    />
                </div>
            </div>

            <div style={{ marginBottom: 16, display: "flex", justifyContent: "center", alignItems: "center", minHeight: selectedRowKeys.length > 0 ? 32 : 0 }}>
                {selectedRowKeys.length > 0 && (
                    <div style={{ fontSize: "16px", fontWeight: 500 }}>
                        <Space>
                            <span>تم تحديد {selectedRowKeys.length} عنصر</span>
                            <Button
                                type="primary"
                                icon={<UserAddOutlined />}
                                onClick={handleBulkAssign}
                            >
                                تعيين المحدد
                            </Button>
                        </Space>
                    </div>
                )}
            </div>

            <List breadcrumb={false}>
                <div id="scrollableDiv" style={{ height: "calc(100vh - 180px)", overflow: "auto", padding: "0 24px", backgroundColor: "#fff" }}>
                    <InfiniteScroll
                        dataLength={devices.length}
                        next={loadMoreData}
                        hasMore={hasMore}
                        loader={<div style={{ textAlign: "center", padding: 10 }}><Spin /></div>}
                        scrollableTarget="scrollableDiv"
                        endMessage={<div style={{ textAlign: "center", padding: 10, color: "#ccc" }}>وصلت لنهاية القائمة</div>}
                    >
                        <Table
                            {...tableProps}
                            dataSource={devices}
                            pagination={false}
                            rowKey="id"
                            rowSelection={{
                                selectedRowKeys,
                                onChange: (keys) => setSelectedRowKeys(keys),
                            }}
                        >
                            <Table.Column
                                dataIndex="asset_id"
                                title="رقم الأصل"
                                render={(value) => <strong>{value}</strong>}
                                sorter={(a: Device, b: Device) => a.asset_id.localeCompare(b.asset_id)}
                                width={100}
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
                                dataIndex="assigned_to"
                                title="الموظف المسؤول"
                                render={(value, record: Device) => (
                                    value ? (
                                        <Space>
                                            <Tag icon={<UserOutlined />} color="blue">
                                                {getUserName(value)}
                                            </Tag>
                                            <Tooltip title="تغيير الموظف">
                                                <Button
                                                    size="small"
                                                    type="text"
                                                    icon={<EditOutlined />}
                                                    onClick={() => handleAssignDevice(record.id)}
                                                />
                                            </Tooltip>
                                        </Space>
                                    ) : (
                                        <Button
                                            size="small"
                                            type="dashed"
                                            icon={<UserAddOutlined />}
                                            onClick={() => handleAssignDevice(record.id)}
                                        >
                                            تعيين موظف
                                        </Button>
                                    )
                                )}
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
                                render={(_, record: Device) => (
                                    <Space>
                                        <ShowButton hideText size="small" recordItemId={record.id} resource="maintenance" />
                                    </Space>
                                )}
                            />
                        </Table>
                    </InfiniteScroll>
                </div>
            </List>

            <DeviceAssignmentModal
                visible={assignmentModalVisible}
                onCancel={() => setAssignmentModalVisible(false)}
                deviceIds={deviceToAssign}
                onSuccess={handleAssignmentSuccess}
                allowedRoles={["technician"]}
            />
        </div>
    );
};
