import type { RefineThemedLayoutHeaderProps } from "@refinedev/antd";
import { useGetIdentity, useMenu, useNavigation, useLogout } from "@refinedev/core";
import {
  Layout as AntdLayout,
  Avatar,
  Space,
  Switch,
  theme,
  Typography,
  Menu,
  Drawer,
  Button,
} from "antd";
import { MenuOutlined, StopOutlined, LogoutOutlined } from "@ant-design/icons";
import React, { useContext, useState } from "react";
import { ColorModeContext } from "../../contexts/color-mode";
import { useImpersonation } from "../../contexts/impersonation";
import { useNavigate } from "react-router-dom";

const { Text } = Typography;
const { useToken } = theme;

type IUser = {
  id: number;
  name: string;
  avatar: string;
};

export const Header: React.FC<RefineThemedLayoutHeaderProps> = () => {
  const { token } = useToken();
  const { data: user } = useGetIdentity<IUser & { role?: string }>();
  const { mode, setMode } = useContext(ColorModeContext);
  const { menuItems, selectedKey } = useMenu();
  const { push } = useNavigation();
  const { mutate, isLoading } = useLogout();
  const [drawerVisible, setDrawerVisible] = useState(false);

  const { impersonatedCompanyId, setImpersonatedCompanyId } = useImpersonation();
  const navigate = useNavigate();

  const handleStopImpersonation = () => {
    setImpersonatedCompanyId(null);
    navigate("/companies");
  };

  const headerStyles: React.CSSProperties = {
    backgroundColor: token.colorBgElevated,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0px 24px",
    height: "64px",
    borderBottom: `1px solid ${token.colorBorderSecondary}`,
    position: "sticky",
    top: 0,
    zIndex: 1000,
  };

  const handleMenuClick = (key: string) => {
    const menuItem = menuItems.find((item) => item.key === key);
    if (menuItem?.route) {
      push(menuItem.route);
      setDrawerVisible(false);
    }
  };

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter((item) => {
    // If no roles specified in meta, show to everyone
    const allowedRoles = (item as any).meta?.roles;
    if (!allowedRoles || allowedRoles.length === 0) {
      return true;
    }
    // Check if user's role is in the allowed roles
    return user?.role && allowedRoles.includes(user.role);
  });

  return (
    <>
      {impersonatedCompanyId && (
        <div style={{
          background: "#ff4d4f",
          color: "white",
          textAlign: "center",
          padding: "8px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "16px"
        }}>
          <span>Running in Impersonation Mode</span>
          <Button
            size="small"
            ghost
            icon={<StopOutlined />}
            onClick={handleStopImpersonation}
          >
            Exit to Admin
          </Button>
        </div>
      )}
      <AntdLayout.Header style={headerStyles}>
        {/* Logo/Title - Right side for RTL */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <Text
            strong
            style={{
              fontSize: "20px",
              color: token.colorPrimary,
              fontWeight: 700,
            }}
          >
            نظام إدارة المخزون
          </Text>
        </div>

        {/* Desktop Navigation - Center */}
        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            gap: "8px",
          }}
          className="desktop-menu"
        >
          {filteredMenuItems.map((item) => (
            <Button
              key={item.key}
              type={selectedKey === item.key ? "primary" : "text"}
              icon={item.icon}
              onClick={() => handleMenuClick(item.key as string)}
              style={{
                height: "40px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {item.label}
            </Button>
          ))}
        </div>

        {/* Mobile Menu Button */}
        <Button
          type="text"
          icon={<MenuOutlined />}
          onClick={() => setDrawerVisible(true)}
          className="mobile-menu-button"
          style={{ display: "none" }}
        />

        {/* User Info & Theme Toggle - Left side for RTL */}
        <Space className="desktop-menu">
          <Switch
            checkedChildren="🌛"
            unCheckedChildren="🔆"
            onChange={() => setMode(mode === "light" ? "dark" : "light")}
            defaultChecked={mode === "dark"}
          />
          <Space style={{ marginLeft: "8px" }} size="middle">
            {user?.name && <Text strong>{user.name}</Text>}
            {user?.avatar && <Avatar src={user?.avatar} alt={user?.name} />}
            <Button
              type="text"
              danger
              icon={<LogoutOutlined />}
              onClick={() => mutate()}
              loading={isLoading}
            >
              تسجيل خروج
            </Button>
          </Space>
        </Space>

        {/* Mobile Drawer */}
        <Drawer
          title="القائمة"
          placement="right"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
        >
          <Menu
            mode="vertical"
            selectedKeys={selectedKey ? [selectedKey] : []}
            onClick={({ key }) => handleMenuClick(key)}
            style={{ border: "none" }}
            items={filteredMenuItems.map((item) => ({
              key: item.key,
              label: item.label,
              icon: item.icon,
            }))}
          />
          <div style={{ marginTop: "24px", padding: "0 16px" }}>
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <Space>
                <Text>الوضع الداكن</Text>
                <Switch
                  checkedChildren="🌛"
                  unCheckedChildren="🔆"
                  onChange={() => setMode(mode === "light" ? "dark" : "light")}
                  defaultChecked={mode === "dark"}
                />
              </Space>
              {user?.name && (
                <Space>
                  {user?.avatar && <Avatar src={user?.avatar} alt={user?.name} />}
                  <Text strong>{user.name}</Text>
                </Space>
              )}
            </Space>
          </div>
        </Drawer>

        <style>
          {`
          @media (max-width: 768px) {
            .desktop-menu {
              display: none !important;
            }
            .mobile-menu-button {
              display: inline-flex !important;
            }
          }
        `}
        </style>
      </AntdLayout.Header>
    </>
  );
};
