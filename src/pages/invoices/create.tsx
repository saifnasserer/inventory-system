import React, { useEffect } from "react";
import { Create, useForm } from "@refinedev/antd";
import { Form, Input, InputNumber, Card, Typography, Descriptions, Spin, Divider } from "antd";
import { useSearchParams } from "react-router-dom";
import { useOne, useUpdate } from "@refinedev/core";
import { Device } from "../../types";

const { Title, Text } = Typography;

export const InvoiceCreate: React.FC = () => {
    const [searchParams] = useSearchParams();
    const deviceId = searchParams.get("device_id");
    const { mutate: updateDevice } = useUpdate();

    const { formProps, saveButtonProps, onFinish } = useForm({
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
            formProps.form?.setFieldsValue({
                device_id: deviceId,
                branch_id: device?.branch_id, // Auto-link to device's current branch if available
            });
        }
    }, [deviceId, device, formProps.form]);

    if (deviceLoading) {
        return <Spin size="large" style={{ display: "block", margin: "50px auto" }} />;
    }

    return (
        <Create saveButtonProps={saveButtonProps} title="إنشاء فاتورة مبيعات">
            <div style={{ display: "flex", gap: "24px", flexDirection: "column" }}>
                {/* Device Info Card */}
                {device && (
                    <Card title="تفاصيل الجهاز" bordered={false} style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                        <Descriptions column={2}>
                            <Descriptions.Item label="رقم الأصل"><Text strong>{device.asset_id}</Text></Descriptions.Item>
                            <Descriptions.Item label="الموديل">{device.model}</Descriptions.Item>
                            <Descriptions.Item label="السيريال">{device.serial_number}</Descriptions.Item>
                            <Descriptions.Item label="المواصفات">
                                {device.cpu_model} / {device.ram_size}GB / {device.storage_size}GB
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>
                )}

                <Form {...formProps} layout="vertical">
                    {/* Hidden Fields */}
                    <Form.Item name="device_id" hidden>
                        <Input />
                    </Form.Item>
                    <Form.Item name="branch_id" hidden>
                        <Input />
                    </Form.Item>

                    <Card title="بيانات العميل والفاتورة" bordered={false} style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                            <Form.Item
                                label="اسم العميل"
                                name="customer_name"
                                rules={[{ required: true, message: "يرجى إدخال اسم العميل" }]}
                            >
                                <Input placeholder="الاسم ثلاثي" />
                            </Form.Item>

                            <Form.Item
                                label="رقم الهاتف"
                                name="customer_contact"
                                rules={[{ required: true, message: "يرجى إدخال رقم الهاتف" }]}
                            >
                                <Input placeholder="01xxxxxxxxx" />
                            </Form.Item>

                            <Form.Item
                                label="البريد الإلكتروني"
                                name="customer_email"
                            >
                                <Input type="email" placeholder="example@mail.com" />
                            </Form.Item>

                            <Form.Item
                                label="تاريخ البيع"
                                name="sale_date"
                                initialValue={new Date().toISOString().split('T')[0]}
                                hidden // Or show date picker if needed
                            >
                                <Input />
                            </Form.Item>
                        </div>

                        <Divider />

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                            <Form.Item
                                label="سعر البيع (EGP)"
                                name="sale_price"
                                rules={[{ required: true, message: "يرجى إدخال سعر البيع" }]}
                            >
                                <InputNumber
                                    style={{ width: "100%" }}
                                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={value => Number(value!.replace(/\$\s?|(,*)/g, '')) || 0}
                                    min={0}
                                    placeholder="0.00"
                                />
                            </Form.Item>

                            <Form.Item
                                label="الضريبة (EGP)"
                                name="tax_amount"
                            >
                                <InputNumber
                                    style={{ width: "100%" }}
                                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={value => Number(value!.replace(/\$\s?|(,*)/g, '')) || 0}
                                    min={0}
                                    placeholder="0.00"
                                />
                            </Form.Item>

                            <Form.Item
                                label="إجمالي الفاتورة"
                                name="total_amount"
                                rules={[{ required: true, message: " مطلوب" }]}
                                help="يجب أن يساوي السعر + الضريبة"
                            >
                                <InputNumber
                                    style={{ width: "100%" }}
                                    min={0}
                                />
                            </Form.Item>
                        </div>

                        <Form.Item
                            label="ملاحظات"
                            name="notes"
                        >
                            <Input.TextArea rows={3} placeholder="أي ملاحظات إضافية..." />
                        </Form.Item>
                    </Card>
                </Form>
            </div>
        </Create>
    );
};
