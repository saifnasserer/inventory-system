import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Radio, Checkbox, Rate, Upload, Button } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { supabaseClient } from "../../utility/supabaseClient";
import { useParams, useNavigate } from "react-router";

export const PhysicalInspectionCreate: React.FC = () => {
    const { deviceId } = useParams();
    const navigate = useNavigate();
    const { formProps, saveButtonProps } = useForm({
        resource: "physical_inspections",
        action: "create",
    });

    const handleFinish = async (values: any) => {
        try {
            const { data: userData } = await supabaseClient.auth.getUser();

            // Create physical inspection
            const { error } = await supabaseClient
                .from("physical_inspections")
                .insert({
                    device_id: deviceId,
                    inspector_id: userData?.user?.id,
                    has_scratches: values.has_scratches || false,
                    has_cracks: values.has_cracks || false,
                    has_dents: values.has_dents || false,
                    overall_condition: values.overall_condition,
                    notes: values.notes,
                });

            if (error) throw error;

            // Update device status
            await supabaseClient
                .from("devices")
                .update({ status: "in_technical_inspection" })
                .eq("id", deviceId);

            navigate("/warehouse/devices");
        } catch (error) {
            console.error("Error creating inspection:", error);
        }
    };

    return (
        <Create saveButtonProps={saveButtonProps} title="الفحص الخارجي للجهاز">
            <Form {...formProps} layout="vertical" onFinish={handleFinish}>
                <Form.Item label="حالة الجهاز الخارجية">
                    <Form.Item name="has_scratches" valuePropName="checked" noStyle>
                        <Checkbox>يوجد خدوش</Checkbox>
                    </Form.Item>
                    <br />
                    <Form.Item name="has_cracks" valuePropName="checked" noStyle>
                        <Checkbox>يوجد كسور</Checkbox>
                    </Form.Item>
                    <br />
                    <Form.Item name="has_dents" valuePropName="checked" noStyle>
                        <Checkbox>يوجد خبطات</Checkbox>
                    </Form.Item>
                </Form.Item>

                <Form.Item
                    label="التقييم العام"
                    name="overall_condition"
                    rules={[{ required: true, message: "الرجاء تحديد التقييم العام" }]}
                >
                    <Radio.Group>
                        <Radio.Button value="excellent">ممتاز</Radio.Button>
                        <Radio.Button value="good">جيد</Radio.Button>
                        <Radio.Button value="fair">مقبول</Radio.Button>
                        <Radio.Button value="poor">سيء</Radio.Button>
                    </Radio.Group>
                </Form.Item>

                <Form.Item label="صور الجهاز" name="photos">
                    <Upload listType="picture" multiple>
                        <Button icon={<UploadOutlined />}>رفع الصور</Button>
                    </Upload>
                </Form.Item>

                <Form.Item label="ملاحظات إضافية" name="notes">
                    <Input.TextArea rows={4} placeholder="أي ملاحظات أخرى..." />
                </Form.Item>
            </Form>
        </Create>
    );
};
