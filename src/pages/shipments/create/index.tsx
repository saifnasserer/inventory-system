import React, { useState } from "react";
import { useCreate, useList } from "@refinedev/core";
import { useForm } from "@refinedev/antd";
import { Form, Input, InputNumber, DatePicker, Button, Card, Typography, Divider, Space, App, Select } from "antd";
import { useNavigate } from "react-router";
import {
    UserOutlined,
    NumberOutlined,
    PlusCircleOutlined,
    FolderAddOutlined,
    PlusOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";

import { VendorCreateModal } from "../components/VendorCreateModal";

const { Title, Text } = Typography;

export const ShipmentCreate: React.FC = () => {
    const navigate = useNavigate();
    const { formProps, formLoading } = useForm({
        resource: "shipments",
        action: "create",
        redirect: "list",
    });

    const { mutateAsync: createShipment } = useCreate();
    const { message } = App.useApp();
    const [vendorModalVisible, setVendorModalVisible] = useState(false);

    const { data: vendorsData } = useList({
        resource: "vendors",
    });

    const handleFinish = async (values: any) => {
        try {
            await createShipment({
                resource: "shipments",
                values: {
                    shipment_name: values.shipment_name,
                    vendor_id: values.vendor_id,
                    delivery_date: values.delivery_date.format("YYYY-MM-DD"),
                    device_count: values.device_count,
                    notes: values.notes,
                },
            });

            message.success(`تم إضافة الشحنة بنجاح! وجاري إنشاء ${values.device_count} سجل جهاز.`);
            navigate("/receiving/shipments");

        } catch (error: any) {
            console.error('Error creating shipment:', error);
            if (error?.statusCode === 401 || error?.statusCode === 403 || error?.message === 'Invalid or expired token') {
                message.error("انتهت صلاحية الجلسة أو غير مصرح لك. يرجى تسجيل الدخول مرة أخرى.");
                navigate('/login');
            } else {
                message.error(error.message || "حدث خطأ أثناء إنشاء الشحنة");
            }
        }
    };

    return (
        <div style={{ maxWidth: 700, margin: "40px auto", padding: "0 24px" }}>
            <div style={{ marginBottom: 40, textAlign: "center" }}>
                <Title level={2} style={{ margin: 0 }}>إنشاء شحنة جديدة</Title>
                <Text type="secondary">أكمل الخطوات الثلاث التالية لتعريف الشحنة وجدولة الأجهزة</Text>
            </div>

            <Form
                {...formProps}
                layout="vertical"
                onFinish={handleFinish}
                initialValues={{
                    delivery_date: dayjs()
                }}
            >
                {/* SECTION 1: Shipment Name */}
                <Card
                    title={<Space><FolderAddOutlined /> الخطوة 1: اسم الشحنة (المجلد)</Space>}
                    variant="borderless"
                    style={{ borderRadius: 16, marginBottom: 24, boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}
                >
                    <Form.Item
                        name="shipment_name"
                        label="اسم الشحنة / المجلد"
                        rules={[{ required: true, message: "يرجى إدخال اسم الشحنة" }]}
                        extra="سيتم استخدام أول حرف من هذا الاسم لتعريف الأجهزة إذا لم يتم اختيار مورد"
                    >
                        <Input
                            size="large"
                            placeholder="مثال: شحنة لابتوبات - يناير"
                            style={{ borderRadius: "32px" }}
                        />
                    </Form.Item>
                    <Form.Item
                        name="delivery_date"
                        label="تاريخ وصول الشحنة"
                        rules={[{ required: true, message: "يرجى تحديد التاريخ" }]}
                    >
                        <DatePicker size="large" style={{ width: "100%", borderRadius: "32px" }} />
                    </Form.Item>
                </Card>

                {/* SECTION 2: Vendor Selection */}
                <Card
                    title={<Space><UserOutlined /> الخطوة 2: تحديد المورد (اختياري)</Space>}
                    variant="borderless"
                    style={{ borderRadius: 16, marginBottom: 24, boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}
                >
                    <Form.Item name="vendor_id" label="اختر المورد">
                        <Select
                            size="large"
                            placeholder="اختر المورد..."
                            allowClear
                            style={{ borderRadius: "32px" }}
                            popupRender={(menu) => (
                                <>
                                    {menu}
                                    <Divider style={{ margin: '8px 0' }} />
                                    <Space style={{ padding: '0 8px 4px' }}>
                                        <Button
                                            type="text"
                                            icon={<PlusOutlined />}
                                            onClick={() => setVendorModalVisible(true)}
                                            style={{ width: '100%', textAlign: 'left' }}
                                        >
                                            إضافة مورد جديد
                                        </Button>
                                    </Space>
                                </>
                            )}
                            options={vendorsData?.data?.map((vendor: any) => ({
                                label: vendor.name,
                                value: vendor.id,
                            }))}
                        />
                    </Form.Item>
                </Card>

                {/* SECTION 3: Device Count */}
                <Card
                    title={<Space><NumberOutlined /> الخطوة 3: عدد الأجهزة</Space>}
                    variant="borderless"
                    style={{ borderRadius: 16, marginBottom: 32, boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}
                >
                    <Form.Item
                        name="device_count"
                        label="إجمالي عدد الأجهزة المستلمة"
                        rules={[
                            { required: true, message: "يرجى إدخال عدد الأجهزة" },
                            { type: "number", min: 1, message: "يجب أن يكون جهاز واحد على الأقل" }
                        ]}
                    >
                        <InputNumber
                            size="large"
                            style={{ width: "100%", borderRadius: "32px" }}
                            placeholder="0"
                        />
                    </Form.Item>
                    <Text type="secondary">
                        <PlusCircleOutlined /> سيتم إنشاء معرفات (Asset IDs) تلقائية وفريدة لجميع الأجهزة بناءً على مدخلاتك.
                    </Text>
                </Card>

                <Form.Item name="notes" label="ملاحظات إضافية">
                    <Input.TextArea rows={3} style={{ borderRadius: 12 }} />
                </Form.Item>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                    <Button
                        size="large"
                        onClick={() => navigate("/receiving/shipments")}
                        style={{ borderRadius: 50, paddingInline: 24 }}
                    >
                        إلغاء
                    </Button>
                    <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        loading={formLoading}
                        style={{
                            borderRadius: 50,
                            paddingInline: 32,
                            background: "#1890ff",
                            border: "none"
                        }}
                    >
                        إنشاء الشحنة والأجهزة
                    </Button>
                </div>
            </Form>

            <VendorCreateModal
                visible={vendorModalVisible}
                onCancel={() => setVendorModalVisible(false)}
                onSuccess={(vendor) => {
                    setVendorModalVisible(false);
                    formProps.form?.setFieldsValue({ vendor_id: vendor.id });
                }}
            />
        </div>
    );
};
