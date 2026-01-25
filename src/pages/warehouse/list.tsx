import { List, useTable, ShowButton, EditButton } from "@refinedev/antd";
import {
    Table,
    Space,
    Tag,
    Card,
    Row,
    Col,
    Statistic,
    Button,
    Modal,
    Spin,
} from "antd";
import {
    ShoppingOutlined,
    InboxOutlined,
    SearchOutlined,
    PrinterOutlined,
    ToolOutlined,
    SwapOutlined,
} from "@ant-design/icons";
import { Input } from "antd";
import { Device } from "../../types";
import { useState, useRef, useEffect } from "react";
import { useGetIdentity } from "@refinedev/core";
import { DeviceLabel } from "../../components/DeviceLabel";
import { useReactToPrint } from "react-to-print";
import InfiniteScroll from "react-infinite-scroll-component";
import { DeviceTransferModal } from "./components/DeviceTransferModal";

export const DeviceList: React.FC = () => {
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [printModalOpen, setPrintModalOpen] = useState(false);
    const [transferModalVisible, setTransferModalVisible] = useState(false);
    const [devicesToTransfer, setDevicesToTransfer] = useState<string[]>([]);
    const printRef = useRef<HTMLDivElement>(null);

    // Search state
    const [searchText, setSearchText] = useState("");



    const { data: identity } = useGetIdentity<{ role: string }>();
    const isAdmin = identity?.role && ["admin", "warehouse_manager", "super_admin"].includes(identity.role);

    const { tableProps, setFilters, tableQueryResult, current, setCurrent, pageSize } = useTable<Device>({
        resource: "devices",
        syncWithLocation: false, // Disabled to prevent 416 errors when filters strictly reduce record count
        pagination: { pageSize: 20 }, // Larger page size for infinite scroll
        filters: {
            permanent: [
                {
                    field: "status",
                    operator: "eq",
                    value: "ready_for_sale",
                }
            ],
        },
        queryOptions: {
            onSuccess: (data) => {
                // If it's the first page, reset data. Else, append.
                if (current === 1) {
                    setAllDevices((data.data as Device[]) || []);
                } else {
                    setAllDevices((prev) => [...prev, ...((data.data as Device[]) || [])]);
                }
            }
        }
    });

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
                        ],
                    },
                ], "merge");
            } else {
                setFilters([], "merge");
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchText, setFilters]);

    // Reset accumulated data when filters change (detected by current page resetting to 1 usually, 
    // or we can listen to query result isLoading/isFetching but that might flicker.
    // The onSuccess handler with current === 1 check handles the "new search/filter" case mostly,
    // provided useTable resets current to 1 on filter change, which it does).

    // We need to ensure that when we search/filter, we reset the list.
    // Refine's useTable resets `current` to 1 automatically on filter change.

    // However, we need to make sure the `data` in onSuccess is correct.

    const devices = allDevices; // Use our local accumulated state
    const total = tableQueryResult?.data?.total || 0;
    const hasMore = devices.length < total;

    const loadMoreData = () => {
        if (!tableQueryResult?.isFetching) {
            setCurrent(current + 1);
        }
    };

    const inWarehouseCount = devices.filter((d) => d.status === "ready_for_sale").length;
    const inMaintenanceCount = devices.filter((d) => ["needs_repair", "in_repair"].includes(d.status)).length;
    const inBranchCount = devices.filter((d) => d.status === "in_branch").length;

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            ready_for_sale: "green",
            needs_repair: "orange",
            in_repair: "orange",
            in_branch: "geekblue",
            sold: "success",
            received: "blue",
            diagnosed: "cyan",
            returned: "volcano",
            scrap: "red",
        };
        return colors[status] || "default";
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            ready_for_sale: "في المخزن",
            needs_repair: "في الصيانة",
            in_repair: "في الصيانة",
            in_branch: "في المبيعات",
            sold: "تم البيع",
            returned: "مرجع للمورد",
            scrap: "خردة",
        };
        return labels[status] || status;
    };

    const handleBulkPrint = () => {
        setPrintModalOpen(true);
    };

    const handleTransfer = (ids: string[]) => {
        setDevicesToTransfer(ids);
        setTransferModalVisible(true);
    };

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Labels-Bulk-${new Date().toISOString().split('T')[0]}`,
    });

    const selectedDevices = devices.filter(d => selectedRowKeys.includes(d.id));

    const rowSelection = isAdmin ? {
        selectedRowKeys,
        onChange: (newSelectedRowKeys: React.Key[]) => {
            setSelectedRowKeys(newSelectedRowKeys);
        },
    } : undefined;

    return (
        <div style={{ padding: "0px" }}>
            {/* Quick Stats Removed as per request */}

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
                    <h2 style={{ fontSize: "20px", fontWeight: 600, margin: 0 }}>المخزن</h2>
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
                    {isAdmin && (
                        <>
                            {selectedRowKeys.length > 0 && (
                                <Space>
                                    <Button
                                        icon={<PrinterOutlined />}
                                        onClick={handleBulkPrint}
                                    >
                                        طباعة ({selectedRowKeys.length})
                                    </Button>
                                    <Button
                                        icon={<SwapOutlined />}
                                        onClick={() => handleTransfer(selectedRowKeys as string[])}
                                    >
                                        نقل ({selectedRowKeys.length})
                                    </Button>
                                </Space>
                            )}
                        </>
                    )}
                </div>
            </div>



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
                        dataSource={devices} // Override dataSource with our accumulated one
                        pagination={false} // Disable internal pagination
                        rowKey="id"
                        rowSelection={rowSelection}
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
                            dataIndex="serial_number"
                            title="الرقم التسلسلي"
                        />

                        <Table.Column
                            dataIndex="status"
                            title="الحالة"
                            render={(value) => (
                                <Tag color={getStatusColor(value)} style={{ borderRadius: "50px", padding: "0 12px" }}>
                                    {getStatusLabel(value)}
                                </Tag>
                            )}
                            sorter={(a: Device, b: Device) => (a.status || "").localeCompare(b.status || "")}
                        />
                        <Table.Column
                            dataIndex="current_location"
                            title="الموقع"
                        />
                        <Table.Column
                            dataIndex="created_at"
                            title="تاريخ الإضافة"
                            render={(value) =>
                                value ? new Date(value).toLocaleDateString("ar-EG") : "-"
                            }
                            sorter={(a: Device, b: Device) =>
                                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                            }
                            responsive={["lg"]}
                        />
                        <Table.Column
                            title="الإجراءات"
                            dataIndex="actions"
                            render={(_, record: Device) => (
                                <Space>
                                    {isAdmin && (
                                        <Button
                                            size="small"
                                            icon={<SwapOutlined />}
                                            onClick={() => handleTransfer([record.id])}
                                            title="نقل"
                                        />
                                    )}
                                    <ShowButton hideText size="small" recordItemId={record.id} resource="devices" />
                                    <EditButton hideText size="small" recordItemId={record.id} resource="devices" />
                                </Space>
                            )}
                        />
                    </Table>
                </InfiniteScroll>
            </div>


            {/* Bulk Print Modal */}
            <Modal
                title={`طباعة الملصقات (${selectedDevices.length} جهاز)`}
                open={printModalOpen}
                onCancel={() => setPrintModalOpen(false)}
                footer={[
                    <Button key="cancel" onClick={() => setPrintModalOpen(false)}>
                        إلغاء
                    </Button>,
                    <Button
                        key="print"
                        type="primary"
                        icon={<PrinterOutlined />}
                        onClick={() => {
                            handlePrint();
                            setPrintModalOpen(false);
                        }}
                    >
                        طباعة الكل
                    </Button>,
                ]}
                width={800}
            >
                <div
                    ref={printRef}
                    style={{
                        padding: "20px",
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: "20px"
                    }}
                >
                    {selectedDevices.map(device => (
                        <DeviceLabel
                            key={device.id}
                            assetId={device.asset_id}
                            deviceType={device.manufacturer}
                            model={device.model}
                            serialNumber={device.serial_number}
                        />
                    ))}
                </div>
            </Modal>

            <DeviceTransferModal
                visible={transferModalVisible}
                onCancel={() => setTransferModalVisible(false)}
                onSuccess={() => {
                    setSelectedRowKeys([]);
                    setCurrent(1);
                    tableQueryResult?.refetch();
                }}
                deviceIds={devicesToTransfer}
            />
        </div >
    );
};
