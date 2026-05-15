import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataStore } from "@/lib/dataStore";
import { useEffect, useState } from "react";
import { format, subWeeks, startOfWeek, endOfWeek } from "date-fns";
import { productionApi } from "@/services/api2";

const COLORS = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd"];

export const ProductionCharts = () => {
  const [chartData, setChartData] = useState<any>(null);

  const [weeklyChartData, setWeeklyChartData] = useState<any>(null);

  // const chartData = DataStore.getDashboardChartData();
  // console.log(chartData);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await DataStore.getDashboardChartData();
        console.log(data);

        setChartData(data);
      } catch (err) {
        console.error("🔥 ERROR in getDashboardChartData:", err);
      }
    };

    fetchData();
  }, []);

  // Helper: Format date as yyyy-MM-dd for API
  const fmt = (date: Date) => format(date, "yyyy-MM-dd");

  useEffect(() => {
    const fetchWeeklyEfficiency = async () => {
      const today = new Date();
      const results: any[] = [];

      // Get last 5 weeks
      for (let i = 0; i < 5; i++) {
        const weekStart = startOfWeek(subWeeks(today, i), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(subWeeks(today, i), { weekStartsOn: 1 });

        const startDate = fmt(weekStart);
        const endDate = fmt(weekEnd);

        // Fetch data for each week
        const response = await productionApi.get(
          `/weekly-trend?start=${startDate}&end=${endDate}`,
        );

        const weekData = response.data;

        // Sum target + actual for the whole week
        const totalTarget = weekData.reduce(
          (sum: number, row: any) => sum + row.target,
          0,
        );
        const totalActual = weekData.reduce(
          (sum: number, row: any) => sum + row.actual,
          0,
        );

        // calculate efficiency
        const efficiency =
          totalTarget === 0
            ? 0
            : Number(((totalActual / totalTarget) * 100).toFixed(2));

        results.unshift({
          week: `W${5 - i}`, // W1, W2, W3, W4, W5 in correct order
          efficiency,
        });
      }

      setWeeklyChartData(results);
    };

    fetchWeeklyEfficiency();
  }, []);

  if (!chartData) return <div>Loading...</div>;

  const weeklyChartData2 = chartData.productionTrend.map((row, i) => ({
    week: `W${i + 1}`,
    efficiency:
      row.target === 0
        ? 0
        : Number(((row.actual / row.target) * 100).toFixed(2)),
  }));
  // Custom label renderer for pie chart to avoid overlapping
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Daily Production Trend */}
      {/* <Card className="shadow-sm border-0 ring-1 ring-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-800">
            Daily Production Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData.productionTrend}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Bar
                dataKey="target"
                fill="#e5e7eb"
                name="Target"
                radius={[2, 2, 0, 0]}
              />
              <Bar
                dataKey="actual"
                fill="#3b82f6"
                name="Actual"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card> */}

      {/* Loom Efficiency */}
      {/* <Card className="shadow-sm border-0 ring-1 ring-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-800">
            Loom Type Efficiency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData.efficiencyData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
                formatter={(value: any) => [`${value}%`, "Efficiency"]}
              />
              <Bar
                dataKey="efficiency"
                fill="#10b981"
                name="Efficiency %"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card> */}

      {/* Order Status Distribution */}
      <Card className="shadow-sm border-0 ring-1 ring-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-800">
            Order Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.orderStatusChart}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
                stroke="#fff"
                strokeWidth={2}
              >
                {chartData.orderStatusChart.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
                formatter={(value: any, name: any) => [value, name]}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: "12px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Weekly Efficiency Trend */}
      <Card className="shadow-sm border-0 ring-1 ring-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-800">
            Weekly Efficiency Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              // data={[
              //   { week: "W1", efficiency: 87 },
              //   { week: "W2", efficiency: 89 },
              //   { week: "W3", efficiency: 91 },
              //   { week: "W4", efficiency: 88 },
              //   { week: "W5", efficiency: 92 },
              //   { week: "W6", efficiency: 90 },
              // ]}
              data={weeklyChartData}
              // data={weeklyChartData2}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis domain={[80, 95]} tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
                formatter={(value: any) => [`${value}%`, "Efficiency"]}
              />
              <Line
                type="monotone"
                dataKey="efficiency"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
