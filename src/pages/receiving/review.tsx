import React, { useState } from "react";
import { useOne, useUpdate } from "@refinedev/core";
import { useParams } from "react-router-dom";
import { Steps, Card, Typography, Row, Col, Tag, Divider, Button, List, Spin, Result, Descriptions, Alert, message, Modal } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined, SaveOutlined, WarningOutlined, DesktopOutlined, FileDoneOutlined, ExperimentOutlined, AuditOutlined } from "@ant-design/icons";
import { Device } from "../../types";

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
    const [currentStep, setCurrentStep] = useState(0);
    const { mutate: updateDevice, isLoading: isUpdating } = useUpdate();

    // Fetch device with report details
    const { data, isLoading, isError } = useOne<Device & { latest_report: DiagnosticReport }>({
        resource: "devices",
        id,
        meta: {
            // Ensure backend includes latest_report relation
        }
    });

    const device = data?.data;
    // Mocking report data until backend relation is fully set up if needed, 
    // but assuming useOne fetches joined data if the backend supports it. 
    // If not, we might need a separate call for the report.
    // Ideally we fetch: GET /devices/:id?include=latest_report.hardware_specs,latest_report.test_results

    // FOR NOW: Let's assume we need to fetch the report separately if not included,
    // or we can use a custom hook. But let's proceed assuming we can get the report ID from the device 
    // and fetch the full report.

    // Actually, let's simplify and assume we'll fetch the report by ID if we had it, but 
    // let's try to fetch the report using the backend custom route or just rely on the device's latest_report
    // if the backend `devices` show endpoint was updated. 
    // Since we didn't update `devices` show endpoint yet, let's fetch the report directly using a custom query 
    // if we know the ID or just list reports for this device.

    // Better approach matching Refine:
    // We'll fetch the report using `useList` on `diagnostic_reports` filtering by `device_id`.

    const { data: reportData, isLoading: isReportLoading } = useOne({
        resource: "diagnostic_reports",
        id: device?.latest_report_id || "",
        queryOptions: {
            enabled: !!device?.latest_report_id,
        },
        meta: {
            // Provide include parameter if your data provider supports it
            // otherwise we depend on default response
        }
    });

    const report = reportData?.data;
    const specs = report?.hardware_specs;
    const results = report?.test_results || [];

    const handleDecision = (decision: "stock" | "maintenance" | "return") => {
        let status = "ready_for_sale";
        let successMessage = "Device moved to stock successfully";

        if (decision === "maintenance") {
            status = "needs_repair";
            successMessage = "Device sent to maintenance";
        } else if (decision === "return") {
            status = "returned";
            successMessage = "Device marked for return";
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
                window.location.href = "/receiving/shipments";
            }
        });
    };

    if (isLoading || isReportLoading) return <div style={{ display: "flex", justifyContent: "center", paddingTop: 50 }}><Spin size="large" /></div>;
    if (isError || !device) return <Result status="404" title="Device not found" />;
    if (!report) return (
        <div style={{ padding: 24 }}>
            <Alert message="No Diagnostic Report Found" description="This device does not have an uploaded diagnostic report." type="warning" showIcon />
            <Button style={{ marginTop: 16 }} onClick={() => window.history.back()}>Go Back</Button>
        </div>
    );

    const steps = [
        {
            title: "Specs Verification",
            icon: <DesktopOutlined />,
            content: (
                <Row gutter={[24, 24]}>
                    <Col span={24}>
                        <Card title="System Information" bordered={false} className="shadow-sm">
                            <Descriptions bordered column={{ xxl: 3, xl: 3, lg: 2, md: 1, sm: 1, xs: 1 }}>
                                <Descriptions.Item label="Model">{specs?.model || device.model}</Descriptions.Item>
                                <Descriptions.Item label="Manufacturer">{specs?.manufacturer || device.manufacturer}</Descriptions.Item>
                                <Descriptions.Item label="Serial Number">{specs?.bios_serial || device.serial_number}</Descriptions.Item>
                                <Descriptions.Item label="CPU">{specs?.cpu_name}</Descriptions.Item>
                                <Descriptions.Item label="RAM">{specs?.memory_total_gb} GB ({specs?.memory_type})</Descriptions.Item>
                                <Descriptions.Item label="Storage">
                                    {specs?.storage_devices?.map((d: any) => `${d.size} ${d.type}`).join(", ")}
                                </Descriptions.Item>
                                <Descriptions.Item label="Battery Health">
                                    <Tag color={specs?.battery_health_percent > 80 ? "green" : specs?.battery_health_percent > 50 ? "orange" : "red"}>
                                        {specs?.battery_health_percent}%
                                    </Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Cosmetic Grade">
                                    <Tag color="purple" style={{ fontSize: 16, padding: "4px 10px" }}>{report.cosmetic_grade}</Tag>
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>
                    </Col>
                </Row>
            )
        },
        {
            title: "Test Results",
            icon: <ExperimentOutlined />,
            content: (
                <Card title={`Diagnostic Score: ${report.score_percent || 0}/100`} bordered={false} className="shadow-sm">
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
                                                <Tag icon={<CheckCircleOutlined />} color="success">PASS</Tag> :
                                                <Tag icon={<CloseCircleOutlined />} color="error">FAIL</Tag>
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
            title: "Final Decision",
            icon: <AuditOutlined />,
            content: (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <Title level={3}>Ready to Process?</Title>
                    <Paragraph type="secondary">Based on the specifications and test results, please select the next destination for this device.</Paragraph>

                    <Row gutter={24} justify="center" style={{ marginTop: 40 }}>
                        <Col>
                            <Button
                                type="primary"
                                size="large"
                                icon={<CheckCircleOutlined />}
                                style={{ backgroundColor: "#52c41a", height: "auto", padding: "10px 30px" }}
                                onClick={() => Modal.confirm({
                                    title: "Confirm Stock",
                                    content: "Are you sure you want to move this device to ready for sale stock?",
                                    onOk: () => handleDecision("stock")
                                })}
                            >
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                    <span style={{ fontSize: 18, fontWeight: "bold" }}>Accept to Stock</span>
                                    <span style={{ fontSize: 12, opacity: 0.8 }}>Device is in good condition</span>
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
                                    title: "Confirm Maintenance",
                                    content: "Are you sure you want to send this device to maintenance?",
                                    onOk: () => handleDecision("maintenance")
                                })}
                            >
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                    <span style={{ fontSize: 18, fontWeight: "bold" }}>Maintenance</span>
                                    <span style={{ fontSize: 12, opacity: 0.8 }}>Needs repair or cleaning</span>
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
                                    title: "Confirm Return",
                                    content: "Are you sure you want to return this device to the vendor?",
                                    onOk: () => handleDecision("return")
                                })}
                            >
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                    <span style={{ fontSize: 18, fontWeight: "bold" }}>Reject / Return</span>
                                    <span style={{ fontSize: 12, opacity: 0.8 }}>Critical failure or wrong item</span>
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
                <Button onClick={() => window.history.back()} style={{ marginBottom: 16 }}>Back to List</Button>
                <Title level={4}>Review Diagnostic Report</Title>
                <Text type="secondary">Asset ID: <Text strong>{device.asset_id}</Text></Text>
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
                left: 0, // Should adjust based on layout
                right: 0,
                padding: "16px 40px",
                background: "#fff",
                borderTop: "1px solid #f0f0f0",
                display: "flex",
                justifyContent: "flex-end",
                gap: 16,
                zIndex: 1000,
                // Adjust for sidebar usually 200px
                paddingLeft: 220
            }}>
                {currentStep > 0 && (
                    <Button onClick={() => setCurrentStep(currentStep - 1)}>
                        Previous
                    </Button>
                )}
                {currentStep < steps.length - 1 && (
                    <Button type="primary" onClick={() => setCurrentStep(currentStep + 1)}>
                        Next
                    </Button>
                )}
            </div>
        </div>
    );
};
