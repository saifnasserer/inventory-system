import React, { useState } from "react";
import { Modal, Form, Select, Input, message } from "antd";
import { useList, useCreate, useGetIdentity } from "@refinedev/core";
import { User, DeviceAssignment } from "../../../types";

const { TextArea } = Input;

interface DeviceAssignmentModalProps {
    visible: boolean;
    onCancel: () => void;
    deviceIds: string[];
    onSuccess: () => void;
    allowedRoles?: string[];
}

export const DeviceAssignmentModal: React.FC<DeviceAssignmentModalProps> = ({
    visible,
    onCancel,
    deviceIds,
    onSuccess,
    allowedRoles,
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const { data: identity } = useGetIdentity<{ id: string }>();

    // Fetch employees (warehouse staff, technicians, etc.)
    const { data: usersData, isLoading: usersLoading } = useList<User>({
        resource: "users",
        filters: [
            {
                field: "role",
                operator: "in",
                value: allowedRoles || ["warehouse_staff", "technician", "warehouse_manager", "repair_manager"],
            },
        ],
        pagination: {
            mode: "off",
        },
    });

    const { mutateAsync: createAssignment } = useCreate<DeviceAssignment>();

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            // Create assignments for all selected devices
            const promises = deviceIds.map((deviceId) =>
                createAssignment({
                    resource: "device_assignments",
                    values: {
                        device_id: deviceId,
                        assigned_to: values.assigned_to,
                        assigned_by: identity?.id,
                        status: "active",
                        notes: values.notes,
                    },
                })
            );

            await Promise.all(promises);

            message.success(
                deviceIds.length === 1
                    ? "تم تعيين الجهاز بنجاح"
                    : `تم تعيين ${deviceIds.length} أجهزة بنجاح`
            );

            onSuccess();
            onCancel();
        } catch (error) {
            console.error("Assignment error:", error);
            // Only show error if it's not a validation error (validation errors are handled by Form automatically mostly)
            if (!(error as any).errorFields) {
                message.error("فشل في تعيين الأجهزة");
            }
        } finally {
            setLoading(false);
        }
    };

    const users = usersData?.data || [];

    return (
        <Modal
            title={deviceIds.length === 1 ? "تعيين جهاز" : `تعيين ${deviceIds.length} أجهزة`}
            open={visible}
            onCancel={onCancel}
            onOk={handleSubmit}
            confirmLoading={loading}
            okText="تعيين"
            cancelText="إلغاء"
            width={500}
            destroyOnClose
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    name="assigned_to"
                    label="الموظف"
                    rules={[{ required: true, message: "يرجى اختيار موظف" }]}
                >
                    <Select
                        placeholder="اختر موظف"
                        loading={usersLoading}
                        showSearch
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                            String(option?.children || "").toLowerCase().includes(input.toLowerCase())
                        }
                    >
                        {users.map((user) => (
                            <Select.Option key={user.id} value={user.id}>
                                {user.full_name} ({getRoleLabel(user.role)})
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item name="notes" label="ملاحظات">
                    <TextArea rows={3} placeholder="أضف ملاحظات (اختياري)" />
                </Form.Item>
            </Form>
        </Modal>
    );
};

function getRoleLabel(role: string): string {
    const roleLabels: Record<string, string> = {
        warehouse_staff: "موظف مخزن",
        technician: "فني صيانة",
        warehouse_manager: "مسؤول مخزن",
        repair_manager: "مدير صيانة",
    };
    return roleLabels[role] || role;
}
