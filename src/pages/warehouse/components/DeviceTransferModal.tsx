import { Modal, Form, Radio, Select, Input, message } from "antd";
import { useUpdateMany, useList } from "@refinedev/core";
import { useEffect, useState } from "react";

interface DeviceTransferModalProps {
    visible: boolean;
    onCancel: () => void;
    onSuccess: () => void;
    deviceIds: string[];
}

export const DeviceTransferModal: React.FC<DeviceTransferModalProps> = ({
    visible,
    onCancel,
    onSuccess,
    deviceIds,
}) => {
    const [form] = Form.useForm();
    const { mutate: updateMany, isLoading } = useUpdateMany();
    const [destination, setDestination] = useState<"maintenance" | "branch" | "warehouse">("warehouse");

    // Fetch branches if destination is branch
    // Assuming 'branches' resource exists. If not, this might need adjustment.
    const { data: branchesData } = useList({
        resource: "branches",
        queryOptions: {
            enabled: destination === "branch",
        },
    });

    // Fetch unique locations for "warehouse" destination
    const { data: devicesData } = useList({
        resource: "devices",
        pagination: { mode: "off" },
        queryOptions: {
            enabled: destination === "warehouse",
        },
    });

    // Extract unique locations from devices
    const existingLocations = Array.from(new Set(devicesData?.data?.map((d: any) => d.current_location).filter(Boolean))).map(loc => ({
        label: loc,
        value: loc,
    }));

    useEffect(() => {
        if (visible) {
            form.resetFields();
            setDestination("warehouse");
        }
    }, [visible, form]);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();

            let updateData: any = {};

            if (destination === "maintenance") {
                updateData = {
                    status: "needs_repair",
                    notes: values.notes ? `Problem: ${values.notes}` : "Transferred to Maintenance",
                    current_location: "Maintenance Center", // Or keep previous?
                };
            } else if (destination === "branch") {
                updateData = {
                    status: "in_branch",
                    branch_id: values.branch_id,
                    current_location: "Branch", // Ideally fetch branch name
                    notes: values.notes,
                };
            } else if (destination === "warehouse") {
                const targetLocation = values.location_name || values.existing_location;
                if (!targetLocation) {
                    message.error("يرجى اختيار موقع أو كتابة موقع جديد");
                    return;
                }

                updateData = {
                    status: "ready_for_sale", // Ensure it stays/becomes ready
                    current_location: targetLocation,
                    notes: values.notes,
                };
            }

            updateMany(
                {
                    resource: "devices",
                    ids: deviceIds,
                    values: updateData,
                },
                {
                    onSuccess: () => {
                        message.success("تم نقل الأجهزة بنجاح");
                        onSuccess();
                        onCancel();
                    },
                    onError: (error) => {
                        console.error("Transfer error", error);
                        message.error("فشل نقل الأجهزة");
                    },
                }
            );
        } catch (error) {
            console.error("Validation failed", error);
        }
    };

    return (
        <Modal
            open={visible}
            title="نقل الأجهزة"
            onCancel={onCancel}
            onOk={handleOk}
            confirmLoading={isLoading}
            okText="نقل"
            cancelText="إلغاء"
            destroyOnClose
        >
            <Form form={form} layout="vertical" initialValues={{ destination: "warehouse" }}>
                <Form.Item name="destination" label="إلى أين تريد نقل الأجهزة؟">
                    <Radio.Group onChange={(e) => setDestination(e.target.value)}>
                        <Radio.Button value="warehouse">موقع آخر بالمخزن</Radio.Button>
                        <Radio.Button value="branch">المبيعات</Radio.Button>
                        <Radio.Button value="maintenance">الصيانة</Radio.Button>
                    </Radio.Group>
                </Form.Item>

                {destination === "warehouse" && (
                    <>
                        <Form.Item
                            name="existing_location"
                            label="اختر من المواقع الموجودة"
                        >
                            <Select
                                allowClear
                                placeholder="اختر موقع..."
                                options={existingLocations}
                                onChange={() => form.setFieldsValue({ location_name: undefined })}
                            />
                        </Form.Item>
                        <Form.Item
                            name="location_name"
                            label="أو اكتب اسم موقع جديد"
                        >
                            <Input
                                placeholder="مثال: رف أ-1"
                                onChange={() => form.setFieldsValue({ existing_location: undefined })}
                            />
                        </Form.Item>
                    </>
                )}

                {destination === "branch" && (
                    <Form.Item
                        name="branch_id"
                        label="اختر الفرع"
                        rules={[{ required: true, message: "يرجى اختيار الفرع" }]}
                    >
                        <Select
                            placeholder="اختر الفرع..."
                            options={branchesData?.data?.map((branch: any) => ({
                                label: branch.name,
                                value: branch.id,
                            }))}
                        />
                    </Form.Item>
                )}

                {destination === "maintenance" && (
                    <p style={{ color: "orange" }}>سيتم تغيير حالة الأجهزة إلى "يحتاج إصلاح" وإرسالها لفريق الصيانة.</p>
                )}

                <Form.Item
                    name="notes"
                    label={destination === "maintenance" ? "وصف المشكلة (Problem Statement)" : "ملاحظات"}
                    rules={[
                        {
                            required: destination === "maintenance",
                            message: "يرجى كتابة وصف المشكلة",
                        }
                    ]}
                >
                    <Input.TextArea
                        rows={3}
                        placeholder={destination === "maintenance" ? "اشرح المشكلة بالتفصيل..." : "أي تفاصيل إضافية..."}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};
