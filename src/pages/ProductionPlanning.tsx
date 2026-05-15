import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GanttChart } from "@/components/GanttChart";
import { ProductionPlanForm } from "@/components/ProductionPlanForm";
import { InlineFormCard } from "@/components/InlineFormCard";
import { InlineProductionPlan } from "@/components/InlineProductionPlan";
import { DataStore } from "@/lib/dataStore";
import { ProductionStorage } from "@/lib/productionStorage";
import { LoomStorage } from "@/lib/loomStorage";
import { OrderStorage } from "@/lib/orderStorage";
import {
  Calendar,
  Plus,
  Filter,
  BarChart3,
  Clock,
  Factory,
  AlertTriangle,
  CheckCircle,
  Edit,
  Eye,
  CalendarX,
  TrendingDown,
} from "lucide-react";
import {
  getAllDelayInfo,
  formatDelayInfo,
  getDelayStatusColor,
  calculateLoomEfficiency,
  getProductionHealthStatus,
} from "@/lib/delayCalculations";
import { loomApi, productionPlanningApi, taskApi } from "@/services/api2";
import { ProductionPlanFilterDialog } from "@/components/ProductionPlanFilterDialog";

const initialProductionPlans = [
  {
    orderId: "BTC-101",
    customer: "Blue Ocean Textiles",
    loomType: "Rapier",
    looms: ["MK-1", "MK-2"],
    startDate: "11-06-2025",
    endDate: "26-06-2025",
    progress: 65,
    status: "In Progress",
    meters: 12000,
    supervisor: "Production Manager",
  },
  {
    orderId: "VTS-205",
    customer: "Victory Fabrics Ltd",
    loomType: "Airjet",
    looms: ["AJ-2"],
    startDate: "15-06-2025",
    endDate: "05-07-2025",
    progress: 25,
    status: "Planning",
    meters: 8500,
    supervisor: "Weaving Supervisor",
  },
  {
    orderId: "FTC-309",
    customer: "Future Textile Corp",
    loomType: "Sulzer",
    looms: ["SZ-1", "SZ-2"],
    startDate: "10-06-2025",
    endDate: "30-06-2025",
    progress: 80,
    status: "In Progress",
    meters: 6200,
    supervisor: "Shift Supervisor",
  },
];

// const upcomingTasks = [
//   {
//     task: "Yarn Requirement - GPT-450",
//     date: "20-06-2025",
//     priority: "High",
//     responsible: "Rajesh Verma",
//   },
//   {
//     task: "Loom Drawing - GPT-448",
//     date: "18-06-2025",
//     priority: "Medium",
//     responsible: "Amit Sharma",
//   },
//   {
//     task: "First Piece Approval - GPT-447",
//     date: "21-06-2025",
//     priority: "High",
//     responsible: "Deepak Singh",
//   },
//   {
//     task: "Sizing Completed - GPT-451",
//     date: "22-06-2025",
//     priority: "Medium",
//     responsible: "Rajesh Verma",
//   },
// ];

const getStatusColor = (status: string) => {
  switch (status) {
    case "In Progress":
      return "bg-blue-500";
    case "Planning":
      return "bg-yellow-500";
    case "Completed":
      return "bg-green-500";
    case "Delayed":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "High":
      return "text-red-600 bg-red-50 border-red-200";
    case "Medium":
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "Low":
      return "text-green-600 bg-green-50 border-green-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
};

export default function ProductionPlanning() {
  const [productionPlans, setProductionPlans] = useState([]);
  const [filteredPlans, setFilteredPlans] = useState([]);
  const [delayInfo, setDelayInfo] = useState({});
  const [realProductionPlans, setRealProductionPlans] = useState([]);
  const [looms, setLooms] = useState([]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    inProgress: 0,
    planning: 0,
    completed: 0,
    onHold: 0,
  });

  const [loomStats, setLoomStats] = useState({
    active: 0,
    delayed: 0,
  });
  const [taskStats, setPendingTasks] = useState({ pendingtasks: 0 });
  const [upcomingTasks, setUpcomingTasks] = useState([
    {
      task: "",
      date: "",
      priority: "",
      responsible: "",
    },
  ]);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);

  // Initialize data and load real production plans with delay info
  // useEffect(() => {
  //   const loadRealProductionData = () => {
  //     // Load real data from storage
  //     const looms = LoomStorage.getLooms();
  //     const orders = OrderStorage.getOrders();
  //     const productionRecords = ProductionStorage.getProductionRecords();
  //     const loomStatus = ProductionStorage.getLoomStatus();

  //     console.log("Production Planning - Loading real data:");
  //     console.log("Looms:", looms);
  //     console.log("Orders:", orders);
  //     console.log("Production Records:", productionRecords);

  //     // Create real production plans from orders with loom assignments
  //     const realPlans = orders
  //       .filter(
  //         (order) => order.selectedLooms && order.selectedLooms.length > 0,
  //       )
  //       .map((order) => {
  //         const assignedLooms = looms.filter((loom) =>
  //           order.selectedLooms?.includes(loom.id),
  //         );

  //         return {
  //           orderId: order.id,
  //           customer: order.customer,
  //           loomType: order.loomType || "Unknown",
  //           looms: order.selectedLooms || [],
  //           startDate: order.orderDate,
  //           endDate: order.deliveryDate,
  //           progress: order.progress || 0,
  //           status: order.status || "Planning",
  //           meters: order.quantity || 0,
  //           supervisor: assignedLooms[0]?.weaver || "Unassigned",
  //           fabric: order.fabric,
  //           construction: order.construction,
  //         };
  //       });

  //     setRealProductionPlans(realPlans);

  //     // Calculate delay information for all orders
  //     const allDelayInfo = getAllDelayInfo();
  //     setDelayInfo(allDelayInfo);

  //     console.log("Delay Information:", allDelayInfo);
  //   };

  //   loadRealProductionData();

  //   // Set up interval to refresh delay info periodically
  //   const interval = setInterval(loadRealProductionData, 30000); // Refresh every 30 seconds

  //   return () => clearInterval(interval);
  // }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB");
  };

  // useEffect(() => {
  //   const fetchProductionPlanning = async () => {
  //     try {
  //       const orderResponse = await productionPlanningApi.get(
  //         "/productionplanning-getall",
  //       );

  //       const loomResponse = await loomApi.get("/loom-getall");
  //       console.log(loomResponse);

  //       // const formatted = response.data.map((o: any) => ({
  //       //   orderId: o.orderid,
  //       //   customer: o.customername,
  //       //   loomType: o.loomtype,
  //       //   looms: o.loomsselected,

  //       //   startDate: o.startdate
  //       //     ? new Date(o.startdate).toLocaleDateString("en-GB")
  //       //     : null,

  //       //   endDate: o.enddate
  //       //     ? new Date(o.enddate).toLocaleDateString("en-GB")
  //       //     : null,

  //       //   progress: Number(o.progress) || 0,
  //       //   status: o.jobstatus || "Pending",
  //       //   meters: Number(o.meters),
  //       //   supervisor: "Production Manager", // static value as per your example
  //       // }));

  //       const activeLooms = loomResponse.data.loom.filter(
  //         (l: any) => l.status === "Running",
  //       ).length;

  //       // Update state
  //       setLoomStats({ active: activeLooms });
  //       // Create real production plans from orders with loom assignments
  //       const realPlans = orderResponse.data.productionplanning
  //         .filter(
  //           (order) => order.loomsselected && order.loomsselected.length > 0,
  //         )
  //         .map((order) => {
  //           const assignedLooms = loomResponse.data.loom.filter((loom) =>
  //             order.loomsselected?.includes(loom.id),
  //           );

  //           return {
  //             orderId: order.orderid,
  //             customer: order.customername,
  //             loomType: order.loomtype || "Unknown",
  //             // looms: order.loomsselected || [],
  //             looms: assignedLooms.map((loom) => loom.name),

  //             startDate: order.startdate,
  //             endDate: order.enddate,
  //             progress: order.progress || 0,
  //             status: order.jobstatus || "Planning",
  //             meters: order.meters || 0,
  //             supervisor: assignedLooms[0]?.weaver || "Unassigned",
  //             fabric: order.fabrictype,
  //             // construction: order.construction,
  //           };
  //         });

  //       // const totalOrders = orderResponse.data.productionplanning.length;
  //       // const inProgress = orderResponse.data.productionplanning.filter(
  //       //   (o) => o.status === "In Progress",
  //       // ).length;
  //       // const planning = orderResponse.data.productionplanning.filter(
  //       //   (o) => o.status === "Planning",
  //       // ).length;
  //       // const completed = orderResponse.data.productionplanning.filter(
  //       //   (o) => o.status === "Completed",
  //       // ).length;
  //       // const onHold = orderResponse.data.productionplanning.filter(
  //       //   (o) => o.status === "On Hold",
  //       // ).length;

  //       const productionPlans = orderResponse.data.productionplanning;

  //       setOrderStats({
  //         totalOrders: productionPlans.length,
  //         inProgress: productionPlans.filter((o) => o.status === "In Progress")
  //           .length,
  //         planning: productionPlans.filter((o) => o.status === "Planning")
  //           .length,
  //         completed: productionPlans.filter((o) => o.status === "Completed")
  //           .length,
  //         onHold: productionPlans.filter((o) => o.status === "On Hold").length,
  //       });

  //       setRealProductionPlans(realPlans);

  //       // Calculate delay information for all orders
  //       // const allDelayInfo = getAllDelayInfo();
  //       // setDelayInfo(allDelayInfo);

  //       // console.log("Delay Information:", allDelayInfo);
  //       // setRealProductionPlans(formatted);
  //       // setProductionPlans(formatted);
  //       // setFilteredPlans(formatted);
  //       // setFilteredWeavers(response.data.weaver);
  //       setError("");
  //     } catch (err) {
  //       setError(err.response?.error || "Error fetching production planning");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchProductionPlanning();
  // }, []);

  useEffect(() => {
    const fetchLooms = async () => {
      try {
        const loomResponse = await loomApi.get("/loom-getall");

        const looms = loomResponse.data.loom;
        setLooms(looms);

        // Count running looms
        const activeLooms = looms.filter(
          (l: any) => l.status === "Running",
        ).length;

        const delayedLooms = looms.filter(
          (l: any) => l.status === "Delayed",
        ).length;
        setLoomStats({ active: activeLooms, delayed: delayedLooms });
      } catch (err) {
        console.error("Failed to fetch looms", err);
      }
    };

    fetchLooms();
  }, []);

  useEffect(() => {
    if (looms.length === 0) return; // ✅ wait until looms are loaded

    const fetchProductionPlanning = async () => {
      setLoading(true);
      try {
        const orderResponse = await productionPlanningApi.get(
          "/productionplanning-getall",
        );

        // const loomResponse = await loomApi.get("/loom-getall");
        // const looms = loomResponse.data.loom;

        const productionPlans = orderResponse.data.productionplanning;

        // ---- Production Plan Stats ----
        setOrderStats({
          totalOrders: productionPlans.length,
          inProgress: productionPlans.filter((o) => o.status === "In Progress")
            .length,
          planning: productionPlans.filter((o) => o.status === "Planning")
            .length,
          completed: productionPlans.filter((o) => o.status === "Completed")
            .length,
          onHold: productionPlans.filter((o) => o.status === "On Hold").length,
        });

        // ---- Create Real Plans ----
        const realPlans = productionPlans
          .filter((order) => order.loomsselected?.length > 0)
          .map((order) => {
            const assignedLooms = looms.filter((loom: any) =>
              order.loomsselected.includes(loom.id),
            );

            return {
              orderId: order.orderid,
              customer: order.customername,
              loomType: order.loomtype || "Unknown",
              looms: assignedLooms.map((loom: any) => loom.name), // Replace ID with name
              startDate: order.startdate,
              endDate: order.enddate,
              progress: order.progress || 0,
              status: order.status || "Planning",
              meters: order.meters || 0,
              supervisor: assignedLooms[0]?.assignedweaver || "Unassigned",
              fabric: order.fabrictype,
              priority: order.priority,
            };
          });

        setRealProductionPlans(realPlans);
        setFilteredPlans(realPlans);
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
  }, [looms]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const taskResponse = await taskApi.get("/task-getall");

        const tasks = taskResponse.data.task;

        // Count running looms
        const pendingTasks = tasks.filter(
          (l: any) => l.status === "Pending",
        ).length;

        setPendingTasks({ pendingtasks: pendingTasks });

        // const upcoming = tasks
        //   .filter((t: any) => new Date(t.duedate) > new Date())
        //   .sort(
        //     (a: any, b: any) =>
        //       new Date(a.duedate).getTime() - new Date(b.duedate).getTime(),
        //   )
        //   .map((t: any) => ({
        //     task: t.tasktitle,
        //     date: t.duedate,
        //     priority: t.priority,
        //     responsible: t.assignedto,
        //   }));
        const today = new Date();
        const upcomingDays = new Date();
        upcomingDays.setDate(today.getDate() + 5);

        const upcoming = tasks
          .filter((t: any) => {
            const due = new Date(t.duedate);
            return due >= today && due <= upcomingDays; // UPCOMING DAYS
          })
          .sort(
            (a: any, b: any) =>
              new Date(a.duedate).getTime() - new Date(b.duedate).getTime(),
          )
          .map((t: any) => ({
            task: t.tasktitle,
            date: t.duedate,
            priority: t.priority,
            responsible: t.assignedto,
          }));

        setUpcomingTasks(upcoming);
      } catch (err) {
        console.error("Failed to fetch tasks", err);
      }
    };

    fetchTasks();
  }, []);

  useEffect(() => {
    setFilteredPlans(productionPlans);
  }, [productionPlans]);

  const [loomEfficiencies, setLoomEfficiencies] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    const fetchEfficiencies = async () => {
      const efficiencies: Record<string, number> = {};
      const plansToUse =
        realProductionPlans.length > 0 ? realProductionPlans : filteredPlans;

      for (const plan of plansToUse) {
        efficiencies[plan.orderId] = await calculateLoomEfficiency(
          plan.orderId,
        );
      }

      setLoomEfficiencies(efficiencies);
    };

    fetchEfficiencies();
  }, [realProductionPlans, filteredPlans]);

  const [isPlanFormOpen, setIsPlanFormOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isViewingPlan, setIsViewingPlan] = useState(false);
  const [currentView, setCurrentView] = useState<"list" | "gantt" | "schedule">(
    "list",
  );
  const [planFilters, setPlanFilters] = useState<any>({});

  const handleNewPlan = (planData: any) => {
    setProductionPlans((prev) => [...prev, planData]);
  };

  const handleViewPlan = (plan: any) => {
    setSelectedPlan(plan);
    setIsViewingPlan(true);
  };

  // const handleFilterPlans = () => {
  //   // Simple filter toggle for demo
  //   if (Object.keys(planFilters).length === 0) {
  //     // Apply filter: show only "In Progress" plans
  //     const filtered = productionPlans.filter(
  //       (plan) => plan.status === "In Progress",
  //     );
  //     setFilteredPlans(filtered);
  //     setPlanFilters({ status: "In Progress" });
  //   } else {
  //     // Clear filters
  //     setFilteredPlans(productionPlans);
  //     setPlanFilters({});
  //   }
  // };
  const getPlanPriority = (plan: any): string => {
    const delayInfo = getAllDelayInfo();
    const orderDelay = delayInfo[plan.orderid];
    if (orderDelay?.isDelayed) return "High";
    if (plan.status === "In Progress") return "Medium";
    return "Low";
  };

  const applyFilters = (newFilters: any) => {
    setPlanFilters(newFilters);
    let filtered = realProductionPlans;

    if (newFilters.status) {
      filtered = filtered.filter((plan) => plan.status === newFilters.status);
    }
    if (newFilters.loomtype) {
      filtered = filtered.filter(
        (plan) => plan.loomType === newFilters.loomtype,
      );
    }
    // if (newFilters.priority) {
    //   filtered = filtered.filter((plan) => {
    //     const planPriority = getPlanPriority(plan);
    //     return planPriority === newFilters.priority;
    //   });
    // }
    if (newFilters.priority) {
      filtered = filtered.filter(
        (plan) => plan.priority === newFilters.priority,
      );
    }
    setFilteredPlans(filtered);
  };

  const clearAllFilters = () => {
    setPlanFilters({});
    setFilteredPlans(realProductionPlans);
  };
  const handleViewChange = (view: "list" | "gantt" | "schedule") => {
    setCurrentView(view);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case "gantt":
        return <GanttChart />;
      case "schedule":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Schedule Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {(filteredPlans.length > 0 ? filteredPlans : filteredPlans).map(
                  (plan) => {
                    const orderDelayInfo = delayInfo[plan.orderId];
                    const isDelayed = orderDelayInfo?.isDelayed || false;

                    return (
                      <div
                        key={plan.orderId}
                        className={`border rounded-lg p-3 sm:p-4 ${
                          isDelayed ? "border-red-200 bg-red-50" : ""
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 space-y-2 sm:space-y-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-sm sm:text-base">
                              {plan.orderId}
                            </h3>
                            {isDelayed && (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge
                              className={`${getStatusColor(plan.status)} text-white text-xs`}
                            >
                              {plan.status}
                            </Badge>
                            {orderDelayInfo && (
                              <Badge
                                className={`${getDelayStatusColor(orderDelayInfo)} text-xs`}
                                variant="outline"
                              >
                                {formatDelayInfo(orderDelayInfo)}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">T&A Start:</span>{" "}
                            {new Date(plan.startDate).toLocaleDateString(
                              "en-GB",
                            )}
                          </div>
                          <div>
                            <span className="text-gray-600">
                              {isDelayed ? "Expected Runout:" : "T&A End:"}
                            </span>{" "}
                            {isDelayed && orderDelayInfo
                              ? new Date(
                                  orderDelayInfo.expectedRunoutDate,
                                ).toLocaleDateString("en-GB")
                              : new Date(plan.endDate).toLocaleDateString(
                                  "en-GB",
                                )}
                          </div>
                          <div>
                            <span className="text-gray-600">Progress:</span>{" "}
                            {orderDelayInfo?.currentProgress || plan.progress}%
                          </div>
                          <div>
                            <span className="text-gray-600">Daily Rate:</span>{" "}
                            {orderDelayInfo?.dailyProductionRate || 0} m/day
                          </div>
                        </div>
                        {isDelayed && orderDelayInfo && (
                          <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-700">
                            <div className="flex items-center space-x-2">
                              <TrendingDown className="h-3 w-3" />
                              <span>
                                Delayed by {orderDelayInfo.delayDays} days -
                                Original completion:{" "}
                                {new Date(
                                  orderDelayInfo.originalRunoutDate,
                                ).toLocaleDateString("en-GB")}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  },
                )}
              </div>
            </CardContent>
          </Card>
        );
      default:
        return null; // Will show the default list view
    }
  };

  const handleEditPlan = (plan: any) => {
    setSelectedPlan(plan);
    setIsViewingPlan(true);
  };

  const ThreeDots = () => (
    <div className="flex space-x-2">
      <div className="h-2 w-2 bg-gray-600 rounded-full animate-bounce"></div>
      <div className="h-2 w-2 bg-gray-600 rounded-full animate-bounce delay-200"></div>
      <div className="h-2 w-2 bg-gray-600 rounded-full animate-bounce delay-400"></div>
    </div>
  );

  return (
    <div className="relative">
      {/* ========== LOADING OVERLAY ========== */}
      {loading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50">
          <ThreeDots />
        </div>
      )}
      <div
        className={`${loading ? "blur-sm pointer-events-none select-none" : ""}`}
      >
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col space-y-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Production Planning
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                View and monitor production schedules created from T&A plans
              </p>
            </div>
            <div className="flex flex-col space-y-2">
              <div className="flex flex-wrap gap-2">
                {/* <Button
                  variant={
                    Object.keys(planFilters).length > 0 ? "default" : "outline"
                  }
                  onClick={handleFilterPlans}
                  className="text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-10"
                >
                  <Filter className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">
                    {Object.keys(planFilters).length > 0
                      ? "Clear Filter"
                      : "Filter Plans"}
                  </span>
                  <span className="xs:hidden">Filter</span>
                </Button> */}
                <Button
                  variant={
                    Object.keys(planFilters).length > 0 ? "default" : "outline"
                  }
                  onClick={() => setIsFilterDialogOpen(true)}
                  className="text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-10"
                >
                  <Filter className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Filter Plans</span>
                  <span className="xs:hidden">Filter</span>
                  {Object.keys(planFilters).length > 0 && (
                    <Badge className="ml-2 text-xs">
                      {Object.keys(planFilters).length}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant={currentView === "gantt" ? "default" : "outline"}
                  onClick={() => handleViewChange("gantt")}
                  className="text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-10"
                >
                  <BarChart3 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Gantt View</span>
                  <span className="xs:hidden">Gantt</span>
                </Button>
                <Button
                  variant={currentView === "schedule" ? "default" : "outline"}
                  onClick={() => handleViewChange("schedule")}
                  className="text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-10"
                >
                  <Calendar className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Schedule Overview</span>
                  <span className="xs:hidden">Schedule</span>
                </Button>
                {currentView !== "list" && (
                  <Button
                    variant="outline"
                    onClick={() => handleViewChange("list")}
                    className="text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-10"
                  >
                    <span className="hidden xs:inline">List View</span>
                    <span className="xs:hidden">List</span>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          {(() => {
            // const systemStats = DataStore.getSystemStats();
            // const orderStats = DataStore.getOrderStats();
            // const taskStats = DataStore.getTaskStats();

            return (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Active Plans</p>
                        <p className="text-2xl font-bold">
                          {orderStats.inProgress + orderStats.planning}
                        </p>
                      </div>
                      <Calendar className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Looms Scheduled</p>
                        <p className="text-2xl font-bold text-green-600">
                          {loomStats.active}
                        </p>
                      </div>
                      <Factory className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Pending Tasks</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {taskStats.pendingtasks}
                        </p>
                      </div>
                      <Clock className="h-8 w-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Delays</p>
                        <p className="text-2xl font-bold text-red-600">
                          {loomStats.delayed}
                        </p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })()}

          {/* Current View Content */}
          {currentView !== "list" ? (
            renderCurrentView()
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Production Schedule */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-5 w-5" />
                      Production Schedule
                      {Object.keys(planFilters).length > 0 && (
                        <Badge variant="outline" className="ml-2">
                          Filtered: {filteredPlans.length} of{" "}
                          {realProductionPlans.length}
                        </Badge>
                      )}
                    </div>
                    {Object.keys(planFilters).length > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={clearAllFilters}
                        className="text-xs"
                      >
                        Clear Filters
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(filteredPlans.length > 0
                      ? filteredPlans
                      : filteredPlans
                    ).map((plan) => {
                      const orderDelayInfo = delayInfo[plan.orderId];
                      const isDelayed = orderDelayInfo?.isDelayed || false;
                      const loomEfficiency = calculateLoomEfficiency(
                        plan.orderId,
                      );

                      return (
                        <Card
                          key={plan.orderId}
                          className={`border-l-4 ${
                            isDelayed ? "border-l-red-500" : "border-l-primary"
                          }`}
                        >
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 space-y-2 sm:space-y-0">
                              <div className="flex items-center space-x-2 sm:space-x-3">
                                <h3 className="font-bold text-sm sm:text-base">
                                  {plan.orderId}
                                </h3>
                                <Badge
                                  className={`${getStatusColor(plan.status)} text-white text-xs`}
                                >
                                  {plan.status}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap gap-1 sm:gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewPlan(plan)}
                                  className="text-xs px-2 py-1 h-8"
                                >
                                  <Eye className="mr-0 xs:mr-1 h-3 w-3" />
                                  <span className="hidden xs:inline">
                                    View Details
                                  </span>
                                  <span className="xs:hidden">View</span>
                                </Button>
                                {/* <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditPlan(plan)}
                                  className="text-xs px-2 py-1 h-8"
                                >
                                  <Edit className="mr-0 xs:mr-1 h-3 w-3" />
                                  <span className="hidden xs:inline">
                                    Edit Plan
                                  </span>
                                  <span className="xs:hidden">Edit</span>
                                </Button> */}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4 mb-3">
                              <div>
                                <p className="text-xs sm:text-sm text-gray-600">
                                  Customer
                                </p>
                                <p className="font-medium text-xs sm:text-sm line-clamp-1">
                                  {plan.customer}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs sm:text-sm text-gray-600">
                                  Quantity
                                </p>
                                <p className="font-medium text-xs sm:text-sm">
                                  {plan.meters.toLocaleString()} meters
                                </p>
                              </div>
                              <div>
                                <p className="text-xs sm:text-sm text-gray-600">
                                  Duration
                                </p>
                                <p className="font-medium text-xs sm:text-sm">
                                  {formatDate(plan.startDate)} -{" "}
                                  {formatDate(plan.endDate)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs sm:text-sm text-gray-600">
                                  Loom Type
                                </p>
                                <p className="font-medium text-xs sm:text-sm">
                                  {plan.loomType}
                                </p>
                              </div>
                            </div>

                            <div className="mb-3">
                              <p className="text-sm text-gray-600 mb-1">
                                Assigned Looms
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {plan.looms.map((loom) => (
                                  <Badge key={loom} variant="outline">
                                    {loom}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">
                                Progress
                              </span>
                              <span className="font-medium">
                                {plan.progress}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{ width: `${plan.progress}%` }}
                              ></div>
                            </div>

                            {/* Delay Information */}
                            {orderDelayInfo && (
                              <div className="mt-3 p-2 rounded-lg bg-gray-50">
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center space-x-2">
                                    {isDelayed ? (
                                      <CalendarX className="h-4 w-4 text-red-500" />
                                    ) : (
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    )}
                                    <span
                                      className={getDelayStatusColor(
                                        orderDelayInfo,
                                      )}
                                    >
                                      {formatDelayInfo(orderDelayInfo)}
                                    </span>
                                  </div>
                                  {/* <span className="text-gray-600">
                                Efficiency: {loomEfficiency}%
                              </span> */}
                                  {/* <span className="text-gray-600">
                                    Efficiency:{" "}
                                    {loomEfficiencies[plan.orderId] ?? 0}%
                                  </span> */}
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
                                      {/* (Planned:{" "}
                                      {orderDelayInfo.plannedDailyRate} m/day) */}
                                    </div>
                                    {/* <div>
                                      Progress: {orderDelayInfo.currentProgress}
                                      % (Expected:{" "}
                                      {orderDelayInfo.expectedProgress}%)
                                    </div> */}
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

              {/* Upcoming Tasks */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Upcoming Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {upcomingTasks.map((task, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm">{task.task}</h4>
                          <Badge
                            variant="outline"
                            className={`text-xs ${getPriorityColor(task.priority)}`}
                          >
                            {task.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          {/* <span>{task.date}</span> */}
                          <span>
                            {new Date(task.date).toLocaleDateString("en-GB")}
                          </span>

                          <span>{task.responsible}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Production plans are now created automatically from T&A plans in Order Management */}

          {/* Inline Plan Details */}
          <InlineFormCard
            title={`Production Plan - ${selectedPlan?.orderId || ""}`}
            isVisible={isViewingPlan}
            onClose={() => setIsViewingPlan(false)}
          >
            {selectedPlan && (
              <InlineProductionPlan
                plan={selectedPlan}
                onEdit={handleEditPlan}
              />
            )}
          </InlineFormCard>
        </div>
      </div>
      <ProductionPlanFilterDialog
        isOpen={isFilterDialogOpen}
        onClose={() => setIsFilterDialogOpen(false)}
        onApplyFilters={applyFilters}
        currentFilters={planFilters}
      />
    </div>
  );
}
