import React, { useEffect, useState } from "react";
import { Create, useForm } from "@refinedev/antd";
import { Form, Input, InputNumber, Card, Typography, Descriptions, Spin, Divider, Row, Col, Space, Statistic, Tag } from "antd";
import { useSearchParams } from "react-router-dom";
import { useOne, useUpdate } from "@refinedev/core";
import {
    UserOutlined,
    PhoneOutlined,
    MailOutlined,
    BarcodeOutlined,
    LaptopOutlined,
    AppstoreOutlined,
    HddOutlined,
    DollarOutlined,
    CalculatorOutlined,
    FileTextOutlined
} from "@ant-design/icons";
import { Device } from "../../types";

const { Title, Text } = Typography;

export const InvoiceCreate: React.FC = () => {
    const [searchParams] = useSearchParams();
    const deviceId = searchParams.get("device_id");
    const { mutate: updateDevice } = useUpdate();
    const [calculatedTotal, setCalculatedTotal] = useState(0);

    const { formProps, saveButtonProps, onFinish, form } = useForm({
        resource: "invoices",
        redirect: "list",
        onMutationSuccess: () => {
            // After invoice is created, mark device as sold
            if (deviceId) {
                updateDevice({
                    resource: "devices",
                    id: deviceId,
                    values: {
                        status: "sold",
                        // assigned_to: null // Optional: clear assignment or keep history
                    },
                });
            }
        },
    });

    // Fetch Device Details if deviceId is present
    const { data: deviceData, isLoading: deviceLoading } = useOne<Device>({
        resource: "devices",
        id: deviceId || "",
        queryOptions: {
            enabled: !!deviceId,
        },
    });

    const device = deviceData?.data;

    // Set initial values including device_id
    useEffect(() => {
        if (deviceId) {
            form?.setFieldsValue({
                device_id: deviceId,
                branch_id: device?.branch_id, // Auto-link to device's current branch if available
            });
        }
    }, [deviceId, device, form]);

    // Auto-calculate total
    const handlePriceChange = () => {
        const salePrice = form?.getFieldValue("sale_price") || 0;
        const taxAmount = form?.getFieldValue("tax_amount") || 0;
        const total = salePrice + taxAmount;
        form?.setFieldsValue({ total_amount: total });
        setCalculatedTotal(total);
    };

    if (deviceLoading) {
        return <Spin size="large" style={{ display: "block", margin: "100px auto" }} />;
    }

    return (
        <Create saveButtonProps={saveButtonProps} title=" " wrapperProps={{ style: { backgroundColor: 'transparent', padding: 0 } }}>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
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
                        <Title level={3} style={{ margin: 0 }}>إنشاء فاتورة مبيعات</Title>
                        <Text type="secondary">إصدار فاتورة جديدة للعميل وتسجيل عملية البيع</Text>
                    </div>
                </div>

                <Form {...formProps} layout="vertical" onValuesChange={handlePriceChange}>
                    {/* Hidden Fields */}
                    <Form.Item name="device_id" hidden><Input /></Form.Item>
                    <Form.Item name="branch_id" hidden><Input /></Form.Item>
                    <Form.Item name="sale_date" initialValue={new Date().toISOString().split('T')[0]} hidden><Input /></Form.Item>

                    <Row gutter={[24, 24]}>
                        {/* LEFT COLUMN: Customer & Payment Form */}
                        <Col xs={24} lg={14}>
                            <Card
                                title={<Space><UserOutlined /> بيانات العميل</Space>}
                                style={{ borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", marginBottom: 24 }}
                                headStyle={{ borderBottom: '1px solid #f0f0f0' }}
                            >
                                <Row gutter={16}>
                                    <Col span={24}>
                                        <Form.Item
                                            label="اسم العميل"
                                            name="customer_name"
                                            rules={[{ required: true, message: "يرجى إدخال اسم العميل" }]}
                                        >
                                            <Input size="large" prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} placeholder="الاسم ثلاثي" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label="رقم الهاتف"
                                            name="customer_contact"
                                            rules={[{ required: true, message: "يرجى إدخال رقم الهاتف" }]}
                                        >
                                            <Input size="large" prefix={<PhoneOutlined style={{ color: '#bfbfbf' }} />} placeholder="01xxxxxxxxx" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label="البريد الإلكتروني"
                                            name="customer_email"
                                        >
                                            <Input size="large" prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} placeholder="example@mail.com" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Card>

                            <Card
                                title={<Space><DollarOutlined /> تفاصيل الدفع</Space>}
                                style={{ borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
                            >
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item
                                            label="سعر البيع (EGP)"
                                            name="sale_price"
                                            rules={[{ required: true, message: "يرجى إدخال سعر البيع" }]}
                                        >
                                            <InputNumber
                                                size="large"
                                                style={{ width: "100%" }}
                                                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                parser={value => (value ? value.replace(/\$\s?|(,*)/g, '') : '') as any}
                                                min={0}
                                                placeholder="0.00"
                                                prefix={<span style={{ color: '#bfbfbf' }}>EGP</span>}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label="الضريبة (EGP)"
                                            name="tax_amount"
                                        >
                                            <InputNumber
                                                size="large"
                                                style={{ width: "100%" }}
                                                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                parser={value => (value ? value.replace(/\$\s?|(,*)/g, '') : '') as any}
                                                min={0}
                                                placeholder="0.00"
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <div style={{ backgroundColor: '#f9f9f9', padding: '16px', borderRadius: 8, marginTop: 8 }}>
                                            <Form.Item
                                                label={<Space><CalculatorOutlined /> <Text strong>إجمالي الفاتورة</Text></Space>}
                                                name="total_amount"
                                                rules={[{ required: true, message: "مطلوب" }]}
                                                style={{ marginBottom: 0 }}
                                            >
                                                <InputNumber
                                                    size="large"
                                                    style={{ width: "100%", fontWeight: 'bold', color: '#52c41a' }}
                                                    min={0}
                                                    readOnly
                                                    prefix={<span style={{ color: '#52c41a' }}>EGP</span>}
                                                />
                                            </Form.Item>
                                        </div>
                                    </Col>
                                    <Col span={24}>
                                        <Divider dashed />
                                        <Form.Item
                                            label="ملاحظات"
                                            name="notes"
                                        >
                                            <Input.TextArea rows={3} placeholder="أي ملاحظات إضافية..." style={{ borderRadius: 8 }} />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Card>
                        </Col>

                        {/* RIGHT COLUMN: Device Ticket Summary */}
                        <Col xs={24} lg={10}>
                            {device && (
                                <Card
                                    style={{
                                        borderRadius: 16,
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                                        border: '1px solid #f0f0f0',
                                        height: '100%'
                                    }}
                                    bodyStyle={{ padding: 0 }}
                                >
                                    <div style={{
                                        backgroundColor: '#fafafa',
                                        padding: '24px',
                                        borderBottom: '1px solid #f0f0f0',
                                        borderTopLeftRadius: 16,
                                        borderTopRightRadius: 16,
                                        textAlign: 'center'
                                    }}>
                                        <LaptopOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
                                        <Title level={4} style={{ margin: '0 0 8px 0' }}>{device.model}</Title>
                                        <Tag color="blue">{device.manufacturer}</Tag>
                                        <div style={{ marginTop: 16 }}>
                                            <Space split={<Divider type="vertical" />}>
                                                <Text type="secondary"><BarcodeOutlined /> {device.asset_id}</Text>
                                                <Text type="secondary">SN: {device.serial_number}</Text>
                                            </Space>
                                        </div>
                                    </div>

                                    <div style={{ padding: '24px' }}>
                                        <Title level={5} style={{ marginBottom: 16 }}>مواصفات الجهاز</Title>
                                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <AppstoreOutlined style={{ color: '#8c8c8c' }} />
                                                <Text type="secondary" style={{ width: 60 }}>CPU</Text>
                                                <Text strong>{device.diagnostic_reports?.[0]?.hardware_specs?.cpu_name || device.cpu_model || "N/A"}</Text>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <HddOutlined style={{ color: '#8c8c8c' }} />
                                                <Text type="secondary" style={{ width: 60 }}>RAM</Text>
                                                <Text strong>{device.ram_size} GB</Text>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <DatabaseFilled style={{ color: '#8c8c8c' }} />
                                                <Text type="secondary" style={{ width: 60 }}>Storage</Text>
                                                <Text strong>{device.storage_size} GB</Text>
                                            </div>
                                            {(device.gpu_model || device.diagnostic_reports?.[0]?.hardware_specs?.gpus?.length > 0) && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <LaptopOutlined style={{ color: '#8c8c8c' }} />
                                                    <Text type="secondary" style={{ width: 60 }}>GPU</Text>
                                                    <Text strong>
                                                        {(() => {
                                                            const gpus = device.diagnostic_reports?.[0]?.hardware_specs?.gpus;
                                                            if (Array.isArray(gpus) && gpus.length > 0) {
                                                                const discrete = gpus.find((g: any) =>
                                                                    (g.model || "").match(/nvidia|amd|geforce|radeon/i)
                                                                );
                                                                return (discrete || gpus[0]).model || device.gpu_model;
                                                            }
                                                            return device.gpu_model;
                                                        })()}
                                                    </Text>
                                                </div>
                                            )}
                                        </Space>

                                        <Divider dashed />

                                        <div style={{ textAlign: 'center' }}>
                                            <Text type="secondary">المبلغ المستحق</Text>
                                            <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
                                                {calculatedTotal.toLocaleString()} <span style={{ fontSize: 16 }}>EGP</span>
                                            </Title>
                                        </div>
                                    </div>
                                </Card>
                            )}
                        </Col>
                    </Row>
                </Form>
            </div>
        </Create>
    );
};

// Helper icon component
const DatabaseFilled = (props: any) => (
    <span role="img" aria-label="database" className="anticon anticon-database" {...props}>
        <svg viewBox="64 64 896 896" focusable="false" data-icon="database" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M832 64H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V96c0-17.7-14.3-32-32-32zm-40 232H232v-60h560v60zm0 216H232v-60h560v60zm0 216H232v-60h560v60z"></path></svg>
    </span>
);
