import { useDeleteMany } from "@refinedev/core";
import { List, useTable, ShowButton } from "@refinedev/antd";
import { Table, Space, Tag, Card, Row, Col, Statistic, Button, Dropdown, Menu, message, Popconfirm, Tooltip, Typography, Input } from "antd";
import { SearchOutlined, ClockCircleOutlined, CheckCircleOutlined, PrinterOutlined, EditOutlined, DeleteOutlined, DownOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { Device } from "../../types";
import { useState, useRef, useEffect } from "react";
import { useReactToPrint } from "react-to-print";
import { AssetIdPrint } from "../../components/DeviceLabel/AssetIdPrint";

export const ShipmentList: React.FC = () => {
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const { mutate: deleteMany, isLoading: isDeleting } = useDeleteMany();

    // Print state
    const [printData, setPrintData] = useState<string[]>([]);
    const [isPrinting, setIsPrinting] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        onAfterPrint: () => {
            setIsPrinting(false);
            setPrintData([]);
        },
    } as any);

    useEffect(() => {
        if (isPrinting && printData.length > 0 && printRef.current) {
            handlePrint();
        }
    }, [isPrinting, printData, handlePrint]);

    const triggerPrint = (ids: string[]) => {
        setPrintData(ids);
        setIsPrinting(true);
    };

    const { tableProps, setFilters } = useTable<Device>({
        resource: "devices",
        syncWithLocation: true,
        pagination: {
            pageSize: 10,
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
    });

    const devices = (tableProps.dataSource || []) as Device[];

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

    return (
        <div style={{ padding: "24px" }}>
            <AssetIdPrint ref={printRef} assetIds={printData} />

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
                    <Typography.Title level={4} style={{ margin: 0 }}>الأجهزة قيد الفحص</Typography.Title>
                    <Typography.Text type="secondary">إدارة وفحص الشحنات الواردة</Typography.Text>
                </div>
                <Button
                    type="primary"
                    size="large"
                    icon={<PlusCircleOutlined />}
                    onClick={() => window.location.href = "/receiving/shipments/create"}
                    style={{
                        height: "48px",
                        padding: "0 32px",
                        fontSize: "16px",
                        borderRadius: "8px",
                        background: "linear-gradient(90deg, #1890ff 0%, #096dd9 100%)",
                        boxShadow: "0 4px 14px rgba(24, 144, 255, 0.3)",
                        border: "none"
                    }}
                >
                    إضافة شحنة جديدة
                </Button>
            </div>

            <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "16px", alignItems: "center", flex: 1 }}>
                    <Input.Search
                        placeholder="بحث برقم الأصل (Asset ID)..."
                        allowClear
                        onSearch={(value) => {
                            setFilters([
                                {
                                    field: "asset_id",
                                    operator: "contains",
                                    value: value,
                                },
                            ], "merge");
                        }}
                        style={{ maxWidth: 300, borderRadius: "8px" }}
                    />
                </div>
                <div style={{ fontSize: "16px", fontWeight: 500 }}>
                    {selectedRowKeys.length > 0 && (
                        <Space>
                            <span>تم تحديد {selectedRowKeys.length} عنصر</span>
                            <Button
                                icon={<PrinterOutlined />}
                                onClick={() => {
                                    const selectedDevices = devices.filter(d => selectedRowKeys.includes(d.id));
                                    const assetIds = selectedDevices.map(d => d.asset_id);
                                    triggerPrint(assetIds);
                                }}
                            >
                                طباعة الملصقات
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

            <Table
                {...tableProps}
                rowKey="id"
                pagination={{
                    ...tableProps.pagination,
                    showSizeChanger: true,
                    position: ["bottomCenter"],
                }}
                rowSelection={{
                    selectedRowKeys,
                    onChange: (keys) => setSelectedRowKeys(keys),
                }}
                style={{
                    backgroundColor: "white",
                    borderRadius: "12px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    padding: "16px"
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
                    fixed="left"
                    render={(_, record: Device) => (
                        <Space>
                            <Tooltip title="طباعة الملصق">
                                <Button
                                    size="small"
                                    icon={<PrinterOutlined />}
                                    onClick={() => triggerPrint([record.asset_id])}
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
        </div >
    );
};
