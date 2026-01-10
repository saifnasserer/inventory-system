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
} from "@ant-design/icons";
import { Input } from "antd";
import { Device } from "../../types";
import { supabaseClient } from "../../utility/supabaseClient";
import InfiniteScroll from "react-infinite-scroll-component";


export const MaintenanceList: React.FC = () => {
    const { tableProps, setFilters, tableQueryResult, current, setCurrent } = useTable<Device>({
        resource: "devices",
        syncWithLocation: true,
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

    // Search state
    const [searchText, setSearchText] = useState("");

    // Debounced Search
    useEffect(() => {
        const timer = setTimeout(() => {
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
    }, [devices.length]); // Re-run when devices list grows

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

            {/* Custom Header Area */}
            <div style={{
                marginBottom: 24,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#fff",
                padding: "16px 24px",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
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

            <List breadcrumb={false}>
                <div id="scrollableDiv" style={{ height: "calc(100vh - 350px)", overflow: "auto" }}>
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
                            size="small"
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
        </div>
    );
};
