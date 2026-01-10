
import { useIsAuthenticated, usePermissions, useLogout } from "@refinedev/core";
import { Navigate, Outlet } from "react-router-dom";
import { Button } from "antd";
import { LogoutOutlined } from "@ant-design/icons";

interface PermissionType {
    role: string;
    branchId: string;
}

export const AdminRoute = () => {
    const { data: auth, isLoading: authLoading } = useIsAuthenticated();
    const { data: permissions, isLoading: permLoading } = usePermissions<PermissionType>();
    const { mutate, isLoading } = useLogout();

    console.log("AdminRoute Check:", {
        auth: auth?.authenticated,
        role: permissions?.role,
        authLoading,
        permLoading
    });

    if (authLoading || permLoading) {
        return (
            <div style={{
                height: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: "20px",
                color: "#666"
            }}>
                Checking Admin Permissions...
            </div>
        );
    }

    if (!auth?.authenticated) {
        console.warn("AdminRoute: Not authenticated, redirecting to login");
        return <Navigate to="/login" />;
    }

    if (permissions?.role !== "super_admin") {
        console.warn(`AdminRoute: Access denied.Role: ${permissions?.role} `);
        return (
            <div style={{ padding: 20, color: "red" }}>
                <h1>Access Denied</h1>
                <p>You must be a Super Admin to view this page.</p>
                <p>Current Role: {permissions?.role || "None"}</p>
            </div>
        );
    }

    return (
        <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
            <div style={{
                background: "#fff",
                padding: "0 24px",
                height: "64px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid #f0f0f0"
            }}>
                <h2 style={{ margin: 0, fontSize: "18px" }}>Super Admin Control Panel</h2>
                <Button
                    danger
                    icon={<LogoutOutlined />}
                    onClick={() => mutate()}
                    loading={isLoading}
                >
                    Logout
                </Button>
            </div>
            <div style={{ padding: "24px" }}>
                <Outlet />
            </div>
        </div>
    );
};
