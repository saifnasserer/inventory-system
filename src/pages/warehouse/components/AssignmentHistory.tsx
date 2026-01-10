import React from "react";
import { Timeline, Tag, Typography, Empty } from "antd";
import { useList } from "@refinedev/core";
import { DeviceAssignment, User } from "../../../types";
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface AssignmentHistoryProps {
    deviceId: string;
}

export const AssignmentHistory: React.FC<AssignmentHistoryProps> = ({ deviceId }) => {
    const { data: assignmentsData, isLoading } = useList<DeviceAssignment>({
        resource: "device_assignments",
        filters: [
            {
                field: "device_id",
                operator: "eq",
                value: deviceId,
            },
        ],
        sorters: [
            {
                field: "assigned_at",
                order: "desc",
            },
        ],
    });

    // Fetch user details for assignments
    const { data: usersData } = useList<User>({
        resource: "users",
        pagination: {
            mode: "off",
        },
    });

    if (isLoading) {
        return <div>جاري التحميل...</div>;
    }

    const assignments = assignmentsData?.data || [];
    const users = usersData?.data || [];

    if (assignments.length === 0) {
        return <Empty description="لا يوجد سجل تعيين لهذا الجهاز" />;
    }

    const getUserName = (userId: string) => {
        const user = users.find((u) => u.id === userId);
        return user?.full_name || "غير معروف";
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "active":
                return <ClockCircleOutlined style={{ color: "#1890ff" }} />;
            case "completed":
                return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
            case "cancelled":
                return <CloseCircleOutlined style={{ color: "#ff4d4f" }} />;
            default:
                return null;
        }
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            active: "نشط",
            completed: "مكتمل",
            cancelled: "ملغي",
        };
        return labels[status] || status;
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            active: "blue",
            completed: "green",
            cancelled: "red",
        };
        return colors[status] || "default";
    };

    const timelineItems = assignments.map((assignment) => ({
        dot: getStatusIcon(assignment.status),
        children: (
            <div>
                <div>
                    <Text strong>تم التعيين إلى: </Text>
                    <Text>{getUserName(assignment.assigned_to)}</Text>
                </div>
                <div>
                    <Text type="secondary">بواسطة: {getUserName(assignment.assigned_by)}</Text>
                </div>
                <div>
                    <Text type="secondary">
                        التاريخ: {new Date(assignment.assigned_at).toLocaleString("ar-EG")}
                    </Text>
                </div>
                {assignment.completed_at && (
                    <div>
                        <Text type="secondary">
                            تاريخ الإكمال: {new Date(assignment.completed_at).toLocaleString("ar-EG")}
                        </Text>
                    </div>
                )}
                <div>
                    <Tag color={getStatusColor(assignment.status)}>
                        {getStatusLabel(assignment.status)}
                    </Tag>
                </div>
                {assignment.notes && (
                    <div style={{ marginTop: 8 }}>
                        <Text type="secondary">ملاحظات: {assignment.notes}</Text>
                    </div>
                )}
            </div>
        ),
    }));

    return <Timeline items={timelineItems} />;
};
