import { useCustom, useGetIdentity } from "@refinedev/core";
import { Row, Col, Card, Statistic, Table, Spin, Typography } from "antd";
import {
    RiseOutlined,
    FallOutlined,
    WalletOutlined,
    DollarOutlined,
    ShoppingCartOutlined,
    ClockCircleOutlined
} from "@ant-design/icons";

const { Title, Text } = Typography;

export const FinanceDashboard: React.FC = () => {
    const { data: identity } = useGetIdentity<{ role: string }>();

    // Only admins see the full dashboard
    const isAdmin = identity?.role && ["admin", "super_admin"].includes(identity.role);

    const { data, isLoading } = useCustom({
        url: "finance/dashboard",
        method: "get",
        queryOptions: {
            enabled: !!isAdmin
        }
    });

    if (!isAdmin) {
        return (
            <div style={{ padding: 24, textAlign: 'center' }}>
                <Title level={4}>عذراً، غير مسموح لك بالدخول لهذه الصفحة</Title>
            </div>
        );
    }

    if (isLoading) {
        return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>;
    }

    const { summary, recentActivity } = data?.data || {};

    return (
        <div style={{ padding: 24 }}>
            <Title level={2} style={{ marginBottom: 24 }}>لوحة الإدارة المالية</Title>

            <Row gutter={[24, 24]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} style={{ borderRadius: 16 }}>
                        <Statistic
                            title="إجمالي الإيرادات"
                            value={summary?.totalRevenue}
                            precision={2}
                            prefix={<RiseOutlined style={{ color: '#52c41a' }} />}
                            suffix="ج.م"
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} style={{ borderRadius: 16 }}>
                        <Statistic
                            title="إجمالي التكاليف"
                            value={summary?.totalCost}
                            precision={2}
                            prefix={<FallOutlined style={{ color: '#f5222d' }} />}
                            suffix="ج.م"
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} style={{ borderRadius: 16 }}>
                        <Statistic
                            title="صافي الربح"
                            value={summary?.totalProfit}
                            precision={2}
                            valueStyle={{ color: '#1890ff' }}
                            prefix={<DollarOutlined />}
                            suffix="ج.م"
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} style={{ borderRadius: 16 }}>
                        <Statistic
                            title="الديون المستحقة"
                            value={summary?.totalOutstanding}
                            precision={2}
                            valueStyle={{ color: '#faad14' }}
                            prefix={<WalletOutlined />}
                            suffix="ج.م"
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
                <Col span={24}>
                    <Card
                        title={<span><ClockCircleOutlined /> آخر الحركات المالية</span>}
                        bordered={false}
                        style={{ borderRadius: 16 }}
                    >
                        <Table
                            dataSource={recentActivity}
                            rowKey={(record: any) => record.sale_date + record.total_amount}
                            columns={[
                                {
                                    title: "التاريخ",
                                    dataIndex: "sale_date",
                                    render: (val) => new Date(val).toLocaleDateString("ar-EG")
                                },
                                {
                                    title: "المبلغ",
                                    dataIndex: "total_amount",
                                    render: (val) => <strong>{Number(val).toFixed(2)} ج.م</strong>
                                },
                            ]}
                            pagination={{ pageSize: 5 }}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};
