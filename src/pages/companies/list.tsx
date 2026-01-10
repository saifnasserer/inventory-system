import { List, useTable, EditButton, ShowButton, DateField } from "@refinedev/antd";
import { Table, Tag, Space, Button, Tooltip, Spin } from "antd";
import { Company } from "../../types";
import { LoginOutlined, StopOutlined, SearchOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useImpersonation } from "../../contexts/impersonation";
import { useState, useEffect } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { Input } from "antd";

export const CompanyList: React.FC = () => {
    const { tableProps, current, setCurrent, tableQueryResult, setFilters } = useTable<Company>({
        syncWithLocation: true,
        pagination: { pageSize: 20 },
        queryOptions: {
            onSuccess: (data) => {
                if (current === 1) {
                    setAllCompanies((data.data as Company[]) || []);
                } else {
                    setAllCompanies((prev) => [...prev, ...((data.data as Company[]) || [])]);
                }
            }
        }
    });

    const [allCompanies, setAllCompanies] = useState<Company[]>([]);
    const companies = allCompanies;
    const total = tableQueryResult?.data?.total || 0;
    const hasMore = companies.length < total;

    const loadMoreData = () => {
        if (!tableQueryResult?.isFetching) {
            setCurrent(current + 1);
        }
    };

    // Search state
    const [searchText, setSearchText] = useState("");

    // Debounced Search
    useEffect(() => {
        const timer = setTimeout(() => {
            setFilters([
                {
                    field: "name",
                    operator: "contains",
                    value: searchText,
                },
            ], "merge");
        }, 500);

        return () => clearTimeout(timer);
    }, [searchText, setFilters]);

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
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: "#fff",
                    padding: "16px 24px",
                    borderRadius: "12px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    marginBottom: 24,
                    width: "100%"
                }}>
                    <div>
                        <h2 style={{ fontSize: "20px", fontWeight: 600, margin: 0 }}>Companies Management</h2>
                    </div>
                    <div>
                        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                            <Input
                                placeholder="Search Companies..."
                                allowClear
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                prefix={<SearchOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
                                style={{ width: 300, borderRadius: "50px" }}
                            />
                            {impersonatedCompanyId && (
                                <Button type="primary" danger icon={<StopOutlined />} onClick={handleStopImpersonation}>
                                    Exit Impersonation
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            }
        >
            <div id="scrollableDiv" style={{ height: "calc(100vh - 200px)", overflow: "auto" }}>
                <InfiniteScroll
                    dataLength={companies.length}
                    next={loadMoreData}
                    hasMore={hasMore}
                    loader={<div style={{ textAlign: "center", padding: 10 }}><Spin /></div>}
                    scrollableTarget="scrollableDiv"
                    endMessage={<div style={{ textAlign: "center", padding: 10, color: "#ccc" }}>End of List</div>}
                >
                    <Table
                        {...tableProps}
                        dataSource={companies}
                        pagination={false}
                        rowKey="id"
                        size="small"
                    >
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
                            width={80} // Fix width for compact look
                            render={(_, record: Company) => (
                                <ShowButton hideText size="small" recordItemId={record.id} />
                            )}
                        />
                    </Table>
                </InfiniteScroll>
            </div>
        </List>
    );
};
