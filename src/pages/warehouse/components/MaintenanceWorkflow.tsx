import React, { useState, useEffect } from "react";
import { Steps, Button, Space, Card, Typography, message, Timeline, Tag, Modal, Input, List, Spin } from "antd";
import { useUpdate, useList, useCreate } from "@refinedev/core";
import {
    ToolOutlined,
    SearchOutlined,
    ExperimentOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    PlusCircleOutlined,
    MedicineBoxOutlined
} from "@ant-design/icons";
import { Device, Repair, SparePartsRequest } from "../../../types";
import { supabaseClient } from "../../../utility/supabaseClient";

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

interface MaintenanceWorkflowProps {
    device: Device;
}

export const MaintenanceWorkflow: React.FC<MaintenanceWorkflowProps> = ({ device }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [repairRecord, setRepairRecord] = useState<Repair | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPartsModalVisible, setIsPartsModalVisible] = useState(false);

    // Fetch or create repair record
    useEffect(() => {
        const fetchRepair = async () => {
            try {
                // Find active repair for this device
                const { data, error } = await supabaseClient
                    .from("repairs")
                    .select("*")
                    .eq("device_id", device.id)
                    .neq("status", "completed")
                    .maybeSingle(); // Use maybeSingle instead of single to avoid error when no record

                if (error) {
                    console.error("Error fetching repair:", error);
                }

                if (data) {
                    console.log("Found existing repair:", data);
                    setRepairRecord(data);
                    mapStatusToStep(data.status);
                } else {
                    console.log("No existing repair found, creating new one");
                    // Create new repair record if none exists (auto-start)
                    const { data: newRepair, error: createError } = await supabaseClient
                        .from("repairs")
                        .insert({
                            device_id: device.id,
                            status: "pending",
                            issue_description: device.notes || "Device sent for maintenance",
                            status_history: [{
                                status: "pending",
                                started_at: new Date().toISOString()
                            }]
                        })
                        .select()
                        .single();

                    if (createError) {
                        console.error("Error creating repair:", createError);
                    }

                    if (!createError && newRepair) {
                        console.log("Created new repair:", newRepair);
                        setRepairRecord(newRepair);
                        setCurrentStep(0);
                    }
                }
            } catch (err) {
                console.error("Error fetching/creating repair:", err);
            } finally {
                setLoading(false);
            }
        };

        if (device.id) fetchRepair();
    }, [device.id]);

    const mapStatusToStep = (status: string) => {
        const statusMap: Record<string, number> = {
            "pending": 0,
            "diagnosing": 1,
            "waiting_for_parts": 2,
            "in_progress": 3,
            "testing": 4,
            "completed": 5
        };
        setCurrentStep(statusMap[status] || 0);
    };

    const updateStatus = async (newStatus: string) => {
        if (!repairRecord) return;

        setLoading(true);

        // Get current status_history or initialize empty array
        const currentHistory = repairRecord.status_history || [];

        // Close the previous status entry by setting ended_at
        const updatedHistory = currentHistory.map((entry: any) => {
            if (!entry.ended_at && entry.status === repairRecord.status) {
                return { ...entry, ended_at: new Date().toISOString() };
            }
            return entry;
        });

        // Add new status entry with started_at
        updatedHistory.push({
            status: newStatus,
            started_at: new Date().toISOString(),
        });

        const { error } = await supabaseClient
            .from("repairs")
            .update({
                status: newStatus,
                status_history: updatedHistory,
                updated_at: new Date().toISOString()
            })
            .eq("id", repairRecord.id);

        if (!error) {
            setRepairRecord({ ...repairRecord, status: newStatus, status_history: updatedHistory } as any);
            mapStatusToStep(newStatus);
            message.success("تم تحديث حالة الصيانة");
        } else {
            message.error("فشل تحديث الحالة");
        }
        setLoading(false);
    };

    const steps = [
        { title: "استلام", icon: <ClockCircleOutlined /> },
        { title: "تشخيص", icon: <SearchOutlined /> },
        { title: "قطاع غيار", icon: <MedicineBoxOutlined /> },
        { title: "إصلاح", icon: <ToolOutlined /> },
        { title: "اختبار", icon: <ExperimentOutlined /> },
        { title: "تم", icon: <CheckCircleOutlined /> },
    ];

    if (loading && !repairRecord) return <div style={{ padding: 40, textAlign: "center" }}><Spin size="large" /></div>;

    return (
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px" }}>
            <Title level={3}>دورة حياة الصيانة</Title>
            <Text type="secondary" style={{ marginBottom: 24, display: "block" }}>
                تتبع حالة إصلاح الجهاز وطلب قطع الغيار
            </Text>

            <Card style={{ marginBottom: 24, borderRadius: 16 }}>
                <Steps
                    current={currentStep}
                    items={steps.map(s => ({ title: s.title, icon: s.icon }))}
                    style={{ marginBottom: 24 }}
                />

                <div style={{
                    minHeight: 200,
                    backgroundColor: "#f9f9f9",
                    borderRadius: 12,
                    padding: 24,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px dashed #d9d9d9"
                }}>
                    <CurrentStepContent
                        step={currentStep}
                        device={device}
                        onNext={(nextStatus: string) => updateStatus(nextStatus)}
                        onOpenParts={() => setIsPartsModalVisible(true)}
                    />
                </div>
            </Card>

            {/* Spare Parts Section */}
            {repairRecord && (
                <SparePartsList repairId={repairRecord.id} />
            )}

            <PartsRequestModal
                visible={isPartsModalVisible}
                onClose={() => setIsPartsModalVisible(false)}
                repairId={repairRecord?.id}
            />
        </div>
    );
};

const CurrentStepContent = ({ step, onNext, onOpenParts, device }: { step: number; onNext: (status: string) => void; onOpenParts: () => void; device: Device }) => {
    switch (step) {
        case 0:
            return (
                <div style={{ textAlign: "center" }}>
                    <Title level={4}>في انتظار الفحص الأولي</Title>
                    {device?.notes && (
                        <div style={{
                            backgroundColor: "#fff7e6",
                            padding: "16px",
                            borderRadius: "12px",
                            marginBottom: "20px",
                            border: "1px solid #ffd591"
                        }}>
                            <Text strong style={{ color: "#d46b08", display: "block", marginBottom: "8px" }}>
                                وصف المشكلة:
                            </Text>
                            <Text style={{ fontSize: "16px", color: "#595959" }}>
                                {device.notes}
                            </Text>
                        </div>
                    )}
                    <Button type="primary" size="large" onClick={() => onNext("diagnosing")}>
                        بدء التشخيص
                    </Button>
                </div>
            );
        case 1:
            return (
                <div style={{ textAlign: "center" }}>
                    <Title level={4}>جاري تحديد المشكلة (Diagnosing)</Title>
                    <Space size="middle">
                        <Button type="default" onClick={() => onNext("waiting_for_parts")}>
                            طلب قطع غيار
                        </Button>
                        <Button type="primary" onClick={() => onNext("in_progress")}>
                            المشكلة محددة - بدء الإصلاح
                        </Button>
                    </Space>
                </div>
            );
        case 2:
            return (
                <div style={{ textAlign: "center" }}>
                    <Title level={4} style={{ color: "#faad14" }}>في انتظار قطع الغيار</Title>
                    <Paragraph>قم بطلب القطع اللازمة من زر الطلب بالأسفل</Paragraph>
                    <Space>
                        <Button icon={<PlusCircleOutlined />} onClick={onOpenParts}>
                            طلب قطعة غيار
                        </Button>
                        <Button type="primary" onClick={() => onNext("in_progress")}>
                            وصلت القطع - بدء الإصلاح
                        </Button>
                    </Space>
                </div>
            );
        case 3:
            return (
                <div style={{ textAlign: "center" }}>
                    <Title level={4} style={{ color: "#1890ff" }}>جاري الإصلاح (In Progress)</Title>
                    <Button type="dashed" size="large" onClick={() => onNext("testing")}>
                        انتهاء الإصلاح - الانتقال للاختبار
                    </Button>
                </div>
            );
        case 4:
            return (
                <div style={{ textAlign: "center" }}>
                    <Title level={4} style={{ color: "#722ed1" }}>اختبار الجودة (QA)</Title>
                    <Button
                        type="primary"
                        size="large"
                        onClick={async () => {
                            // Update repair status to completed
                            await onNext("completed");

                            // Update device status to ready_for_sale
                            const { error } = await supabaseClient
                                .from("devices")
                                .update({ status: "ready_for_sale", current_location: "warehouse" })
                                .eq("id", device.id);

                            if (!error) {
                                message.success("تم إنهاء الصيانة بنجاح! الجهاز جاهز للبيع");
                                setTimeout(() => window.location.href = "/warehouse/devices", 1500);
                            }
                        }}
                        style={{ background: "#52c41a", borderColor: "#52c41a" }}
                    >
                        اجتاز الاختبار - إنهاء
                    </Button>
                </div>
            );
        default:
            return <Title level={4} type="success">تمت الصيانة بنجاح ✅</Title>;
    }
};

const SparePartsList = ({ repairId }: { repairId: string }) => {
    const { data, isLoading } = useList<SparePartsRequest>({
        resource: "spare_parts_requests", // Make sure this resource is in App.tsx
        filters: [{ field: "repair_id", operator: "eq", value: repairId }]
    });

    if (isLoading) return null;
    const parts = data?.data || [];

    return (
        <Card title="طلبات قطع الغيار" style={{ marginTop: 24, borderRadius: 16 }}>
            {parts.length === 0 ? (
                <EmptyState />
            ) : (
                <List
                    itemLayout="horizontal"
                    dataSource={parts}
                    renderItem={(item) => (
                        <List.Item>
                            <List.Item.Meta
                                avatar={<MedicineBoxOutlined style={{ fontSize: 24, color: "#1890ff" }} />}
                                title={item.part_name}
                                description={`الكمية: ${item.quantity} - الحالة: ${item.status}`}
                            />
                            {item.status === 'pending' && <Tag color="orange">قيد الانتظار</Tag>}
                            {item.status === 'approved' && <Tag color="green">تمت الموافقة</Tag>}
                        </List.Item>
                    )}
                />
            )}
        </Card>
    );
};

const EmptyState = () => (
    <div style={{ textAlign: "center", padding: "20px", color: "#ccc" }}>
        لا توجد طلبات قطع غيار
    </div>
);

const PartsRequestModal = ({ visible, onClose, repairId }: any) => {
    const { mutate: createRequest, isLoading } = useCreate();
    const [partName, setPartName] = useState("");
    const [reason, setReason] = useState("");
    const [qty, setQty] = useState(1);

    // Get current user (simple fix: assume logged in user, logic handled by backend mostly or context)
    // For now we omit requested_by or let backend handle default if possible, or pass it in.

    const handleSubmit = () => {
        if (!partName) return message.error("اسم القطعة مطلوب");

        createRequest({
            resource: "spare_parts_requests",
            values: {
                repair_id: repairId,
                part_name: partName,
                notes: reason,
                quantity: qty,
                status: "pending",
                // requested_by column relies on RLS auth.uid() default or manual from Identity.
                // We'll trust the backend/RLS or add it if needed. For now simplest approach.
            },
            successNotification: () => ({ message: "تم إرسال الطلب بنجاح", type: "success" })
        }, {
            onSuccess: () => {
                setPartName("");
                setReason("");
                setQty(1);
                onClose();
            }
        });
    };

    return (
        <Modal
            title="طلب قطعة غيار"
            open={visible}
            onCancel={onClose}
            onOk={handleSubmit}
            confirmLoading={isLoading}
        >
            <Space direction="vertical" style={{ width: "100%" }}>
                <div>
                    <Text strong>اسم القطعة</Text>
                    <Input placeholder="مثال: شاشة LCD" value={partName} onChange={e => setPartName(e.target.value)} />
                </div>
                <div>
                    <Text strong>الكمية</Text>
                    <Input type="number" value={qty} onChange={e => setQty(parseInt(e.target.value))} />
                </div>
                <div>
                    <Text strong>سبب الطلب / ملاحظات</Text>
                    <TextArea rows={3} value={reason} onChange={e => setReason(e.target.value)} />
                </div>
            </Space>
        </Modal>
    );
};
