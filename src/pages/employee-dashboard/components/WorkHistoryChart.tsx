import React from "react";
import { Column } from "@ant-design/plots";
import { WorkHistoryData } from "../../../types";
import { Empty } from "antd";

interface WorkHistoryChartProps {
    data: WorkHistoryData[];
}

export const WorkHistoryChart: React.FC<WorkHistoryChartProps> = ({ data }) => {
    if (!data || data.length === 0) {
        return <Empty description="لا توجد بيانات لعرضها" />;
    }

    // Transform data for the chart
    const chartData = data.flatMap((item) => [
        {
            date: new Date(item.date).toLocaleDateString("ar-EG", { month: "short", day: "numeric" }),
            value: item.completed_count,
            category: "إجمالي المعالجة",
        },
        {
            date: new Date(item.date).toLocaleDateString("ar-EG", { month: "short", day: "numeric" }),
            value: item.to_warehouse_count,
            category: "للمخزن",
        },
        {
            date: new Date(item.date).toLocaleDateString("ar-EG", { month: "short", day: "numeric" }),
            value: item.to_maintenance_count,
            category: "للصيانة",
        },
    ]);

    const config = {
        data: chartData,
        xField: "date",
        yField: "value",
        seriesField: "category",
        isGroup: true,
        columnStyle: {
            radius: [8, 8, 0, 0],
        },
        color: ["#52c41a", "#1890ff", "#faad14"],
        legend: {
            position: "top" as const,
        },
        label: {
            position: "top" as const,
            style: {
                fill: "#000000",
                opacity: 0.6,
            },
        },
        xAxis: {
            label: {
                autoRotate: true,
                autoHide: true,
            },
        },
        yAxis: {
            label: {
                formatter: (v: string) => `${v}`,
            },
        },
        tooltip: {
            shared: true,
            showMarkers: true,
        },
        animation: {
            appear: {
                animation: "scale-in-y",
                duration: 500,
            },
        },
    };

    return <Column {...config} />;
};
