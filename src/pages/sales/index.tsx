import React from "react";
import { Card, Typography } from "antd";

const { Title, Paragraph } = Typography;

export const SalesPage: React.FC = () => {
    return (
        <div style={{ padding: "24px" }}>
            <Card>
                <Title level={2}>لوحة المبيعات</Title>
                <Paragraph>
                    صفحة المبيعات قيد التطوير...
                </Paragraph>
            </Card>
        </div>
    );
};
