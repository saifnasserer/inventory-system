import React from "react";
import { Form, Radio, Input, Typography, Space } from "antd";
import { CheckCircleFilled, ToolFilled, WarningFilled } from "@ant-design/icons";

const { Text, Title } = Typography;
const { TextArea } = Input;

interface InspectionDecisionProps {
    physicalData: any;
    hardwareData: any;
    onFinish: (values: any) => void;
    onBack: () => void;
    loading?: boolean;
}

export const InspectionDecision: React.FC<InspectionDecisionProps> = ({
    physicalData,
    onFinish,
}) => {
    const [form] = Form.useForm();
    const [decision, setDecision] = React.useState<string>();

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            style={{ maxWidth: 600, margin: "0 auto" }}
        >
            <div style={{ textAlign: "center", marginBottom: 32 }}>
                <Title level={3}>القرار النهائي</Title>
                <Text type="secondary">حدد وجهة الجهاز بناءً على نتائج الفحص</Text>
            </div>

            {/* Compact Summary Pill */}
            <div style={{
                backgroundColor: "#f9f9f9",
                borderRadius: "16px",
                padding: "20px",
                marginBottom: "32px",
                textAlign: "center"
            }}>
                <Text type="secondary" style={{ marginBottom: 8, display: "block" }}>ملخص الحالة</Text>
                <Space size="large" wrap style={{ justifyContent: "center" }}>
                    <StatusBadge label="الحالة العامة" value={getConditionLabel(physicalData?.overall_condition)} color={getConditionColor(physicalData?.overall_condition)} />
                    {physicalData?.has_scratches && <StatusBadge label="خدوش" value="موجود" color="red" />}
                    {physicalData?.has_cracks && <StatusBadge label="شروخ" value="موجود" color="red" />}
                    {physicalData?.has_dents && <StatusBadge label="انبعاجات" value="موجود" color="red" />}
                </Space>
            </div>

            <Form.Item name="decision" rules={[{ required: true, message: "مطلوب" }]}>
                <Radio.Group onChange={(e) => setDecision(e.target.value)} style={{ width: "100%" }}>
                    <Space direction="vertical" style={{ width: "100%" }} size={16}>

                        <DecisionCard
                            value="warehouse"
                            current={decision}
                            icon={<CheckCircleFilled />}
                            title="جاهز للمخزن"
                            desc="الجهاز سليم وجاهز للبيع المباشر"
                            color="#52c41a"
                        />

                        <DecisionCard
                            value="maintenance"
                            current={decision}
                            icon={<ToolFilled />}
                            title="إرسال للصيانة"
                            desc="يحتاج إلى إصلاح مشاكل فنية أو ظاهرية"
                            color="#faad14"
                        />
                    </Space>
                </Radio.Group>
            </Form.Item>

            {decision === "maintenance" && (
                <div style={{ marginTop: 24, animation: "fadeIn 0.3s ease-in-out" }}>
                    <div style={{
                        backgroundColor: "#fff7e6",
                        padding: "20px",
                        borderRadius: "16px",
                        border: "1px solid #ffd591"
                    }}>
                        <Space style={{ marginBottom: 12, color: "#d46b08" }}>
                            <WarningFilled />
                            <Text strong style={{ color: "#d46b08" }}>تفاصيل العطل</Text>
                        </Space>
                        <Form.Item
                            name="reason"
                            rules={[{ required: true, message: "يرجى وصف المشكلة بدقة" }]}
                            style={{ marginBottom: 0 }}
                        >
                            <TextArea
                                rows={3}
                                placeholder="اكتب وصفاً دقيقاً للمشكلة ليتمكن الفني من إصلاحها..."
                                style={{
                                    borderRadius: "8px",
                                    border: "1px solid #ffd591",
                                    backgroundColor: "#fff"
                                }}
                                autoFocus
                            />
                        </Form.Item>
                    </div>
                </div>
            )}
        </Form>
    );
};

const DecisionCard = ({ value, current, icon, title, desc, color }: any) => {
    const isSelected = current === value;
    return (
        <Radio value={value} style={{ width: "100%", margin: 0 }}>
            <div style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                width: "100%",
            }}>
                <div style={{
                    minWidth: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    backgroundColor: isSelected ? color : "#f5f5f5",
                    color: isSelected ? "#fff" : "#8c8c8c",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    transition: "all 0.3s"
                }}>
                    {icon}
                </div>
                <div>
                    <Text strong style={{ fontSize: "16px", display: "block", color: isSelected ? color : "#262626" }}>{title}</Text>
                    <Text type="secondary">{desc}</Text>
                </div>
            </div>
        </Radio>
    );
};

const StatusBadge = ({ label, value, color }: any) => {
    const colorMap: any = {
        green: "#52c41a",
        blue: "#1890ff",
        orange: "#faad14",
        red: "#ff4d4f",
        default: "#8c8c8c"
    };

    return (
        <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: "#8c8c8c", marginBottom: "4px" }}>{label}</div>
            <div style={{
                fontWeight: 600,
                color: colorMap[color] || color,
                backgroundColor: `${colorMap[color] || color}15`,
                padding: "4px 12px",
                borderRadius: "100px",
                fontSize: "13px"
            }}>
                {value}
            </div>
        </div>
    );
};

// ... utility functions
const getConditionColor = (condition: string) => {
    const colors: Record<string, string> = {
        excellent: "green",
        good: "blue",
        fair: "orange",
        poor: "red",
    };
    return colors[condition] || "default";
};

const getConditionLabel = (condition: string) => {
    const labels: Record<string, string> = {
        excellent: "ممتازة",
        good: "جيدة",
        fair: "مقبولة",
        poor: "سيئة",
    };
    return labels[condition] || condition;
};
