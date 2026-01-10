import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Select } from "antd";

export const CompanyCreate: React.FC = () => {
    const { formProps, saveButtonProps } = useForm();

    return (
        <Create saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout="vertical">
                <Form.Item
                    label="Company Name"
                    name="name"
                    rules={[
                        {
                            required: true,
                        },
                    ]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    label="Status"
                    name="status"
                    initialValue="active"
                    rules={[
                        {
                            required: true,
                        },
                    ]}
                >
                    <Select
                        options={[
                            { label: "Active", value: "active" },
                            { label: "Inactive", value: "inactive" },
                        ]}
                    />
                </Form.Item>
                <Form.Item
                    label="Subscription Plan"
                    name="subscription_plan"
                    initialValue="free"
                >
                    <Select
                        options={[
                            { label: "Free", value: "free" },
                            { label: "Pro", value: "pro" },
                            { label: "Enterprise", value: "enterprise" },
                        ]}
                    />
                </Form.Item>
            </Form>
        </Create>
    );
};
