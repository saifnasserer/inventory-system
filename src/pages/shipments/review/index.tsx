import React, { useState } from "react";
import { useOne, useUpdate } from "@refinedev/core";
import { useParams, useNavigate } from "react-router-dom";
import { Steps, Card, Typography, Row, Col, Tag, Divider, Button, List, Spin, Result, Descriptions, Alert, message, Modal } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined, DesktopOutlined, ExperimentOutlined, AuditOutlined, WarningOutlined } from "@ant-design/icons";

import { Device } from "../../../types";

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

interface DiagnosticReport {
    id: string;
    report_id: string;
    score_percent: number;
    generated_at: string;
    cosmetic_grade: string;
    hardware_specs?: any;
    test_results?: any[];
}

export const ReviewReport: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const { mutate: updateDevice, isLoading: isUpdating } = useUpdate();

    const { data, isLoading, isError } = useOne<Device>({
        resource: "devices",
        id,
    });

    const device = data?.data;

    const { data: reportData, isLoading: isReportLoading } = useOne<DiagnosticReport>({
        resource: "diagnostic_reports",
        id: device?.latest_report_id || "",
        queryOptions: {
            enabled: !!device?.latest_report_id,
        },
    });

    const report = reportData?.data;
    const specs = report?.hardware_specs;
    const results = report?.test_results || [];

    const handleDecision = (decision: "stock" | "maintenance" | "return") => {
        let status = "ready_for_sale";
        let successMessage = "تم نقل الجهاز إلى المخزن بنجاح";

        if (decision === "maintenance") {
            status = "needs_repair";
            successMessage = "تم إرسال الجهاز للصيانة";
        } else if (decision === "return") {
            status = "returned";
            successMessage = "تم تحديد الجهاز للإرجاع للمورد";
        }

        updateDevice({
            resource: "devices",
            id: id!,
            values: {
                status: status,
            },
        }, {
            onSuccess: () => {
                message.success(successMessage);
                navigate("/receiving/shipments");
            }
        });
    };

    if (isLoading || isReportLoading) return <div style={{ display: "flex", justifyContent: "center", paddingTop: 50 }}><Spin size="large" /></div>;
    if (isError || !device) return <Result status="404" title="الجهاز غير موجود" />;

    if (!report) return (
        <div style={{ padding: 24 }}>
            <Alert message="لم يتم العثور على تقرير فحص" description="لا يوجد تقرير فحص مرفوع لهذا الجهاز." type="warning" showIcon />
            <Button style={{ marginTop: 16 }} onClick={() => navigate(-1)}>الرجوع للخلف</Button>
        </div>
    );

    const steps = [
        {
            title: "التحقق من المواصفات",
            icon: <DesktopOutlined />,
            content: (
                <Row gutter={[24, 24]}>
                    <Col span={24}>
                        <Card title="بيانات النظام" bordered={false} className="shadow-sm">
                            <Descriptions bordered column={{ xxl: 3, xl: 3, lg: 2, md: 1, sm: 1, xs: 1 }}>
                                <Descriptions.Item label="الموديل">{specs?.model || device.model}</Descriptions.Item>
                                <Descriptions.Item label="المصنع">{specs?.manufacturer || device.manufacturer}</Descriptions.Item>
                                <Descriptions.Item label="الرقم التسلسلي">{specs?.bios_serial || device.serial_number}</Descriptions.Item>
                                <Descriptions.Item label="المعالج">{specs?.cpu_name}</Descriptions.Item>
                                <Descriptions.Item label="الرامات">{specs?.memory_total_gb} GB ({specs?.memory_type})</Descriptions.Item>
                                <Descriptions.Item label="التخزين">
                                    {specs?.storage_devices?.map((d: any) => `${d.size} ${d.type}`).join(", ")}
                                </Descriptions.Item>
                                <Descriptions.Item label="صحة البطارية">
                                    <Tag color={specs?.battery_health_percent > 80 ? "green" : specs?.battery_health_percent > 50 ? "orange" : "red"}>
                                        {specs?.battery_health_percent}%
                                    </Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="تقييم الحالة">
                                    <Tag color="purple" style={{ fontSize: 16, padding: "4px 10px" }}>{report.cosmetic_grade}</Tag>
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>
                    </Col>
                </Row>
            )
        },
        {
            title: "نتائج الفحص",
            icon: <ExperimentOutlined />,
            content: (
                <Card title={`درجة الفحص: ${report.score_percent || 0}/100`} bordered={false} className="shadow-sm">
                    <List
                        grid={{ gutter: 16, column: 1 }}
                        dataSource={results}
                        renderItem={(item: any) => (
                            <List.Item>
                                <Card size="small" style={{ borderLeft: `4px solid ${item.status === 'success' || item.status === 'pass' ? '#52c41a' : '#ff4d4f'}` }}>
                                    <Row justify="space-between" align="middle">
                                        <Col>
                                            <Text strong style={{ fontSize: 16 }}>{item.test_name}</Text>
                                            <br />
                                            <Text type="secondary">{item.message}</Text>
                                        </Col>
                                        <Col>
                                            {item.status === 'success' || item.status === 'pass' ?
                                                <Tag icon={<CheckCircleOutlined />} color="success">ناجح</Tag> :
                                                <Tag icon={<CloseCircleOutlined />} color="error">فاشل</Tag>
                                            }
                                        </Col>
                                    </Row>
                                </Card>
                            </List.Item>
                        )}
                    />
                </Card>
            )
        },
        {
            title: "القرار النهائي",
            icon: <AuditOutlined />,
            content: (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <Title level={3}>جاهز للاعتماد؟</Title>
                    <Paragraph type="secondary">بناءً على المواصفات ونتائج الاختبارات، يرجى تحديد الوجهة القادمة لهذا الجهاز.</Paragraph>

                    <Row gutter={24} justify="center" style={{ marginTop: 40 }}>
                        <Col>
                            <Button
                                type="primary"
                                size="large"
                                icon={<CheckCircleOutlined />}
                                style={{ backgroundColor: "#52c41a", height: "auto", padding: "10px 30px" }}
                                onClick={() => Modal.confirm({
                                    title: "تأكيد الإرسال للمخزن",
                                    content: "هل أنت متأكد من نقل الجهاز إلى المخزن؟ سيكون جاهزاً للبيع فوراً.",
                                    okText: "تأكيد",
                                    cancelText: "إلغاء",
                                    onOk: () => handleDecision("stock")
                                })}
                            >
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                    <span style={{ fontSize: 18, fontWeight: "bold" }}>إلى المخزن</span>
                                    <span style={{ fontSize: 12, opacity: 0.8 }}>(جاهز للبيع)</span>
                                </div>
                            </Button>
                        </Col>
                        <Col>
                            <Button
                                type="primary"
                                danger
                                size="large"
                                icon={<WarningOutlined />}
                                style={{ backgroundColor: "#faad14", borderColor: "#faad14", height: "auto", padding: "10px 30px" }}
                                onClick={() => Modal.confirm({
                                    title: "إرسال للصيانة",
                                    content: "هل تريد إرسال هذا الجهاز لقسم الصيانة والقطع؟",
                                    okText: "تأكيد",
                                    cancelText: "إلغاء",
                                    onOk: () => handleDecision("maintenance")
                                })}
                            >
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                    <span style={{ fontSize: 18, fontWeight: "bold" }}>إلى الصيانة</span>
                                    <span style={{ fontSize: 12, opacity: 0.8 }}>يحتاج إصلاح أو تنظيف</span>
                                </div>
                            </Button>
                        </Col>
                        <Col>
                            <Button
                                type="primary"
                                danger
                                size="large"
                                icon={<CloseCircleOutlined />}
                                style={{ height: "auto", padding: "10px 30px" }}
                                onClick={() => Modal.confirm({
                                    title: "تأكيد الإرجاع",
                                    content: "هل تريد إرجاع هذا الجهاز للمورد؟",
                                    okText: "تأكيد",
                                    cancelText: "إلغاء",
                                    onOk: () => handleDecision("return")
                                })}
                            >
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                    <span style={{ fontSize: 18, fontWeight: "bold" }}>إرجاع للمورد</span>
                                    <span style={{ fontSize: 12, opacity: 0.8 }}>فشل حرج أو صنف غير مطابق</span>
                                </div>
                            </Button>
                        </Col>
                    </Row>
                </div>
            )
        }
    ];

    return (
        <div style={{ padding: 24, paddingBottom: 100 }}>
            <div style={{ marginBottom: 24 }}>
                <Button onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>الرجوع للقائمة</Button>
                <Title level={4}>مراجعة تقرير الفحص الفني</Title>
                <Text type="secondary">رقم الأصل: <Text strong>{device.asset_id}</Text></Text>
            </div>

            <Steps current={currentStep} onChange={setCurrentStep}>
                {steps.map(item => (
                    <Step key={item.title} title={item.title} icon={item.icon} />
                ))}
            </Steps>

            <Divider />

            <div style={{ minHeight: 400 }}>
                {steps[currentStep].content}
            </div>

            <div style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                padding: "16px 40px",
                background: "#fff",
                borderTop: "1px solid #f0f0f0",
                display: "flex",
                justifyContent: "flex-end",
                gap: 16,
                zIndex: 1000,
                paddingLeft: 220
            }}>
                {currentStep > 0 && (
                    <Button onClick={() => setCurrentStep(currentStep - 1)}>
                        السابق
                    </Button>
                )}
                {currentStep < steps.length - 1 && (
                    <Button type="primary" onClick={() => setCurrentStep(currentStep + 1)}>
                        التالي
                    </Button>
                )}
            </div>
        </div>
    );
};
