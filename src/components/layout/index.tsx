import React, { useState } from "react";
import { Layout as AntdLayout } from "antd";
import { Sidebar } from "./Sidebar";

const { Content } = AntdLayout;

export const CustomLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Default to collapsed (true) as requested
    const [collapsed, setCollapsed] = useState(true);

    const handleContentClick = () => {
        // "if opened and we interacted with the screen auto close it"
        if (!collapsed) {
            setCollapsed(true);
        }
    };

    return (
        <AntdLayout style={{ minHeight: "100vh", background: "#ffffff" }}>
            <Sidebar
                collapsed={collapsed}
                onToggle={() => setCollapsed(!collapsed)}
            />

            <AntdLayout
                style={{
                    background: "#ffffff",
                    marginRight: collapsed ? 80 : 260, // Adjust margin based on sidebar width (RTL)
                    transition: "margin-right 0.2s",
                }}
                onClick={handleContentClick}
            >
                <Content
                    style={{
                        padding: 32,
                        minHeight: 280,
                        background: "#ffffff",
                        overflow: "auto",
                        // Add a subtle overlay effect when sidebar is open?
                        // User requirement: "interacted with the screen auto close it".
                        // Simply clicking anywhere in the content will trigger handleContentClick.
                        opacity: !collapsed ? 0.6 : 1,
                        pointerEvents: !collapsed ? 'auto' : 'auto', // Allow clicks to trigger closure
                        transition: "opacity 0.2s"
                    }}
                >
                    {children}
                </Content>
            </AntdLayout>
        </AntdLayout>
    );
};
