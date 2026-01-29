import { List, useTable, ShowButton, EditButton, CreateButton } from "@refinedev/antd";
import { Table, Tag, Card, Statistic, Row, Col, Space } from "antd";
import { UserOutlined, WalletOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { Client } from "../../types";

export const ClientList: React.FC = () => {
    const { tableProps } = useTable<Client>({
        resource: "clients",
        syncWithLocation: true,
    });

    const totalBalance = tableProps.dataSource?.reduce((acc, curr) => acc + Number(curr.balance), 0) || 0;

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
                borderRadius: "16px 16px 0 0"
            }}>
                <h2 style={{ fontSize: "20px", fontWeight: 600, margin: 0 }}>إدارة العملاء</h2>
                <CreateButton size="large" style={{ borderRadius: 8 }}>إضافة عميل جديد</CreateButton>
            </div>

            <div style={{ padding: "0 24px" }}>
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={12} md={8}>
                        <Card variant="borderless" style={{ borderRadius: 16 }}>
                            <Statistic
                                title="إجمالي العملاء"
                                value={(tableProps?.pagination as any)?.total || 0}
                                prefix={<UserOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Card variant="borderless" style={{ borderRadius: 16 }}>
                            <Statistic
                                title="إجمالي المبالغ الآجلة"
                                value={totalBalance}
                                prefix={<WalletOutlined />}
                                precision={2}
                                valueStyle={{ color: totalBalance > 0 ? '#cf1322' : '#3f8600' }}
                                suffix="ج.م"
                            />
                        </Card>
                    </Col>
                </Row>

                <List title="" wrapperProps={{ style: { padding: 0 } }}>
                    <Table {...tableProps} rowKey="id" pagination={{ ...tableProps.pagination, pageSize: 10 }}>
                        <Table.Column
                            dataIndex="name"
                            title="اسم العميل"
                            render={(value) => <strong>{value}</strong>}
                            sorter
                        />
                        <Table.Column dataIndex="phone" title="رقم الهاتف" />
                        <Table.Column
                            dataIndex="balance"
                            title="الرصيد المتبقي (آجل)"
                            render={(value) => (
                                <Tag color={Number(value) > 0 ? "volcano" : "green"} style={{ borderRadius: 50 }}>
                                    {Number(value).toFixed(2)} ج.م
                                </Tag>
                            )}
                            sorter
                        />
                        <Table.Column
                            dataIndex={["_count", "invoices"]}
                            title="عدد الفواتير"
                            render={(value) => (
                                <Tag color="blue" style={{ borderRadius: 50 }}>{value}</Tag>
                            )}
                        />
                        <Table.Column
                            title="الإجراءات"
                            dataIndex="actions"
                            render={(_, record: Client) => (
                                <Space>
                                    <ShowButton hideText size="small" recordItemId={record.id} resource="clients" />
                                    <EditButton hideText size="small" recordItemId={record.id} resource="clients" />
                                </Space>
                            )}
                        />
                    </Table>
                </List>
            </div>
        </div>
    );
};
