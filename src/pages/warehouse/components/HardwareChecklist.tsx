import React from "react";
import { Form, Typography, Input, Row, Col } from "antd";
import { CheckCircleFilled, HddFilled, DatabaseFilled, AppstoreFilled, BuildFilled } from "@ant-design/icons";
import { Device } from "../../../types";

const { Text, Title } = Typography;
const { TextArea } = Input;

interface HardwareChecklistProps {
    device: Device;
    onFinish: (values: any) => void;
    onBack: () => void;
    initialValues?: any;
    formRef?: React.MutableRefObject<any>;
}

export const HardwareChecklist: React.FC<HardwareChecklistProps> = ({
    device,
    onFinish,
    onBack,
    initialValues,
    formRef,
}) => {
    const [form] = Form.useForm();

    React.useEffect(() => {
        if (formRef) {
            formRef.current = form;
        }
    }, [form, formRef]);

    const specs = [
        {
            key: "cpu_verified",
            title: "المعالج (CPU)",
            value: device.cpu_model || "غير محدد",
            icon: <AppstoreFilled />
        },
        {
            key: "gpu_verified",
            title: "كرت الشاشة (GPU)",
            value: device.gpu_model || "غير محدد",
            icon: <BuildFilled />
        },
        {
            key: "ram_verified",
            title: "الذاكرة (RAM)",
            value: device.ram_count && device.ram_size ? `${device.ram_count}x ${device.ram_size}GB` : "غير محدد",
            icon: <DatabaseFilled />
        },
        {
            key: "storage_verified",
            title: "التخزين",
            value: device.storage_count && device.storage_size
                ? `${device.storage_count}x ${device.storage_size}GB ${device.storage_types?.join(" + ") || ""}`
                : "غير محدد",
            icon: <HddFilled />
        },
    ];

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={initialValues || {
                cpu_verified: true,
                gpu_verified: true,
                ram_verified: true,
                storage_verified: true,
            }}
            style={{ maxWidth: 800, margin: "0 auto" }}
        >
            <div style={{ textAlign: "center", marginBottom: 32 }}>
                <Title level={3}>مطابقة المواصفات</Title>
                <Text type="secondary">انقر على البطاقة لتأكيد تطابق المواصفات</Text>
            </div>

            <Row gutter={[16, 16]}>
                {specs.map((spec) => (
                    <Col span={24} md={12} key={spec.key}>
                        <Form.Item name={spec.key} valuePropName="checked" style={{ marginBottom: 0 }}>
                            <SpecCard title={spec.title} detail={spec.value} icon={spec.icon} />
                        </Form.Item>
                    </Col>
                ))}
            </Row>

            <div style={{ marginTop: 32 }}>
                <Form.Item label="ملاحظات فنية" name="technical_notes">
                    <TextArea
                        rows={3}
                        placeholder="هل هناك أي اختلافات أو ملاحظات إضافية؟"
                        style={{
                            borderRadius: '12px',
                            border: '1px solid #f0f0f0',
                            padding: '12px',
                            backgroundColor: '#fafafa'
                        }}
                        variant="borderless"
                    />
                </Form.Item>
            </div>
        </Form>
    );
};

const SpecCard = ({ value, onChange, title, detail, icon }: any) => {
    return (
        <div
            onClick={() => onChange(!value)}
            style={{
                cursor: "pointer",
                border: `2px solid ${value ? "#52c41a" : "#f0f0f0"}`,
                backgroundColor: value ? "#f6ffed" : "#fff",
                borderRadius: "16px",
                padding: "20px",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                transition: "all 0.3s ease",
                height: "100%",
                boxShadow: value ? "0 4px 12px rgba(82, 196, 26, 0.15)" : "0 2px 8px rgba(0,0,0,0.04)"
            }}
        >
            <div style={{ display: "flex", gap: "16px" }}>
                <div style={{
                    fontSize: "24px",
                    color: value ? "#52c41a" : "#bfbfbf",
                    backgroundColor: value ? "#fff" : "#f5f5f5",
                    padding: "10px",
                    borderRadius: "12px",
                    display: "flex"
                }}>
                    {icon}
                </div>
                <div>
                    <Text type="secondary" style={{ fontSize: "12px" }}>{title}</Text>
                    <div style={{ fontWeight: 600, fontSize: "16px", marginTop: "4px" }}>
                        {detail}
                    </div>
                </div>
            </div>
            {value && (
                <CheckCircleFilled style={{ fontSize: "20px", color: "#52c41a" }} />
            )}
        </div>
    );
};
