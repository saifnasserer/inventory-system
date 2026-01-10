import React from "react";
import { Card, Typography } from "antd";

const { Title, Paragraph } = Typography;

export const SalesPortalPage: React.FC = () => {
    return (
        <div style={{ padding: "24px" }}>
            <Card>
                <Title level={2}>بوابة المبيعات</Title>
                <Paragraph>
                    بوابة المبيعات قيد التطوير...
                </Paragraph>
            </Card>
        </div>
    );
};
