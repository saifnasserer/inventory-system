import React from "react";
import { useShow, useNavigation } from "@refinedev/core";
import { Show, List, useTable, DeleteButton } from "@refinedev/antd";
import { Typography, Card, Descriptions, Table, Tag, Space, Badge, Button } from "antd";
import { CalendarOutlined, ContainerOutlined, InfoCircleOutlined, ShopOutlined, EyeOutlined, AuditOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useParams, useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

export const ShipmentShow: React.FC = () => {
    const { show } = useNavigation();
    const navigate = useNavigate();
    const { queryResult } = useShow({
        resource: "shipments",
    });
    const { data: shipmentData, isLoading: shipmentLoading } = queryResult;
    const record = shipmentData?.data;

    // Fetch devices for this shipment
    // We assume the devices resource has a filter for shipment_id or we filter manually if needed.
    // Ideally the backend supports ?shipment_id=X
    const { tableProps: deviceTableProps } = useTable({
        resource: "devices",
        filters: {
            permanent: [
                {
                    field: "shipment_id",
                    operator: "eq",
                    value: record?.id,
                },
            ],
        },
        queryOptions: {
            enabled: !!record?.id,
        },
        syncWithLocation: false, // Don't sync device filters to URL to keep it clean
    });

    return (
        <Show
            isLoading={shipmentLoading}
            title="تفاصيل الشحنة"
            breadcrumb={<></>}
            headerButtons={({ defaultButtons }) => (
                <>
                    {defaultButtons}
                    <DeleteButton
                        recordItemId={record?.id}
                        type="primary"
                        danger
                        confirmTitle="هل أنت متأكد من حذف هذه الشحنة؟"
                        confirmOkText="نعم، احذف"
                        confirmCancelText="إلغاء"
                    />
                </>
            )}
        >
            {/* Shipment Header Info */}
            <Card
                bordered={false}
                style={{
                    marginBottom: 16,
                    background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
                    borderRadius: 12,
                    color: "white"
                }}
                bodyStyle={{ padding: "16px 24px" }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Space size={12}>
                        <ContainerOutlined style={{ fontSize: 20, color: "rgba(255,255,255,0.8)" }} />
                        <Title level={4} style={{ color: "white", margin: 0 }}>
                            {record?.shipment_name}
                        </Title>
                    </Space>
                    <Tag color="cyan" style={{ border: "none", borderRadius: 8 }}>
                        {record?.status || "مكتملة"}
                    </Tag>
                </div>

                <Descriptions
                    size="small"
                    column={{ xs: 1, sm: 2, md: 4 }}
                    style={{ marginTop: 12 }}
                    contentStyle={{ color: "white", fontWeight: "bold" }}
                    labelStyle={{ color: "rgba(255,255,255,0.7)" }}
                >
                    <Descriptions.Item label="تاريخ الوصول">
                        <Space size={4}>
                            <CalendarOutlined style={{ fontSize: 12 }} />
                            {record?.delivery_date ? dayjs(record.delivery_date).format("YYYY-MM-DD") : "-"}
                        </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="المورد">
                        <Space size={4}>
                            <ShopOutlined style={{ fontSize: 12 }} />
                            {record?.vendor?.name || "غير محدد"}
                        </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="عدد الأجهزة">
                        <Badge count={record?.device_count} showZero color="white" style={{ color: "#1890ff" }} />
                    </Descriptions.Item>
                    {record?.notes && (
                        <Descriptions.Item label="ملاحظات">
                            <Text ellipsis={{ tooltip: true }} style={{ color: "white", maxWidth: 150 }}>
                                {record.notes}
                            </Text>
                        </Descriptions.Item>
                    )}
                </Descriptions>
            </Card>

            {/* Devices List */}
            <List
                title={
                    <Space size={8}>
                        <Title level={5} style={{ margin: 0 }}>الأجهزة في هذه الشحنة</Title>
                        <Tag color="blue" style={{ borderRadius: 6 }}>{deviceTableProps?.dataSource?.length || 0} جهاز</Tag>
                    </Space>
                }
                resource="devices"
                breadcrumb={false} // Hide breadcrumb in inner list
                headerProps={{
                    extra: <></> // Hide create button here as we are just viewing
                }}
            >
                <Table {...deviceTableProps} rowKey="id" size="middle">
                    <Table.Column
                        dataIndex="asset_id"
                        title="رقم الأصل (Asset ID)"
                        render={(val) => <Text strong copyable>{val}</Text>}
                    />
                    <Table.Column
                        dataIndex="serial_number"
                        title="الرقم التسلسلي"
                        render={(val) => val ? <Text copyable>{val}</Text> : null}
                    />
                    <Table.Column
                        dataIndex="model"
                        title="الموديل / النوع"
                    />
                    <Table.Column
                        dataIndex="status"
                        title="الحالة"
                        render={(val) => {
                            const statusMap: Record<string, { label: string, color: string }> = {
                                received: { label: "تم الاستلام", color: "blue" },
                                diagnosed: { label: "في انتظار المراجعة", color: "cyan" },
                                ready_for_sale: { label: "في المخزن", color: "green" },
                                needs_repair: { label: "في الصيانة", color: "warning" },
                                in_repair: { label: "في الصيانة", color: "orange" },
                                in_branch: { label: "في المبيعات", color: "geekblue" },
                                sold: { label: "تم البيع", color: "purple" },
                                scrap: { label: "خردة", color: "volcano" }
                            };
                            const status = statusMap[val] || { label: val, color: "default" };
                            return (
                                <Tag color={status.color} style={{ borderRadius: 6, border: 'none' }}>
                                    {status.label}
                                </Tag>
                            );
                        }}
                    />
                    <Table.Column
                        title="الإجراءات"
                        render={(_, record: any) => (
                            <Space>
                                {record.status === "diagnosed" ? (
                                    <Button
                                        size="small"
                                        type="primary"
                                        icon={<AuditOutlined />}
                                        onClick={() => navigate(`/receiving/shipments/review/${record.id}`)}
                                    >
                                        مراجعة التقرير
                                    </Button>
                                ) : record.status === "received" && !record.latest_report_id ? (
                                    <Button
                                        size="small"
                                        type="primary"
                                        icon={<AuditOutlined />}
                                        onClick={() => navigate(`/receiving/devices/show/${record.id}`)}
                                        style={{ backgroundColor: '#faad14', borderColor: '#faad14' }}
                                    >
                                        فحص يدوي
                                    </Button>
                                ) : (
                                    <Button
                                        size="small"
                                        icon={<EyeOutlined />}
                                        onClick={() => show("devices", record.id)}
                                    >
                                        عرض التفاصيل
                                    </Button>
                                )}
                            </Space>
                        )}
                    />
                </Table>
            </List>
        </Show >
    );
};
