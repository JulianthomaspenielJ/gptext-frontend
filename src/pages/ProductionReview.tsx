import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SearchFilter } from "@/components/SearchFilter";
import { OrderDetailsView } from "@/components/OrderDetailsView";
import { OrderStorage } from "@/lib/orderStorage";
import {
  BarChart3,
  Calendar,
  Download,
  TrendingUp,
  Package,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  CalendarX,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { loomApi, productionPlanningApi } from "@/services/api2";
import ENDPOINTS from "@/services/api";
import {
  formatDelayInfo,
  getAllDelayInfo,
  getDelayStatusColor,
} from "@/lib/delayCalculations";

export default function ProductionReview() {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [productionReview, setRealProductionReview] = useState<any[]>([]);
  const [monthlyProductionData, setMonthlyProductionData] = useState<any[]>([]);
  const [looms, setLooms] = useState<any[]>([]);
  const [delayInfo, setDelayInfo] = useState({});

  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    inProgress: 0,
    planning: 0,
    completed: 0,
    onHold: 0,
    totalProduction: 0,
  });
  const [otdPercentage, setOtdPercentage] = useState(0);
  const [avgEfficiency, setAvgEfficiency] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProductionPlanning = async () => {
      setLoading(true);
      try {
        const orderResponse = await productionPlanningApi.get(
          "/productionplanning-getall",
        );

        const productionReview = orderResponse.data.productionplanning;
        console.log(productionReview);
        setOrderStats({
          totalOrders: productionReview.length,
          inProgress: productionReview.filter((o) => o.status === "In Progress")
            .length,
          planning: productionReview.filter((o) => o.status === "Planning")
            .length,
          completed: productionReview.filter((o) => o.status === "Completed")
            .length,
          onHold: productionReview.filter((o) => o.status === "On Hold").length,
          totalProduction: productionReview.reduce(
            (sum: number, item: any) =>
              sum + Number(item.actualproduction || 0),
            0,
          ),
        });

        const completedOrders = productionReview.filter(
          (o) => o.progress === "100.00" && o.actualproduction !== null,
        );
        const onTimeOrders = completedOrders.filter((o) => {
          return Number(o.actualproduction) >= Number(o.meters);
        });

        const otdpercentage =
          completedOrders.length === 0
            ? 0
            : ((onTimeOrders.length / completedOrders.length) * 100).toFixed(2);

        setOtdPercentage(Number(otdpercentage));

        console.log("On-Time Delivery %:", otdpercentage);

        const totalActual = productionReview.reduce(
          (sum, o) => sum + Number(o.actualproduction || 0),
          0,
        );

        const totalTarget = productionReview.reduce((sum, o) => {
          const dailyTarget = Number(o.productionperdayloom || 0);
          if (!dailyTarget || !o.startdate || !o.enddate) return sum;

          const days =
            (Number(new Date(o.enddate)) - Number(new Date(o.startdate))) /
              (1000 * 60 * 60 * 24) +
            1;

          const loomsCount = Array.isArray(o.loomsselected)
            ? Number(o.loomsselected.length)
            : 1;

          return sum + dailyTarget * days * loomsCount;
        }, 0);

        const avgefficiency =
          totalTarget === 0
            ? 0
            : ((totalActual / totalTarget) * 100).toFixed(2);

        setAvgEfficiency(Number(avgefficiency));
        console.log("Avg Efficiency %:", avgefficiency);

        // ✅ Filter only items with loomsselected.length > 0
        const filteredProductionReview = productionReview.filter(
          (item: any) =>
            Array.isArray(item.loomsselected) && item.loomsselected.length > 0,
        );

        console.log(filteredProductionReview);
        setRealProductionReview(filteredProductionReview);
        setFilteredData(filteredProductionReview);
        const allDelayInfo = await getAllDelayInfo();
        setDelayInfo(allDelayInfo);
        setError("");
      } catch (err) {
        setError(err.response?.error || "Error fetching production planning");
      } finally {
        setLoading(false);
      }
    };

    fetchProductionPlanning();
  }, []);

  // useEffect(() => {
  //   const fetchLooms = async () => {
  //     setLoading(true);
  //     try {
  //       const loomResponse = await loomApi.get(
  //         "/loom-getall",
  //       );

  //       const looms = loomResponse.data.loom;
  //     const avgEfficiencyByType = calculateAvgEfficiencyByType(looms);

  //       setError("");
  //     } catch (err) {
  //       setError(err.response?.error || "Error fetching production planning");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchLooms();
  // }, []);

  useEffect(() => {
    const fetchLooms = async () => {
      setLoading(true);
      try {
        const response = await loomApi.get("/loom-getall");

        const loomsData = Array.isArray(response.data?.loom)
          ? response.data.loom
          : [];

        setLooms(loomsData);
        setError("");
      } catch (err: any) {
        setError(err.response?.error || "Error fetching looms");
      } finally {
        setLoading(false);
      }
    };

    fetchLooms();
  }, []);

  useEffect(() => {
    fetchMonthlyTrend();
  }, []);
  // const handleSearch = (query: string) => {
  //   // Implement search logic
  //   console.log("Searching:", query);
  // };

  const handleSearch = (query: string) => {
    console.log("Searching:", query);
    if (!query.trim()) {
      setFilteredData(productionReview);
      return;
    }

    const filtered = productionReview.filter((order) =>
      // loom.id.toLowerCase().includes(query.toLowerCase()) ||
      // loom.loomtype.toLowerCase().includes(query.toLowerCase()) ||
      // loom.assignedweaver.toLowerCase().includes(query.toLowerCase()) ||
      // loom.location.toLowerCase().includes(query.toLowerCase()),
      order.orderid.toLowerCase().includes(query.toLowerCase()),
    );
    setFilteredData(filtered);
  };

  // const handleFilter = (filters: any) => {
  //   // Implement filter logic
  //   console.log("Filtering:", filters);
  // };

  const handleFilter = (filters: any) => {
    let filtered = [...productionReview];

    if (filters.status) {
      filtered = filtered.filter(
        (pReview) => pReview.status === filters.status,
      );
    }

    if (filters.priority) {
      filtered = filtered.filter(
        (pReview) => pReview.priority === filters.priority,
      );
    }

    setFilteredData(filtered);
  };

  const handleClearFilters = () => {
    setFilteredData(productionReview);
  };

  const handleViewOrder = (order: any) => {
    // Get order details from storage
    // const orders = OrderStorage.getOrders();
    // const orderDetail = orders.find((o) => o.id === order.id);
    setSelectedOrder(order.id);
    console.log(order.id);
    setIsOrderDetailsOpen(true);
  };

  const handleExportReport = () => {
    const reportData = {
      totalOrders: orderStats.totalOrders,
      totalProduction: orderStats.totalProduction,
      onTimeDelivery: otdPercentage,
      avgEfficiency: avgEfficiency,
      generatedOn: new Date().toLocaleString(),
    };

    // Generate PDF report
    import("jspdf").then((jsPDFModule) => {
      import("jspdf-autotable").then((autoTableModule) => {
        const jsPDF = jsPDFModule.default;
        const autoTable = autoTableModule.default;

        const doc = new jsPDF();
        let yPos = 20;

        // Header
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("Production Review Report", 105, yPos, { align: "center" });

        yPos += 15;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Generated on: ${reportData.generatedOn}`, 105, yPos, {
          align: "center",
        });

        yPos += 20;

        // Summary data
        const summaryData = [
          ["Metric", "Value"],
          ["Total Orders", reportData.totalOrders.toString()],
          ["Total Production", reportData.totalProduction],
          ["On-Time Delivery", reportData.onTimeDelivery],
          ["Average Efficiency", reportData.avgEfficiency],
        ];

        autoTable(doc, {
          startY: yPos,
          head: [summaryData[0]],
          body: summaryData.slice(1),
          theme: "grid",
          styles: { fontSize: 10 },
          columnStyles: {
            0: { fontStyle: "bold" },
            1: { halign: "center" },
          },
        });

        yPos = (doc as any).lastAutoTable.finalY + 20;

        // Additional analysis section
        doc.setFont("helvetica", "bold");
        doc.text("Production Analysis", 20, yPos);
        yPos += 10;

        doc.setFont("helvetica", "normal");
        doc.text(
          "• Production efficiency is within acceptable range (89%)",
          20,
          yPos,
        );
        yPos += 7;
        doc.text("• On-time delivery performance is excellent (92%)", 20, yPos);
        yPos += 7;
        doc.text("• Total production volume shows consistent output", 20, yPos);
        yPos += 7;
        doc.text(
          "• Detailed weaver-wise and loom-wise analysis available",
          20,
          yPos,
        );

        // Save PDF
        doc.save(
          `production-report-${new Date().toISOString().split("T")[0]}.pdf`,
        );
      });
    });
  };

  const fetchMonthlyTrend = async () => {
    // const end = new Date(selectedDate);
    // const start = new Date(end);
    // start.setDate(end.getDate() - 6);

    // const start = "2025-01-01";
    // const end = "2025-12-31";

    // const startStr = start.toISOString().split("T")[0];
    // const endStr = end.toISOString().split("T")[0];

    const today = new Date();

    const endDate = new Date(today.getFullYear(), today.getMonth(), 0);

    // Start = first day, 6 months before end month
    const startDate = new Date(
      endDate.getFullYear(),
      endDate.getMonth() - 5,
      1,
    );

    const start = startDate.toISOString().split("T")[0];
    const end = endDate.toISOString().split("T")[0];

    try {
      const response = await ENDPOINTS.getMonthlyTrend(start, end);

      console.log(response);
      setMonthlyProductionData(response.data);
      // let raw = response.data;

      // // Handle common wrapper patterns
      // if (raw?.data) raw = raw.data;
      // if (raw?.weeklyTrend) raw = raw.weeklyTrend;
      // if (raw?.result) raw = raw.result;

      // if (!Array.isArray(raw)) {
      //   console.error("Not an array after unwrapping:", raw);
      //   setWeeklyTrend([]);
      //   return;
      // }

      // Normalize field names
      // const normalized = raw.map((item: any) => ({
      //   date: item.date || item.day || item.productionDate,
      //   target: Number(item.target || item.planned || item.targetProduction || 0),
      //   actual: Number(item.actual || item.produced || item.actualProduction || 0),
      // }));

      // Filter valid entries
      // const valid = normalized.filter((d: any) => d.date && !isNaN(d.target) && !isNaN(d.actual));

      // setWeeklyTrend(valid);
    } catch (err: any) {
      console.error("Monthly trend error:", err.response?.data || err.message);
      // setWeeklyTrend([]);
    }
  };

  const calculateAvgEfficiencyByType = (looms: any[]) => {
    const grouped = looms.reduce((acc: any, loom: any) => {
      const type = loom.loomtype;
      const efficiency = Number(loom.efficiency);

      if (isNaN(efficiency)) return acc;

      if (!acc[type]) {
        acc[type] = { total: 0, count: 0 };
      }

      acc[type].total += efficiency;
      acc[type].count += 1;

      return acc;
    }, {});

    // Convert to average
    return Object.keys(grouped).map((type) => ({
      loomtype: type,
      avgEfficiency: Number(
        (grouped[type].total / grouped[type].count).toFixed(2),
      ),
    }));
  };
  const efficiencyByType = useMemo(() => {
    if (!looms?.length) return [];

    const grouped = looms.reduce((acc: any, loom: any) => {
      const type = loom.loomtype;
      const efficiency = Number(loom.efficiency);

      if (isNaN(efficiency)) return acc;

      if (!acc[type]) acc[type] = { total: 0, count: 0 };

      acc[type].total += efficiency;
      acc[type].count += 1;

      return acc;
    }, {});

    return Object.entries(grouped).map(([type, data]: any) => ({
      loomtype: type,
      avgEfficiency: Number((data.total / data.count).toFixed(1)),
    }));
  }, [looms]);

  const overallEfficiency = useMemo(() => {
    if (!looms?.length) return 0;

    return Number(
      (
        looms.reduce(
          (sum: number, loom: any) => sum + Number(loom.efficiency || 0),
          0,
        ) / looms.length
      ).toFixed(1),
    );
  }, [looms]);

  // Sample data for the Monthly Production Trend chart
  // const monthlyProductionData = [
  //   { month: "Jan", production: 45000, target: 50000 },
  //   { month: "Feb", production: 52000, target: 50000 },
  //   { month: "Mar", production: 48000, target: 50000 },
  //   { month: "Apr", production: 61000, target: 55000 },
  //   { month: "May", production: 55000, target: 55000 },
  //   { month: "Jun", production: 67000, target: 60000 },
  // ];

  const loomMap = useMemo(() => {
    const map: Record<string, any> = {};
    looms.forEach((loom: any) => {
      map[String(loom.id)] = loom;
    });
    return map;
  }, [looms]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB");
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Production Review
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Comprehensive review of production performance and metrics
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
          <div className="flex-1 sm:mr-4">
            <SearchFilter
              onSearch={handleSearch}
              onFilter={handleFilter}
              onClearFilters={handleClearFilters}
              filterOptions={{
                status: ["Completed", "Planning", "In Progress", "Delayed"],
                priority: ["High", "Medium", "Low"],
                dateRange: true,
              }}
              placeholder="Search production data..."
            />
          </div>
          <Button
            onClick={handleExportReport}
            className="w-full sm:w-auto text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-10"
          >
            <Download className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Export Report</span>
            <span className="xs:hidden">Export</span>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Orders Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {orderStats.completed}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Production</p>
                <p className="text-2xl font-bold">
                  {orderStats.totalProduction} m
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">On-Time Delivery</p>
                <p className="text-2xl font-bold">{otdPercentage} %</p>
              </div>
              <Package className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Efficiency</p>
                <p className="text-2xl font-bold">{avgEfficiency} %</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      {/* 
[
              {
                orderId: "BTC-101",
                customer: "Blue Ocean Textiles",
                plannedMeters: 12000,
                deliveredMeters: 12000,
                status: "Completed",
                deliveryDate: "29-06-2025",
                onTime: true,
              },
              {
                orderId: "VTS-205",
                customer: "Victory Fabrics Ltd",
                plannedMeters: 8500,
                deliveredMeters: 5500,
                status: "In Progress",
                deliveryDate: "15-07-2025",
                onTime: true,
              },
              {
                orderId: "FTC-309",
                customer: "Future Textile Corp",
                plannedMeters: 6200,
                deliveredMeters: 4960,
                status: "In Progress",
                deliveryDate: "08-07-2025",
                onTime: true,
              },
            ] */}
      {/* Order Performance */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Order Performance Review</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredData.map((order) => (
//               const orderDelayInfo = delayInfo[order.orderid];
// const isDelayed = orderDelayInfo?.isDelayed || false;
  // return (

              <Card key={order.orderid} className="border-l-4 border-l-primary">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 space-y-2 sm:space-y-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-sm sm:text-lg">
                        {order.orderid}
                      </h3>
                      <Badge
                        className={`text-xs ${
                          order.status === "Completed"
                            ? "bg-green-500 text-white"
                            : "bg-blue-500 text-white"
                        }`}
                      >
                        {order.status}
                      </Badge>
                      {order.onTime && (
                        <Badge className="bg-green-100 text-green-700 text-xs">
                          On Time
                        </Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewOrder({ id: order.orderid })}
                      className="text-xs xs:text-sm px-2 xs:px-3 h-8"
                    >
                      <Eye className="mr-0 xs:mr-1 h-3 w-3 xs:h-4 xs:w-4" />
                      <span className="hidden xs:inline">View Details</span>
                      <span className="xs:hidden">View</span>
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Customer
                      </p>
                      <p className="font-medium text-xs sm:text-sm line-clamp-1">
                        {order.customername}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Planned Meters
                      </p>
                      <p className="font-medium text-xs sm:text-sm">
                        {order.meters}m
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Production Meters
                      </p>
                      <p className="font-medium text-xs sm:text-sm">
                        {order.actualproduction || 0} m
                      </p>
                    </div>

                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Duration
                      </p>
                      <p className="font-medium text-xs sm:text-sm">
                        {formatDate(order.startdate)} -{" "}
                        {formatDate(order.enddate)}
                      </p>
                    </div>
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 mb-1">
                        Assigned Looms
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {order.loomsselected?.map((loomId: any) => {
                          const loom = loomMap[String(loomId)];

                          return (
                            <Badge key={loomId} variant="outline">
                              {loom ? loom.name : `Loom ${loomId}`}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-gray-600">
                      Progress
                    </span>
                    <span className="font-medium text-xs sm:text-sm">
                      {Math.round(
                        (order.actualproduction / order.meters) * 100,
                      )}
                      %
                    </span>
                  </div>
                  <Progress
                    value={(order.actualproduction / order.meters) * 100}
                    className="mt-1"
                  />

                  {orderDelayInfo && (
                    <div className="mt-3 p-2 rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          {isDelayed ? (
                            <CalendarX className="h-4 w-4 text-red-500" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}

                          <span className={getDelayStatusColor(orderDelayInfo)}>
                            {formatDelayInfo(orderDelayInfo)}
                          </span>
                        </div>
                      </div>

                      {isDelayed && (
                        <div className="mt-2 text-xs text-gray-600 space-y-1">
                          <div>
                            Original Runout:{" "}
                            {new Date(
                              orderDelayInfo.originalRunoutDate,
                            ).toLocaleDateString("en-GB")}
                          </div>

                          <div className="text-red-600 font-medium">
                            Expected Runout:{" "}
                            {new Date(
                              orderDelayInfo.expectedRunoutDate,
                            ).toLocaleDateString("en-GB")}
                          </div>

                          <div>
                            Average Current Rate:{" "}
                            {orderDelayInfo.dailyProductionRate} m
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
              
            ))}
          </div>
        </CardContent>
      </Card> */}

      <Card>
        <CardHeader>
          <CardTitle>Order Performance Review</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {filteredData.map((order) => {
              const orderDelayInfo = delayInfo[order.orderid];
              const isDelayed = orderDelayInfo?.isDelayed || false;

              return (
                <Card
                  key={order.orderid}
                  className={`border-l-4 ${
                    isDelayed ? "border-l-red-500" : "border-l-primary"
                  }`}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 space-y-2 sm:space-y-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-sm sm:text-lg">
                          {order.gptid}
                        </h3>

                        <Badge
                          className={`text-xs ${
                            order.status === "Completed"
                              ? "bg-green-500 text-white"
                              : "bg-blue-500 text-white"
                          }`}
                        >
                          {order.status}
                        </Badge>

                        {order.onTime && (
                          <Badge className="bg-green-100 text-green-700 text-xs">
                            On Time
                          </Badge>
                        )}
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewOrder({ id: order.orderid })}
                        className="text-xs xs:text-sm px-2 xs:px-3 h-8"
                      >
                        <Eye className="mr-0 xs:mr-1 h-3 w-3 xs:h-4 xs:w-4" />
                        <span className="hidden xs:inline">View Details</span>
                        <span className="xs:hidden">View</span>
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Customer
                        </p>
                        <p className="font-medium text-xs sm:text-sm line-clamp-1">
                          {order.customername}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Planned Meters
                        </p>
                        <p className="font-medium text-xs sm:text-sm">
                          {order.meters} m
                        </p>
                      </div>

                      <div>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Production Meters
                        </p>
                        <p className="font-medium text-xs sm:text-sm">
                          {order.actualproduction || 0} m
                        </p>
                      </div>

                      <div>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Warp Meters Left
                        </p>
                        <p className="font-medium text-xs sm:text-sm">
                          {Number(order.availablewarpmeters || 0).toFixed(2)} m
                        </p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Duration
                        </p>
                        <p className="font-medium text-xs sm:text-sm">
                          {formatDate(order.startdate)} -{" "}
                          {formatDate(order.enddate)}
                        </p>
                      </div>

                      <div className="mb-3">
                        <p className="text-sm text-gray-600 mb-1">
                          Assigned Looms
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {order.loomsselected?.map((loom: any) => {
                            // const loom = loomMap[String(loomId)];
                            return (
                              <Badge key={loom.id} variant="outline">
                                {loom ? loom.name : `Loom ${loom}`}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-gray-600">
                        Progress
                      </span>
                      <span className="font-medium text-xs sm:text-sm">
                        {Math.round(
                          (order.actualproduction / order.meters) * 100,
                        )}
                        %
                      </span>
                    </div>

                    <Progress
                      value={(order.actualproduction / order.meters) * 100}
                      className="mt-1"
                    />

                    {orderDelayInfo && (
                      <div className="mt-3 p-2 rounded-lg bg-gray-50">
                        <div className="flex items-center space-x-2 text-xs">
                          {isDelayed ? (
                            <CalendarX className="h-4 w-4 text-red-500" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}

                          <span className={getDelayStatusColor(orderDelayInfo)}>
                            {formatDelayInfo(orderDelayInfo)}
                          </span>
                        </div>

                        {isDelayed && (
                          <div className="mt-2 text-xs text-gray-600 space-y-1">
                            <div>
                              Original Runout:{" "}
                              {new Date(
                                orderDelayInfo.originalRunoutDate,
                              ).toLocaleDateString("en-GB")}
                            </div>

                            <div className="text-red-600 font-medium">
                              Expected Runout:{" "}
                              {new Date(
                                orderDelayInfo.expectedRunoutDate,
                              ).toLocaleDateString("en-GB")}
                            </div>

                            <div>
                              Average Current Rate:{" "}
                              {orderDelayInfo.dailyProductionRate} m
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Production Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyProductionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} interval={0} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value.toLocaleString()}m`,
                      name === "production" ? "Actual Production" : "Target",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="production"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    name="production"
                  />
                  <Line
                    type="monotone"
                    dataKey="target"
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="target"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader>
            <CardTitle>Efficiency Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Rapier Looms</span>
                  <span>92% avg efficiency</span>
                </div>
                <Progress value={92} />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Airjet Looms</span>
                  <span>88% avg efficiency</span>
                </div>
                <Progress value={88} />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Sulzer Looms</span>
                  <span>95% avg efficiency</span>
                </div>
                <Progress value={95} />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Performance</span>
                  <span>91.7% avg efficiency</span>
                </div>
                <Progress value={91.7} />
              </div>
            </div>
          </CardContent>
        </Card> */}
        <Card>
          <CardHeader>
            <CardTitle>Efficiency Analysis</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {efficiencyByType.map((item) => (
                <div key={item.loomtype}>
                  <div className="flex justify-between text-sm mb-2">
                    <span>{item.loomtype} Looms</span>
                    <span>{item.avgEfficiency}% avg efficiency</span>
                  </div>
                  <Progress value={item.avgEfficiency} />
                </div>
              ))}

              <div>
                <div className="flex justify-between text-sm mb-2 font-medium">
                  <span>Overall Performance</span>
                  <span>{overallEfficiency}% avg efficiency</span>
                </div>
                <Progress value={overallEfficiency} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Details View */}
      <OrderDetailsView
        orderId={selectedOrder}
        isOpen={isOrderDetailsOpen}
        onClose={() => setIsOrderDetailsOpen(false)}
        // mode="view"
      />
    </div>
  );
}
