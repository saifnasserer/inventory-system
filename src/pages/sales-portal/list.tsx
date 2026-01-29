import React, { useState, useEffect } from "react";
import { List, useTable, ShowButton } from "@refinedev/antd";
import {
    Table,
    Space,
    Tag,
    Button,
    Input,
    Typography,
    Tooltip,
    Spin
} from "antd";
import {
    SearchOutlined,
    UserAddOutlined,
    EditOutlined,
    ShopOutlined,
    FileAddOutlined,
    SwapOutlined
} from "@ant-design/icons";
import { useNavigation } from "@refinedev/core";
import { Device, User } from "../../types";
import InfiniteScroll from "react-infinite-scroll-component";
import { DeviceAssignmentModal } from "../warehouse/components/DeviceAssignmentModal";
import { DeviceTransferModal } from "../warehouse/components/DeviceTransferModal";
import { useList } from "@refinedev/core";

export const SalesPortalList: React.FC = () => {
    const { push } = useNavigation();
    const { tableProps, setFilters, tableQueryResult, current, setCurrent } = useTable<Device>({
        resource: "devices",
        syncWithLocation: false,
        pagination: { pageSize: 20 },
        filters: {
            permanent: [
                {
                    field: "status",
                    operator: "in",
                    value: "in_branch",
                },
            ],
        },
        meta: {
            select: "*,diagnostic_reports(*,hardware_specs(*))",
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

    // Assignment & Transfer State
    const [assignmentModalVisible, setAssignmentModalVisible] = useState(false);
    const [transferModalVisible, setTransferModalVisible] = useState(false);
    const [deviceToAssign, setDeviceToAssign] = useState<string[]>([]);
    const [devicesToTransfer, setDevicesToTransfer] = useState<string[]>([]);

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

    const handleTransfer = (ids: string[]) => {
        setDevicesToTransfer(ids);
        setTransferModalVisible(true);
    };

    const handleTransferSuccess = () => {
        setSelectedRowKeys([]);
        setCurrent(1);
        tableQueryResult?.refetch();
    };

    // Search state
    const [searchText, setSearchText] = useState("");
    const [allDevices, setAllDevices] = useState<Device[]>([]);

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
                            {
                                field: "cpu_model",
                                operator: "contains",
                                value: searchText,
                            },
                            {
                                field: "gpu_model",
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

    const devices = allDevices;
    const total = tableQueryResult?.data?.total || 0;
    const hasMore = devices.length < total;

    const loadMoreData = () => {
        if (!tableQueryResult?.isFetching) {
            setCurrent(current + 1);
        }
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            in_branch: "في المبيعات",
            ready_for_sale: "في المخزن",
            sold: "تم البيع",
            needs_repair: "في الصيانة",
            in_repair: "في الصيانة",
            returned: "مرجع للمورد",
            scrap: "خردة",
        };
        return labels[status] || status;
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            in_branch: "geekblue",
            ready_for_sale: "green",
            sold: "success",
            needs_repair: "orange",
            in_repair: "orange",
            returned: "volcano",
            scrap: "red",
        };
        return colors[status] || "default";
    };

    return (
        <div style={{ padding: "0px" }}>

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
                    <h2 style={{ fontSize: "20px", fontWeight: 600, margin: 0 }}>بوابة المبيعات</h2>
                </div>
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                    <Input
                        placeholder="Search (Model, Serial, Hardware)..."
                        allowClear
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        prefix={<SearchOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
                        style={{ width: 300, borderRadius: "50px" }}
                    />
                </div>
            </div>

            <div style={{ marginBottom: 16, display: "flex", justifyContent: "center", alignItems: "center", minHeight: selectedRowKeys.length > 0 ? 32 : 0, padding: "0 24px" }}>
                {selectedRowKeys.length > 0 && (
                    <div style={{ fontSize: "16px", fontWeight: 500 }}>
                        <Space>
                            <span>تم تحديد {selectedRowKeys.length} عنصر</span>
                            <Button
                                type="primary"
                                icon={<FileAddOutlined />}
                                onClick={() => push(`/invoices/create?device_ids=${selectedRowKeys.join(",")}`)}
                            >
                                إنشاء فاتورة للمحدد
                            </Button>
                            <Button
                                type="default"
                                icon={<SwapOutlined />}
                                onClick={() => handleTransfer(selectedRowKeys as string[])}
                            >
                                نقل المحدد
                            </Button>
                        </Space>
                    </div>
                )}
            </div>

            <List breadcrumb={false} title={false} headerButtons={null}>
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
                                dataIndex="model"
                                title="الموديل"
                                sorter={(a: Device, b: Device) =>
                                    (a.model || "").localeCompare(b.model || "")
                                }
                            />
                            <Table.Column
                                dataIndex="serial_number"
                                title="السيريال"
                                sorter={(a: Device, b: Device) =>
                                    (a.serial_number || "").localeCompare(b.serial_number || "")
                                }
                            />
                            <Table.Column
                                title="CPU"
                                render={(_, record: Device) => record.diagnostic_reports?.[0]?.hardware_specs?.cpu_name || record.cpu_model || "-"}
                            />
                            <Table.Column
                                title="GPU"
                                render={(_, record: Device) => {
                                    const gpus = record.diagnostic_reports?.[0]?.hardware_specs?.gpus;
                                    if (Array.isArray(gpus) && gpus.length > 0) {
                                        // Try to find a discrete GPU first
                                        const discreteGpu = gpus.find((gpu: any) => {
                                            const name = (gpu.model || gpu.name || "").toLowerCase();
                                            return name.includes("nvidia") ||
                                                name.includes("amd") ||
                                                name.includes("geforce") ||
                                                name.includes("radeon") ||
                                                name.includes("rtx") ||
                                                name.includes("gtx");
                                        });
                                        if (discreteGpu) return discreteGpu.model || discreteGpu.name;
                                        return gpus[0].model || gpus[0].name;
                                    }
                                    return record.gpu_model || "-";
                                }}
                                responsive={["lg"]}
                            />
                            <Table.Column
                                title="RAM"
                                render={(_, record: Device) => {
                                    const ram = record.diagnostic_reports?.[0]?.hardware_specs?.memory_total_gb || record.ram_size;
                                    return ram ? `${ram} GB` : "-";
                                }}
                            />
                            <Table.Column
                                title="Storage"
                                render={(_, record: Device) => {
                                    const storage = record.diagnostic_reports?.[0]?.hardware_specs?.storage_devices?.[0]?.size || record.storage_size;
                                    return storage ? `${storage} GB` : "-";
                                }}
                            />

                            <Table.Column
                                title="الإجراءات"
                                dataIndex="actions"
                                render={(_, record: Device) => (
                                    <Space>
                                        <ShowButton hideText size="small" recordItemId={record.id} resource="devices" />
                                        <Tooltip title="إنشاء فاتورة">
                                            <Button
                                                size="small"
                                                icon={<FileAddOutlined />}
                                                onClick={() => push(`/invoices/create?device_id=${record.id}`)}
                                            >
                                                فاتورة
                                            </Button>
                                        </Tooltip>
                                        <Tooltip title="نقل الجهاز">
                                            <Button
                                                size="small"
                                                icon={<SwapOutlined />}
                                                onClick={() => handleTransfer([record.id])}
                                            />
                                        </Tooltip>
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
                allowedRoles={["sales_staff", "branch_manager"]}
            />

            <DeviceTransferModal
                visible={transferModalVisible}
                onCancel={() => setTransferModalVisible(false)}
                deviceIds={devicesToTransfer}
                onSuccess={handleTransferSuccess}
                excludeDestinations={["branch"]}
            />
        </div>
    );
};
