import { useDeleteMany, useList } from "@refinedev/core";
import { List, useTable, ShowButton } from "@refinedev/antd";
import { Table, Space, Tag, Card, Row, Col, Statistic, Button, Dropdown, Menu, message, Popconfirm, Tooltip, Typography, Input, Spin, Modal } from "antd";
import { SearchOutlined, ClockCircleOutlined, CheckCircleOutlined, PrinterOutlined, EditOutlined, DeleteOutlined, DownOutlined, PlusCircleOutlined, UserOutlined } from "@ant-design/icons";
import { Device, User } from "../../types";
import { useState, useRef, useEffect } from "react";
import { useReactToPrint } from "react-to-print";
import { DeviceLabel } from "../../components/DeviceLabel";
import InfiniteScroll from "react-infinite-scroll-component";
import { DeviceAssignmentModal } from "../warehouse/components/DeviceAssignmentModal";
import { UserAddOutlined } from "@ant-design/icons";

export const ShipmentList: React.FC = () => {
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const { mutate: deleteMany, isLoading: isDeleting } = useDeleteMany();

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

    // Search state
    const [searchText, setSearchText] = useState("");



    // Print state
    const [printModalOpen, setPrintModalOpen] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Labels-Shipment-${new Date().toISOString().split('T')[0]}`,
    });

    const handleBulkPrint = () => {
        setPrintModalOpen(true);
    };



    const { tableProps, setFilters, tableQueryResult, current, setCurrent } = useTable<Device>({
        resource: "devices",
        syncWithLocation: true,
        pagination: {
            pageSize: 20,
        },
        filters: {
            permanent: [
                {
                    field: "status",
                    operator: "in",
                    value: ["received", "pending_inspection", "in_physical_inspection", "in_technical_inspection"],
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

    // Calculate stats
    const receivedCount = devices.filter((d) => d.status === "received").length;
    const pendingCount = devices.filter((d) => d.status === "pending_inspection").length;
    const inPhysicalCount = devices.filter((d) => d.status === "in_physical_inspection").length;
    const inTechnicalCount = devices.filter((d) => d.status === "in_technical_inspection").length;

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            received: "purple",
            pending_inspection: "orange",
            in_physical_inspection: "cyan",
            in_technical_inspection: "blue",
        };
        return colors[status] || "default";
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            received: "تم الاستلام",
            pending_inspection: "في انتظار الفحص",
            in_physical_inspection: "في الفحص الخارجي",
            in_technical_inspection: "في الفحص الفني",
        };
        return labels[status] || status;
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
                    <Typography.Title level={4} style={{ margin: 0 }}>الأجهزة قيد الفحص</Typography.Title>
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
                    <Button
                        type="primary"
                        size="middle"
                        icon={<PlusCircleOutlined />}
                        onClick={() => window.location.href = "/receiving/shipments/create"}
                        style={{
                            borderRadius: "50px",
                            background: "linear-gradient(90deg, #1890ff 0%, #096dd9 100%)",
                            boxShadow: "0 4px 14px rgba(24, 144, 255, 0.3)",
                            border: "none"
                        }}
                    >
                        إضافة شحنة
                    </Button>
                </div>
            </div>

            <div style={{ marginBottom: 16, display: "flex", justifyContent: "center", alignItems: "center", minHeight: selectedRowKeys.length > 0 ? 32 : 0 }}>

                <div style={{ fontSize: "16px", fontWeight: 500 }}>
                    {selectedRowKeys.length > 0 && (
                        <Space>
                            <span>تم تحديد {selectedRowKeys.length} عنصر</span>
                            <Button
                                icon={<PrinterOutlined />}
                                onClick={() => {
                                    const selectedDevices = devices.filter(d => selectedRowKeys.includes(d.id));
                                    handleBulkPrint();
                                }}
                            >
                                طباعة الملصقات
                            </Button>
                            <Button
                                icon={<UserAddOutlined />}
                                onClick={handleBulkAssign}
                            >
                                تعيين المحدد
                            </Button>
                            <Popconfirm
                                title="هل أنت متأكد من حذف العناصر المحددة؟"
                                onConfirm={() => {
                                    deleteMany(
                                        {
                                            resource: "devices",
                                            ids: selectedRowKeys as string[],
                                        },
                                        {
                                            onSuccess: () => {
                                                message.success("تم الحذف بنجاح");
                                                setSelectedRowKeys([]);
                                            },
                                        }
                                    );
                                }}
                                okText="نعم"
                                cancelText="لا"
                            >
                                <Button danger icon={<DeleteOutlined />} loading={isDeleting}>
                                    حذف المحدد
                                </Button>
                            </Popconfirm>
                        </Space>
                    )}
                </div>
            </div>

            <div style={{
                backgroundColor: "white",
                padding: "0px"
            }}>
                <div id="scrollableDiv" style={{ height: "calc(100vh - 180px)", overflow: "auto" }}>
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
                                title="حالة الفحص"
                                render={(value) => (
                                    <Tag color={getStatusColor(value)}>{getStatusLabel(value)}</Tag>
                                )}
                                filters={[
                                    { text: "تم الاستلام", value: "received" },
                                    { text: "في انتظار الفحص", value: "pending_inspection" },
                                    { text: "في الفحص الخارجي", value: "in_physical_inspection" },
                                    { text: "في الفحص الفني", value: "in_technical_inspection" },
                                ]}
                                onFilter={(value, record: Device) => record.status === value}
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
                                dataIndex="current_location"
                                title="الموقع"
                                responsive={["lg"]}
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
                                responsive={["md"]}
                            />
                            <Table.Column
                                title="الإجراءات"
                                dataIndex="actions"
                                render={(_, record: Device) => (
                                    <Space>
                                        <Tooltip title="طباعة الملصق">
                                            <Button
                                                size="small"
                                                icon={<PrinterOutlined />}
                                                onClick={() => {
                                                    setSelectedRowKeys([record.id]);
                                                    handleBulkPrint();
                                                }}
                                            />
                                        </Tooltip>

                                        {record.model ? (
                                            <Button
                                                size="small"
                                                type="primary"
                                                onClick={() => window.location.href = `/receiving/shipments/inspect/${record.id}`}
                                            >
                                                ابدأ الفحص
                                            </Button>
                                        ) : (
                                            <Space size={4}>
                                                <Tooltip title="إضافة بيانات">
                                                    <Button
                                                        size="small"
                                                        icon={<EditOutlined />}
                                                        onClick={() => window.location.href = `/warehouse/devices/edit/${record.id}`}
                                                    />
                                                </Tooltip>
                                            </Space>
                                        )}
                                    </Space>
                                )}
                            />
                        </Table>
                    </InfiniteScroll>
                </div>
            </div>


            {/* Assignment Modal */}
            <DeviceAssignmentModal
                visible={assignmentModalVisible}
                onCancel={() => setAssignmentModalVisible(false)}
                deviceIds={deviceToAssign}
                onSuccess={handleAssignmentSuccess}
                allowedRoles={["warehouse_staff"]}
            />

            {/* Print Modal */}
            <Modal
                title={`طباعة الملصقات (${selectedRowKeys.length} جهاز)`}
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
                    {devices.filter(d => selectedRowKeys.includes(d.id)).map(device => (
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
        </div >
    );
};
