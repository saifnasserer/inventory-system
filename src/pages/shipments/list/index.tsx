import React from "react";
import { useNavigation } from "@refinedev/core";
import { useTable, List } from "@refinedev/antd";
import { Table, Space, Button, Tag, Typography } from "antd";
import { PlusOutlined, FolderOpenOutlined, EyeOutlined } from "@ant-design/icons";

const { Text } = Typography;

export const ShipmentList: React.FC = () => {
    const { tableProps } = useTable({
        syncWithLocation: true,
    });

    const { show } = useNavigation();

    return (
        <List
            title="إدارة الشحنات"
            createButtonProps={{ children: "إضافة شحنة جديدة" }}
        >
            <Table {...tableProps} rowKey="id">

                <Table.Column
                    dataIndex="shipment_name"
                    title="اسم الشحنة"
                    render={(value) => (
                        <Space>
                            <FolderOpenOutlined style={{ color: '#1890ff' }} />
                            <Text strong>{value}</Text>
                        </Space>
                    )}
                />

                <Table.Column
                    dataIndex="delivery_date"
                    title="تاريخ الوصول"
                    render={(value) => value ? new Date(value).toLocaleDateString('ar-KW') : '-'}
                />

                <Table.Column
                    dataIndex="device_count"
                    title="عدد الأجهزة"
                    render={(value) => <Tag color="blue">{value} جهاز</Tag>}
                />

                <Table.Column
                    title="الإجراءات"
                    dataIndex="actions"
                    render={(_, record: any) => (
                        <Space>
                            <Button
                                size="small"
                                icon={<EyeOutlined />}
                                onClick={() => show("shipments", record.id)}
                            >
                                عرض
                            </Button>
                        </Space>
                    )}
                />
            </Table>
        </List>
    );
};
