import { Edit } from "@refinedev/antd";
import { useForm } from "@refinedev/antd";
import { Form, Input, Select, InputNumber, Card, Row, Col } from "antd";
import { Device } from "../../types";

export const DeviceEdit: React.FC = () => {
    const { formProps, saveButtonProps, queryResult } = useForm<Device>();

    const statusOptions = [
        { label: "في المخزن", value: "received" },
        { label: "في انتظار الفحص", value: "pending_inspection" },
        { label: "في الفحص الخارجي", value: "in_physical_inspection" },
        { label: "في الفحص الفني", value: "in_technical_inspection" },
        { label: "جاهز للبيع", value: "ready_for_sale" },
        { label: "يحتاج صيانة", value: "needs_repair" },
        { label: "في الصيانة", value: "in_repair" },
        { label: "في الفرع", value: "in_branch" },
        { label: "تم البيع", value: "sold" },
    ];

    return (
        <Edit saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout="vertical">
                <Card variant="outlined" title="المعلومات الأساسية" style={{ marginBottom: 16 }}>
                    <Row gutter={16}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="رقم الأصل"
                                name="asset_id"
                                rules={[
                                    {
                                        required: true,
                                        message: "يرجى إدخال رقم الأصل",
                                    },
                                ]}
                            >
                                <Input placeholder="مثال: AST-001" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="الموديل"
                                name="model"
                            >
                                <Input placeholder="مثال: Dell Latitude 5420" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="الرقم التسلسلي"
                                name="serial_number"
                            >
                                <Input placeholder="مثال: SN123456789" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="الشركة المصنعة"
                                name="manufacturer"
                            >
                                <Input placeholder="مثال: Dell" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="الحالة"
                                name="status"
                                rules={[
                                    {
                                        required: true,
                                        message: "يرجى اختيار الحالة",
                                    },
                                ]}
                            >
                                <Select options={statusOptions} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="الموقع الحالي"
                                name="current_location"
                                rules={[
                                    {
                                        required: true,
                                        message: "يرجى إدخال الموقع الحالي",
                                    },
                                ]}
                            >
                                <Input placeholder="مثال: المخزن الرئيسي" />
                            </Form.Item>
                        </Col>
                    </Row>
                </Card>

                <Card variant="outlined" title="المواصفات الفنية" style={{ marginBottom: 16 }}>
                    <Row gutter={16}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="المعالج (CPU)"
                                name="cpu_model"
                            >
                                <Input placeholder="مثال: Intel Core i7-1165G7" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="كرت الشاشة (GPU)"
                                name="gpu_model"
                            >
                                <Input placeholder="مثال: Intel Iris Xe Graphics" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Card variant="outlined" type="inner" title="الرامات (RAM)" style={{ marginBottom: 16 }}>
                        <Row gutter={16}>
                            <Col xs={24} md={8}>
                                <Form.Item
                                    label="عدد القطع"
                                    name="ram_count"
                                >
                                    <InputNumber
                                        min={0}
                                        style={{ width: "100%" }}
                                        placeholder="مثال: 2"
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item
                                    label="حجم القطعة (GB)"
                                    name="ram_size"
                                >
                                    <InputNumber
                                        min={0}
                                        style={{ width: "100%" }}
                                        placeholder="مثال: 8"
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item
                                    label="الموديلات"
                                    name="ram_models"
                                >
                                    <Select
                                        mode="tags"
                                        placeholder="أضف موديلات الرامات"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>

                    <Card variant="outlined" type="inner" title="التخزين (Storage)">
                        <Row gutter={16}>
                            <Col xs={24} md={8}>
                                <Form.Item
                                    label="عدد القطع"
                                    name="storage_count"
                                >
                                    <InputNumber
                                        min={0}
                                        style={{ width: "100%" }}
                                        placeholder="مثال: 1"
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item
                                    label="حجم القطعة (GB)"
                                    name="storage_size"
                                >
                                    <InputNumber
                                        min={0}
                                        style={{ width: "100%" }}
                                        placeholder="مثال: 512"
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item
                                    label="الأنواع"
                                    name="storage_types"
                                >
                                    <Select
                                        mode="tags"
                                        placeholder="مثال: SSD, NVMe"
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24}>
                                <Form.Item
                                    label="الموديلات"
                                    name="storage_models"
                                >
                                    <Select
                                        mode="tags"
                                        placeholder="أضف موديلات التخزين"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>
                </Card>
            </Form>
        </Edit>
    );
};
