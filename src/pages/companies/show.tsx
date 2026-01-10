import { useShow, useList, useInvalidate, useUpdate, useDelete } from "@refinedev/core";
import { Show, DeleteButton, EditButton } from "@refinedev/antd";
import { Typography, Row, Col, Card, Statistic, Table, Button, Space, Avatar, Tag, Modal, Form, Input, App, Select, Tooltip } from "antd";
import { UserOutlined, ShopOutlined, DatabaseOutlined, TeamOutlined, PlusOutlined, EditOutlined, DeleteOutlined, LoginOutlined } from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { supabaseClient } from "../../utility/supabaseClient";
import { useImpersonation } from "../../contexts/impersonation";

const { Title, Text } = Typography;

export const CompanyShow = () => {
    const { queryResult } = useShow();
    const { data: companyData, isLoading: companyLoading } = queryResult;
    const record = companyData?.data;

    const invalidate = useInvalidate();
    const { message, notification } = App.useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [form] = Form.useForm();

    const { mutate: update } = useUpdate();
    const { mutate: deleteUser } = useDelete();
    const [editingUser, setEditingUser] = useState<any>(null);

    const { impersonatedCompanyId, setImpersonatedCompanyId } = useImpersonation();
    const navigate = useNavigate();

    const handleImpersonate = () => {
        if (record?.id) {
            setImpersonatedCompanyId(record.id);
            navigate("/receiving/shipments");
        }
    };

    // Fetch related stats (devices, users, etc.)
    // For now, we'll just mock or use separate useList calls

    // Fetch Users for this company
    const { data: usersData, isLoading: usersLoading } = useList({
        resource: "users",
        filters: [
            {
                field: "company_id",
                operator: "eq",
                value: record?.id,
            },
        ],
        queryOptions: {
            enabled: !!record?.id,
        },
    });

    const { data: devicesData, isLoading: devicesLoading } = useList({
        resource: "devices",
        filters: [
            {
                field: "company_id",
                operator: "eq",
                value: record?.id,
            },
        ],
        queryOptions: {
            enabled: !!record?.id,
        },
    });

    const activeUsers = usersData?.data?.length || 0;
    const totalDevices = devicesData?.total || 0;

    const handleCreateAdmin = async (values: any) => {
        setCreateLoading(true);
        try {
            // 1. Create temporary client to create Auth User without logging out Super Admin
            const tempSupabase = createClient(
                import.meta.env.VITE_SUPABASE_URL,
                import.meta.env.VITE_SUPABASE_ANON_KEY,
                {
                    auth: {
                        persistSession: false, // CRITICAL: Don't overwrite current session
                        autoRefreshToken: false,
                        detectSessionInUrl: false,
                    },
                }
            );

            // 2. Sign up the new user
            const { data: authData, error: authError } = await tempSupabase.auth.signUp({
                email: values.email,
                password: values.password,
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("No user returned from signUp");

            // 3. Insert into public.users (using main client with Super Admin privileges)
            const { error: insertError } = await supabaseClient
                .from("users")
                .insert({
                    id: authData.user.id,
                    email: values.email,
                    full_name: values.fullName,
                    role: values.role, // Use selected role
                    company_id: record?.id,
                    branch_id: null, // Company Admins might not belong to a specific branch initially
                });

            if (insertError) {
                // cleanup auth user if insert fails? 
                // For now, just throw, admin can manually fix or retry
                throw insertError;
            }

            notification.success({
                message: "Success",
                description: "User created and confirmed successfully",
            });

            setIsModalOpen(false);
            form.resetFields();
            invalidate({ resource: "users", invalidates: ["list"] });

        } catch (error: any) {
            console.error("Create User Error:", error);
            notification.error({
                message: "Error",
                description: error.message || "Failed to create user",
            });
        } finally {
            setCreateLoading(false);
        }
    };

    const handleEditUser = (values: any) => {
        setCreateLoading(true);
        update({
            resource: "users",
            id: editingUser.id,
            values: {
                full_name: values.fullName,
                role: values.role,
                // accessing email/password on edit is complex for auth.users, skipping for now
            },
        }, {
            onSuccess: () => {
                notification.success({ message: "User updated successfully" });
                setIsModalOpen(false);
                setEditingUser(null);
                form.resetFields();
                invalidate({ resource: "users", invalidates: ["list"] });
                setCreateLoading(false);
            },
            onError: (error) => {
                notification.error({ message: "Error updating user", description: error.message });
                setCreateLoading(false);
            }
        });
    };

    const openEditModal = (user: any) => {
        setEditingUser(user);
        form.setFieldsValue({
            fullName: user.full_name,
            email: user.email,
            role: user.role,
        });
        setIsModalOpen(true);
    };

    const openCreateModal = () => {
        setEditingUser(null);
        form.resetFields();
        form.setFieldValue("role", "admin");
        setIsModalOpen(true);
    };

    return (
        <Show
            isLoading={companyLoading}
            headerButtons={
                <>
                    <Tooltip title="Access Company Profile">
                        <Button
                            icon={<LoginOutlined />}
                            onClick={handleImpersonate}
                            type={impersonatedCompanyId === record?.id ? "primary" : "default"}
                        >
                            Access Company
                        </Button>
                    </Tooltip>
                    <EditButton />
                </>
            }
        >
            <Title level={2}>{record?.name}</Title>
            <Text type="secondary">{record?.subscription_plan} Plan • Status: <Tag color={record?.status === 'active' ? 'green' : 'red'}>{record?.status}</Tag></Text>

            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                <Col span={8}>
                    <Card hoverable>
                        <Statistic
                            title="Total Devices"
                            value={totalDevices}
                            prefix={<DatabaseOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card hoverable>
                        <Statistic
                            title="Active Users"
                            value={activeUsers}
                            prefix={<TeamOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card hoverable>
                        <Statistic
                            title="Subscription"
                            value={record?.subscription_plan || "Free"}
                            prefix={<ShopOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            <div style={{ marginTop: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Title level={4}>Company Users</Title>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={openCreateModal}
                    >
                        Create User
                    </Button>
                </div>

                <Table
                    dataSource={usersData?.data || []}
                    rowKey="id"
                    loading={usersLoading}
                    pagination={{ pageSize: 5 }}
                    columns={[
                        {
                            title: "Name",
                            dataIndex: "full_name",
                            key: "full_name",
                            render: (value, record: any) => (
                                <Space>
                                    <Avatar icon={<UserOutlined />} src={record.avatar_url} />
                                    <Text>{value || "No Name"}</Text>
                                </Space>
                            )
                        },
                        {
                            title: "Email",
                            dataIndex: "email",
                            key: "email",
                        },
                        {
                            title: "Role",
                            dataIndex: "role",
                            key: "role",
                            render: (value) => <Tag color={value === 'admin' ? 'blue' : 'default'}>{value}</Tag>
                        },
                        {
                            title: "Status",
                            dataIndex: "status",
                            key: "status",
                            render: (value) => <Tag>{value || "Active"}</Tag>
                        },
                        {
                            title: "Actions",
                            key: "actions",
                            render: (_, record: any) => (
                                <Space>
                                    <Button
                                        size="small"
                                        icon={<EditOutlined />}
                                        onClick={() => openEditModal(record)}
                                    />
                                    <DeleteButton
                                        hideText
                                        size="small"
                                        recordItemId={record.id}
                                        resource="users"
                                        onSuccess={() => invalidate({ resource: "users", invalidates: ["list"] })}
                                    />
                                </Space>
                            )
                        }
                    ]}
                />
            </div>

            <Modal
                title={editingUser ? "Edit User" : "Create Company User"}
                open={isModalOpen}
                onCancel={() => { setIsModalOpen(false); setEditingUser(null); }}
                footer={null}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={editingUser ? handleEditUser : handleCreateAdmin}
                    initialValues={{ role: "admin" }}
                >
                    <Form.Item
                        name="fullName"
                        label="Full Name"
                        rules={[{ required: true, message: "Please enter full name" }]}
                    >
                        <Input placeholder="John Doe" />
                    </Form.Item>

                    {/* Disable Email/Password editing for now */}
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: "Please enter email" },
                            { type: "email", message: "Please enter a valid email" }
                        ]}
                    >
                        <Input placeholder="user@company.com" disabled={!!editingUser} />
                    </Form.Item>

                    {!editingUser && (
                        <Form.Item
                            name="password"
                            label="Password"
                            rules={[{ required: true, message: "Please enter password" }]}
                        >
                            <Input.Password />
                        </Form.Item>
                    )}

                    <Form.Item
                        name="role"
                        label="Role"
                        rules={[{ required: true, message: "Please select a role" }]}
                    >
                        <Select>
                            <Select.Option value="admin">Company Admin</Select.Option>
                            <Select.Option value="warehouse_manager">Warehouse Manager</Select.Option>
                            <Select.Option value="warehouse_staff">Warehouse Staff</Select.Option>
                            <Select.Option value="repair_manager">Repair Manager</Select.Option>
                            <Select.Option value="technician">Technician</Select.Option>
                            <Select.Option value="branch_manager">Branch Manager</Select.Option>
                            <Select.Option value="sales_staff">Sales Staff</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item>
                        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                            <Button onClick={() => { setIsModalOpen(false); setEditingUser(null); }}>Cancel</Button>
                            <Button type="primary" htmlType="submit" loading={createLoading}>
                                {editingUser ? "Update User" : "Create User"}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </Show>
    );
};
