import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, ZoomIn, ZoomOut, Filter, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import {
  ProductionStorage,
  LoomProductionStatus,
} from "@/lib/productionStorage";
import { LoomStorage, Loom } from "@/lib/loomStorage";
import { WeaverStorage } from "@/lib/weaverStorage";
import { OrderStorage } from "@/lib/orderStorage";
import { DataSync } from "@/lib/dataSync";
import { checkAndInitializeDemoData } from "@/lib/initializeDemoData";
import {
  getTAInfo,
  calculateDelayInfo,
  formatDelayInfo,
  getDelayStatusColor,
} from "@/lib/delayCalculations";

interface GanttTask {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  loom: string;
  orderId: string;
  customer: string;
  color: string;
  status: "running" | "completed" | "delayed" | "maintenance" | "idle";
  weaverId: string;
  weaverName: string;
  loomType: string;
  isDelayed?: boolean;
  expectedDeliveryDate?: string;
  originalDeliveryDate?: string;
  taStartDate?: string;
  taEndDate?: string;
  dailyProductionRate?: number;
  plannedDailyRate?: number;
  delayDays?: number;
  scheduledRunoutDate?: string;
}

export const GanttChart = () => {
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [allTasks, setAllTasks] = useState<GanttTask[]>([]);
  const [looms, setLooms] = useState<Loom[]>([]);
  const [weavers, setWeavers] = useState<any[]>([]);
  const [selectedWeaver, setSelectedWeaver] = useState<string>("all");
  const [selectedLoomType, setSelectedLoomType] = useState<string>("all");

  // Helper function to get color by status
  const getColorByStatus = (status: string): string => {
    switch (status) {
      case "running":
        return "#3b82f6";
      case "completed":
        return "#10b981";
      case "delayed":
        return "#ef4444";
      case "maintenance":
        return "#f59e0b";
      default:
        return "#6b7280";
    }
  };

  // Load real data from storage
  useEffect(() => {
    const loadData = () => {
      console.log("Loading Gantt Chart data...");

      // Force demo data initialization
      checkAndInitializeDemoData();

      // Small delay to ensure data is properly written
      setTimeout(() => {
        const loomData = LoomStorage.getLooms();
        const loomStatus = ProductionStorage.getLoomStatus();
        const orders = OrderStorage.getOrders();
        const weaverData = WeaverStorage.getWeavers();
        const productionRecords = ProductionStorage.getProductionRecords();

        // Load delivery schedules
        let deliverySchedules = [];
        try {
          const stored = localStorage.getItem("gp_textiles_delivery_schedules");
          if (stored) {
            deliverySchedules = JSON.parse(stored);
          }
        } catch (error) {
          console.error("Error loading delivery schedules:", error);
        }

        console.log("Gantt Chart - Loom data:", loomData);
        console.log("Gantt Chart - Loom status:", loomStatus);
        console.log("Gantt Chart - Orders:", orders);
        console.log("Gantt Chart - Production records:", productionRecords);
        console.log("Gantt Chart - Delivery schedules:", deliverySchedules);

        setWeavers(weaverData);

        // Create tasks from real data - include all looms, not just ones with current orders
        const realTasks: GanttTask[] = loomData.map((loom) => {
          const status = loomStatus.find((s) => s.loomId === loom.id);
          const order = orders.find((o) => o.id === loom.currentOrder);
          const deliverySchedule = deliverySchedules.find(
            (d) => d.orderId === loom.currentOrder,
          );

          // Get production data for this loom
          const loomProductionRecords = productionRecords.filter(
            (r) => r.loomId === loom.id,
          );
          const latestProduction = loomProductionRecords.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          )[0];

          // Use T&A dates as primary source for start and end dates
          let startDate: Date, endDate: Date;
          let taInfo = null;
          let scheduledRunoutDate: Date;

          if (order) {
            // Get T&A information for the order
            taInfo = getTAInfo(order.id);

            if (taInfo) {
              // Use T&A loom start and completion dates
              startDate = new Date(taInfo.loomStartDate); // T&A Loom Start Date
              scheduledRunoutDate = new Date(taInfo.loomCompletionDate); // T&A Loom Completion Date
              endDate = scheduledRunoutDate; // Initially set to scheduled runout
            } else {
              // Fallback to order dates if no T&A info
              startDate = order.orderDate
                ? new Date(order.orderDate)
                : new Date();
              scheduledRunoutDate = order.deliveryDate
                ? new Date(order.deliveryDate)
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
              endDate = scheduledRunoutDate;
            }

            // Get delay information to calculate actual runout date
            const delayInfo = calculateDelayInfo(order.id);
            if (delayInfo && delayInfo.isDelayed) {
              // Update end date to show actual expected runout date
              endDate = new Date(delayInfo.expectedRunoutDate);
              console.log(
                `Order ${order.id}: Scheduled runout ${scheduledRunoutDate.toLocaleDateString()} -> Actual runout ${endDate.toLocaleDateString()}`,
              );
            }
          } else {
            // For looms without orders, show a short period from today
            startDate = new Date();
            endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            scheduledRunoutDate = endDate;
          }

          // Map loom status to production status
          let taskStatus: string;
          if (status?.status) {
            taskStatus = status.status;
          } else {
            // Map loom status to production status
            switch (loom.status.toLowerCase()) {
              case "running":
                taskStatus = "running";
                break;
              case "maintenance":
                taskStatus = "maintenance";
                break;
              case "idle":
                taskStatus = "idle";
                break;
              default:
                taskStatus = loom.currentOrder ? "running" : "idle";
            }
          }

          const currentOrder = loom.currentOrder || "No Order";
          const customerName =
            order?.customer ||
            (loom.currentOrder ? "Unknown Customer" : "Available");

          // Calculate real progress from production data
          let realProgress = 0;
          let isDelayed = false;
          let expectedDeliveryDate = endDate;

          if (order && order.quantity && loomProductionRecords.length > 0) {
            const totalProduced = loomProductionRecords.reduce(
              (sum, r) => sum + r.actualProduction,
              0,
            );
            realProgress = Math.min(
              100,
              (totalProduced / order.quantity) * 100,
            );

            // Calculate expected completion based on current progress rate
            const daysSinceStart = Math.max(
              1,
              Math.ceil(
                (new Date().getTime() - startDate.getTime()) /
                  (24 * 60 * 60 * 1000),
              ),
            );
            const currentProductionRate = totalProduced / daysSinceStart;

            if (currentProductionRate > 0) {
              const remainingQuantity = order.quantity - totalProduced;
              const estimatedRemainingDays = Math.ceil(
                remainingQuantity / currentProductionRate,
              );
              expectedDeliveryDate = new Date(
                new Date().getTime() +
                  estimatedRemainingDays * 24 * 60 * 60 * 1000,
              );

              // Check if delayed (current progress is behind schedule)
              const expectedProgressByNow = Math.min(
                100,
                (daysSinceStart /
                  Math.ceil(
                    (endDate.getTime() - startDate.getTime()) /
                      (24 * 60 * 60 * 1000),
                  )) *
                  100,
              );

              isDelayed = realProgress < expectedProgressByNow * 0.9; // 10% tolerance

              // If delayed, mark status and adjust end date
              if (isDelayed && taskStatus === "running") {
                taskStatus = "delayed";
                endDate = expectedDeliveryDate;
              }
            }
          } else if (status?.progress) {
            realProgress = status.progress;
          } else if (taskStatus === "running") {
            realProgress = loom.efficiency || 0;
          }

          // Get delay information for enhanced display
          const delayInfo = calculateDelayInfo(currentOrder);

          // Debug logging for specific orders
          if (currentOrder === "FTC-309") {
            console.log("Debug FTC-309 - T&A Info:", taInfo);
            console.log("Debug FTC-309 - Delay Info:", delayInfo);
            console.log(
              "Debug FTC-309 - Production Records:",
              loomProductionRecords,
            );
            console.log("Debug FTC-309 - Start Date:", startDate);
            console.log("Debug FTC-309 - End Date:", endDate);
          }

          // Adjust timeline dates and status for delayed orders
          let actualEndDate = endDate;
          let delayDays = 0;

          if (delayInfo && delayInfo.isDelayed) {
            actualEndDate = new Date(delayInfo.expectedRunoutDate);
            delayDays = delayInfo.delayDays;
            // Update task status to delayed if production is running but behind schedule
            if (taskStatus === "running") {
              taskStatus = "delayed";
            }
          }

          return {
            id: `${loom.id}-${currentOrder}`,
            name: `${currentOrder} - ${customerName}${delayInfo?.isDelayed ? ` (${delayDays}d delay)` : ""}`,
            startDate,
            endDate: actualEndDate, // Use adjusted end date for visual timeline
            progress: realProgress,
            loom: loom.id,
            orderId: currentOrder,
            customer: customerName,
            color: getColorByStatus(taskStatus),
            status: taskStatus as any,
            weaverId: loom.weaverId,
            weaverName: loom.weaver,
            loomType: loom.type,
            isDelayed: delayInfo?.isDelayed || false,
            expectedDeliveryDate: actualEndDate.toLocaleDateString("en-GB"), // Actual expected runout date
            originalDeliveryDate:
              scheduledRunoutDate.toLocaleDateString("en-GB"), // T&A scheduled runout date
            taStartDate: taInfo?.loomStartDate || order?.orderDate,
            taEndDate: taInfo?.loomCompletionDate || order?.deliveryDate,
            dailyProductionRate: delayInfo?.dailyProductionRate || 0,
            plannedDailyRate:
              delayInfo?.plannedDailyRate ||
              taInfo?.plannedDailyProduction ||
              0,
            delayDays: delayDays,
            scheduledRunoutDate:
              scheduledRunoutDate.toLocaleDateString("en-GB"), // T&A scheduled completion
          };
        });

        console.log("Generated tasks:", realTasks);
        console.log("Loom data:", loomData);
        console.log("Orders:", orders);
        console.log("Production records:", productionRecords);

        setAllTasks(realTasks);
        setTasks(realTasks);
        setLooms(loomData);
      }, 100); // Small delay to ensure localStorage data is available
    };

    loadData();

    // Subscribe to data changes
    const unsubscribeProduction = DataSync.subscribe(
      DataSync.DATA_TYPES.PRODUCTION,
      loadData,
    );
    const unsubscribeLooms = DataSync.subscribe(
      DataSync.DATA_TYPES.LOOMS,
      loadData,
    );
    const unsubscribeOrders = DataSync.subscribe(
      DataSync.DATA_TYPES.ORDERS,
      loadData,
    );
    const unsubscribeGantt = DataSync.subscribe(
      DataSync.DATA_TYPES.GANTT,
      loadData,
    );

    return () => {
      unsubscribeProduction();
      unsubscribeLooms();
      unsubscribeOrders();
      unsubscribeGantt();
    };
  }, []);

  // Apply filters when data changes
  useEffect(() => {
    if (allTasks.length > 0) {
      applyAllFilters();
    }
  }, [allTasks]);

  const handleTaskUpdate = (taskId: string, newProgress: number) => {
    // Update production status in storage
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      const loomStatus = ProductionStorage.getLoomStatus();
      const status = loomStatus.find((s) => s.loomId === task.loom);
      if (status) {
        status.progress = newProgress;
        ProductionStorage.saveLoomStatus(loomStatus);
      }
    }
  };

  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const applyAllFilters = (
    statusFilter: string = selectedStatus,
    weaverFilter: string = selectedWeaver,
    loomTypeFilter: string = selectedLoomType,
  ) => {
    let filteredTasks = [...allTasks];
    let filteredLooms = LoomStorage.getLooms();

    // Apply status filter
    if (statusFilter !== "all") {
      filteredTasks = filteredTasks.filter(
        (task) => task.status === statusFilter,
      );
    }

    // Apply weaver filter
    if (weaverFilter !== "all") {
      filteredTasks = filteredTasks.filter(
        (task) => task.weaverId === weaverFilter,
      );
      filteredLooms = filteredLooms.filter(
        (loom) => loom.weaverId === weaverFilter,
      );
    }

    // Apply loom type filter
    if (loomTypeFilter !== "all") {
      filteredTasks = filteredTasks.filter(
        (task) => task.loomType === loomTypeFilter,
      );
      filteredLooms = filteredLooms.filter(
        (loom) => loom.type === loomTypeFilter,
      );
    }

    setTasks(filteredTasks);
    setLooms(filteredLooms);
  };

  const handleFilterByStatus = (status: string) => {
    setSelectedStatus(status);
    applyAllFilters(status, selectedWeaver, selectedLoomType);
  };

  const handleFilterByWeaver = (weaverId: string) => {
    setSelectedWeaver(weaverId);
    applyAllFilters(selectedStatus, weaverId, selectedLoomType);
  };

  const handleFilterByLoomType = (loomType: string) => {
    setSelectedLoomType(loomType);
    applyAllFilters(selectedStatus, selectedWeaver, loomType);
  };

  // Generate date range for the chart (current month and next month)
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
  const totalDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  const getDaysArray = () => {
    const days = [];
    for (let i = 0; i < totalDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const getTaskPosition = (task: GanttTask) => {
    const taskStart = Math.max(
      0,
      Math.ceil(
        (task.startDate.getTime() - startDate.getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    );
    const taskDuration = Math.ceil(
      (task.endDate.getTime() - task.startDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    const width = Math.min(taskDuration, totalDays - taskStart);

    return {
      left: `${(taskStart / totalDays) * 100}%`,
      width: `${(width / totalDays) * 100}%`,
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-blue-200 border-blue-400";
      case "completed":
        return "bg-green-200 border-green-400";
      case "delayed":
        return "bg-red-200 border-red-400";
      case "maintenance":
        return "bg-yellow-200 border-yellow-400";
      case "idle":
        return "bg-gray-200 border-gray-400";
      default:
        return "bg-gray-200 border-gray-400";
    }
  };

  const days = getDaysArray();

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center justify-between">
          <CardTitle className="flex items-center text-sm sm:text-base">
            <Calendar className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            Production Gantt Chart
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <select
              className="px-2 py-1 border rounded text-xs sm:text-sm flex-1 sm:flex-none min-w-[80px]"
              value={selectedStatus}
              onChange={(e) => handleFilterByStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="delayed">Delayed</option>
              <option value="maintenance">Maintenance</option>
              <option value="idle">Idle</option>
            </select>
            <select
              className="px-2 py-1 border rounded text-xs sm:text-sm flex-1 sm:flex-none min-w-[80px]"
              value={selectedWeaver}
              onChange={(e) => handleFilterByWeaver(e.target.value)}
            >
              <option value="all">All Weavers</option>
              {weavers.map((weaver) => (
                <option key={weaver.id} value={weaver.id}>
                  {weaver.name}
                </option>
              ))}
            </select>
            <select
              className="px-2 py-1 border rounded text-xs sm:text-sm flex-1 sm:flex-none min-w-[80px]"
              value={selectedLoomType}
              onChange={(e) => handleFilterByLoomType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="Rapier">Rapier</option>
              <option value="Airjet">Airjet</option>
              <option value="Sulzer">Sulzer</option>
            </select>
            <Button variant="outline" size="sm" className="text-xs px-2 h-8">
              <ZoomOut className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button variant="outline" size="sm" className="text-xs px-2 h-8">
              <ZoomIn className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <ScrollArea className="w-full">
            <div className="min-w-[600px] sm:min-w-[800px]">
              {/* Header with dates */}
              <div className="flex border-b bg-gray-50">
                <div className="w-24 sm:w-32 p-2 sm:p-3 border-r bg-white font-medium text-xs sm:text-sm">
                  Loom
                </div>
                <div className="flex-1 flex">
                  {days
                    .filter((_, index) => index % 7 === 0)
                    .map((date, index) => (
                      <div
                        key={index}
                        className="flex-1 p-1 sm:p-2 text-center text-xs sm:text-sm font-medium border-r min-w-[60px] sm:min-w-[80px]"
                      >
                        {date.toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </div>
                    ))}
                </div>
              </div>

              {/* Loom rows */}
              {looms.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-gray-500">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No loom data available</p>
                    <p className="text-sm">
                      Please check your data initialization
                    </p>
                  </div>
                </div>
              ) : (
                looms.map((loom) => (
                  <div
                    key={loom.id}
                    className="flex border-b min-h-[50px] sm:min-h-[60px]"
                  >
                    <div className="w-24 sm:w-32 p-2 sm:p-3 border-r bg-gray-50 font-medium flex flex-col justify-center text-xs sm:text-sm">
                      <div>{loom.id}</div>
                      <div className="text-xs text-gray-500">{loom.type}</div>
                    </div>
                    <div className="flex-1 relative p-1 sm:p-2">
                      {/* Grid lines */}
                      <div className="absolute inset-0 flex">
                        {days
                          .filter((_, index) => index % 7 === 0)
                          .map((_, index) => (
                            <div
                              key={index}
                              className="flex-1 border-r border-gray-200"
                            />
                          ))}
                      </div>

                      {/* Tasks for this loom */}
                      {tasks
                        .filter((task) => task.loom === loom.id)
                        .map((task) => {
                          const position = getTaskPosition(task);
                          return (
                            <div
                              key={task.id}
                              className={`absolute top-1 sm:top-2 h-6 sm:h-8 rounded cursor-pointer border-2 flex items-center px-1 sm:px-2 text-xs font-medium transition-all hover:shadow-md ${getStatusColor(task.status)} ${selectedTask === task.id ? "ring-2 ring-blue-500" : ""}`}
                              style={position}
                              onClick={() =>
                                setSelectedTask(
                                  selectedTask === task.id ? null : task.id,
                                )
                              }
                              title={`${task.name} - ${task.progress}% complete - ${task.status}`}
                            >
                              <div className="truncate text-xs">
                                <span className="hidden sm:inline">
                                  {task.orderId} ({task.progress}%)
                                </span>
                                <span className="sm:hidden">
                                  {task.orderId}
                                </span>
                              </div>
                              {/* Progress bar */}
                              <div
                                className="absolute bottom-0 left-0 h-1 rounded-b"
                                style={{ backgroundColor: task.color }}
                              >
                                <div
                                  className="h-full rounded-b"
                                  style={{
                                    width: `${task.progress}%`,
                                    backgroundColor: task.color,
                                    opacity: 0.8,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Task details */}
        {selectedTask && (
          <div className="mt-4 p-3 sm:p-4 border rounded-lg bg-blue-50">
            {(() => {
              const task = tasks.find((t) => t.id === selectedTask);
              if (!task) return null;
              return (
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 space-y-2 sm:space-y-0">
                    <h4 className="font-medium text-sm sm:text-base line-clamp-1">
                      {task.name}
                    </h4>
                    <Badge className={`${getStatusColor(task.status)} text-xs`}>
                      {task.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                    <div>
                      <span className="text-gray-600">T&A Loom Start:</span>
                      <div className="font-medium">
                        {task.taStartDate
                          ? new Date(task.taStartDate).toLocaleDateString(
                              "en-GB",
                            )
                          : task.startDate.toLocaleDateString("en-GB")}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">
                        T&A Scheduled Runout:
                      </span>
                      <div className="font-medium">
                        {task.scheduledRunoutDate || task.originalDeliveryDate}
                      </div>
                    </div>
                    {task.isDelayed && (
                      <div>
                        <span className="text-gray-600">
                          Actual Expected Runout:
                        </span>
                        <div className="font-medium text-red-600">
                          {task.expectedDeliveryDate}
                        </div>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">Progress:</span>
                      <div className="font-medium">{task.progress}%</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Loom:</span>
                      <div className="font-medium">
                        {task.loom} ({task.loomType})
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Weaver:</span>
                      <div className="font-medium">{task.weaverName}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <div className="font-medium capitalize">
                        {task.status}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Customer:</span>
                      <div className="font-medium">{task.customer}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Order ID:</span>
                      <div className="font-medium">{task.orderId}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Production Rate:</span>
                      <div className="font-medium">
                        {task.dailyProductionRate || 0} m/day
                        {task.plannedDailyRate && (
                          <div className="text-xs text-gray-500">
                            Planned: {task.plannedDailyRate} m/day
                          </div>
                        )}
                      </div>
                    </div>
                    {task.isDelayed && (
                      <div className="col-span-full mt-3 p-3 bg-red-50 border border-red-200 rounded">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            <span className="text-red-600 font-medium">
                              Loom Runout Delayed
                            </span>
                          </div>
                          <div className="bg-red-100 px-2 py-1 rounded text-red-800 font-bold text-sm">
                            {task.delayDays || 0} days delay
                          </div>
                        </div>
                        <div className="text-xs text-red-700 space-y-1">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="font-medium">
                                T&A Scheduled Runout:
                              </span>
                              <div>
                                {task.scheduledRunoutDate ||
                                  task.originalDeliveryDate}
                              </div>
                            </div>
                            <div>
                              <span className="font-medium">
                                Actual Expected Runout:
                              </span>
                              <div className="text-red-600 font-medium">
                                {task.expectedDeliveryDate}
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <div>
                              <span className="font-medium">Current Rate:</span>
                              <div>{task.dailyProductionRate || 0} m/day</div>
                            </div>
                            <div>
                              <span className="font-medium">Planned Rate:</span>
                              <div>{task.plannedDailyRate || 0} m/day</div>
                            </div>
                          </div>
                          <div className="mt-2 pt-2 border-t border-red-200 text-xs">
                            Daily production rate (
                            {task.dailyProductionRate || 0} m/day) is below T&A
                            planned rate ({task.plannedDailyRate || 0} m/day).
                            Actual loom runout date is {task.delayDays || 0}{" "}
                            days behind T&A scheduled completion.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-200 border border-blue-400 rounded"></div>
            <span>Running</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-200 border border-green-400 rounded"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-200 border border-red-400 rounded"></div>
            <span>Delayed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-200 border border-yellow-400 rounded"></div>
            <span>Maintenance</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-200 border border-gray-400 rounded"></div>
            <span>Idle</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
