import { useForm } from "@refinedev/antd";
import { Form, Input, InputNumber, DatePicker, Button, Card, Row, Col, Typography, Divider, Space, message, Modal } from "antd";
import { useNavigate } from "react-router";
import {
    BarcodeOutlined,
    UserOutlined,
    PhoneOutlined,
    CalendarOutlined,
    NumberOutlined,
    FileTextOutlined,
    PlusCircleOutlined,
    ArrowRightOutlined
} from "@ant-design/icons";
import { supabaseClient } from "../../utility/supabaseClient";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export const ShipmentCreate: React.FC = () => {
    const navigate = useNavigate();
    const { formProps, onFinish } = useForm({
        resource: "shipments",
        action: "create",
        redirect: "list",
    });

    const handleFinish = async (values: any) => {
        try {
            // Create shipment
            const { data: shipmentData, error: shipmentError } = await supabaseClient
                .from("shipments")
                .insert({
                    shipment_code: values.shipment_code,
                    supplier_name: values.supplier_name,
                    supplier_contact: values.supplier_contact,
                    delivery_date: values.delivery_date.format("YYYY-MM-DD"),
                    device_count: values.device_count,
                    notes: values.notes,
                })
                .select()
                .single();

            if (shipmentError) throw shipmentError;

            // Generate Asset IDs for devices
            const devices = [];
            for (let i = 1; i <= values.device_count; i++) {
                const assetId = `${values.shipment_code}-${String(i).padStart(4, "0")}`;
                devices.push({
                    asset_id: assetId,
                    shipment_id: shipmentData.id,
                    status: "received",
                    current_location: "warehouse",
                });
            }

            // Insert devices
            const { error: devicesError } = await supabaseClient
                .from("devices")
                .insert(devices);

            if (devicesError) throw devicesError;

            // Show success modal with work distribution
            Modal.success({
                title: "تم إضافة الشحنة بنجاح!",
                width: 600,
                content: (
                    <div>
                        <Typography.Paragraph>تم إنشاء {values.device_count} سجلات أجهزة جديدة.</Typography.Paragraph>
                        <Divider>توزيع المهام (Work Allocation)</Divider>
                        <div style={{ backgroundColor: "#f5f5f5", padding: "16px", borderRadius: "8px" }}>
                            <Typography.Title level={5} style={{ marginTop: 0 }}>المهمة المطلوبة:</Typography.Title>
                            <Typography.Paragraph>
                                يرجى توصيل الأجهزة بالشبكة ليتم تحميل البيانات تلقائياً عبر البرنامج المساعد.
                            </Typography.Paragraph>
                            <Divider style={{ margin: "12px 0" }} />
                            <Space direction="vertical" style={{ width: "100%" }}>
                                {/* Hardcoded assignments commented out per user request
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span>🟢 <strong>سيف (Saif):</strong></span>
                                    <span>الأجهزة من 1 إلى {Math.min(5, values.device_count)}</span>
                                </div>
                                {values.device_count > 5 && (
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span>🔵 <strong>يوسف (Yousef):</strong></span>
                                        <span>الأجهزة من 6 إلى {Math.min(20, values.device_count)}</span>
                                    </div>
                                )}
                                {values.device_count > 20 && (
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span>🟠 <strong>باقي الفريق:</strong></span>
                                        <span>الأجهزة من 21 إلى {values.device_count}</span>
                                    </div>
                                )}
                                */}
                                <div style={{ display: "flex", justifyContent: "center" }}>
                                    <span>سيتم توزيع المهام تلقائياً على الفريق المتاح.</span>
                                </div>
                            </Space>
                        </div>
                    </div>
                ),
                okText: "الذهاب للقائمة",
                onOk: () => navigate("/receiving/shipments"),
            });

        } catch (error: any) {
            console.error("Error creating shipment:", error);
            if (error.code === "23505") {
                message.error("رمز الشحنة موجود بالفعل. الرجاء استخدام رمز آخر.");
            } else if (error.code === "42501") {
                message.error("ليس لديك صلاحية لإضافة شحنات. الرجاء التحقق من الصلاحيات.");
            } else {
                message.error("حدث خطأ أثناء إنشاء الشحنة");
            }
        }
    };

    return (
        <div style={{ maxWidth: 800, margin: "24px auto", padding: "0 24px" }}>
            <div style={{ marginBottom: 32, textAlign: "center" }}>
                <Title level={2}>استلام شحنة جديدة</Title>
                <Text type="secondary">أدخل بيانات الشحنة والأجهزة المستلمة لإنشاء سجل جديد</Text>
            </div>

            <Card
                bordered={false}
                style={{
                    borderRadius: "16px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.03)"
                }}
            >
                <Form {...formProps} layout="vertical" onFinish={handleFinish} initialValues={{ delivery_date: dayjs() }}>
                    <div style={{ marginBottom: 24 }}>
                        <Title level={5} style={{ marginBottom: 16, color: "#1890ff" }}>
                            <BarcodeOutlined /> بيانات الشحنة الأساسية
                        </Title>
                        <Row gutter={24}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="رمز الشحنة"
                                    name="shipment_code"
                                    rules={[{ required: true, message: "مطلوب" }]}
                                >
                                    <Input
                                        size="large"
                                        prefix={<BarcodeOutlined style={{ color: "#bfbfbf" }} />}
                                        placeholder="SHP-2024-XXX"
                                        style={{ borderRadius: "8px" }}
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="تاريخ الاستلام"
                                    name="delivery_date"
                                    rules={[{ required: true, message: "مطلوب" }]}
                                >
                                    <DatePicker
                                        size="large"
                                        style={{ width: "100%", borderRadius: "8px" }}
                                        format="YYYY-MM-DD"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                    </div>

                    <Divider dashed />

                    <div style={{ marginBottom: 24 }}>
                        <Title level={5} style={{ marginBottom: 16, color: "#1890ff" }}>
                            <UserOutlined /> بيانات المورد
                        </Title>
                        <Row gutter={24}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="اسم المورد"
                                    name="supplier_name"
                                    rules={[{ required: true, message: "مطلوب" }]}
                                >
                                    <Input
                                        size="large"
                                        prefix={<UserOutlined style={{ color: "#bfbfbf" }} />}
                                        placeholder="اسم الشركة أو المورد"
                                        style={{ borderRadius: "8px" }}
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item label="معلومات الاتصال" name="supplier_contact">
                                    <Input
                                        size="large"
                                        prefix={<PhoneOutlined style={{ color: "#bfbfbf" }} />}
                                        placeholder="رقم الهاتف"
                                        style={{ borderRadius: "8px" }}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                    </div>

                    <Divider dashed />

                    <div style={{ marginBottom: 24 }}>
                        <Title level={5} style={{ marginBottom: 16, color: "#1890ff" }}>
                            <NumberOutlined /> تفاصيل المخزون
                        </Title>
                        <Row gutter={24}>
                            <Col xs={24}>
                                <div style={{
                                    backgroundColor: "#f9f9f9",
                                    padding: "20px",
                                    borderRadius: "12px",
                                    border: "1px solid #f0f0f0"
                                }}>
                                    <Form.Item
                                        label="عدد الأجهزة في الشحنة"
                                        name="device_count"
                                        rules={[
                                            { required: true, message: "الرجاء إدخال العدد" },
                                            { type: "number", min: 1, message: "يجب أن يكون 1 على الأقل" },
                                        ]}
                                        extra="سيتم إنشاء سجلات أجهزة تلقائية بهذا العدد"
                                        style={{ marginBottom: 0 }}
                                    >
                                        <InputNumber
                                            size="large"
                                            min={1}
                                            style={{ width: "100%", borderRadius: "8px" }}
                                            placeholder="0"
                                        />
                                    </Form.Item>
                                </div>
                            </Col>
                        </Row>
                    </div>

                    <Form.Item label="ملاحظات إضافية" name="notes" style={{ marginTop: 24 }}>
                        <Input.TextArea
                            rows={4}
                            placeholder="أي تفاصيل أخرى حول الشحنة..."
                            style={{ borderRadius: "12px", padding: "12px" }}
                        />
                    </Form.Item>

                    <div style={{
                        marginTop: 40,
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "12px",
                        borderTop: "1px solid #f0f0f0",
                        paddingTop: "24px"
                    }}>
                        <Button
                            size="large"
                            onClick={() => navigate("/receiving/shipments")}
                            style={{ borderRadius: "8px", height: "48px", minWidth: "100px" }}
                        >
                            إلغاء
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            icon={<PlusCircleOutlined />}
                            loading={formProps.loading}
                            style={{
                                borderRadius: "8px",
                                height: "48px",
                                minWidth: "160px",
                                background: "linear-gradient(90deg, #1890ff 0%, #096dd9 100%)",
                                border: "none",
                                boxShadow: "0 4px 14px rgba(24, 144, 255, 0.3)"
                            }}
                        >
                            إضافة الشحنة
                        </Button>
                    </div>
                </Form>
            </Card>
        </div>
    );
};
