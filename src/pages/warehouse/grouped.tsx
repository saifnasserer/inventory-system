import React, { useState, useMemo } from "react";
import { useNavigation, useList, useGetIdentity } from "@refinedev/core";
import { Table, Space, Button, Tag, Typography, Input, Card, Breadcrumb } from "antd";
import { FolderOpenOutlined, SwapOutlined, SearchOutlined, TableOutlined, HomeOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { DeviceTransferModal } from "./components/DeviceTransferModal";
import { Device } from "../../types";

const { Text, Title } = Typography;

export const DeviceGroupedList: React.FC = () => {
    const navigate = useNavigate();
    const { show } = useNavigation();
    const [searchText, setSearchText] = useState("");
    const [transferModalVisible, setTransferModalVisible] = useState(false);
    const [devicesToTransfer, setDevicesToTransfer] = useState<string[]>([]);

    const { data: identity } = useGetIdentity<{ role: string }>();
    const isAdmin = identity?.role && ["admin", "warehouse_manager", "super_admin"].includes(identity.role);

    const { data: devicesData, isLoading } = useList<Device>({
        resource: "devices",
        pagination: { mode: "off" },
        filters: [
            {
                field: "status",
                operator: "eq",
                value: "ready_for_sale",
            }
        ],
    });

    // Group devices by model
    const groupedData = useMemo(() => {
        if (!devicesData?.data) return [];

        const groups: Record<string, { model: string; count: number; ids: string[]; devices: Device[] }> = {};

        devicesData.data.forEach((device) => {
            const model = device.model || "غير محدد";
            if (!groups[model]) {
                groups[model] = {
                    model,
                    count: 0,
                    ids: [],
                    devices: [],
                };
            }
            groups[model].count += 1;
            groups[model].ids.push(device.id);
            groups[model].devices.push(device);
        });

        let result = Object.values(groups);

        if (searchText) {
            result = result.filter(g => g.model.toLowerCase().includes(searchText.toLowerCase()));
        }

        return result;
    }, [devicesData, searchText]);

    const handleTransfer = (ids: string[]) => {
        setDevicesToTransfer(ids);
        setTransferModalVisible(true);
    };

    return (
        <div style={{ padding: "0px" }}>
            {/* Header Area */}
            <div style={{
                marginBottom: 24,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#fff",
                padding: "16px 24px",
                borderBottom: "1px solid #f0f0f0",
            }}>
                <div>
                    <Breadcrumb style={{ marginBottom: 8 }}>
                        <Breadcrumb.Item href="/">
                            <HomeOutlined />
                        </Breadcrumb.Item>
                        <Breadcrumb.Item href="/warehouse/devices">المخزن</Breadcrumb.Item>
                        <Breadcrumb.Item>المجموعات</Breadcrumb.Item>
                    </Breadcrumb>
                    <Title level={4} style={{ margin: 0 }}>المجموعات بالموديل</Title>
                </div>
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                    <Input
                        placeholder="بحث عن موديل..."
                        allowClear
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        prefix={<SearchOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
                        style={{ width: 250, borderRadius: "50px" }}
                    />
                    <Button
                        icon={<TableOutlined />}
                        onClick={() => navigate("/warehouse/devices/all")}
                        style={{ borderRadius: "50px" }}
                    >
                        عرض كل الأجهزة
                    </Button>
                </div>
            </div>

            <div style={{ padding: "0 24px" }}>
                <Table
                    dataSource={groupedData}
                    loading={isLoading}
                    rowKey="model"
                    pagination={{ pageSize: 15 }}
                >
                    <Table.Column
                        dataIndex="model"
                        title="الموديل"
                        render={(value) => (
                            <Space>
                                <FolderOpenOutlined style={{ color: '#faad14', fontSize: '20px' }} />
                                <Text strong style={{ fontSize: '16px' }}>{value}</Text>
                            </Space>
                        )}
                    />
                    <Table.Column
                        dataIndex="count"
                        title="عدد الأجهزة"
                        render={(value) => <Tag color="blue" style={{ borderRadius: '12px', padding: '0 12px' }}>{value} جهاز</Tag>}
                        sorter={(a: any, b: any) => a.count - b.count}
                    />
                    <Table.Column
                        title="الإجراءات"
                        render={(_, record: any) => (
                            <Space>
                                <Button
                                    size="small"
                                    icon={<TableOutlined />}
                                    onClick={() => {
                                        navigate(`/warehouse/devices/all?model=${encodeURIComponent(record.model)}`);
                                    }}
                                >
                                    فتح المجموعة
                                </Button>
                                {isAdmin && (
                                    <Button
                                        size="small"
                                        type="primary"
                                        icon={<SwapOutlined />}
                                        onClick={() => handleTransfer(record.ids)}
                                    >
                                        نقل الكل ({record.count})
                                    </Button>
                                )}
                            </Space>
                        )}
                    />
                </Table>
            </div>

            <DeviceTransferModal
                visible={transferModalVisible}
                onCancel={() => setTransferModalVisible(false)}
                onSuccess={() => {
                    // Refetch from useList is automatic if resource changes, 
                    // but here we might need to manually trigger if using custom state.
                    // useList data will update on next render loop typically.
                }}
                deviceIds={devicesToTransfer}
            />
        </div>
    );
};
