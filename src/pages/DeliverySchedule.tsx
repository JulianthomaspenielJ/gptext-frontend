import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { usersApi } from "../services/api2";
import { DataSync } from "@/lib/dataSync";
import {
  Calendar as CalendarIcon,
  Plus,
  Edit,
  Eye,
  Download,
  Truck,
  Clock,
  CheckCircle,
  AlertTriangle,
  Factory,
} from "lucide-react";
import { format } from "date-fns";
import ENDPOINTS from "@/services/api";

interface DeliveryScheduleEntry {
  id: string;
  orderId: string;
  gptId: string;
  customer: string;
  orderDate: string;
  deliveryDate: string;
  weaverAllocations: WeaverAllocation[];
  totalFabricMeters: number;
  totalWarpMeters: number;
  status: "planned" | "in-progress" | "completed" | "delayed";
  remarks?: string;
  createdDate: string;
  updatedDate: string;
  dispatchInchargeName: string;
  dailySchedule: DailySchedule[];
}

interface WeaverAllocation {
  weaverId: string;
  weaverName: string;
  plannedMeters: number;
}

interface DailySchedule {
  id: string;
  date: string;
  plannedProduction: number;
  actualProduction?: number;
  isWeekend?: boolean;
  cumulativeTotal?: number;
  loomId?: string;
  loomName?: string;
  weaverId?: string;
  weaverName?: string;
}

export default function DeliverySchedule() {
  const [schedules, setSchedules] = useState<DeliveryScheduleEntry[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<
    DeliveryScheduleEntry[]
  >([]);
  const [selectedSchedule, setSelectedSchedule] =
    useState<DeliveryScheduleEntry | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [orders, setOrders] = useState<any[]>([]);
  const [weavers, setWeavers] = useState<any[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [saving, setSaving] = useState(false);

  // Stats from backend (or fallback to zeros)
  const [stats, setStats] = useState({
    totalSchedules: 0,
    inProgress: 0,
    planned: 0,
    completed: 0,
    delayed: 0,
  });
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingWeavers, setLoadingWeavers] = useState(true);
  // Add this with your other form states
  const [scheduleStatus, setScheduleStatus] = useState<"planned" | "in-progress" | "completed" | "delayed">("planned");
  // Form state
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState<Date>();
  const [weaverAllocations, setWeaverAllocations] = useState<
    WeaverAllocation[]
  >([]);
  const [remarks, setRemarks] = useState("");
  const [dailySchedule, setDailySchedule] = useState<DailySchedule[]>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    loadData();
    loadSchedulesFromAPI();

    const unsubscribe = DataSync.subscribe(
      DataSync.DATA_TYPES.ORDERS,
      loadData,
    );
    return unsubscribe;
  }, []);

  const loadData = async () => {
    setLoadingOrders(true);
    setLoadingWeavers(true);

    try {
      // Load Orders
      const ordersResponse = await ENDPOINTS.getOrdersList();

      // DEBUG: Log what you're actually getting
      console.log("Raw orders response:", ordersResponse.data);

      // COMMON PATTERNS — Try these in order:
      let allOrders: any[] = [];

      if (Array.isArray(ordersResponse.data)) {
        allOrders = ordersResponse.data;
      }
      else if (ordersResponse.data?.orders && Array.isArray(ordersResponse.data.orders)) {
        allOrders = ordersResponse.data.orders;
      }
      else if (ordersResponse.data?.data && Array.isArray(ordersResponse.data.data)) {
        allOrders = ordersResponse.data.data;
      }
      else {
        console.error("Unexpected orders response format:", ordersResponse.data);
        alert("Orders data format unexpected. Check console.");
        allOrders = [];
      }

      // Now filter safely
      const eligibleOrders = allOrders.filter(
        (order: any) =>
          (order.status === "In Progress" || order.status === "Planning") &&
          order.selectedLooms &&
          order.selectedLooms.length > 0
      );

      setOrders(eligibleOrders.length > 0 ? eligibleOrders : allOrders);
      console.log("Eligible orders for scheduling:", eligibleOrders.length);
    } catch (error: any) {
      console.error("Failed to load orders:", error);
      alert("Failed to load orders: " + (error.response?.data?.error || error.message || "Network error"));
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }

    // === Weavers part remains the same ===
    try {
      const dispatchInchargeFabricResponse = await usersApi.get("/dispatch-incharge-fabric/list");
      console.log("Raw weavers response:", dispatchInchargeFabricResponse.data);

      // Your backend uses "weaver" (singular) as the key
      let dispatchInchargeFabric: any[] = [];

      if (dispatchInchargeFabricResponse.data?.dispatchInchargeFabric && Array.isArray(dispatchInchargeFabricResponse.data.dispatchInchargeFabric)) {
        dispatchInchargeFabric = dispatchInchargeFabricResponse.data.dispatchInchargeFabric;
      } else if (Array.isArray(dispatchInchargeFabricResponse.data)) {
        dispatchInchargeFabric = dispatchInchargeFabricResponse.data;
      } else {
        console.error("Unexpected weavers response format:", dispatchInchargeFabricResponse.data);
        alert("Failed to parse weavers data.");
        dispatchInchargeFabric = [];
      }

      // Normalize to { id, name } format
      const normalizedWeavers = dispatchInchargeFabric.map((w: any) => ({
        id: w.id,
        name: w.name,
      }));

      setWeavers(normalizedWeavers);
      console.log("Successfully loaded weavers:", normalizedWeavers.length, normalizedWeavers);
    } catch (error: any) {
      console.error("Failed to load weavers:", error);
      alert("Failed to load weavers: " + (error.response?.data?.error || error.message));
      setWeavers([]);
    } finally {
      setLoadingWeavers(false);
    }
  };




  const generateDailySchedule = (
    startDate: string,
    endDate: string,
    dailyTarget: number,
  ): DailySchedule[] => {
    const schedule: DailySchedule[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    let cumulative = 0;

    for (
      let date = new Date(start);
      date <= end;
      date.setDate(date.getDate() + 1)
    ) {
      const dateStr = date.toISOString().split("T")[0];
      const isWeekend = date.getDay() === 0; // Sunday
      const plannedProduction = isWeekend ? 0 : dailyTarget;

      if (!isWeekend) {
        cumulative += plannedProduction;
      }

      schedule.push({
        id: `day-${dateStr}`, // Generate a unique ID for each day
        date: dateStr,
        plannedProduction,
        isWeekend,
        cumulativeTotal: cumulative,
      });
    }

    return schedule;
  };

  const handleNewSchedule = () => {
    console.log("Opening new schedule form");
    setSelectedSchedule(null);
    setSelectedOrderId("");
    setDeliveryDate(undefined);
    setWeaverAllocations([]);
    setRemarks("");
    setCalendarOpen(false);
    setFormMode("create");
    setIsFormOpen(true);
    setScheduleStatus("planned");
  };

  const handleEditSchedule = async (schedule: DeliveryScheduleEntry) => {
    setFormMode("edit");
    setSelectedSchedule(schedule);

    // Pre-fill form
    setScheduleStatus(schedule.status);
    setSelectedOrderId(schedule.orderId);
    setDeliveryDate(new Date(schedule.deliveryDate));
    setRemarks(schedule.remarks || "");
    // Set dispatch incharge from the schedule
    if (schedule.dispatchInchargeName) {
      setSelectedSchedule({
        ...schedule,
        dispatchInchargeName: schedule.dispatchInchargeName
      });
    }

    setIsFormOpen(true);
  };



  // Count working days (excluding Sundays)
  const numberOfWorkingDays = (startDateStr: string, endDateStr: string): number => {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    if (start > end) return 0;

    let count = 0;
    const current = new Date(start);

    while (current <= end) {
      if (current.getDay() !== 0) {
        // 0 = Sunday
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  };

  const handleViewSchedule = async (scheduleFromList: DeliveryScheduleEntry) => {
    setLoadingSchedule(true);
    setIsViewOpen(true);

    try {
      const response = await ENDPOINTS.getDeliveryScheduleById(scheduleFromList.id);
      const fullSchedule = response.data.schedule;

      // Normalize (same as in loadSchedulesFromAPI)
      const normalized: DeliveryScheduleEntry = {
        id: fullSchedule.id,
        orderId: fullSchedule.order_id || fullSchedule.orderId,
        gptId: fullSchedule.gptid || fullSchedule.gptId,
        customer: fullSchedule.customer,
        orderDate: fullSchedule.order_date.split("T")[0],
        deliveryDate: fullSchedule.delivery_date.split("T")[0],
        totalFabricMeters: Number(fullSchedule.delivery_quantity),
        totalWarpMeters: Number(fullSchedule.warp_meters),
        remarks: fullSchedule.remarks || "",
        status: fullSchedule.status,
        createdDate: fullSchedule.created_date.split("T")[0],
        updatedDate: fullSchedule.updated_date.split("T")[0],
        dispatchInchargeName: fullSchedule.dispatch_incharge_name,
        dailySchedule: (fullSchedule.dailySchedule || []).map((day: any) => ({
          id: day.id,
          date: day.date,
          plannedProduction: Number(day.plannedProduction),
          actualProduction: day.actualProduction ? Number(day.actualProduction) : null,
          isWeekend: day.isWeekend,
          cumulativeTotal: day.cumulativeTotal ? Number(day.cumulativeTotal) : null,
          loomId: day.loomId,
          loomName: day.loomName,
          weaverId: day.weaverId,
          weaverName: day.weaverName,
        })),
        weaverAllocations: (fullSchedule.weaverAllocations || []).map((wa: any) => ({
          id: wa.id,
          weaverId: wa.weaverId,
          weaverName: wa.weaverName,
          plannedMeters: Number(wa.plannedMeters),
        })),
      };

      setSelectedSchedule(normalized);
    } catch (error: any) {
      console.error("Failed to load full schedule:", error);
      // alert("Could not load schedule details. Please try again.");
      // setIsViewOpen(false);
    } finally {
      setLoadingSchedule(false);
    }
  };

  // Load from API
  const loadSchedulesFromAPI = async () => {
    try {
      const response = await ENDPOINTS.getAllDeliverySchedules();
      const { schedules: rawSchedules = [], stats = {} } = response.data;

      // Normalize backend data → frontend format
      const loadedSchedules: DeliveryScheduleEntry[] = rawSchedules.map((s: any) => ({
        id: s.id,
        orderId: s.order_id,
        gptId: s.gptid,
        customer: s.customer,
        orderDate: s.order_date.split("T")[0],
        deliveryDate: s.delivery_date.split("T")[0],
        totalFabricMeters: Number(s.delivery_quantity),
        totalWarpMeters: Number(s.warp_meters),
        remarks: s.remarks || "",
        status: s.status as "planned" | "in-progress" | "completed" | "delayed",
        createdDate: s.created_date.split("T")[0],
        updatedDate: s.updated_date.split("T")[0],
        dispatchInchargeName: s.dispatch_incharge_name,
         dailySchedule: (s.dailySchedule || []).map((day: any) => ({
            id: day.id,
            date: day.date,
            plannedProduction: Number(day.plannedProduction),
            actualProduction: day.actualProduction ? Number(day.actualProduction) : null,
            isWeekend: day.isWeekend,
            cumulativeTotal: day.cumulativeTotal ? Number(day.cumulativeTotal) : null,
            loomId: day.loomId,
            loomName: day.loomName,
            weaverId: day.weaverId,
            weaverName: day.weaverName,
          })),
        weaverAllocations: (s.weaverAllocations || []).map((wa: any) => ({
          id: wa.id,
          weaverId: wa.weaverId,
          weaverName: wa.weaverName,
          plannedMeters: Number(wa.plannedMeters),
         
        })),
      }));

      // Use stats directly from backend
      const apiStats = {
        totalSchedules: stats.totalSchedules || loadedSchedules.length,
        inProgress: stats.inProgress || 0,
        planned: stats.planned || 0,
        completed: stats.completed || 0,
        delayed: stats.delayed || 0,
      };

      setSchedules(loadedSchedules);
      setFilteredSchedules(loadedSchedules);
      setStats(apiStats);

      console.log("Real delivery schedules loaded:", loadedSchedules.length);
    } catch (error: any) {
      console.error("Failed to load delivery schedules:", error);
      alert("Cannot connect to server. Please check your internet or try again later.");

      // Show clean empty state
      setSchedules([]);
      setFilteredSchedules([]);
      setStats({
        totalSchedules: 0,
        inProgress: 0,
        planned: 0,
        completed: 0,
        delayed: 0,
      });
    }
  };

  const handleSaveSchedule = async () => {
    if (!selectedOrderId || !deliveryDate || !selectedSchedule?.dispatchInchargeName) {
      alert("Please fill all required fields: Order, Delivery Date, and Dispatch Incharge.");
      return;
    }

    const order = orders.find((o) => o.id === selectedOrderId);
    if (!order) {
      alert("Selected order not found.");
      return;
    }

    // Find dispatch incharge ID from name
    const selectedIncharge = weavers.find(w => w.name === selectedSchedule.dispatchInchargeName);
    const dispatchInchargeId = selectedIncharge?.id || "";

    const payload = {
      deliveryDate: deliveryDate.toISOString().split("T")[0],
      status: scheduleStatus,
      dispatchInchargeId: dispatchInchargeId,
      remarks: remarks || null,
    };

    setSaving(true);
    try {
      if (formMode === "create") {
        // For create, send full payload
        const createPayload = {
          orderId: selectedOrderId,
          customer: order.customername,
          orderDate: order.orderdate || order.createddate,
          actualProduction: order.actualproduction,
          totalFabricMeters: selectedSchedule?.totalFabricMeters || 0,
          totalWarpMeters: selectedSchedule?.totalWarpMeters || 0,
          ...payload,
        };
        await ENDPOINTS.createDeliverySchedule(createPayload);
        alert("Delivery schedule created successfully!");
      } else if (formMode === "edit" && selectedSchedule?.id) {
        // For edit, send only the specified fields
        await ENDPOINTS.updateDeliverySchedule(selectedSchedule.id, payload);
        alert("Delivery schedule updated successfully!");
      }
      setIsFormOpen(false);
      await loadSchedulesFromAPI(); // Refresh list

      // Reset form
      setSelectedOrderId("");
      setDeliveryDate(undefined);
      setRemarks("");
      setSelectedSchedule(null);
      setFormMode("create");
    } catch (error: any) {
      console.error(`Error ${formMode === "create" ? "creating" : "updating"} schedule:`, error);
      const msg = error.response?.data?.error || error.message || "Unknown error";
      alert(`Failed to ${formMode === "create" ? "create" : "update"} schedule: ${msg}`);
    } finally { setSaving(false); }
  };

  const handleExportSchedule = (schedule: DeliveryScheduleEntry) => {
    generateDeliverySchedulePDF(schedule);
  };

  const generateDeliverySchedulePDF = (schedule: DeliveryScheduleEntry) => {
    // Import jsPDF dynamically to avoid SSR issues
    import("jspdf").then((jsPDFModule) => {
      import("jspdf-autotable").then((autoTableModule) => {
        const jsPDF = jsPDFModule.default;
        const autoTable = autoTableModule.default;

        const doc = new jsPDF();
        let yPos = 20;

        // Header
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("{/* Delivery Schedules List Report", 105, yPos, { align: "center" });

        yPos += 20;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");

        // Basic Information
        const basicInfo = [
          ["Field", "Value"],
          ["Order ID", schedule.orderId],
          ["Customer", schedule.customer],
          ["Delivery Date", schedule.deliveryDate],
          ["Total Fabric", `${schedule.totalFabricMeters} meters`],
          ["Total Warp", `${schedule.totalWarpMeters} meters`],
          ["Status", schedule.status],
        ];

        autoTable(doc, {
          startY: yPos,
          head: [basicInfo[0]],
          body: basicInfo.slice(1),
          theme: "grid",
          styles: { fontSize: 8 },
          columnStyles: { 0: { fontStyle: "bold" } },
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;

        // Weaver Allocations
        doc.setFont("helvetica", "bold");
        doc.text("WEAVER ALLOCATIONS", 20, yPos);
        yPos += 10;

        schedule.weaverAllocations.forEach((weaver, index) => {
          doc.setFont("helvetica", "bold");
          doc.text(
            `${weaver.weaverName} - ${weaver.plannedMeters} meters`,
            20,
            yPos,
          );
          yPos += 10;

          // Daily schedule table for this weaver
          if (schedule.dailySchedule && schedule.dailySchedule.length > 0) {
            const scheduleHeaders = [
              "Date",
              "Planned Production",
              "Cumulative Total",
            ];
            const scheduleData = schedule.dailySchedule
              .slice(0, 10)
              .map((day) => [
                day.date,
                day.plannedProduction.toString(),
                (day.cumulativeTotal || 0).toString(),
              ]);

            autoTable(doc, {
              startY: yPos,
              head: [scheduleHeaders],
              body: scheduleData,
              theme: "grid",
              styles: { fontSize: 7 },
              margin: { left: 30 },
            });

            yPos = (doc as any).lastAutoTable.finalY + 10;
          }

          // Add new page if needed
          if (yPos > 250 && index < schedule.weaverAllocations.length - 1) {
            doc.addPage();
            yPos = 20;
          }
        });

        // Save PDF
        doc.save(
          `delivery-schedule-${schedule.orderId}-${schedule.deliveryDate}.pdf`,
        );
      });
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "in-progress":
        return "bg-blue-500";
      case "delayed":
        return "bg-red-500";
      default:
        return "bg-yellow-500";
    }
  };


  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Delivery Schedule
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Manage delivery schedules and weaver allocations for orders
          </p>
        </div>
{/* 
        <div className="flex justify-end">
          <Button onClick={handleNewSchedule} className="text-xs sm:text-sm">
            <Plus className="mr-2 h-4 w-4" />
            New Schedule
          </Button>
        </div> */}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {loadingOrders || loadingWeavers ? (
          // Show 4 skeleton cards while loading
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Schedules</p>
                    <p className="text-2xl font-bold">{stats.totalSchedules}</p>
                  </div>
                  <Truck className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">In Progress</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {stats.inProgress}
                    </p>
                  </div>
                  <Factory className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Planned</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {stats.planned}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.completed}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Delivery Schedules List */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Schedules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">{loadingOrders || loadingWeavers ? (
            // Show 3-5 skeleton schedule cards
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="mb-4">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-8 w-32" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                    <div className="flex gap-2 mt-3 sm:mt-0">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div key={j}>
                        <Skeleton className="h-4 w-20 mb-1" />
                        <Skeleton className="h-5 w-32" />
                      </div>
                    ))}
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <div className="flex flex-wrap gap-2">
                      <Skeleton className="h-7 w-32 rounded-full" />
                      <Skeleton className="h-7 w-28 rounded-full" />
                      <Skeleton className="h-7 w-36 rounded-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredSchedules.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No delivery schedules</h3>
              <p className="mt-2 text-sm text-gray-500">
                Get started by creating a new delivery schedule.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSchedules.map((schedule) => (
                <Card key={schedule.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 space-y-2 sm:space-y-0">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-bold text-lg">{schedule.gptId}</h3>
                        <Badge
                          className={`${getStatusColor(schedule.status)} text-white`}
                        >
                          {schedule.status.charAt(0).toUpperCase() +
                            schedule.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewSchedule(schedule)}
                          className="text-xs"
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditSchedule(schedule)}
                          className="text-xs"
                        >
                          <Edit className="mr-1 h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExportSchedule(schedule)}
                          className="text-xs"
                        >
                          <Download className="mr-1 h-3 w-3" />
                          Export
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-gray-600">Customer</p>
                        <p className="font-medium">{schedule.customer}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Delivery Date</p>
                        <p className="font-medium">{schedule.deliveryDate}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Fabric</p>
                        <p className="font-medium">
                          {schedule.totalFabricMeters.toLocaleString()} meters
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Dispatch Incharge</p>
                        <p className="font-medium">
                          {schedule.dispatchInchargeName}
                        </p>
                      </div>
                      {/* <div>
                        <p className="text-sm text-gray-600">Weavers</p>
                        <p className="font-medium">
                          {schedule.weaverAllocations.length} assigned
                        </p>
                      </div> */}
                    </div>

                    {/* <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="font-medium mb-2">Weaver Allocations</h4>
                      {schedule.weaverAllocations.length === 0 ? (
                        <p className="text-gray-500 text-sm italic">No weavers allocated</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {schedule.weaverAllocations.map((weaver) => (
                            <Badge key={weaver.weaverId} variant="outline">
                              {weaver.weaverName}: {Number(weaver.plannedMeters).toLocaleString()}m
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div> */}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          </div>
        </CardContent>
      </Card>

      {/* Schedule Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {formMode === "create"
                ? "Create New Delivery Schedule"
                : "Edit Delivery Schedule"}
            </DialogTitle>
            <DialogDescription>
            Plan delivery schedules, update delivery status, and coordinate with the dispatch in-charge
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="order">Selected Order</Label>
                <div className="p-2 border rounded-md bg-gray-50">
                  {selectedOrderId ? (
                    <span className="text-sm ">
                      {orders.find(o => o.id === selectedOrderId)?.gptid || selectedOrderId} - 
                      {orders.find(o => o.id === selectedOrderId)?.customername || ''}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">No order selected</span>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="deliveryDate">Delivery Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {deliveryDate
                        ? format(deliveryDate, "PPP")
                        : "Select delivery date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={deliveryDate}
                      onSelect={setDeliveryDate}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today;
                      }}
                      initialFocus
                      // Optional but often helps with interaction bugs:
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={scheduleStatus} onValueChange={(value) => setScheduleStatus(value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="delayed">Delayed</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Current status: <span className="font-medium capitalize">{scheduleStatus.replace("-", " ")}</span>
                </p>
              </div>
              <div>
                <Label htmlFor="dispatchIncharge">Dispatch Incharge *</Label>
                <Select
                  value={selectedSchedule?.dispatchInchargeName || ""}
                  onValueChange={(value) => {
                    if (selectedSchedule) {
                      setSelectedSchedule({
                        ...selectedSchedule,
                        dispatchInchargeName: value
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select dispatch incharge" />
                  </SelectTrigger>
                  <SelectContent>
                    {weavers.map((weaver) => (
                      <SelectItem key={weaver.id} value={weaver.name}>
                        {weaver.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedSchedule?.dispatchInchargeName && (
                  <p className="text-xs text-gray-500 mt-1">
                    Current incharge: <span className="font-medium">{selectedSchedule.dispatchInchargeName}</span>
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="remarks">Remarks</Label>
              <Input
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Any special delivery instructions..."
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveSchedule}
                disabled={
                  !selectedOrderId ||
                  !deliveryDate ||
                  !selectedSchedule?.dispatchInchargeName
                }
              >
                {formMode === "create" ? "Create Schedule" : "Update Schedule"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Truck className="mr-2 h-5 w-5" />
              {loadingSchedule && <span className="text-sm text-gray-500">(Loading...)</span>}
              Delivery Schedule: {selectedSchedule?.gptId}
            </DialogTitle>
            <DialogDescription>
              {selectedSchedule?.customer} - Delivery:{" "}
              {selectedSchedule?.deliveryDate}
            </DialogDescription>
          </DialogHeader>

          {selectedSchedule && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-2">Order Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Order:</span>
                        <span className="font-medium">
                          {selectedSchedule.gptId}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Customer:</span>
                        <span className="font-medium">
                          {selectedSchedule.customer}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <Badge
                          className={`${getStatusColor(selectedSchedule.status)} text-white`}
                        >
                          {selectedSchedule.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-2">Production Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Fabric:</span>
                        <span className="font-medium">
                          {selectedSchedule.totalFabricMeters.toLocaleString()}m
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Warp:</span>
                        <span className="font-medium">
                          {selectedSchedule.totalWarpMeters.toLocaleString()}m
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dispatch Incharge:</span>
                        <span className="font-medium">
                          {selectedSchedule.dispatchInchargeName}
                        </span>
                      </div>

                      {/* <div className="flex justify-between">
                        <span>Weavers:</span>
                        <span className="font-medium">
                          {selectedSchedule.weaverAllocations.length}
                        </span>
                      </div> */}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-2">Timeline</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Order Date:</span>
                        <span className="font-medium">
                          {selectedSchedule.orderDate}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery:</span>
                        <span className="font-medium">
                          {selectedSchedule.deliveryDate}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Created:</span>
                        <span className="font-medium">
                          {selectedSchedule.createdDate}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="font-medium mb-4">Daily Production Schedule</h3>
                <Card>
                  <CardContent className="p-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left p-3 font-medium">Date</th>
                            <th className="text-left p-3 font-medium">Weaver & Loom</th>
                            <th className="text-right p-3 font-medium">Planned Production</th>
                            <th className="text-right p-3 font-medium">Actual Production</th>
                            <th className="text-right p-3 font-medium">Cumulative Total</th>
                            <th className="text-center p-3 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedSchedule?.dailySchedule?.length > 0 ? (
                            selectedSchedule.dailySchedule.map((day) => (
                              <tr
                                key={day.id}
                                className={`border-b transition-colors ${
                                  day.isWeekend 
                                    ? "bg-red-50 hover:bg-red-100" 
                                    : "hover:bg-gray-50"
                                }`}
                              >
                                <td className="p-3">
                                  <div className="flex items-center">
                                    {new Date(day.date).toLocaleDateString("en-US", {
                                      weekday: "short",
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric"
                                    })}
                                    {day.isWeekend && (
                                      <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full font-medium">
                                        Sunday
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <div className="text-sm">
                                    {day.weaverName && day.loomName ? (
                                      <span className="font-medium text-blue-700">
                                        {day.weaverName} - {day.loomName}
                                      </span>
                                    ) : day.weaverName ? (
                                      <span className="font-medium text-blue-700">
                                        {day.weaverName}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400">Not assigned</span>
                                    )}
                                  </div>
                                </td>
                                <td className="text-right p-3">
                                  <span className={day.isWeekend ? "text-gray-400" : ""}>
                                    {day.plannedProduction > 0
                                      ? day.plannedProduction.toLocaleString()
                                      : "-"}
                                  </span>
                                </td>
                                <td className="text-right p-3">
                                  <span className={
                                    day.actualProduction 
                                      ? (day.actualProduction >= day.plannedProduction 
                                          ? "text-green-600" 
                                          : "text-orange-600")
                                      : "text-gray-400"
                                  }>
                                    {day.actualProduction 
                                      ? day.actualProduction.toLocaleString()
                                      : "-"}
                                  </span>
                                </td>
                                <td className="text-right p-3 font-medium">
                                  {day.cumulativeTotal?.toLocaleString() || "-"}
                                </td>
                                <td className="text-center p-3">
                                  {day.isWeekend ? (
                                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                      Weekend
                                    </span>
                                  ) : day.actualProduction ? (
                                    day.actualProduction >= day.plannedProduction ? (
                                      <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                                        On Target
                                      </span>
                                    ) : (
                                      <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">
                                        Below Target
                                      </span>
                                    )
                                  ) : (
                                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                                      Planned
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="text-center p-8 text-gray-500">
                                No daily schedule data available
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
