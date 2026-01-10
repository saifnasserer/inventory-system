import { Create, useForm } from "@refinedev/antd";
import { Form, Input, InputNumber, Radio, Switch } from "antd";
import { supabaseClient } from "../../utility/supabaseClient";
import { useParams, useNavigate } from "react-router";

export const TechnicalInspectionCreate: React.FC = () => {
    const { deviceId } = useParams();
    const navigate = useNavigate();
    const { formProps, saveButtonProps } = useForm({
        resource: "technical_inspections",
        action: "create",
    });

    const handleFinish = async (values: any) => {
        try {
            const { data: userData } = await supabaseClient.auth.getUser();

            // Update device with technical specs
            await supabaseClient
                .from("devices")
                .update({
                    model: values.model,
                    serial_number: values.serial_number,
                    manufacturer: values.manufacturer,
                    cpu_model: values.cpu_model,
                    gpu_model: values.gpu_model,
                    ram_size: values.ram_size,
                    ram_count: values.ram_count,
                    storage_size: values.storage_size,
                    storage_count: values.storage_count,
                })
                .eq("id", deviceId);

            // Create technical inspection
            const { error } = await supabaseClient
                .from("technical_inspections")
                .insert({
                    device_id: deviceId,
                    inspector_id: userData?.user?.id,
                    stress_test_passed: values.stress_test_passed,
                    max_temperature: values.max_temperature,
                    performance_score: values.performance_score,
                    ready_for_sale: values.ready_for_sale,
                    needs_repair: values.needs_repair,
                    repair_notes: values.repair_notes,
                    notes: values.notes,
                });

            if (error) throw error;

            // Update device status based on decision
            const newStatus = values.ready_for_sale
                ? "ready_for_sale"
                : "needs_repair";

            await supabaseClient
                .from("devices")
                .update({ status: newStatus })
                .eq("id", deviceId);

            navigate("/warehouse/devices");
        } catch (error) {
            console.error("Error creating technical inspection:", error);
        }
    };

    return (
        <Create saveButtonProps={saveButtonProps} title="الفحص الفني للجهاز">
            <Form {...formProps} layout="vertical" onFinish={handleFinish}>
                <h3>مواصفات الجهاز</h3>

                <Form.Item
                    label="الموديل"
                    name="model"
                    rules={[{ required: true, message: "الرجاء إدخال الموديل" }]}
                >
                    <Input placeholder="مثال: Dell Latitude 5420" />
                </Form.Item>

                <Form.Item
                    label="الرقم التسلسلي"
                    name="serial_number"
                    rules={[{ required: true, message: "الرجاء إدخال الرقم التسلسلي" }]}
                >
                    <Input placeholder="Serial Number" />
                </Form.Item>

                <Form.Item label="الشركة المصنعة" name="manufacturer">
                    <Input placeholder="مثال: Dell, HP, Lenovo" />
                </Form.Item>

                <Form.Item label="المعالج (CPU)" name="cpu_model">
                    <Input placeholder="مثال: Intel Core i7-11800H" />
                </Form.Item>

                <Form.Item label="كرت الشاشة (GPU)" name="gpu_model">
                    <Input placeholder="مثال: NVIDIA RTX 3060" />
                </Form.Item>

                <Form.Item label="حجم الرام (GB)" name="ram_size">
                    <InputNumber min={1} style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item label="عدد شرائح الرام" name="ram_count">
                    <InputNumber min={1} style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item label="حجم التخزين (GB)" name="storage_size">
                    <InputNumber min={1} style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item label="عدد وحدات التخزين" name="storage_count">
                    <InputNumber min={1} style={{ width: "100%" }} />
                </Form.Item>

                <h3 style={{ marginTop: 24 }}>اختبارات الأداء</h3>

                <Form.Item
                    label="اختبار الضغط (Stress Test)"
                    name="stress_test_passed"
                    valuePropName="checked"
                >
                    <Switch checkedChildren="نجح" unCheckedChildren="فشل" />
                </Form.Item>

                <Form.Item label="أقصى درجة حرارة (°C)" name="max_temperature">
                    <InputNumber min={0} max={150} style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item
                    label="تقييم الأداء (0-100)"
                    name="performance_score"
                    rules={[{ type: "number", min: 0, max: 100 }]}
                >
                    <InputNumber min={0} max={100} style={{ width: "100%" }} />
                </Form.Item>

                <h3 style={{ marginTop: 24 }}>القرار النهائي</h3>

                <Form.Item
                    label="حالة الجهاز"
                    name="ready_for_sale"
                    rules={[{ required: true, message: "الرجاء تحديد حالة الجهاز" }]}
                >
                    <Radio.Group>
                        <Radio value={true}>جاهز للبيع</Radio>
                        <Radio value={false}>يحتاج صيانة</Radio>
                    </Radio.Group>
                </Form.Item>

                <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, currentValues) =>
                        prevValues.ready_for_sale !== currentValues.ready_for_sale
                    }
                >
                    {({ getFieldValue }) =>
                        getFieldValue("ready_for_sale") === false ? (
                            <Form.Item label="ملاحظات الصيانة المطلوبة" name="repair_notes">
                                <Input.TextArea
                                    rows={3}
                                    placeholder="حدد المشاكل والصيانة المطلوبة..."
                                />
                            </Form.Item>
                        ) : null
                    }
                </Form.Item>

                <Form.Item label="ملاحظات إضافية" name="notes">
                    <Input.TextArea rows={3} placeholder="أي ملاحظات أخرى..." />
                </Form.Item>
            </Form>
        </Create>
    );
};
