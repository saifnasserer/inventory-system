import React, { useState, useEffect, useRef } from "react";
import { Create, useForm, useSelect, useModalForm } from "@refinedev/antd";
import { useList } from "@refinedev/core";
import { useSearchParams } from "react-router-dom";
import {
    Form,
    Input,
    InputNumber,
    Card,
    Typography,
    Divider,
    Row,
    Col,
    Space,
    Select,
    Button,
    Radio,
    Empty,
    Modal,
    Tooltip
} from "antd";
import {
    UserOutlined,
    PhoneOutlined,
    DollarOutlined,
    FileTextOutlined,
    PlusOutlined,
    DeleteOutlined,
    LaptopOutlined,
    SaveOutlined,
    UserAddOutlined
} from "@ant-design/icons";
import { Device, Client } from "../../types";

const { Title, Text } = Typography;

export const InvoiceCreate: React.FC = () => {
    const [calculatedTotal, setCalculatedTotal] = useState(0);
    const [searchParams] = useSearchParams();
    const clientSelectRef = useRef<any>(null);
    const [customerSearch, setCustomerSearch] = useState("");

    // Support both device_id (single) and device_ids (multi)
    const deviceIdParam = searchParams.get("device_id");
    const deviceIdsParam = searchParams.get("device_ids");

    const deviceIds = (deviceIdsParam ? deviceIdsParam.split(",") : (deviceIdParam ? [deviceIdParam] : [])).filter(id => id.trim() !== "");

    const { formProps, saveButtonProps } = useForm({
        resource: "invoices",
        redirect: "list",
    });

    const form = formProps.form!;

    // Client Creation Modal
    const {
        modalProps: clientModalProps,
        formProps: clientFormProps,
        show: showClientModal,
    } = useModalForm<Client>({
        resource: "clients",
        action: "create",
        syncWithLocation: false,
        redirect: false, // Prevent navigation
        onMutationSuccess: (data: any) => {
            const newClient = data.data;
            if (newClient && form) {
                form.setFieldsValue({
                    client_id: newClient.id,
                    customer_name: newClient.name,
                    customer_contact: newClient.phone
                });
            }
        }
    });

    // Fetch initial devices if passed via query params
    const { data: initialDevicesData } = useList<Device>({
        resource: "devices",
        filters: [
            {
                field: "id",
                operator: "in",
                value: deviceIds,
            }
        ],
        queryOptions: {
            enabled: deviceIds.length > 0,
        },
        meta: {
            select: "*,diagnostic_reports(*,hardware_specs(*))"
        }
    });

    const { data: clientsData, refetch: refetchClients } = useList<Client>({
        resource: "clients",
        filters: customerSearch ? [
            {
                field: "name",
                operator: "contains",
                value: customerSearch,
            },
        ] : [],
        pagination: {
            pageSize: 50,
        },
    });

    // Debounced customer search
    useEffect(() => {
        const timer = setTimeout(() => {
            refetchClients();
        }, 300);
        return () => clearTimeout(timer);
    }, [customerSearch]);

    const { selectProps: deviceSelectProps } = useSelect<Device>({
        resource: "devices",
        optionLabel: "model",
    });

    // Handle initial devices pre-population
    useEffect(() => {
        if (initialDevicesData?.data && form) {
            if (initialDevicesData.data.length > 0) {
                const items = initialDevicesData.data.map(device => ({
                    device_id: device.id,
                    item_name: device.model,
                    unit_price: 0,
                    quantity: 1,
                    total_price: 0
                }));
                form.setFieldsValue({ items });
                calculateTotals();
            } else if (deviceIds.length > 0 && deviceIds[0] !== "") {
                // If IDs were requested but none found, clear the selection
                form.setFieldsValue({ items: [] });
            }
        }
    }, [initialDevicesData, form]);

    // Auto-calculate totals whenever items change
    const calculateTotals = () => {
        if (!form) return;
        const items = form.getFieldValue("items") || [];
        let total = 0;

        items.forEach((item: any) => {
            if (item) {
                total += Number(item.unit_price || 0);
            }
        });

        const taxAmount = form.getFieldValue("tax_amount") || 0;
        const grandTotal = total + taxAmount;

        form.setFieldsValue({ total_amount: grandTotal });
        setCalculatedTotal(grandTotal);
    };

    const handleValuesChange = (changedValues: any, _allValues: any) => {
        if (changedValues.items || changedValues.tax_amount !== undefined) {
            calculateTotals();
        }
    };


    return (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px" }}>
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
                    <Text type="secondary">إصدار فاتورة جديدة ودعم أصناف متعددة</Text>
                </div>
            </div>

            <Form {...formProps} layout="vertical" onValuesChange={handleValuesChange}>
                {/* Hidden Fields */}
                <Form.Item name="invoice_number" initialValue={`INV-${Math.floor(Date.now() / 1000)}`} hidden><Input /></Form.Item>
                <Form.Item name="sale_date" initialValue={new Date().toISOString().split('T')[0]} hidden><Input /></Form.Item>
                <Form.Item name="customer_name" hidden><Input /></Form.Item>

                <Row gutter={[24, 24]}>
                    <Col xs={24} lg={16}>
                        {/* Customer Section */}
                        <Card
                            title={<Space><UserOutlined /> بيانات العميل</Space>}
                            style={{ borderRadius: 16, marginBottom: 24 }}
                            variant="borderless"
                        >
                            <Row gutter={16} align="bottom">
                                <Col flex="auto">
                                    <Form.Item
                                        label="اختيار العميل"
                                        name="client_id"
                                        rules={[{ required: true, message: "يرجى اختيار العميل" }]}
                                    >
                                        <Select
                                            ref={clientSelectRef}
                                            size="large"
                                            showSearch
                                            allowClear
                                            placeholder="ابحث باسم العميل..."
                                            filterOption={false}
                                            onSearch={(value) => setCustomerSearch(value)}
                                            onSelect={(val: any) => {
                                                const selectedClient = clientsData?.data.find(c => c.id === val);
                                                if (selectedClient) {
                                                    form.setFieldsValue({
                                                        customer_name: selectedClient.name,
                                                        customer_contact: selectedClient.phone
                                                    });
                                                }
                                                if (clientSelectRef.current) {
                                                    clientSelectRef.current.blur();
                                                }
                                            }}
                                            options={clientsData?.data.map(client => ({
                                                label: client.name,
                                                value: client.id,
                                            })) || []}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col flex="48px">
                                    <Form.Item label=" ">
                                        <Tooltip title="إضافة عميل جديد">
                                            <Button
                                                size="large"
                                                icon={<UserAddOutlined />}
                                                onClick={() => showClientModal()}
                                                style={{ borderRadius: 8 }}
                                            />
                                        </Tooltip>
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item
                                        label="رقم هاتف العميل"
                                        name="customer_contact"
                                    >
                                        <Input
                                            size="large"
                                            prefix={<PhoneOutlined />}
                                            placeholder="رقم الهاتف يظهر هنا تلقائياً"
                                            variant="filled"
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Card>

                        {/* Items Section */}
                        <Card
                            title={<Space><LaptopOutlined /> أصناف الفاتورة</Space>}
                            style={{ borderRadius: 16 }}
                            variant="borderless"
                        >
                            <Form.List name="items">
                                {(fields, { add, remove }) => (
                                    <>
                                        {fields.map(({ key, name, ...restField }) => (
                                            <div key={key} style={{
                                                marginBottom: 16,
                                                padding: 16,
                                                backgroundColor: '#f9f9f9',
                                                borderRadius: 20,
                                                border: '1px solid #f0f0f0'
                                            }}>
                                                <Row gutter={16} align="bottom">
                                                    <Col xs={24} md={12}>
                                                        <Form.Item
                                                            {...restField}
                                                            label="اسم الصنف"
                                                            name={[name, 'item_name']}
                                                            rules={[{ required: true }]}
                                                        >
                                                            <Input placeholder="اسم الصنف" size="large" />
                                                        </Form.Item>
                                                        {/* Hidden device_id to preserve link if pre-populated */}
                                                        <Form.Item name={[name, 'device_id']} hidden>
                                                            <Input />
                                                        </Form.Item>
                                                    </Col>
                                                    <Col xs={18} md={10}>
                                                        <Form.Item
                                                            {...restField}
                                                            label="السعر"
                                                            name={[name, 'unit_price']}
                                                            rules={[{ required: true }]}
                                                        >
                                                            <InputNumber
                                                                min={0}
                                                                size="large"
                                                                style={{ width: '100%' }}
                                                                placeholder="0"
                                                                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                            />
                                                        </Form.Item>
                                                    </Col>
                                                    <Col xs={6} md={2}>
                                                        <Button
                                                            type="text"
                                                            danger
                                                            icon={<DeleteOutlined />}
                                                            onClick={() => remove(name)}
                                                            style={{ marginBottom: 4 }}
                                                        />
                                                    </Col>
                                                </Row>
                                            </div>
                                        ))}
                                        <Button
                                            type="dashed"
                                            onClick={() => add()}
                                            block
                                            icon={<PlusOutlined />}
                                            style={{ height: 45, borderRadius: 24 }}
                                        >
                                            إضافة صنف جديد
                                        </Button>
                                        {fields.length === 0 && <div style={{ padding: 20 }}><Empty description="لا يوجد أصناف مضافة" /></div>}
                                    </>
                                )}
                            </Form.List>
                        </Card>
                    </Col>

                    <Col xs={24} lg={8}>
                        <Card
                            title={<Space><DollarOutlined /> ملخص الفاتورة</Space>}
                            style={{ borderRadius: 16, position: 'sticky', top: 24, padding: "8px" }}
                            variant="borderless"
                        >
                            <div style={{ backgroundColor: '#f0f5ff', padding: 20, borderRadius: 20, textAlign: 'center', marginBottom: 24 }}>
                                <Text type="secondary">الإجمالي المستحق</Text>
                                <div style={{ fontSize: 36, fontWeight: 'bold', color: '#1890ff' }}>
                                    {calculatedTotal.toLocaleString()} <span style={{ fontSize: 16 }}>ج.م</span>
                                </div>
                                <Form.Item name="total_amount" hidden><Input /></Form.Item>
                            </div>

                            <Form.Item label="المبلغ المدفوع (مقدم)" name="amount_paid" initialValue={0}>
                                <InputNumber
                                    size="large"
                                    style={{ width: '100%' }}
                                    min={0}
                                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                />
                            </Form.Item>

                            <Form.Item
                                label="طريقة السداد"
                                name="payment_method"
                                initialValue="cash"
                                rules={[{ required: true }]}
                            >
                                <Radio.Group buttonStyle="solid" style={{ width: '100%', display: 'flex' }}>
                                    <Radio.Button value="cash" style={{ flex: 1, textAlign: 'center' }}>نقدي (Cash)</Radio.Button>
                                    <Radio.Button value="credit" style={{ flex: 1, textAlign: 'center' }}>آجل (Credit)</Radio.Button>
                                </Radio.Group>
                            </Form.Item>

                            <Divider dashed />

                            <Form.Item label="ملاحظات" name="notes">
                                <Input.TextArea rows={3} placeholder="أي ملاحظات إضافية..." style={{ borderRadius: 12 }} />
                            </Form.Item>

                            <div style={{ marginTop: 24 }}>
                                <Button
                                    type="primary"
                                    size="large"
                                    block
                                    icon={<SaveOutlined />}
                                    style={{ height: 56, fontSize: 18, borderRadius: 28, fontWeight: 700 }}
                                    onClick={() => form.submit()}
                                    loading={saveButtonProps.loading}
                                >
                                    حفظ الفاتورة
                                </Button>
                                <div style={{ textAlign: "center", marginTop: 12 }}>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                        * في حال البيع الآجل، سيتم تسجيل المتبقي تلقائياً.
                                    </Text>
                                </div>
                            </div>
                        </Card>
                    </Col>
                </Row>
            </Form>

            {/* Client Modal */}
            <Modal {...clientModalProps} title="إضافة عميل جديد" width={400}>
                <Form {...clientFormProps} layout="vertical">
                    <Form.Item
                        label="اسم العميل"
                        name="name"
                        rules={[{ required: true, message: "الاسم مطلوب" }]}
                    >
                        <Input size="large" placeholder="الاسم الكامل" />
                    </Form.Item>
                    <Form.Item
                        label="رقم الهاتف"
                        name="phone"
                        rules={[{ required: true, message: "رقم الهاتف مطلوب" }]}
                    >
                        <Input size="large" placeholder="01xxxxxxxxx" />
                    </Form.Item>
                    <Form.Item
                        label="العنوان"
                        name="address"
                    >
                        <Input.TextArea placeholder="العنوان بالتفصيل" />
                    </Form.Item>
                </Form>
            </Modal>

            <style>{`
                .readonly-number input {
                    background-color: transparent !important;
                    border: none !important;
                    box-shadow: none !important;
                    cursor: default !important;
                    color: #000 !important;
                    padding: 0 !important;
                    text-align: right !important;
                }
                .ant-create .ant-page-header {
                    display: none;
                }
            `}</style>
        </div>
    );
};
