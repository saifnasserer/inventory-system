import React from "react";
import { List, Space, Tag, Button, Tooltip, Typography } from "antd";
import { PrinterOutlined, UserAddOutlined, EditOutlined, FileOutlined } from "@ant-design/icons";
import { Device } from "../../../../types";

const { Text } = Typography;

interface DeviceListProps {
    devices: Device[];
    onPrintLabel: (device: Device) => void;
    onAssignEmployee: (deviceId: string) => void;
    getStatusColor: (status: string) => string;
    getStatusLabel: (status: string) => string;
}

export const DeviceList: React.FC<DeviceListProps> = ({
    devices,
    onPrintLabel,
    onAssignEmployee,
    getStatusColor,
    getStatusLabel,
}) => {
    return (
        <div style={{ padding: "8px 0 16px 48px", background: "#fdfdfd", borderLeft: "2px solid #f0f0f0" }}>
            <List
                dataSource={devices}
                split={false}
                renderItem={(record: Device) => (
                    <List.Item style={{ border: "none", padding: "8px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", width: "100%", justifyContent: "space-between" }}>
                            <Space size={12}>
                                <FileOutlined style={{ color: "#8c8c8c", fontSize: "16px" }} />
                                <Space direction="vertical" size={0}>
                                    <Text strong>{record.asset_id}</Text>
                                    <Text type="secondary" style={{ fontSize: "12px" }}>
                                        {record.manufacturer} {record.model} {record.serial_number && `• ${record.serial_number}`}
                                    </Text>
                                </Space>
                                <Tag bordered={false} color={getStatusColor(record.status)} style={{ marginLeft: 8 }}>
                                    {getStatusLabel(record.status)}
                                </Tag>
                            </Space>

                            <Space>
                                <Tooltip title="طباعة الملصق">
                                    <Button
                                        size="small"
                                        type="text"
                                        icon={<PrinterOutlined />}
                                        onClick={() => onPrintLabel(record)}
                                    />
                                </Tooltip>
                                <Tooltip title="تعيين موظف">
                                    <Button
                                        size="small"
                                        type="text"
                                        icon={<UserAddOutlined />}
                                        onClick={() => onAssignEmployee(record.id)}
                                    />
                                </Tooltip>
                                {record.status === "diagnosed" ? (
                                    <Button
                                        size="small"
                                        type="primary"
                                        style={{ backgroundColor: "#52c41a", borderColor: "#52c41a", fontSize: "11px" }}
                                        onClick={() => window.location.href = `/receiving/shipments/review/${record.id}`}
                                    >
                                        مراجعة التقرير
                                    </Button>
                                ) : (
                                    <Button
                                        size="small"
                                        type="primary"
                                        style={{ fontSize: "11px" }}
                                        onClick={() => window.location.href = `/receiving/shipments/inspect/${record.id}`}
                                    >
                                        فحص
                                    </Button>
                                )}
                                <Button
                                    size="small"
                                    type="text"
                                    icon={<EditOutlined />}
                                    onClick={() => window.location.href = `/warehouse/devices/edit/${record.id}`}
                                />
                            </Space>
                        </div>
                    </List.Item>
                )}
            />
        </div>
    );
};
