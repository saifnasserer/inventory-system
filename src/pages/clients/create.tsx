import React from "react";
import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Card, Row, Col, Space, Typography } from "antd";
import { UserOutlined, PhoneOutlined } from "@ant-design/icons";

const { Text } = Typography;

export const ClientCreate: React.FC = () => {
    const { formProps, saveButtonProps } = useForm();

    return (
        <Create saveButtonProps={saveButtonProps} title="إضافة عميل جديد">
            <Card bordered={false} style={{ borderRadius: 16 }}>
                <Form {...formProps} layout="vertical">
                    <Row gutter={16}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="اسم العميل"
                                name="name"
                                rules={[{ required: true, message: "يرجى إدخال اسم العميل" }]}
                            >
                                <Input
                                    size="large"
                                    prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                                    placeholder="الاسم الكامل"
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="رقم الهاتف"
                                name="phone"
                                rules={[{ required: true, message: "يرجى إدخال رقم الهاتف" }]}
                            >
                                <Input
                                    size="large"
                                    prefix={<PhoneOutlined style={{ color: '#bfbfbf' }} />}
                                    placeholder="01xxxxxxxxx"
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Card>
        </Create>
    );
};
