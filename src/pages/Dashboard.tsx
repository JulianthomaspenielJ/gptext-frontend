import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ProductionCharts } from "@/components/ProductionCharts";
// import { RealTimeStatus } from "@/components/RealTimeStatus";
// import { OrderStorage } from "@/lib/orderStorage";
// import { DataStore } from "@/lib/dataStore";
import { DataSync } from "@/lib/dataSync";
// import { WeaverStorage } from "@/lib/weaverStorage";
// import { LoomStorage } from "@/lib/loomStorage";
// import { checkAndInitializeDemoData } from "@/lib/initializeDemoData";
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Factory,
  Package,
  TrendingUp,
  Users,
  Zap,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import { loomApi, productionPlanningApi, weaverApi } from "@/services/api2";
import { DataStore } from "@/lib/dataStore";

// This will be dynamically calculated

// This will be dynamically loaded from OrderStorage

// const loomStatus = [
//   { type: "Rapier", active: 8, total: 12, efficiency: 92 },
//   { type: "Airjet", active: 10, total: 12, efficiency: 88 },
//   { type: "Sulzer", active: 6, total: 6, efficiency: 95 },
// ];

const alerts = [
  {
    type: "warning",
    message: "Loom MK-3 requires maintenance in 2 days",
    time: "2 hours ago",
  },
  {
    type: "info",
    message: "Order BTC-101 is ahead of schedule",
    time: "4 hours ago",
  },
  {
    type: "urgent",
    message: "Cotton yarn shortage detected for next week's production",
    time: "6 hours ago",
  },
];

interface StatusData {
  timestamp: string;
  activeLooms: number;
  currentProduction: number;
  efficiency: number;
  alerts: number;
  connectionStatus: "connected" | "disconnected" | "reconnecting";
}
export default function Dashboard() {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    orders: [],
    stats: [],
    alerts: [],
    recentOrders: [],
  });
  const [looms, setLooms] = useState([]);
  const [orders, setOrders] = useState([]);
  const [weavers, setWeavers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [status, setStatus] = useState<StatusData>({
    timestamp: new Date().toLocaleTimeString(),
    activeLooms: 4, // Will be updated from DataStore
    currentProduction: 0, // Will be updated from DataStore
    efficiency: 0, // Will be updated from DataStore
    alerts: 0, // Will be updated from DataStore
    connectionStatus: "connected",
  });
  // Initialize demo data and load dashboard data
  // useEffect(() => {
  // Initialize comprehensive demo data on first load
  // checkAndInitializeDemoData();

  // loadDashboardData();

  // Subscribe to data changes for real-time updates
  // const unsubscribers = [
  //   DataSync.subscribe(DataSync.DATA_TYPES.ORDERS, loadDashboardData),
  //   DataSync.subscribe(DataSync.DATA_TYPES.LOOMS, loadDashboardData),
  //   DataSync.subscribe(DataSync.DATA_TYPES.WEAVERS, loadDashboardData),
  //   DataSync.subscribe(DataSync.DATA_TYPES.PRODUCTION, loadDashboardData),
  //   DataSync.subscribe(DataSync.DATA_TYPES.DASHBOARD, loadDashboardData),
  // ];

  // return () => {
  //   unsubscribers.forEach((unsub) => unsub());
  // };
  // }, []);

  // useEffect(() => {
  //   const fetchLooms = async () => {
  //     try {
  //       const loomResponse = await loomApi.get("/loom-getall");

  //       const looms = loomResponse.data.loom;

  //       // // Count running looms
  //       // const activeLooms = looms.filter(
  //       //   (l: any) => l.status === "Running",
  //       // ).length;

  //       // const delayedLooms = looms.filter(
  //       //   (l: any) => l.status === "Delayed",
  //       // ).length;
  //       setLooms(looms);
  //     } catch (err) {
  //       console.error("Failed to fetch looms", err);
  //     }
  //   };

  //   fetchLooms();
  // }, []);

  useEffect(() => {
    const updateStatus = async () => {
      try {
        const currentStats = await DataStore.getSystemStats(); // <-- await the promise

        // console.log(currentStats);

        setStatus((prev) => ({
          ...prev,
          timestamp: new Date().toLocaleTimeString(),
          activeLooms: currentStats.looms.active,
          currentProduction: currentStats.production.todaysProduction,
          efficiency: currentStats.production.efficiency,
          alerts:
            currentStats.tasks.overdue +
            (currentStats.looms.maintenance > 0 ? 1 : 0),
        }));
      } catch (error) {
        console.error("Failed to fetch system stats:", error);
      }
    };

    // Initial update
    updateStatus();

    // if (!isLive) return;

    // const interval = setInterval(() => {
    //   updateStatus();
    // }, 3000);

    // return () => clearInterval(interval);
  }, []);
  const loadDashboardData = () => {
    // const orders = OrderStorage.getOrders();
    // const looms = LoomStorage.getLooms();
    // const weavers = WeaverStorage.getWeavers();
    // const systemStats = DataStore.getSystemStats();

    // Calculate real stats from actual data
    const activeLooms = looms.filter((l) => l.status === "Running").length;
    const totalLooms = looms.length;
    const activeOrders = orders.filter(
      (o) => o.status === "In Progress",
    ).length;
    const completedOrders = orders.filter(
      (o) => o.status === "Completed",
    ).length;
    const totalOrders = orders.length;
    const activeWeavers = weavers.filter((w) => w.status === "Active").length;

    // Calculate today's production based on running looms
    // const todaysProduction = activeLooms * 850; // Estimated meters per active loom per day

    // Calculate today's production based on active looms
    let todaysProduction = 0;

    // Loop through active looms
    const activeLoomsList = looms.filter((l) => l.status === "Running");

    // Sum production per day from orders assigned to active looms
    orders.forEach((order) => {
      if (order.loomsselected && order.productionperdayloom) {
        order.loomsselected.forEach((loomId) => {
          if (activeLoomsList.some((l) => l.id === loomId)) {
            todaysProduction += Number(order.productionperdayloom) || 0;
          }
        });
      }
    });

    const stats = [
      {
        title: "Active Looms",
        value: activeLooms.toString(),
        total: totalLooms.toString(),
        change:
          activeLooms > totalLooms - activeLooms
            ? `+${activeLooms - (totalLooms - activeLooms)}`
            : `${activeLooms - (totalLooms - activeLooms)}`,
        icon: Factory,
        color: "bg-green-500",
      },
      {
        title: "Today's Production",
        // value: todaysProduction.toLocaleString(),
        value: status.currentProduction,
        unit: "meters",
        change: `${Math.round((activeLooms / totalLooms) * 100)}%`,
        icon: TrendingUp,
        color: "bg-blue-500",
      },
      {
        title: "Active Orders",
        value: activeOrders.toString(),
        total: totalOrders.toString(),
        change:
          activeOrders > completedOrders
            ? `+${activeOrders - completedOrders}`
            : `${activeOrders - completedOrders}`,
        icon: Package,
        color: "bg-orange-500",
      },
      {
        title: "Active Weavers",
        value: activeWeavers.toString(),
        total: weavers.length.toString(),
        change:
          activeWeavers === weavers.length
            ? "All active"
            : `${weavers.length - activeWeavers} inactive`,
        icon: Users,
        color:
          activeWeavers === weavers.length ? "bg-green-500" : "bg-yellow-500",
      },
    ];

    // Get recent orders (last 3)
    const recentOrders = orders.slice(0, 3).map((order) => ({
      id: order.orderid,
      customer: order.customername,
      fabric: order.fabric,
      meters: order.quantity.toLocaleString(),
      delivery: new Date(order.enddate).toLocaleDateString("en-GB"),
      status: order.status,
      progress: order.progress,
      gptid: order.gptid,
    }));

    // Generate alerts based on real data
    const alerts = [];

    // Check for overdue orders
    const today = new Date();
    orders.forEach((order) => {
      const deliveryDate = new Date(order.enddate);
      if (deliveryDate < today && order.status !== "Completed") {
        alerts.push({
          type: "urgent",
          message: `Order ${order.gptid} is overdue (Due: ${new Date(order.enddate).toLocaleDateString("en-GB")})`,
          time: "Real-time",
        });
      }
    });

    // Check for low progress orders
    orders.forEach((order) => {
      if (order.status === "In Progress" && order.progress < 30) {
        alerts.push({
          type: "warning",
          message: `Order ${order.gptid} progress is below 30% (${order.progress}%)`,
          time: "Real-time",
        });
      }
    });

    // Add general system alerts
    if (alerts.length === 0) {
      alerts.push({
        type: "info",
        message: "All orders are on track and progressing well",
        time: "Real-time",
      });
    }

    setDashboardData({
      orders,
      stats,
      alerts: alerts.slice(0, 3), // Show only first 3 alerts
      recentOrders,
    });
  };
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // const orderResponse = await productionPlanningApi.get(
        //   "/productionplanning-getall",
        // );
        // const productionPlans = orderResponse.data.productionplanning;

        // const loomResponse = await loomApi.get("/loom-getall");
        // const looms = loomResponse.data.loom;

        // const weaverResponse = await weaverApi.get("/weaver-getall");
        // const weavers = weaverResponse.data.weaver;

        const { orders, looms, employees } = await DataStore.fetchAllData();

        setWeavers(employees);
        setOrders(orders);
        setLooms(looms);
        // const allDelayInfo = await getAllDelayInfo();
        // setDelayInfo(allDelayInfo);
        // console.log("Delay Information:", allDelayInfo);

        setError("");
      } catch (err) {
        setError(err.response?.error || "Error fetching production planning");
      } finally {
        setLoading(false);
      }
    };

    // loadDashboardData();

    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (looms.length || orders.length || weavers.length) {
      loadDashboardData();
    }
  }, [looms, orders, weavers]);

  const computeLoomStatus = (looms) => {
    const result = {};

    looms.forEach((loom) => {
      const type = loom.loomtype;
      if (!result[type]) {
        result[type] = { type, active: 0, total: 0, efficiencyValues: [] };
      }

      result[type].total += 1;
      if (loom.status === "Running") {
        result[type].active += 1;
      }
      result[type].efficiencyValues.push(Number(loom.efficiency));
    });

    return Object.values(result).map((item: any) => ({
      type: item.type,
      active: item.active,
      total: item.total,
      efficiency: Math.round(
        item.efficiencyValues.reduce((a, b) => a + b, 0) /
          item.efficiencyValues.length,
      ),
    }));
  };

  const loomStatus = computeLoomStatus(looms);

  const handleRefresh = async () => {
    setIsRefreshing(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));
    loadDashboardData();
    setIsRefreshing(false);
  };

  const handleAlertClick = (alert: any) => {
    if (alert.message.includes("Loom")) {
      navigate("/looms");
    } else if (alert.message.includes("Order")) {
      navigate("/orders");
    } else if (alert.message.includes("Yarn")) {
      navigate("/orders");
    }
  };

  // console.log(dashboardData);
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome to Textile Production Management
          </p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => {
              const today = new Date().toLocaleDateString("en-GB");
              alert(
                `Today's Summary (${today}):\n\n• 24 Active Looms\n• 15,420m Production\n• 83.3% Target Achievement\n• 12 Pending Tasks`,
              );
            }}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Today
          </Button>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-full sm:w-auto"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Refreshing..." : "Refresh Data"}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardData.stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.title}</p>
                    <div className="flex items-baseline space-x-2">
                      <p className="text-2xl font-bold">{stat.value}</p>
                      {stat.total && (
                        <span className="text-sm text-gray-500">
                          / {stat.total}
                        </span>
                      )}
                      {stat.unit && (
                        <span className="text-sm text-gray-500">
                          {stat.unit}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center mt-1">
                      <span
                        className={`text-sm ${stat.change.startsWith("+") ? "text-green-600" : "text-red-600"}`}
                      >
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-full ${stat.color}`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="mr-2 h-5 w-5" />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate("/orders")}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">{order.gptid}</h3>
                      <Badge
                        variant={
                          order.status === "In Progress"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {order.status}
                      </Badge>
                    </div>
                    <span className="text-sm text-gray-500">
                      {order.delivery}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {order.customer} • {order.fabric} • {order.meters}m
                  </p>
                  <div className="flex items-center space-x-2">
                    <Progress value={order.progress} className="flex-1" />
                    <span className="text-sm text-gray-500">
                      {order.progress}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Alerts & Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.alerts.map((alert, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleAlertClick(alert)}
                >
                  <div
                    className={`p-1 rounded-full ${
                      alert.type === "urgent"
                        ? "bg-red-100"
                        : alert.type === "warning"
                          ? "bg-yellow-100"
                          : "bg-blue-100"
                    }`}
                  >
                    <AlertTriangle
                      className={`h-4 w-4 ${
                        alert.type === "urgent"
                          ? "text-red-600"
                          : alert.type === "warning"
                            ? "text-yellow-600"
                            : "text-blue-600"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-gray-500">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loom Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Factory className="mr-2 h-5 w-5" />
            Loom Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loomStatus.map((loom) => (
              <div key={loom.type} className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                      <Zap className="h-8 w-8 text-gray-600" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-green-500 text-white text-xs rounded-full px-2 py-1">
                      {loom.efficiency}%
                    </div>
                  </div>
                </div>
                <h3 className="font-medium text-lg">{loom.type}</h3>
                <p className="text-sm text-gray-600">
                  {loom.active} / {loom.total} Active
                </p>
                <Progress
                  value={(loom.active / loom.total) * 100}
                  className="mt-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Real-time Status */}
      {/* <RealTimeStatus /> */}

      {/* Production Charts */}
      <ProductionCharts />
    </div>
  );
}
