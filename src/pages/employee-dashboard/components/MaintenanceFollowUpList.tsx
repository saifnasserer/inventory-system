import React from "react";
import { Table, Tag, Space } from "antd";
import { MaintenanceFollowUp } from "../../../types";
import { useNavigation } from "@refinedev/core";
import { EyeOutlined } from "@ant-design/icons";

interface MaintenanceFollowUpListProps {
    data: MaintenanceFollowUp[];
}

export const MaintenanceFollowUpList: React.FC<MaintenanceFollowUpListProps> = ({ data }) => {
    const { show } = useNavigation();

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            needs_repair: "orange",
            in_repair: "blue",
        };
        return colors[status] || "default";
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            needs_repair: "بحاجة للصيانة",
            in_repair: "قيد الصيانة",
        };
        return labels[status] || status;
    };

    const getRepairStatusLabel = (status?: string) => {
        if (!status) return "-";
        const labels: Record<string, string> = {
            pending: "معلق",
            diagnosing: "قيد التشخيص",
            waiting_for_parts: "في انتظار القطع",
            in_progress: "قيد العمل",
            testing: "قيد الاختبار",
            completed: "مكتمل",
            returned_to_inspection: "عاد للفحص",
        };
        return labels[status] || status;
    };

    const columns = [
        {
            title: "رقم الأصل",
            dataIndex: "asset_id",
            key: "asset_id",
            render: (value: string) => <strong>{value}</strong>,
        },
        {
            title: "الموديل",
            dataIndex: "model",
            key: "model",
        },
        {
            title: "الحالة",
            dataIndex: "status",
            key: "status",
            render: (value: string) => (
                <Tag color={getStatusColor(value)}>{getStatusLabel(value)}</Tag>
            ),
        },
        {
            title: "حالة الصيانة",
            dataIndex: "repair_status",
            key: "repair_status",
            render: (value?: string) => getRepairStatusLabel(value),
        },
        {
            title: "تاريخ الإرسال",
            dataIndex: "assigned_at",
            key: "assigned_at",
            render: (value: string) =>
                value ? new Date(value).toLocaleDateString("ar-EG") : "-",
        },
        {
            title: "الإجراءات",
            key: "actions",
            render: (_: any, record: MaintenanceFollowUp) => (
                <Space>
                    <a
                        onClick={() => show("devices", record.device_id)}
                        style={{ cursor: "pointer" }}
                    >
                        <EyeOutlined /> عرض
                    </a>
                </Space>
            ),
        },
    ];

    return (
        <Table
            dataSource={data}
            columns={columns}
            rowKey="device_id"
            pagination={{ pageSize: 10 }}
            scroll={{ x: 800 }}
        />
    );
};
