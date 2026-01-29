import React from "react";
import { List, useTable, DateField, TagField, NumberField } from "@refinedev/antd";
import { Table, Space, Tag, Typography, Button, Tooltip, Card } from "antd";
import {
    FileTextOutlined,
    EyeOutlined,
    PhoneOutlined,
    UserOutlined,
    DollarOutlined,
    CalendarOutlined
} from "@ant-design/icons";
import { Invoice } from "../../types";
import { useNavigate } from "react-router-dom";

const { Text, Title } = Typography;

export const InvoiceList: React.FC = () => {
    const navigate = useNavigate();
    const { tableProps } = useTable<Invoice>({
        resource: "invoices",
        initialSorter: [
            {
                field: "created_at",
                order: "desc",
            },
        ],
        meta: {
            select: "*,clients(*),invoice_items(*)"
        }
    });

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
            case "paid": return "مدفوع";
            case "partial": return "دفع جزئي";
            case "pending": return "آجل / مستحق";
            default: return status;
        }
    };

    return (
        <div style={{ padding: "24px" }}>
            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: '#e6f7ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1890ff',
                    fontSize: 24
                }}>
                    <FileTextOutlined />
                </div>
                <div>
                    <Title level={3} style={{ margin: 0 }}>سجل الفواتير</Title>
                    <Text type="secondary">عرض وإدارة جميع فواتير المبيعات</Text>
                </div>
            </div>

            <List title=" " wrapperProps={{ style: { padding: 0 } }}>
                <Card variant="borderless" style={{ borderRadius: 16 }}>
                    <Table {...tableProps} rowKey="id" pagination={{ ...tableProps.pagination, showSizeChanger: true }}>
                        <Table.Column
                            dataIndex="invoice_number"
                            title="رقم الفاتورة"
                            render={(value) => <Text strong style={{ color: '#1890ff' }}>{value}</Text>}
                        />
                        <Table.Column
                            title="العميل"
                            render={(_, record: Invoice) => (
                                <Space direction="vertical" size={0}>
                                    <Text strong><UserOutlined style={{ color: '#8c8c8c' }} /> {record.customer_name || record.clients?.name || "عميل نقدي"}</Text>
                                    <Text type="secondary"><PhoneOutlined style={{ color: '#bfbfbf' }} /> {record.customer_contact || record.clients?.phone || "-"}</Text>
                                </Space>
                            )}
                        />
                        <Table.Column
                            dataIndex="total_amount"
                            title="الإجمالي"
                            render={(value) => (
                                <Text strong style={{ color: '#52c41a' }}>
                                    <NumberField value={value} options={{ style: "currency", currency: "EGP" }} />
                                </Text>
                            )}
                            sorter
                        />
                        <Table.Column
                            dataIndex="amount_paid"
                            title="المدفوع"
                            render={(value) => <NumberField value={value} options={{ style: "currency", currency: "EGP" }} />}
                        />
                        <Table.Column
                            dataIndex="payment_status"
                            title="حالة السداد"
                            render={(value: string) => (
                                <Tag color={getStatusColor(value)} style={{ borderRadius: 12, padding: '0 12px' }}>
                                    {getStatusLabel(value)}
                                </Tag>
                            )}
                            filters={[
                                { text: "مدفوع", value: "paid" },
                                { text: "دفع جزئي", value: "partial" },
                                { text: "آجل", value: "pending" },
                            ]}
                        />
                        <Table.Column
                            dataIndex="sale_date"
                            title="تاريخ البيع"
                            render={(value) => (
                                <Space>
                                    <CalendarOutlined style={{ color: '#8c8c8c' }} />
                                    <DateField value={value} format="YYYY-MM-DD" />
                                </Space>
                            )}
                            sorter
                        />
                        <Table.Column
                            title="الأصناف"
                            render={(_, record: Invoice) => (
                                <Tooltip title={record.invoice_items?.map(i => i.item_name).join(", ")}>
                                    <Text ellipsis style={{ maxWidth: 150 }}>
                                        {record.invoice_items?.[0]?.item_name || "-"}
                                        {record.invoice_items && record.invoice_items.length > 1 ? ` (+${record.invoice_items.length - 1})` : ""}
                                    </Text>
                                </Tooltip>
                            )}
                        />
                        <Table.Column
                            title="إجراءات"
                            dataIndex="actions"
                            render={(_, record: Invoice) => (
                                <Space size="middle">
                                    <Tooltip title="عرض التفاصيل">
                                        <Button
                                            size="small"
                                            icon={<EyeOutlined />}
                                            onClick={() => navigate(`/invoices/show/${record.id}`)}
                                            style={{ borderRadius: 8 }}
                                        />
                                    </Tooltip>
                                </Space>
                            )}
                        />
                    </Table>
                </Card>
            </List>
        </div>
    );
};
