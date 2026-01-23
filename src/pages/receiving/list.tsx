import { useDeleteMany } from "@refinedev/core";
import { useTable } from "@refinedev/antd";
import { Table, Space, Tag, Typography, Input, Spin, Button, Popconfirm, message, Tooltip, Modal } from "antd";
import { SearchOutlined, PrinterOutlined, DeleteOutlined, PlusCircleOutlined, EditOutlined, UserAddOutlined } from "@ant-design/icons";
import { Device, Shipment, User } from "../../types";
import { useState, useRef, useEffect } from "react";
import { useReactToPrint } from "react-to-print";
import { DeviceLabel } from "../../components/DeviceLabel";
import InfiniteScroll from "react-infinite-scroll-component";
import { DeviceAssignmentModal } from "../warehouse/components/DeviceAssignmentModal";

export const ShipmentList: React.FC = () => {
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const { mutate: deleteMany, isLoading: isDeleting } = useDeleteMany();

    // Assignment State
    const [assignmentModalVisible, setAssignmentModalVisible] = useState(false);
    const [deviceToAssign, setDeviceToAssign] = useState<string[]>([]);

    // Search state
    const [searchText, setSearchText] = useState("");

    // Print state
    const [printModalOpen, setPrintModalOpen] = useState(false);
    const [devicesToPrint, setDevicesToPrint] = useState<Device[]>([]);
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Labels-Shipment-${new Date().toISOString().split('T')[0]}`,
    });

    const { tableProps, setFilters, tableQueryResult, current, setCurrent } = useTable<Shipment>({
        resource: "shipments",
        syncWithLocation: true,
        pagination: {
            pageSize: 20,
        },
        queryOptions: {
            onSuccess: (data) => {
                if (current === 1) {
                    setAllShipments((data.data as Shipment[]) || []);
                } else {
                    setAllShipments((prev) => [...prev, ...((data.data as Shipment[]) || [])]);
                }
            }
        }
    });

    // Debounced Search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchText) {
                setFilters([
                    {
                        operator: "or",
                        value: [
                            {
                                field: "shipment_name",
                                operator: "contains",
                                value: searchText,
                            },
                            {
                                field: "shipment_code",
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

    const [allShipments, setAllShipments] = useState<Shipment[]>([]);
    const total = tableQueryResult?.data?.total || 0;
    const hasMore = allShipments.length < total;

    const loadMoreData = () => {
        if (!tableQueryResult?.isFetching) {
            setCurrent(current + 1);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            received: "purple",
            diagnosed: "geekblue",
            pending_inspection: "orange",
            in_physical_inspection: "cyan",
            in_technical_inspection: "blue",
            ready_for_sale: "green",
            needs_repair: "red",
        };
        return colors[status] || "default";
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            received: "تم الاستلام",
            diagnosed: "جاهز للمراجعة",
            pending_inspection: "في انتظار الفحص",
            in_physical_inspection: "في الفحص الخارجي",
            in_technical_inspection: "في الفحص الفني",
            ready_for_sale: "جاهز للبيع",
            needs_repair: "يحتاج صيانة",
        };
        return labels[status] || status;
    };

    const handleAssignDevice = (deviceId: string) => {
        setDeviceToAssign([deviceId]);
        setAssignmentModalVisible(true);
    };

    const handleAssignmentSuccess = () => {
        setCurrent(1);
        tableQueryResult?.refetch();
    };

    const expandedRowRender = (shipment: Shipment) => {
        const devices = shipment.devices || [];
        return (
            <Table
                dataSource={devices}
                pagination={false}
                rowKey="id"
                size="small"
                columns={[
                    {
                        title: "رقم الأصل",
                        dataIndex: "asset_id",
                        key: "asset_id",
                        render: (text) => <strong>{text}</strong>,
                    },
                    {
                        title: "الموديل",
                        dataIndex: "model",
                        key: "model",
                        render: (text) => text || "-",
                    },
                    {
                        title: "السيريال",
                        dataIndex: "serial_number",
                        key: "serial_number",
                        render: (text) => text || "-",
                    },
                    {
                        title: "الحالة",
                        dataIndex: "status",
                        key: "status",
                        render: (status) => (
                            <Tag color={getStatusColor(status)}>{getStatusLabel(status)}</Tag>
                        ),
                    },
                    {
                        title: "الإجراءات",
                        key: "actions",
                        render: (_, record: Device) => (
                            <Space>
                                <Tooltip title="طباعة الملصق">
                                    <Button
                                        size="small"
                                        icon={<PrinterOutlined />}
                                        onClick={() => {
                                            setDevicesToPrint([record]);
                                            setPrintModalOpen(true);
                                        }}
                                    />
                                </Tooltip>
                                <Tooltip title="تعيين موظف">
                                    <Button
                                        size="small"
                                        icon={<UserAddOutlined />}
                                        onClick={() => handleAssignDevice(record.id)}
                                    />
                                </Tooltip>
                                {record.status === "diagnosed" ? (
                                    <Button
                                        size="small"
                                        type="primary"
                                        style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
                                        onClick={() => window.location.href = `/receiving/shipments/review/${record.id}`}
                                    >
                                        مراجعة التقرير
                                    </Button>
                                ) : (
                                    <Button
                                        size="small"
                                        type="primary"
                                        onClick={() => window.location.href = `/receiving/shipments/inspect/${record.id}`}
                                    >
                                        فحص
                                    </Button>
                                )}
                                <Button
                                    size="small"
                                    icon={<EditOutlined />}
                                    onClick={() => window.location.href = `/warehouse/devices/edit/${record.id}`}
                                />
                            </Space>
                        ),
                    },
                ]}
            />
        );
    };

    return (
        <div style={{ padding: "0px" }}>
            {/* Header */}
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
                    <Typography.Title level={4} style={{ margin: 0 }}>إدارة الشحنات</Typography.Title>
                </div>
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                    <Input
                        placeholder="بحث عن شحنة (الاسم، الكود)..."
                        allowClear
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        prefix={<SearchOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
                        style={{ width: 300, borderRadius: "50px" }}
                    />
                    <Button
                        type="primary"
                        icon={<PlusCircleOutlined />}
                        onClick={() => window.location.href = "/receiving/shipments/create"}
                        style={{ borderRadius: "50px" }}
                    >
                        إضافة شحنة
                    </Button>
                </div>
            </div>

            <div style={{ backgroundColor: "white", padding: "0px" }}>
                <div id="scrollableDiv" style={{ height: "calc(100vh - 120px)", overflow: "auto" }}>
                    <InfiniteScroll
                        dataLength={allShipments.length}
                        next={loadMoreData}
                        hasMore={hasMore}
                        loader={<div style={{ textAlign: "center", padding: 10 }}><Spin /></div>}
                        scrollableTarget="scrollableDiv"
                    >
                        <Table
                            {...tableProps}
                            dataSource={allShipments}
                            pagination={false}
                            rowKey="id"
                            expandable={{
                                expandedRowRender,
                                defaultExpandAllRows: false,
                            }}
                        >
                            <Table.Column
                                title="اسم الشحنة"
                                dataIndex="shipment_name"
                                render={(value, record: Shipment) => (
                                    <Space direction="vertical" size={0}>
                                        <Typography.Text strong>{value || "بدون اسم"}</Typography.Text>
                                        <Typography.Text type="secondary" style={{ fontSize: "12px" }}>
                                            {record.shipment_code}
                                        </Typography.Text>
                                    </Space>
                                )}
                            />
                            <Table.Column
                                title="المورد"
                                dataIndex="vendors"
                                render={(vendors) => vendors?.name || "بدون مورد"}
                            />
                            <Table.Column
                                title="عدد الأجهزة"
                                dataIndex="device_count"
                                align="center"
                                render={(count, record: Shipment) => (
                                    <Tag color="blue">{record.devices?.length || 0} / {count}</Tag>
                                )}
                            />
                            <Table.Column
                                title="تاريخ التوصيل"
                                dataIndex="delivery_date"
                                render={(value) => value ? new Date(value).toLocaleDateString("ar-EG") : "-"}
                            />
                            <Table.Column
                                title="تاريخ الإضافة"
                                dataIndex="created_at"
                                render={(value) => value ? new Date(value).toLocaleDateString("ar-EG") : "-"}
                            />
                            <Table.Column
                                title="الإجراءات"
                                key="actions"
                                render={(_, record: Shipment) => (
                                    <Space>
                                        <Tooltip title="طباعة كل ملصقات الشحنة">
                                            <Button
                                                size="small"
                                                icon={<PrinterOutlined />}
                                                onClick={() => {
                                                    setDevicesToPrint(record.devices || []);
                                                    setPrintModalOpen(true);
                                                }}
                                            />
                                        </Tooltip>
                                        <Popconfirm
                                            title="هل أنت متأكد من حذف هذه الشحنة؟"
                                            onConfirm={() => {
                                                deleteMany({
                                                    resource: "shipments",
                                                    ids: [record.id],
                                                }, {
                                                    onSuccess: () => {
                                                        message.success("تم حذف الشحنة بنجاح");
                                                        setCurrent(1);
                                                    }
                                                });
                                            }}
                                        >
                                            <Button size="small" danger icon={<DeleteOutlined />} loading={isDeleting} />
                                        </Popconfirm>
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
                title={`طباعة الملصقات (${devicesToPrint.length} جهاز)`}
                open={printModalOpen}
                onCancel={() => setPrintModalOpen(false)}
                footer={[
                    <Button key="cancel" onClick={() => setPrintModalOpen(false)}>إلغاء</Button>,
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
                    {devicesToPrint.map(device => (
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
        </div>
    );
};
