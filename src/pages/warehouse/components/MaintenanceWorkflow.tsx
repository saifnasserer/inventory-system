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

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

interface MaintenanceWorkflowProps {
    device: Array<Device> | Device; // Handle potential array if useList is used
}

export const MaintenanceWorkflow: React.FC<{ device: Device }> = ({ device }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [repairRecord, setRepairRecord] = useState<Repair | null>(null);
    const [isPartsModalVisible, setIsPartsModalVisible] = useState(false);

    const { data: listData, isLoading: listLoading, refetch } = useList<Repair>({
        resource: "repairs",
        filters: [
            { field: "device_id", operator: "eq", value: device.id },
            { field: "status", operator: "ne", value: "completed" }
        ],
        pagination: { pageSize: 1, mode: "client" },
        queryOptions: {
            enabled: !!device.id
        }
    });

    const { mutate: createRepair, isLoading: creatingRepair } = useCreate<Repair>();
    const { mutate: updateRepair, isLoading: updatingRepair } = useUpdate<Repair>();

    const loading = listLoading || creatingRepair || updatingRepair;

    useEffect(() => {
        if (!listLoading && listData) {
            const existingRepair = listData.data[0];
            if (existingRepair) {
                setRepairRecord(existingRepair);
                mapStatusToStep(existingRepair.status);
            } else if (!creatingRepair && !repairRecord) {
                // Auto-create repair if none exists
                createRepair({
                    resource: "repairs",
                    values: {
                        device_id: device.id,
                        status: "pending",
                        issue_description: device.notes || "Device sent for maintenance",
                    }
                }, {
                    onSuccess: (data) => {
                        setRepairRecord(data.data as any);
                        setCurrentStep(0);
                    }
                });
            }
        }
    }, [listData, listLoading, device.id]);

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

        updateRepair({
            resource: "repairs",
            id: repairRecord.id,
            values: {
                status: newStatus,
            }
        }, {
            onSuccess: (data) => {
                setRepairRecord(data.data as any);
                mapStatusToStep(newStatus);
                message.success("تم تحديث حالة الصيانة");
            },
            onError: () => {
                message.error("فشل تحديث الحالة");
            }
        });
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
    const { mutate: updateDevice } = useUpdate();

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
                            updateDevice({
                                resource: "devices",
                                id: device.id,
                                values: {
                                    status: "ready_for_sale",
                                    current_location: "warehouse"
                                }
                            }, {
                                onSuccess: () => {
                                    message.success("تم إنهاء الصيانة بنجاح! الجهاز جاهز للبيع");
                                    setTimeout(() => window.location.href = "/warehouse/devices", 1500);
                                }
                            });
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
        resource: "spare-parts-requests",
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

    const handleSubmit = () => {
        if (!partName) return message.error("اسم القطعة مطلوب");

        createRequest({
            resource: "spare-parts-requests",
            values: {
                repair_id: repairId,
                part_name: partName,
                notes: reason,
                quantity: qty,
                status: "pending",
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
