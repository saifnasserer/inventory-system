import React, { useState } from "react";
import { Steps, Button, Space, Card, BackTop, ConfigProvider } from "antd";
import { useUpdate } from "@refinedev/core";
import { message } from "antd";
import { ArrowRightOutlined, ArrowLeftOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { Device } from "../../../types";
import { PhysicalConditionForm } from "./PhysicalConditionForm";
import { HardwareChecklist } from "./HardwareChecklist";
import { InspectionDecision } from "./InspectionDecision";

interface InspectionStepsProps {
    device: Device;
}

export const InspectionSteps: React.FC<InspectionStepsProps> = ({ device }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [physicalData, setPhysicalData] = useState<any>(null);
    const [hardwareData, setHardwareData] = useState<any>(null);

    const { mutate: updateDevice, isLoading } = useUpdate();

    const handlePhysicalFinish = (values: any) => {
        setPhysicalData(values);
        setCurrentStep(1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleHardwareFinish = (values: any) => {
        setHardwareData(values);
        setCurrentStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDecisionFinish = (values: any) => {
        const { decision } = values;
        const newStatus = decision === "maintenance" ? "needs_repair" : "ready_for_sale";

        updateDevice(
            {
                resource: "devices",
                id: device.id,
                values: {
                    status: newStatus,
                    notes: values.reason, // Save the failure reason/note
                    updated_at: new Date().toISOString(),
                },
            },
            {
                onSuccess: () => {
                    message.success("تم تحديث حالة الجهاز بنجاح");
                    setTimeout(() => window.location.reload(), 1000);
                },
            }
        );
    };

    // Form submit triggers
    const triggerSubmit = () => document.querySelector<HTMLFormElement>('form')?.requestSubmit();

    const steps = [
        { title: "الظاهري" },
        { title: "المكونات" },
        { title: "القرار" },
    ];

    return (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 0" }}>
            <div style={{ marginBottom: 48 }}>
                <ConfigProvider theme={{
                    token: {
                        colorPrimary: '#1890ff',
                        colorSplit: 'rgba(0,0,0,0.06)'
                    }
                }}>
                    <Steps current={currentStep} items={steps} />
                </ConfigProvider>
            </div>

            <div style={{ minHeight: "400px" }}>
                {currentStep === 0 && (
                    <div className="fade-in">
                        <PhysicalConditionForm
                            onFinish={handlePhysicalFinish}
                            initialValues={physicalData}
                        />
                    </div>
                )}

                {currentStep === 1 && (
                    <div className="fade-in">
                        <HardwareChecklist
                            device={device}
                            onFinish={handleHardwareFinish}
                            onBack={() => setCurrentStep(0)}
                            initialValues={hardwareData}
                        />
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="fade-in">
                        <InspectionDecision
                            physicalData={physicalData}
                            hardwareData={hardwareData}
                            onFinish={handleDecisionFinish}
                            onBack={() => setCurrentStep(1)}
                            loading={isLoading}
                        />
                    </div>
                )}
            </div>

            {/* Floating/Fixed Action Bar for Mobile Feel, or just bottom bar */}
            <div style={{
                marginTop: 48,
                padding: "24px",
                borderTop: "1px solid #f0f0f0",
                display: "flex",
                justifyContent: "center",
                background: "linear-gradient(to top, #fff 80%, rgba(255,255,255,0))"
            }}>
                <Space size={16}>
                    {currentStep > 0 && (
                        <Button
                            size="large"
                            icon={<ArrowRightOutlined />}
                            onClick={() => setCurrentStep(currentStep - 1)}
                            style={{ borderRadius: "12px", minWidth: "120px", height: "48px" }}
                        >
                            السابق
                        </Button>
                    )}

                    {currentStep < 2 ? (
                        <Button
                            type="primary"
                            size="large"
                            onClick={triggerSubmit}
                            style={{
                                borderRadius: "12px",
                                minWidth: "160px",
                                height: "48px",
                                background: "linear-gradient(90deg, #1890ff 0%, #096dd9 100%)",
                                border: "none",
                                boxShadow: "0 4px 14px rgba(24, 144, 255, 0.3)"
                            }}
                        >
                            التالي <ArrowLeftOutlined />
                        </Button>
                    ) : (
                        <Button
                            type="primary"
                            size="large"
                            loading={isLoading}
                            onClick={triggerSubmit}
                            icon={<CheckCircleOutlined />}
                            style={{
                                borderRadius: "12px",
                                minWidth: "200px",
                                height: "48px",
                                background: "linear-gradient(90deg, #52c41a 0%, #389e0d 100%)",
                                border: "none",
                                boxShadow: "0 4px 14px rgba(82, 196, 26, 0.3)"
                            }}
                        >
                            إنهاء واعتماد
                        </Button>
                    )}
                </Space>
            </div>

            <style>
                {`
                    .fade-in {
                        animation: fadeIn 0.4s ease-out;
                    }
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    /* Override ant radio styles for custom cards */
                    .ant-radio-wrapper {
                        margin-right: 0;
                        white-space: normal;
                    }
                    .ant-radio {
                        display: none; /* Hide default radio circle for card-like feel */
                    }
                `}
            </style>
        </div>
    );
};
