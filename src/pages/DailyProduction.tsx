import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductionRecordForm } from "@/components/ProductionRecordForm";
import { WeaverProductionForm } from "@/components/WeaverProductionForm";
import axios from "axios";
import {
  TrendingUp,
  Calendar,
  Factory,
  Target,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Users,
  Package,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import ENDPOINTS from "@/services/api";

interface Loom {
  loom_id: string;
  loom_name: string;
  order_id: string | null;
  gptid: string | null;
  weaver_id: string | null;
  weaver_name: string;
  target: number;
  actual: number;
  loom_status: string;
}

interface Weaver {
  weaver_id: string;
  weaver_name: string;
  loom_ids: string[];
  loom_names: string[];
  loom_statuses: string[];
  order_id: string[];
  gpt_ids: string[];
  target: number;
  actual: number;
}

interface Order {
  order_id: string;
  gptid: string;
  loom_ids: string[];
  loom_names: string[];
  loom_statuses: string[];
  weaver_ids: string[];
  weaver_names: string[];
  target: number;
  actual: number;
}

interface DailyData {
  success: boolean;
  date: string;
  summary: {
    totalTarget: number;
    totalActual: number;
    achievement: number;
    activeLooms: number;
  };
  data: {
    loomWise: Loom[];
    weaverWise: Weaver[];
    orderWise: Order[];
  };
}

interface WeeklyTrend {
  date: string;
  target: number;
  actual: number;
}

export default function DailyProduction() {
  const [selectedLoom, setSelectedLoom] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedWeaver, setSelectedWeaver] = useState<any>(null);
  const [isRecordFormOpen, setIsRecordFormOpen] = useState(false);
  const [isWeaverFormOpen, setIsWeaverFormOpen] = useState(false);
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  const [weavers, setWeavers] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [productionData, setProductionData] = useState<any[]>([]);

  const [weaverProductionData, setWeaverProductionData] = useState([]);
  const [dailyData, setDailyData] = useState<DailyData | null>(null);
  const [weeklyTrend, setWeeklyTrend] = useState<WeeklyTrend[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDaily = async () => {
    setLoading(true);
    try {
      const res = await ENDPOINTS.getDailyProduction(selectedDate); // Axios call
      setDailyData(res.data); // Axios uses res.data
    } catch (err) {
      console.error("Daily fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch weekly trend (last 7 days)
  const fetchWeeklyTrend = async () => {
    const end = new Date(selectedDate);
    const start = new Date(end);
    start.setDate(end.getDate() - 6);

    const startStr = start.toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];

    try {
      const response = await ENDPOINTS.getWeeklyTrend(startStr, endStr);

      let raw = response.data;

      // Handle common wrapper patterns
      if (raw?.data) raw = raw.data;
      if (raw?.weeklyTrend) raw = raw.weeklyTrend;
      if (raw?.result) raw = raw.result;

      if (!Array.isArray(raw)) {
        console.error("Not an array after unwrapping:", raw);
        setWeeklyTrend([]);
        return;
      }

      // Normalize field names
      const normalized = raw.map((item: any) => ({
        date: item.date || item.day || item.productionDate,
        target: Number(
          item.target || item.planned || item.targetProduction || 0,
        ),
        actual: Number(
          item.actual || item.produced || item.actualProduction || 0,
        ),
      }));

      // Filter valid entries
      const valid = normalized.filter(
        (d: any) => d.date && !isNaN(d.target) && !isNaN(d.actual),
      );

      setWeeklyTrend(valid);
    } catch (err: any) {
      console.error("Weekly trend error:", err.response?.data || err.message);
      setWeeklyTrend([]);
    }
  };

  useEffect(() => {
    fetchDaily();
    fetchWeeklyTrend();
  }, [selectedDate]);

  // Dynamic alerts
  const alerts =
    dailyData?.data?.loomWise
      .map((loom) => {
        const efficiency =
          loom.target > 0 ? Math.round((loom.actual / loom.target) * 100) : 0;
        if (loom.target > 0 && loom.actual === 0) {
          return {
            type: "error",
            title: `${loom.loom_name} - No Production`,
            desc: "Target set but 0 meters produced",
            icon: AlertTriangle,
          };
        }
        if (efficiency > 0 && efficiency < 80) {
          return {
            type: "warning",
            title: `${loom.loom_name} - Low Efficiency`,
            desc: `${efficiency}%`,
            icon: AlertTriangle,
          };
        }
        if (efficiency >= 100) {
          return {
            type: "success",
            title: `${loom.loom_name} - Target Exceeded!`,
            desc: `${loom.actual}m vs ${loom.target}m`,
            icon: CheckCircle,
          };
        }
        if (loom.loom_status === "Maintenance") {
          return {
            type: "info",
            title: `${loom.loom_name} - Under Maintenance`,
            desc: "Loom not running",
            icon: AlertCircle,
          };
        }
        return null;
      })
      .filter(Boolean)
      .slice(0, 6) || [];

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setIsDatePickerOpen(false);
  };

  const handleLoomClick = (loom: any) => {
    setSelectedLoom(loom);
    setIsRecordFormOpen(true);
  };

  const handleWeaverClick = (weaver: any) => {
    setSelectedWeaver(weaver);
    setIsWeaverFormOpen(true);
  };

  const handleOrderClick = (order: any) => {
    setSelectedOrder(order);
    setIsOrderFormOpen(true);
  };

  const handleProductionSubmit = (data: any) => {
    setProductionData((prev) =>
      prev.map((item) =>
        item.loom === data.loomId
          ? { ...item, actual: data.actualProduction }
          : item,
      ),
    );
    console.log("Production recorded:", data);
  };

  const handleWeaverProductionSubmit = (data: any) => {
    setWeaverProductionData((prev) =>
      prev.map((item) =>
        item.weaverId === data.weaverId
          ? {
              ...item,
              totalActual: data.totalProduction,
              efficiency: data.efficiency,
            }
          : item,
      ),
    );
    console.log("Weaver production recorded:", data);
  };

  if (loading) return <SkeletonLoader />;

  if (!dailyData) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 text-xl">Failed to load production data</p>
        <Button onClick={fetchDaily} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Daily Production
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Monitor and record daily production output for each loom
          </p>
        </div>
        <div className="flex flex-col xs:flex-row space-y-2 xs:space-y-0 xs:space-x-2">
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className="w-full xs:w-auto text-xs sm:text-sm"
            >
              <Calendar className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              {new Date(selectedDate).toLocaleDateString()}
            </Button>
            {isDatePickerOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg p-2 z-10">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="border rounded px-2 py-1 text-sm"
                />
              </div>
            )}
          </div>
          <Button
            onClick={() => {
              fetchDaily();
              fetchWeeklyTrend();
            }}
            className="w-full xs:w-auto text-xs sm:text-sm"
          >
            <TrendingUp className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Refresh Data</span>
            <span className="xs:hidden">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Production Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {[
          {
            label: "Today's Target",
            value: dailyData.summary.totalTarget.toLocaleString() + "m",
            icon: Target,
            valueClass: "text-lg sm:text-2xl font-bold",
            iconClass: "h-6 w-6 sm:h-8 sm:w-8 text-blue-500",
          },
          {
            label: "Actual Production",
            value: dailyData.summary.totalActual.toLocaleString() + "m",
            icon: TrendingUp,
            valueClass: "text-lg sm:text-2xl font-bold text-green-600",
            iconClass: "h-6 w-6 sm:h-8 sm:w-8 text-green-500",
          },
          {
            label: "Achievement",
            value: dailyData.summary.achievement + "%",
            icon: Progress,
            valueClass: "text-lg sm:text-2xl font-bold",
            iconClass: "text-yellow-500",
            progress: true,
          },
          {
            label: "Active Looms",
            value: dailyData.summary.activeLooms,
            icon: Factory,
            valueClass: "text-lg sm:text-2xl font-bold",
            iconClass: "h-6 w-6 sm:h-8 sm:w-8 text-blue-500",
          },
        ].map((item, i) => (
          <Card key={i}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {item.label}
                  </p>
                  <p className={item.valueClass}>{item.value}</p>
                </div>

                {/* Special case: Achievement uses Progress component */}
                {!item.progress ? (
                  <item.icon className={item.iconClass} />
                ) : (
                  <div className="text-yellow-500">
                    <Progress
                      value={dailyData.summary.achievement}
                      className="w-6 sm:w-8"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Production Tracking Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Production Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="looms" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger
                value="looms"
                className="flex items-center text-xs sm:text-sm px-2 py-2"
              >
                <Factory className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Loom-wise Production</span>
                <span className="xs:hidden">Looms</span>
              </TabsTrigger>
              <TabsTrigger
                value="weavers"
                className="flex items-center text-xs sm:text-sm px-2 py-2"
              >
                <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Weaver-wise Production</span>
                <span className="xs:hidden">Weavers</span>
              </TabsTrigger>
              <TabsTrigger
                value="orders"
                className="flex items-center text-xs sm:text-sm px-2 py-2"
              >
                <Package className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Order-wise Production</span>
                <span className="xs:hidden">Orders</span>
              </TabsTrigger>
            </TabsList>

            {/* Loom-wise Production Tab */}
            <TabsContent value="looms" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {dailyData.data.loomWise.map((loom) => {
                  const efficiency =
                    loom.target > 0
                      ? Math.round((loom.actual / loom.target) * 100)
                      : 0;
                  return (
                    <Card
                      key={loom.loom_id}
                      className="border-2 cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => handleLoomClick(loom)}
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-bold">{loom.loom_name}</h3>
                          <Badge
                            className={
                              loom.actual >= loom.target
                                ? "bg-green-500 text-white"
                                : loom.actual === 0
                                  ? "bg-red-500 text-white"
                                  : "bg-yellow-500 text-white"
                            }
                          >
                            {loom.actual >= loom.target
                              ? "Target Met"
                              : loom.actual === 0
                                ? "Not Running"
                                : "Below Target"}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Target:</span>
                            <span className="font-medium">{loom.target}m</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Actual:</span>
                            <span className="font-medium">{loom.actual}m</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Order:</span>
                            <span className="font-medium">
                              {loom.gptid || "No active orders"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Weaver:</span>
                            <span className="font-medium">
                              {loom.weaver_name}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Efficiency</span>
                            <span>{efficiency}%</span>
                          </div>
                          <Progress value={Math.min(efficiency, 100)} />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* Weaver-wise Production Tab */}
            <TabsContent value="weavers" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {dailyData.data.weaverWise.map((w) => {
                  const efficiency =
                    w.target > 0 ? Math.round((w.actual / w.target) * 100) : 0;
                  return (
                    <Card
                      key={w.weaver_id}
                      className="border-2 cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => handleWeaverClick(w)}
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-bold">{w.weaver_name}</h3>
                          <Badge
                            className={
                              efficiency >= 95
                                ? "bg-green-500 text-white"
                                : efficiency === 0
                                  ? "bg-red-500 text-white"
                                  : efficiency >= 80
                                    ? "bg-yellow-500 text-white"
                                    : "bg-orange-500 text-white"
                            }
                          >
                            {efficiency >= 95
                              ? "Excellent"
                              : efficiency === 0
                                ? "No Production"
                                : efficiency >= 80
                                  ? "Good"
                                  : "Below Average"}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              Assigned Looms:
                            </span>
                            <span className="font-medium">
                              {w.loom_names.join(", ")}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Target:</span>
                            <span className="font-medium">{w.target}m</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Actual:</span>
                            <span className="font-medium">{w.actual}m</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Orders:</span>
                            <span className="font-medium">
                              {w.gpt_ids.join(", ")}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Efficiency</span>
                            <span>{efficiency}%</span>
                          </div>
                          <Progress value={efficiency} />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* Order-wise Production Tab */}
            <TabsContent value="orders" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {dailyData.data.orderWise.map((order) => {
                  const efficiency =
                    order.target > 0
                      ? Math.round((order.actual / order.target) * 100)
                      : 0;
                  return (
                    <Card
                      key={order.order_id}
                      onClick={() => handleOrderClick(order)}
                      className="border-2 cursor-pointer hover:shadow-lg transition-shadow"
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-bold">{order.gptid}</h3>
                          <Badge
                            className={
                              efficiency >= 95
                                ? "bg-green-500 text-white"
                                : efficiency === 0
                                  ? "bg-red-500 text-white"
                                  : efficiency >= 80
                                    ? "bg-yellow-500 text-white"
                                    : "bg-orange-500 text-white"
                            }
                          >
                            {efficiency >= 95
                              ? "Excellent"
                              : efficiency === 0
                                ? "No Production"
                                : efficiency >= 80
                                  ? "Good"
                                  : "Below Average"}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              Assigned Looms:
                            </span>
                            <span className="font-medium">
                              {order.loom_names.join(", ")}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Target:</span>
                            <span className="font-medium">{order.target}m</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Actual:</span>
                            <span className="font-medium">{order.actual}m</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Weavers:</span>
                            <span className="font-medium">
                              {order.weaver_names.join(", ")}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Efficiency</span>
                            <span>{efficiency}%</span>
                          </div>
                          <Progress value={efficiency} />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Production Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Production Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyTrend.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(dateStr) => {
                      const d = new Date(dateStr);
                      return d.toLocaleDateString("en", { weekday: "short" });
                    }}
                  />
                  <YAxis tickFormatter={(v) => v / 1000 + "k"} />
                  <Tooltip
                    formatter={(value: number) => value.toLocaleString() + "m"}
                    labelFormatter={(label) =>
                      `Date: ${new Date(label).toLocaleDateString()}`
                    }
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="target"
                    stroke="#3b82f6"
                    name="Target"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#10b981"
                    name="Actual"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Production Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="text-gray-600">All looms running smoothly!</p>
                </div>
              ) : (
                alerts.map((a, i) => {
                  const Icon = a.icon;
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-4 border rounded-lg bg-gray-50"
                    >
                      <Icon
                        className={`h-5 w-5 mt-0.5 ${
                          a.type === "success"
                            ? "text-green-600"
                            : a.type === "error"
                              ? "text-red-600"
                              : a.type === "warning"
                                ? "text-orange-600"
                                : "text-blue-600"
                        }`}
                      />
                      <div>
                        <p className="font-semibold text-sm">{a.title}</p>
                        <p className="text-xs text-gray-600">{a.desc}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Production Record Forms */}
      {/* {selectedLoom && (
        <ProductionRecordForm
          isOpen={isRecordFormOpen}
          setIsOpen={setIsRecordFormOpen}
          loomId={selectedLoom.loom_id}
          loomName={selectedLoom.loom_name}
          weaverId={selectedLoom.weaver_id}
          orderId={selectedLoom.order_id}
          gptId={selectedLoom.gptid}
          targetProduction={selectedLoom.target}
          currentProduction={selectedLoom.actual}
          selectedDate={selectedDate}
          onSubmit={() => {
            fetchDaily();
            fetchWeeklyTrend();
          }}
        />
      )}

      {selectedWeaver && (
        <WeaverProductionForm
          isOpen={isWeaverFormOpen}
          onClose={() => setIsWeaverFormOpen(false)}
          weaver={{
            weaverId: selectedWeaver.weaver_id,
            gptId: selectedWeaver.gpt_ids,
            weaverName: selectedWeaver.weaver_name,
            totalTarget: selectedWeaver.target,
            efficiency:
              selectedWeaver.target > 0
                ? Math.round(
                    (selectedWeaver.actual / selectedWeaver.target) * 100,
                  )
                : 0,
            isOrderView: false,
            orderId: selectedOrder?.order_id,

            assignedLooms: selectedWeaver.loom_ids.map(
              (loomId: string, index: number) => {
                return {
                  id: loomId,
                  name: selectedWeaver.loom_names[index] || loomId || "Unknown",
                  targetProduction: 0,
                };
              },
            ),
          }}
          onSubmit={() => {
            fetchDaily();
            fetchWeeklyTrend();
          }}
        />
      )}
      {selectedOrder && (
        <WeaverProductionForm
          isOpen={isOrderFormOpen}
          onClose={() => setIsOrderFormOpen(false)}
          weaver={{
            weaverId: selectedOrder.weaver_ids?.[0] || "",
            gptId: selectedOrder.gptid,
            weaverName: selectedOrder.weaver_names?.[0] || "",
            totalTarget: selectedOrder.target,
            efficiency:
              selectedOrder.target > 0
                ? Math.round(
                    (selectedOrder.actual / selectedOrder.target) * 100,
                  )
                : 0,
            isOrderView: true,
            weaverNames: selectedOrder.weaver_names,
            orderId: selectedOrder.order_id,
            assignedLooms: selectedOrder.loom_ids.map(
              (loomId: string, index: number) => {
                return {
                  id: loomId,
                  name: selectedOrder.loom_names[index] || loomId || "Unknown",
                  targetProduction: 0,
                };
              },
            ),
          }}
          onSubmit={() => {
            fetchDaily();
            fetchWeeklyTrend();
          }}
        />
      )} */}

      {/* Production Record Forms */}
      {selectedLoom && (
        <ProductionRecordForm
          isOpen={isRecordFormOpen}
          setIsOpen={setIsRecordFormOpen}
          loomId={selectedLoom.loom_id}
          loomName={selectedLoom.loom_name}
          weaverId={selectedLoom.weaver_id}
          orderId={selectedLoom.order_id}
          gptId={selectedLoom.gptid}
          targetProduction={selectedLoom.target}
          currentProduction={selectedLoom.actual}
          selectedDate={selectedDate}
          onSubmit={() => {
            fetchDaily();
            fetchWeeklyTrend();
          }}
        />
      )}

      {selectedWeaver && (
        <WeaverProductionForm
          isOpen={isWeaverFormOpen}
          onClose={() => setIsWeaverFormOpen(false)}
          weaver={{
            weaverId: selectedWeaver.weaver_id,
            gptId: selectedWeaver.gpt_ids,
            weaverName: selectedWeaver.weaver_name,
            totalTarget: selectedWeaver.target,
            efficiency:
              selectedWeaver.target > 0
                ? Math.round(
                    (selectedWeaver.actual / selectedWeaver.target) * 100,
                  )
                : 0,
            isOrderView: false,
            orderId: selectedOrder?.order_id,
            assignedLooms: selectedWeaver.loom_ids.map(
              (loomId: string, index: number) => {
                return {
                  id: loomId,
                  name: selectedWeaver.loom_names[index] || loomId || "Unknown",
                  targetProduction: 0,
                };
              },
            ),
          }}
          onSubmit={() => {
            fetchDaily();
            fetchWeeklyTrend();
          }}
        />
      )}
      {selectedOrder && (
        <WeaverProductionForm
          isOpen={isOrderFormOpen}
          onClose={() => setIsOrderFormOpen(false)}
          weaver={{
            weaverId: selectedOrder.weaver_ids?.[0] || "",
            gptId: selectedOrder.gptid,
            weaverName: selectedOrder.weaver_names?.[0] || "",
            totalTarget: selectedOrder.target,
            efficiency:
              selectedOrder.target > 0
                ? Math.round(
                    (selectedOrder.actual / selectedOrder.target) * 100,
                  )
                : 0,
            isOrderView: true,
            weaverNames: selectedOrder.weaver_names,
            orderId: selectedOrder.order_id,
            assignedLooms: selectedOrder.loom_ids.map(
              (loomId: string, index: number) => {
                return {
                  id: loomId,
                  name: selectedOrder.loom_names[index] || loomId || "Unknown",
                  targetProduction: 0,
                };
              },
            ),
          }}
          onSubmit={() => {
            fetchDaily();
            fetchWeeklyTrend();
          }}
        />
      )}
    </div>
  );
}

// Skeleton Loader
function SkeletonLoader() {
  return (
    <div className="p-6 space-y-8 animate-pulse">
      <div className="flex justify-between">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-10 w-48" />
      </div>
      <div className="grid grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <Skeleton className="h-40 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
