import { Modal, Form, Input, App } from "antd";
import { useCreate } from "@refinedev/core";

interface VendorCreateModalProps {
    visible: boolean;
    onCancel: () => void;
    onSuccess: (vendor: any) => void;
}

export const VendorCreateModal: React.FC<VendorCreateModalProps> = ({
    visible,
    onCancel,
    onSuccess,
}) => {
    const [form] = Form.useForm();
    const { mutate: createVendor, isLoading } = useCreate();
    const { message } = App.useApp();

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            createVendor(
                {
                    resource: "vendors",
                    values,
                },
                {
                    onSuccess: (data) => {
                        message.success("تم إضافة المورد بنجاح");
                        onSuccess(data.data);
                        form.resetFields();
                    },
                }
            );
        } catch (error) {
            console.error("Vendor creation failed", error);
        }
    };

    return (
        <Modal
            title="إضافة مورد جديد"
            open={visible}
            onCancel={onCancel}
            onOk={handleOk}
            confirmLoading={isLoading}
            okText="إضافة"
            cancelText="إلغاء"
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    name="name"
                    label="اسم المورد"
                    rules={[{ required: true, message: "يرجى إدخال اسم المورد" }]}
                >
                    <Input placeholder="مثال: شركة التقنية العالمية" />
                </Form.Item>
                <Form.Item
                    name="contact_person"
                    label="الشخص المسؤول"
                >
                    <Input placeholder="اسم جهة الاتصال" />
                </Form.Item>
                <Form.Item
                    name="contact_phone"
                    label="رقم الهاتف"
                >
                    <Input placeholder="رقم التواصل" />
                </Form.Item>
            </Form>
        </Modal>
    );
};
