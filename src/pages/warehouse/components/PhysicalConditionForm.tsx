import React from "react";
import { Form, Space, Typography, Row, Col } from "antd";
import { CheckCircleFilled, CloseCircleFilled, MehFilled, FrownFilled, SmileFilled, StarFilled } from "@ant-design/icons";

const { Text, Title } = Typography;

interface PhysicalConditionFormProps {
    onFinish: (values: any) => void;
    initialValues?: any;
    formRef?: React.MutableRefObject<any>;
}

const SelectionTile = ({ value, selected, onChange, icon, label, color }: any) => (
    <div
        onClick={() => onChange(value)}
        style={{
            cursor: "pointer",
            border: `2px solid ${selected ? color : "#f0f0f0"}`,
            backgroundColor: selected ? `${color}10` : "#fff",
            borderRadius: "12px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.3s ease",
            height: "100%",
            boxShadow: selected ? `0 4px 12px ${color}40` : "none",
        }}
    >
        <div style={{ fontSize: "24px", color: selected ? color : "#bfbfbf", marginBottom: "8px" }}>
            {icon}
        </div>
        <Text strong style={{ color: selected ? color : "#595959" }}>{label}</Text>
    </div>
);

export const PhysicalConditionForm: React.FC<PhysicalConditionFormProps> = ({
    onFinish,
    initialValues,
    formRef,
}) => {
    const [form] = Form.useForm();

    React.useEffect(() => {
        if (formRef) {
            formRef.current = form;
        }
    }, [form, formRef]);

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={initialValues}
            style={{ maxWidth: 800, margin: "0 auto" }}
        >
            <Space direction="vertical" size={32} style={{ width: "100%" }}>
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                    <Title level={3}>الفحص الظاهري</Title>
                    <Text type="secondary">قيم الحالة الخارجية للجهاز بدقة</Text>
                </div>

                {/* Yes/No Questions Grid */}
                <div style={{ display: 'grid', gap: '24px' }}>
                    {[
                        { name: "has_scratches", label: "هل يوجد خدوش؟" },
                        { name: "has_cracks", label: "هل يوجد شروخ؟" },
                        { name: "has_dents", label: "هل يوجد انبعاجات؟" }
                    ].map((item) => (
                        <Form.Item
                            key={item.name}
                            name={item.name}
                            rules={[{ required: true, message: "مطلوب" }]}
                            style={{ marginBottom: 0 }}
                        >
                            {/* Custom Field Component wrapper to handle value binding */}
                            <QuestionRow label={item.label} />
                        </Form.Item>
                    ))}
                </div>

                <div style={{ marginTop: 24 }}>
                    <Title level={5} style={{ marginBottom: 16 }}>التقييم العام للجهاز</Title>
                    <Form.Item name="overall_condition" rules={[{ required: true }]}>
                        <ConditionSelector />
                    </Form.Item>
                </div>
            </Space>
        </Form>
    );
};

// Helper component for Yes/No rows
const QuestionRow = ({ value, onChange, label }: any) => (
    <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 24px",
        backgroundColor: "#fff",
        borderRadius: "16px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
    }}>
        <Text strong style={{ fontSize: 16 }}>{label}</Text>
        <Space size="middle">
            <div
                onClick={() => onChange(false)}
                style={{
                    cursor: "pointer",
                    padding: "8px 24px",
                    borderRadius: "20px",
                    backgroundColor: value === false ? "#f6ffed" : "#f5f5f5",
                    border: `1px solid ${value === false ? "#b7eb8f" : "transparent"}`,
                    color: value === false ? "#52c41a" : "#8c8c8c",
                    transition: "all 0.2s"
                }}
            >
                <CheckCircleFilled /> لا
            </div>
            <div
                onClick={() => onChange(true)}
                style={{
                    cursor: "pointer",
                    padding: "8px 24px",
                    borderRadius: "20px",
                    backgroundColor: value === true ? "#fff1f0" : "#f5f5f5",
                    border: `1px solid ${value === true ? "#ffa39e" : "transparent"}`,
                    color: value === true ? "#ff4d4f" : "#8c8c8c",
                    transition: "all 0.2s"
                }}
            >
                <CloseCircleFilled /> نعم
            </div>
        </Space>
    </div>
);

// Helper for condition selection
const ConditionSelector = ({ value, onChange }: any) => {
    const conditions = [
        { key: "excellent", label: "ممتازة", icon: <StarFilled />, color: "#52c41a" },
        { key: "good", label: "جيدة", icon: <SmileFilled />, color: "#1890ff" },
        { key: "fair", label: "مقبولة", icon: <MehFilled />, color: "#faad14" },
        { key: "poor", label: "سيئة", icon: <FrownFilled />, color: "#ff4d4f" },
    ];

    return (
        <Row gutter={[16, 16]}>
            {conditions.map((c) => (
                <Col span={6} xs={12} key={c.key}>
                    <SelectionTile
                        value={c.key}
                        label={c.label}
                        icon={c.icon}
                        color={c.color}
                        selected={value === c.key}
                        onChange={onChange}
                    />
                </Col>
            ))}
        </Row>
    );
};
