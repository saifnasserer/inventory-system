import React from "react";
import { Show, NumberField, DateField, TextField } from "@refinedev/antd";
import { Typography, Card, Row, Col, Divider, Table, Tag, Space, Button } from "antd";
import {
    FileTextOutlined,
    UserOutlined,
    PhoneOutlined,
    EnvironmentOutlined,
    CalendarOutlined,
    DollarOutlined,
    LaptopOutlined,
    PrinterOutlined
} from "@ant-design/icons";
import { useShow } from "@refinedev/core";
import { Invoice } from "../../types";

const { Title, Text } = Typography;

export const InvoiceShow: React.FC = () => {
    const { queryResult } = useShow<Invoice>({
        meta: {
            select: "*,clients(*),invoice_items(id,item_name,serial_number,asset_id,quantity,unit_price,total_price)"
        }
    });

    const { data, isLoading } = queryResult;
    const record = data?.data;

    const getStatusColor = (status: string) => {
        switch (status) {
            case "paid": return "success";
            case "partial": return "warning";
            case "pending": return "error";
            default: return "default";
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "paid": return "مدفوع بالكامل";
            case "partial": return "دفع جزئي";
            case "pending": return "آجل / لم يسدد";
            default: return status;
        }
    };

    const columns = [
        {
            title: "الصنف",
            key: "item",
            render: (_: any, item: any) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{item.item_name}</Text>
                    {(item.serial_number || item.asset_id) && (
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            {item.serial_number && `S/N: ${item.serial_number}`}
                            {item.serial_number && item.asset_id && " | "}
                            {item.asset_id && `Asset: ${item.asset_id}`}
                        </Text>
                    )}
                </Space>
            )
        },
        {
            title: "الكمية",
            dataIndex: "quantity",
            key: "quantity",
            align: "center" as const,
        },
        {
            title: "سعر الوحدة",
            dataIndex: "unit_price",
            key: "unit_price",
            render: (value: number) => <NumberField value={value} options={{ style: "currency", currency: "EGP" }} />
        },
        {
            title: "الإجمالي",
            dataIndex: "total_price",
            key: "total_price",
            render: (value: number) => <Text strong><NumberField value={value} options={{ style: "currency", currency: "EGP" }} /></Text>
        }
    ];

    return (
        <Show
            isLoading={isLoading}
            title={record ? `تفاصيل الفاتورة: ${record.invoice_number}` : "جاري التحميل..."}
            headerButtons={({ defaultButtons }) => (
                <>
                    <Button icon={<PrinterOutlined />} onClick={() => window.print()}>طباعة</Button>
                    {defaultButtons}
                </>
            )}
        >
            <div className="printable-invoice" style={{ padding: "0 12px" }}>
                <Row gutter={[24, 24]}>
                    <Col xs={24} md={16}>
                        {/* Header Info */}
                        <Card variant="borderless" style={{ borderRadius: 16, marginBottom: 24, backgroundColor: '#fafafa' }}>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Space direction="vertical" size={4}>
                                        <Text type="secondary">الحالة</Text>
                                        <Tag color={getStatusColor(record?.payment_status || "")} style={{ borderRadius: 12, padding: '4px 16px', fontSize: 14 }}>
                                            {getStatusLabel(record?.payment_status || "")}
                                        </Tag>
                                    </Space>
                                </Col>
                                <Col span={12} style={{ textAlign: 'left' }}>
                                    <Space direction="vertical" size={4}>
                                        <Text type="secondary">تاريخ الفاتورة</Text>
                                        <Title level={4} style={{ margin: 0 }}>
                                            <CalendarOutlined style={{ color: '#1890ff', marginLeft: 8 }} />
                                            {record?.sale_date ? new Date(record.sale_date).toLocaleDateString('ar-EG') : "-"}
                                        </Title>
                                    </Space>
                                </Col>
                            </Row>
                        </Card>

                        {/* Customer & Items */}
                        <Card
                            title={<Space><UserOutlined /> بيانات العميل</Space>}
                            variant="borderless"
                            style={{ borderRadius: 16, marginBottom: 24 }}
                        >
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Space direction="vertical">
                                        <Text type="secondary">الاسم الكامل</Text>
                                        <Text strong style={{ fontSize: 16 }}>{record?.customer_name || record?.clients?.name || "عميل نقدي"}</Text>
                                    </Space>
                                </Col>
                                <Col span={12}>
                                    <Space direction="vertical">
                                        <Text type="secondary">رقم الهاتف</Text>
                                        <Text strong style={{ fontSize: 16 }}>{record?.customer_contact || record?.clients?.phone || "-"}</Text>
                                    </Space>
                                </Col>
                            </Row>
                        </Card>

                        <Card
                            title={<Space><LaptopOutlined /> الأصناف المباعة</Space>}
                            variant="borderless"
                            style={{ borderRadius: 16 }}
                            bodyStyle={{ padding: 0 }}
                        >
                            <Table
                                columns={columns}
                                dataSource={record?.invoice_items}
                                pagination={false}
                                rowKey="id"
                                style={{ borderRadius: 16, overflow: 'hidden' }}
                            />
                        </Card>
                    </Col>

                    <Col xs={24} md={8}>
                        {/* Financial Summary */}
                        <Card
                            title={<Space><DollarOutlined /> الملخص المالي</Space>}
                            variant="borderless"
                            style={{ borderRadius: 16, height: '100%' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                <Text type="secondary">الإجمالي قبل الضريبة</Text>
                                <NumberField value={record?.sale_price || 0} options={{ style: "currency", currency: "EGP" }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                <Text type="secondary">الضريبة</Text>
                                <NumberField value={record?.tax_amount || 0} options={{ style: "currency", currency: "EGP" }} />
                            </div>
                            <Divider dashed style={{ margin: '12px 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                                <Title level={4} style={{ margin: 0 }}>الإجمالي الكلي</Title>
                                <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                                    <NumberField value={record?.total_amount || 0} options={{ style: "currency", currency: "EGP" }} />
                                </Title>
                            </div>

                            <div style={{ backgroundColor: '#f6ffed', padding: 16, borderRadius: 12, marginBottom: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text type="secondary">المبلغ المدفوع</Text>
                                    <Text strong style={{ color: '#52c41a' }}>
                                        <NumberField value={record?.amount_paid || 0} options={{ style: "currency", currency: "EGP" }} />
                                    </Text>
                                </div>
                            </div>

                            {record?.total_amount && record?.amount_paid && record.total_amount > record.amount_paid && (
                                <div style={{ backgroundColor: '#fff2f0', padding: 16, borderRadius: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Text type="secondary">المبلغ المتبقي</Text>
                                        <Text strong style={{ color: '#ff4d4f' }}>
                                            <NumberField value={Number(record.total_amount) - Number(record.amount_paid)} options={{ style: "currency", currency: "EGP" }} />
                                        </Text>
                                    </div>
                                </div>
                            )}

                            {record?.notes && (
                                <>
                                    <Divider dashed />
                                    <Text type="secondary">ملاحظات:</Text>
                                    <div style={{ marginTop: 8, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
                                        {record.notes}
                                    </div>
                                </>
                            )}
                        </Card>
                    </Col>
                </Row>
            </div>
            <style>{`
                @media print {
                    .ant-layout-header, .ant-layout-sider, .ant-page-header-heading-extra, .ant-breadcrumb {
                        display: none !important;
                    }
                    .ant-layout-content {
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .printable-invoice {
                        padding: 0 !important;
                    }
                    .ant-card {
                        border: 1px solid #f0f0f0 !important;
                    }
                }
            `}</style>
        </Show>
    );
};
