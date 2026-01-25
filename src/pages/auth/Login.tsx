import React from "react";
import { useLogin } from "@refinedev/core";
import { Form, Input, Button, Card, Typography, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import styles from "./Login.module.css";

const { Title, Text } = Typography;

interface LoginFormValues {
    email: string;
    password: string;
}

export const Login: React.FC = () => {
    const { mutate: login, isLoading } = useLogin<LoginFormValues>();
    const [form] = Form.useForm();

    const onFinish = (values: LoginFormValues) => {
        login(values, {
            onError: (error) => {
                message.error(error.message || "فشل تسجيل الدخول");
            },
        });
    };

    return (
        <div className={styles.container}>
            <div className={styles.loginCard}>
                <Card variant="borderless" className={styles.card}>
                    <div className={styles.header}>
                        <Title level={2} className={styles.title}>
                            نظام إدارة المخزون
                        </Title>
                        <Text className={styles.subtitle}>
                            مرحباً بك مجدداً، يرجى تسجيل الدخول للمتابعة
                        </Text>
                    </div>

                    <Form
                        form={form}
                        name="login"
                        onFinish={onFinish}
                        layout="vertical"
                        requiredMark={false}
                        className={styles.form}
                        initialValues={{
                            email: "",
                            password: "",
                        }}
                    >
                        <Form.Item
                            name="email"
                            label="البريد الإلكتروني"
                            rules={[
                                {
                                    required: true,
                                    message: "يرجى إدخال البريد الإلكتروني",
                                },
                                {
                                    type: "email",
                                    message: "يرجى إدخال بريد إلكتروني صحيح",
                                },
                            ]}
                        >
                            <Input
                                prefix={<UserOutlined />}
                                placeholder="example@email.com"
                                size="large"
                                className={styles.input}
                            />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            label="كلمة المرور"
                            rules={[
                                {
                                    required: true,
                                    message: "يرجى إدخال كلمة المرور",
                                },
                            ]}
                        >
                            <Input.Password
                                prefix={<LockOutlined />}
                                placeholder="••••••••"
                                size="large"
                                className={styles.input}
                            />
                        </Form.Item>

                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={isLoading}
                                size="large"
                                block
                                className={styles.submitButton}
                            >
                                تسجيل الدخول
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            </div>
        </div>
    );
};
