import { Modal, Form, Radio, Select, Input, message, Button, Space, Divider } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useUpdateMany, useList, useCreate } from "@refinedev/core";
import { useEffect, useState } from "react";

interface DeviceTransferModalProps {
    visible: boolean;
    onCancel: () => void;
    onSuccess: () => void;
    deviceIds: string[];
    excludeDestinations?: ("maintenance" | "branch" | "warehouse")[];
}

export const DeviceTransferModal: React.FC<DeviceTransferModalProps> = ({
    visible,
    onCancel,
    onSuccess,
    deviceIds,
    excludeDestinations = [],
}) => {
    const [form] = Form.useForm();
    const [branchForm] = Form.useForm();
    const { mutate: updateMany, isLoading } = useUpdateMany();
    const { mutate: createBranch, isLoading: isCreatingBranch } = useCreate();

    // Default to the first non-excluded destination
    const defaultDestination = (["warehouse", "branch", "maintenance"] as const).find(d => !excludeDestinations.includes(d)) || "warehouse";

    const [destination, setDestination] = useState<"maintenance" | "branch" | "warehouse">(defaultDestination);
    const [branchModalVisible, setBranchModalVisible] = useState(false);

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

    // Extract unique locations from devices in warehouse (where branch_id is null)
    const existingLocations = Array.from(new Set(
        devicesData?.data
            ?.filter((d: any) => !d.branch_id)
            ?.map((d: any) => d.current_location)
            .filter(Boolean)
    )).map(loc => ({
        label: loc as string,
        value: loc as string,
    }));

    useEffect(() => {
        if (visible) {
            form.resetFields();
            setDestination(defaultDestination);
        }
    }, [visible, form, defaultDestination]);

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
                const selectedBranch = (branchesData?.data as any[])?.find((b: any) => b.id === values.branch_id);
                updateData = {
                    status: "in_branch",
                    branch_id: values.branch_id,
                    current_location: selectedBranch ? `الفرع: ${selectedBranch.name}` : "Branch",
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
            destroyOnHidden
        >
            <Form form={form} layout="vertical" initialValues={{ destination: defaultDestination }}>
                <Form.Item name="destination" label="إلى أين تريد نقل الأجهزة؟">
                    <Radio.Group onChange={(e) => setDestination(e.target.value)}>
                        {!excludeDestinations.includes("warehouse") && <Radio.Button value="warehouse">المخزن</Radio.Button>}
                        {!excludeDestinations.includes("branch") && <Radio.Button value="branch">المبيعات</Radio.Button>}
                        {!excludeDestinations.includes("maintenance") && <Radio.Button value="maintenance">الصيانة</Radio.Button>}
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
                                dropdownRender={(menu) => (
                                    <>
                                        {menu}
                                        <Divider style={{ margin: '8px 0' }} />
                                        <Space style={{ padding: '0 8px 4px' }}>
                                            <Button
                                                type="text"
                                                icon={<PlusOutlined />}
                                                onClick={() => {
                                                    // Trigger the "new location" input focus or just clear existing
                                                    form.setFieldsValue({ existing_location: undefined });
                                                }}
                                                style={{ width: '100%', textAlign: 'left' }}
                                            >
                                                إضافة موقع جديد
                                            </Button>
                                        </Space>
                                    </>
                                )}
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
                            dropdownRender={(menu) => (
                                <>
                                    {menu}
                                    <Divider style={{ margin: '8px 0' }} />
                                    <Space style={{ padding: '0 8px 4px' }}>
                                        <Button
                                            type="text"
                                            icon={<PlusOutlined />}
                                            onClick={() => setBranchModalVisible(true)}
                                            style={{ width: '100%', textAlign: 'left' }}
                                        >
                                            إضافة فرع جديد
                                        </Button>
                                    </Space>
                                </>
                            )}
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

            <Modal
                title="إضافة فرع جديد"
                open={branchModalVisible}
                onCancel={() => setBranchModalVisible(false)}
                onOk={async () => {
                    try {
                        const values = await branchForm.validateFields();
                        createBranch(
                            {
                                resource: "branches",
                                values,
                            },
                            {
                                onSuccess: (data) => {
                                    message.success("تم إضافة الفرع بنجاح");
                                    setBranchModalVisible(false);
                                    branchForm.resetFields();
                                    // Optionally select the new branch automatically
                                    form.setFieldsValue({ branch_id: (data.data as any).id });
                                },
                            }
                        );
                    } catch (error) {
                        console.error("Branch creation failed", error);
                    }
                }}
                confirmLoading={isCreatingBranch}
                okText="إضافة"
                cancelText="إلغاء"
                destroyOnHidden
            >
                <Form form={branchForm} layout="vertical">
                    <Form.Item
                        name="name"
                        label="اسم الفرع"
                        rules={[{ required: true, message: "يرجى إدخال اسم الفرع" }]}
                    >
                        <Input placeholder="مثال: فرع الرياض" />
                    </Form.Item>
                    <Form.Item
                        name="location"
                        label="الموقع"
                    >
                        <Input placeholder="مثال: حي الملك فهد" />
                    </Form.Item>
                </Form>
            </Modal>
        </Modal>
    );
};
