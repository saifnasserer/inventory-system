import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Radio, Checkbox, Rate, Upload, Button, App } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useParams, useNavigate } from "react-router";
import { useUpdate, useCreate, useGetIdentity } from "@refinedev/core";

export const PhysicalInspectionCreate: React.FC = () => {
    const { deviceId } = useParams();
    const navigate = useNavigate();
    const { message } = App.useApp();
    const { data: identity } = useGetIdentity<any>();

    const { formProps, saveButtonProps, formLoading } = useForm({
        resource: "physical-inspections",
        action: "create",
        redirect: false,
    });

    const { mutateAsync: updateDevice } = useUpdate();
    const { mutateAsync: createInspection } = useCreate();

    const handleFinish = async (values: any) => {
        try {
            // 1. Create physical inspection
            await createInspection({
                resource: "physical-inspections",
                values: {
                    device_id: deviceId,
                    inspector_id: identity?.id,
                    has_scratches: values.has_scratches || false,
                    has_cracks: values.has_cracks || false,
                    has_dents: values.has_dents || false,
                    overall_condition: values.overall_condition,
                    notes: values.notes,
                    photos: values.photos, // This might need server-side file handling if actually uploading
                },
            });

            // 2. Update device status to next step (technical inspection)
            await updateDevice({
                resource: "devices",
                id: deviceId as string,
                values: {
                    status: "in_technical_inspection",
                },
            });

            message.success("تم تسجيل الفحص الخارجي بنجاح");
            navigate("/warehouse/devices");
        } catch (error: any) {
            console.error("Error creating physical inspection:", error);
            message.error(error.message || "حدث خطأ أثناء تسجيل الفحص");
        }
    };

    return (
        <Create saveButtonProps={saveButtonProps} title="الفحص الخارجي للجهاز" isLoading={formLoading}>
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
