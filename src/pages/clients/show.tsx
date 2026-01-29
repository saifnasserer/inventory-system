import { useShow, useOne } from "@refinedev/core";
import { Show, NumberField, DateField, TagField } from "@refinedev/antd";
import { Typography, Card, Table, Tag, Row, Col, Statistic, Space, Divider } from "antd";
import { WalletOutlined, ShoppingCartOutlined, UserOutlined } from "@ant-design/icons";
import { Client, Invoice } from "../../types";

const { Title, Text } = Typography;

export const ClientShow: React.FC = () => {
    const { queryResult } = useShow<Client>({
        resource: "clients",
    });
    const { data, isLoading } = queryResult;

    const record = data?.data;

    const invoiceColumns = [
        {
            title: "رقم الفاتورة",
            dataIndex: "invoice_number",
            key: "invoice_number",
            render: (value: string) => <strong>{value}</strong>
        },
        {
            title: "التاريخ",
            dataIndex: "sale_date",
            key: "sale_date",
            render: (value: string) => <DateField value={value} format="YYYY/MM/DD" />
        },
        {
            title: "إجمالي المبلغ",
            dataIndex: "total_amount",
            key: "total_amount",
            render: (value: number) => <NumberField value={value} options={{ style: "currency", currency: "EGP" }} />
        },
        {
            title: "المدفوع",
            dataIndex: "amount_paid",
            key: "amount_paid",
            render: (value: number) => <NumberField value={value} options={{ style: "currency", currency: "EGP" }} />
        },
        {
            title: "الحالة",
            dataIndex: "payment_status",
            key: "payment_status",
            render: (value: string) => {
                const colors = { paid: "green", partial: "orange", pending: "red" };
                const labels = { paid: "تم الدفع", partial: "دفع جزئي", pending: "مستحق" };
                return <Tag color={colors[value as keyof typeof colors]} style={{ borderRadius: 50 }}>{labels[value as keyof typeof labels] || value}</Tag>;
            }
        },
        {
            title: "الجزء المتبقي",
            key: "remaining",
            render: (_: any, record: Invoice) => {
                const remaining = Number(record.total_amount) - Number(record.amount_paid);
                return <Text type={remaining > 0 ? "danger" : "secondary"}>{remaining.toFixed(2)} ج.م</Text>;
            }
        }
    ];

    return (
        <Show isLoading={isLoading} title="ملف العميل">
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Card variant="borderless" style={{ borderRadius: 16 }}>
                        <Row align="middle" gutter={24}>
                            <Col>
                                <div style={{
                                    width: 80, height: 80, borderRadius: '50%',
                                    backgroundColor: '#1890ff', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <UserOutlined style={{ fontSize: 40, color: '#fff' }} />
                                </div>
                            </Col>
                            <Col flex="auto">
                                <Title level={3} style={{ margin: 0 }}>{record?.name}</Title>
                                <Space>
                                    <Text type="secondary">{record?.phone || "لا يوجد رقم هاتف"}</Text>
                                </Space>
                            </Col>
                            <Col>
                                <Card size="small" style={{ borderRadius: 12, backgroundColor: '#fff2f0', borderColor: '#ffccc7' }}>
                                    <Statistic
                                        title="الرصيد المديون"
                                        value={record?.balance}
                                        precision={2}
                                        suffix="ج.م"
                                        valueStyle={{ color: '#cf1322' }}
                                        prefix={<WalletOutlined />}
                                    />
                                </Card>
                            </Col>
                        </Row>
                    </Card>
                </Col>

                <Col span={24}>
                    <Card title="سجل التعاملات (الفواتير)" variant="borderless" style={{ borderRadius: 16 }}>
                        <Table
                            dataSource={record?.invoices}
                            columns={invoiceColumns}
                            rowKey="id"
                            pagination={{ pageSize: 5 }}
                        />
                    </Card>
                </Col>
            </Row>
        </Show>
    );
};
