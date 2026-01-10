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
} from "antd";
import {
    ShoppingOutlined,
    InboxOutlined,
    SearchOutlined,
    UserAddOutlined,
    PrinterOutlined,
} from "@ant-design/icons";
import { Input } from "antd";
import { Device } from "../../types";
import { useState, useRef } from "react";
import { DeviceAssignmentModal } from "./components/DeviceAssignmentModal";
import { useGetIdentity } from "@refinedev/core";
import { DeviceLabel } from "../../components/DeviceLabel";
import { useReactToPrint } from "react-to-print";

export const DeviceList: React.FC = () => {
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [assignmentModalVisible, setAssignmentModalVisible] = useState(false);
    const [deviceToAssign, setDeviceToAssign] = useState<string[]>([]);
    const [printModalOpen, setPrintModalOpen] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    const { data: identity } = useGetIdentity<{ role: string }>();
    const isAdmin = identity?.role && ["admin", "warehouse_manager", "super_admin"].includes(identity.role);

    const { tableProps, setFilters, tableQueryResult } = useTable<Device>({
        resource: "devices",
        syncWithLocation: true,
        pagination: { pageSize: 10 },
        filters: {
            permanent: [
                {
                    field: "status",
                    operator: "in",
                    value: ["ready_for_sale", "in_branch", "sold"],
                },
            ],
        },
    });

    const devices = (tableProps.dataSource || []) as Device[];

    const readyForSaleCount = devices.filter((d) => d.status === "ready_for_sale").length;
    const inBranchCount = devices.filter((d) => d.status === "in_branch").length;

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            ready_for_sale: "green",
            in_branch: "geekblue",
            sold: "success",
        };
        return colors[status] || "default";
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            ready_for_sale: "جاهز للبيع",
            in_branch: "في الفرع",
            sold: "تم البيع",
        };
        return labels[status] || status;
    };

    const handleAssignDevice = (deviceId: string) => {
        setDeviceToAssign([deviceId]);
        setAssignmentModalVisible(true);
    };

    const handleBulkAssign = () => {
        setDeviceToAssign(selectedRowKeys as string[]);
        setAssignmentModalVisible(true);
    };

    const handleAssignmentSuccess = () => {
        setSelectedRowKeys([]);
        tableQueryResult?.refetch();
    };

    const handleBulkPrint = () => {
        setPrintModalOpen(true);
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
        <div style={{ padding: "24px" }}>
            {/* Quick Stats */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={8}>
                    <Card hoverable>
                        <Statistic
                            title="جاهز للبيع"
                            value={readyForSaleCount}
                            prefix={<ShoppingOutlined />}
                            valueStyle={{ color: "#52c41a" }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                    <Card hoverable>
                        <Statistic
                            title="في الفرع"
                            value={inBranchCount}
                            prefix={<InboxOutlined />}
                            valueStyle={{ color: "#1890ff" }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                    <Card hoverable>
                        <Statistic
                            title="إجمالي المخزون"
                            value={devices.length}
                            prefix={<InboxOutlined />}
                            valueStyle={{ color: "#722ed1" }}
                        />
                    </Card>
                </Col>
            </Row>

            <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <Input.Search
                    placeholder="بحث برقم الأصل..."
                    allowClear
                    onSearch={(value) => setFilters([{ field: "asset_id", operator: "contains", value: value }], "merge")}
                    style={{ maxWidth: 300 }}
                />
                {isAdmin && selectedRowKeys.length > 0 && (
                    <Space>
                        <Button
                            icon={<PrinterOutlined />}
                            onClick={handleBulkPrint}
                        >
                            طباعة الملصقات ({selectedRowKeys.length})
                        </Button>
                        <Button
                            type="primary"
                            icon={<UserAddOutlined />}
                            onClick={handleBulkAssign}
                        >
                            تعيين ({selectedRowKeys.length})
                        </Button>
                    </Space>
                )}
            </div>

            <List title="المخزون - الأجهزة الجاهزة" breadcrumb={false}>
                <Table
                    {...tableProps}
                    rowKey="id"
                    rowSelection={rowSelection}
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
                        dataIndex="serial_number"
                        title="الرقم التسلسلي"
                        responsive={["lg"]}
                    />
                    <Table.Column
                        dataIndex="status"
                        title="الحالة"
                        render={(value) => (
                            <Tag color={getStatusColor(value)}>{getStatusLabel(value)}</Tag>
                        )}
                        filters={[
                            { text: "جاهز للبيع", value: "ready_for_sale" },
                            { text: "في الفرع", value: "in_branch" },
                            { text: "تم البيع", value: "sold" },
                        ]}
                        onFilter={(value, record: Device) => record.status === value}
                    />
                    <Table.Column
                        dataIndex="current_location"
                        title="الموقع"
                        responsive={["md"]}
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
                        fixed="left"
                        render={(_, record: Device) => (
                            <Space>
                                {isAdmin && (
                                    <Button
                                        type="link"
                                        size="small"
                                        icon={<UserAddOutlined />}
                                        onClick={() => handleAssignDevice(record.id)}
                                    >
                                        تعيين
                                    </Button>
                                )}
                                <ShowButton hideText size="small" recordItemId={record.id} resource="devices" />
                                <EditButton hideText size="small" recordItemId={record.id} resource="devices" />
                            </Space>
                        )}
                    />
                </Table>
            </List>

            {/* Assignment Modal */}
            <DeviceAssignmentModal
                visible={assignmentModalVisible}
                onCancel={() => setAssignmentModalVisible(false)}
                deviceIds={deviceToAssign}
                onSuccess={handleAssignmentSuccess}
            />

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
        </div>
    );
};
