import React, { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useMenu, useLogout, useGetIdentity, useCan } from "@refinedev/core";
import { Layout, Menu, Button, Typography, Avatar, Tooltip, theme } from "antd";
import {
    LogoutOutlined,
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    DashboardOutlined,
    UserOutlined,
} from "@ant-design/icons";

const { Sider } = Layout;
const { Text } = Typography;

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
    const { menuItems, selectedKey } = useMenu();
    const { mutate: logout } = useLogout();
    const { data: user } = useGetIdentity<{ fullName: string, role: string }>();
    const { token } = theme.useToken();

    // Filter menu items based on access control
    const filteredMenuItems = useMemo(() => {
        return menuItems.filter((item) => {
            // Always hide items marked as hidden
            if (item.meta?.hide) return false;

            // For items without a resource name, show them
            if (!item.name) return true;

            // Check access control for this resource
            // We'll use a synchronous check based on the user's role
            const allowedRoles = item.meta?.roles as string[] | undefined;

            // If no roles specified, show the item
            if (!allowedRoles || allowedRoles.length === 0) return true;

            // Check if user's role is in the allowed roles
            return allowedRoles.includes(user?.role || '');
        });
    }, [menuItems, user?.role]);

    return (
        <Sider
            trigger={null}
            collapsible
            collapsed={collapsed}
            collapsedWidth={80}
            theme="light"
            width={260}
            style={{
                height: "100vh",
                position: "fixed",
                right: 0,
                top: 0,
                zIndex: 100,
                borderLeft: "1px solid #f0f0f0",
                boxShadow: collapsed ? "none" : "-4px 0 24px rgba(0,0,0,0.05)",
                transition: "all 0.2s",
            }}
        >
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                {/* Toggle / Brand Area */}
                <div style={{
                    height: 72,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: collapsed ? "center" : "space-between",
                    padding: "0 24px",
                    borderBottom: "1px solid #fcfcfc"
                }}>
                    {!collapsed && (
                        <Text strong style={{ fontSize: 20, color: "#000000", letterSpacing: -0.5 }}>
                            نظام المخزون
                        </Text>
                    )}
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggle();
                        }}
                        style={{
                            fontSize: '18px',
                            width: 44,
                            height: 44,
                            color: "#8c8c8c",
                            background: collapsed ? "transparent" : "#f5f5f5"
                        }}
                    />
                </div>

                {/* Menu */}
                <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "16px 12px" }}>
                    <Menu
                        mode="inline"
                        selectedKeys={[selectedKey]}
                        style={{ borderRight: 0, background: "transparent" }}
                        items={filteredMenuItems.map((item) => {
                            if (item.meta?.hide) return null;
                            const isSelected = selectedKey === item.key;

                            return {
                                key: item.key,
                                icon: <span style={{ fontSize: "18px" }}>{item.icon || <DashboardOutlined />}</span>,
                                label: (
                                    <Link to={item.route ?? "/"} style={{ fontWeight: isSelected ? 600 : 400 }}>
                                        {item.label}
                                    </Link>
                                ),
                                style: {
                                    borderRadius: 8,
                                    marginBottom: 4,
                                    color: isSelected ? "#000000" : "#595959",
                                    background: isSelected ? "#f0f0f0" : "transparent",
                                }
                            };
                        })}
                    />
                </div>

                {/* User Profile & Logout - Moved to Bottom */}
                <div style={{
                    borderTop: "1px solid #f0f0f0",
                    padding: "16px",
                    background: "#fafafa"
                }}>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: collapsed ? "center" : "flex-start",
                        marginBottom: collapsed ? 0 : 16,
                        cursor: "pointer"
                    }}>
                        <Avatar
                            size={40}
                            icon={<UserOutlined />}
                            style={{
                                backgroundColor: "#000000",
                                color: "#fff",
                                flexShrink: 0,
                                cursor: "pointer"
                            }}
                            onClick={() => collapsed && onToggle()}
                        />

                        {!collapsed && (
                            <div style={{ marginLeft: 12, overflow: "hidden" }}>
                                <Text strong style={{ display: "block", fontSize: 14, whiteSpace: "nowrap" }}>{user?.fullName || "المستخدم"}</Text>
                                <Text type="secondary" style={{ fontSize: 11, whiteSpace: "nowrap" }}>{getRoleLabel(user?.role)}</Text>
                            </div>
                        )}
                    </div>

                    {!collapsed && (
                        <Button
                            block
                            danger
                            icon={<LogoutOutlined />}
                            onClick={() => logout()}
                            style={{ borderRadius: 8 }}
                        >
                            تسجيل الخروج
                        </Button>
                    )}
                </div>
            </div>
        </Sider>
    );
};

function getRoleLabel(role?: string): string {
    const roleLabels: Record<string, string> = {
        admin: "مدير عام",
        warehouse_manager: "مسؤول المخزن",
        warehouse_staff: "موظف مخزن",
        repair_manager: "مدير صيانة",
        technician: "فني صيانة",
        branch_manager: "مدير فرع",
        sales_staff: "موظف مبيعات",
        super_admin: "مدير النظام",
    };
    return roleLabels[role || ""] || role || "";
}
