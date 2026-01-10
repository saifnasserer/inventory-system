import { List, useTable, EditButton, ShowButton, DateField } from "@refinedev/antd";
import { Table, Tag, Space, Button, Tooltip } from "antd";
import { Company } from "../../types";
import { LoginOutlined, StopOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useImpersonation } from "../../contexts/impersonation";

export const CompanyList: React.FC = () => {
    const { tableProps } = useTable<Company>({
        syncWithLocation: true,
    });
    const { impersonatedCompanyId, setImpersonatedCompanyId } = useImpersonation();
    const navigate = useNavigate();

    const handleImpersonate = (companyId: string) => {
        setImpersonatedCompanyId(companyId);
        navigate("/receiving/shipments"); // Redirect to a functional page
    };

    const handleStopImpersonation = () => {
        setImpersonatedCompanyId(null);
    };

    return (
        <List
            title={
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Companies Management</span>
                    {impersonatedCompanyId && (
                        <Button type="primary" danger icon={<StopOutlined />} onClick={handleStopImpersonation}>
                            Exit Impersonation
                        </Button>
                    )}
                </div>
            }
        >
            <Table {...tableProps} rowKey="id">
                <Table.Column dataIndex="name" title="Company Name" />
                <Table.Column
                    dataIndex="status"
                    title="Status"
                    render={(value) => (
                        <Tag color={value === "active" ? "green" : "red"}>{value}</Tag>
                    )}
                />
                <Table.Column
                    dataIndex="subscription_plan"
                    title="Plan"
                    render={(value) => (
                        <Tag color="blue">{value?.toUpperCase()}</Tag>
                    )}
                />
                <Table.Column
                    dataIndex="created_at"
                    title="Created At"
                    render={(value) => <DateField value={value} />}
                />
                <Table.Column
                    title="Actions"
                    dataIndex="actions"
                    render={(_, record: Company) => (
                        <ShowButton hideText size="small" recordItemId={record.id} />
                    )}
                />
            </Table>
        </List>
    );
};
