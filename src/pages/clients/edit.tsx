import React from "react";
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Card, Row, Col, Typography } from "antd";
import { UserOutlined, PhoneOutlined } from "@ant-design/icons";

export const ClientEdit: React.FC = () => {
    const { formProps, saveButtonProps, queryResult } = useForm();

    return (
        <Edit saveButtonProps={saveButtonProps} title="تعديل بيانات العميل">
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
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Card>
        </Edit>
    );
};
