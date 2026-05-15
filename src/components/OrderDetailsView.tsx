import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Package,
  Calendar,
  User,
  MapPin,
  Phone,
  Factory,
  Target,
  TrendingUp,
  Settings,
  Loader2,

  AlertCircle
} from "lucide-react";
import ENDPOINTS from "@/services/api";
import { log } from "console";

interface OrderDetailsViewProps {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface TimeActionPlan {
  process: string;
  completed: boolean;
}

interface Order {
  // Basic Info
  id: string;
  gptid: string;
  customer: string;
  buyerPO?: string;
  quantity?: number;
  unit: string;
  deliveryDate: string;

  // Fabric & Construction
  fabric: string;
  construction: string;
  gsm?: string;
  rate?: string;

  // Technical Specifications
  fabricStock?: string;
  toBeProduced?: string;
  warpEndsBeam?: string;
  warpCrimp?: string;
  warpMeterReqd?: string;
  warpYarnCount?: string;
  reedYarnKgs?: string;
  reedSpace?: string;

  // Production Planning
  loomType?: string;
  productionPerDayLoom?: string;
  availableDays?: string;
  loomsRequired?: string;
  loomsPlanned?: string;
  isJobWork: boolean;

  // Loom Assignment
  selectedLooms?: string[];

  // Timeline & Progress
  progress: number;
  timeActionPlan?: TimeActionPlan[];

  // Status
  status: string;
  priority: string;
}

export const OrderDetailsView: React.FC<OrderDetailsViewProps> = ({
  orderId,
  isOpen,
  onClose,
}) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress":
        return "bg-blue-500 text-white";
      case "Planning":
        return "bg-yellow-500 text-white";
      case "Completed":
        return "bg-green-500 text-white";
      case "On Hold":
        return "bg-red-500 text-white";
      case "Job Work":
        return "bg-orange-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "border-red-200 bg-red-50 text-red-700";
      case "Medium":
        return "border-yellow-200 bg-yellow-50 text-yellow-700";
      case "Low":
        return "border-green-200 bg-green-50 text-green-700";
      default:
        return "border-gray-200 bg-gray-50 text-gray-700";
    }
  };

  const formatActivityProcess = (text: string): string => {
    if (!text) return text;

    // If the text contains " - Loom <something>", strip that part entirely
    const marker = " - Loom ";
    const idx = text.indexOf(marker);

    if (idx === -1) return text;

    return text.slice(0, idx).trimEnd();
  };

  useEffect(() => {
    if (!isOpen || !orderId) {
      setOrder(null);
      return;
    }

    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await ENDPOINTS.getOrderById(orderId);
        if (response.data.success && response.data.order) {
          const apiOrder = response.data.order;

          const loomObjects = apiOrder.productionPlanning?.[0]?.loomsselected || [];
          const selectedLoomNames = loomObjects.map((loom: any) => loom.name);

          // Use timeAndActionPlans if exists, otherwise fall back to tasks
          const timelineItems = apiOrder.timeAndActionPlans?.length > 0
            ? apiOrder.timeAndActionPlans
            : apiOrder.tasks || [];
          // Map API response to UI Order type
          const mappedOrder: Order = {
            id: apiOrder.id,
            gptid: apiOrder.gptid,
            customer: apiOrder.customername || "Unknown",
            buyerPO: apiOrder.buyerponumber || undefined,
            quantity: apiOrder.quantity || parseFloat(apiOrder.meters) || 0,
            unit: apiOrder.unit || "meters",
            deliveryDate: new Date(apiOrder.deliverydate).toLocaleDateString("en-IN"),
            fabric: apiOrder.fabrictype || "N/A",
            construction: [
              apiOrder.constructionvalue1,
              apiOrder.constructionvalue2,
              apiOrder.constructionvalue3,
              apiOrder.constructionvalue4,
              apiOrder.constructionvalue5,
            ]
              .filter(Boolean)
              .join(" x ") || "N/A",
            gsm: apiOrder.gsm || undefined,
            rate: apiOrder.rate || undefined,

            // Technical Specs
            fabricStock: apiOrder.fabricstock,
            toBeProduced: apiOrder.tobeproduced,
            warpEndsBeam: apiOrder.warpendsbeam,
            warpCrimp: apiOrder.warpcrimp,
            warpMeterReqd: apiOrder.warpmeterrequired,
            warpYarnCount: apiOrder.warpyarncount,
            reedYarnKgs: apiOrder.reedyarnkgs,
            reedSpace: apiOrder.reedspace,

            // Production Planning (take first if multiple)
            loomType: apiOrder.productionPlanning?.[0]?.loomtype,
            productionPerDayLoom: apiOrder.productionPlanning?.[0]?.productionperdayloom,
            availableDays: apiOrder.productionPlanning?.[0]?.availabledays,
            loomsRequired: apiOrder.productionPlanning?.[0]?.loomsrequired,
            loomsPlanned: apiOrder.productionPlanning?.[0]?.loomsplanned,

            // Job Work
            isJobWork: apiOrder.status === "Job Work",

            // Assigned Looms
            selectedLooms: apiOrder.productionPlanning?.[0]?.loomsselected || [],

            // Progress & T&A
            progress: apiOrder.progress || 0,
            timeActionPlan: timelineItems.map((item: any) => ({
              process: item.process || item.tasktitle || "Unknown Task",
              completed: item.status === "Completed" || item.progress === "100" || item.progress >= 100,
            })),

            status: apiOrder.status || "Planning",
            priority: apiOrder.priority || "Medium",
          };

          setOrder(mappedOrder);
          console.log(mappedOrder);

        }
      } catch (err: any) {
        console.error("Failed to fetch order:", err);
        setError(err.response?.data?.message || "Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, isOpen]);

  if (!isOpen) return null;

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-6xl">
          <div className="flex flex-col items-center justify-center h-96 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            <p>Loading order details...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !order) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-6xl">
          <div className="flex flex-col items-center justify-center h-96 gap-4 text-red-600">
            <AlertCircle className="h-12 w-12" />
            <p className="text-lg font-medium">Error Loading Order</p>
            <p className="text-sm">{error || "Order not found"}</p>
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
            <div>
              <DialogTitle className="flex items-center text-lg sm:text-xl">
                <Package className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Order Details - {order.gptid}
              </DialogTitle>
              <DialogDescription className="text-sm">
                "Complete order information and specifications"
              </DialogDescription>

            </div>

          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 h-auto">
            <TabsTrigger
              value="details"
              className="text-xs sm:text-sm px-2 py-2"
            >
              <span className="hidden sm:inline">
                Order & Technical Details
              </span>
              <span className="sm:hidden">Details</span>
            </TabsTrigger>
            <TabsTrigger
              value="production"
              className="text-xs sm:text-sm px-2 py-2"
            >
              <span className="hidden sm:inline">Production Planning</span>
              <span className="sm:hidden">Production</span>
            </TabsTrigger>
            <TabsTrigger value="looms" className="text-xs sm:text-sm px-2 py-2">
              <span className="hidden sm:inline">Loom Assignment</span>
              <span className="sm:hidden">Looms</span>
            </TabsTrigger>
            {/* <TabsTrigger
              value="timeline"
              className="text-xs sm:text-sm px-2 py-2"
            >
              <span className="hidden sm:inline">T&A Timeline</span>
              <span className="sm:hidden">Timeline</span>
            </TabsTrigger> */}
          </TabsList>

          {/* Tab 1: Order & Technical Details */}
          <TabsContent value="details" className="space-y-6">
            {/* Order Status & Basic Info */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-blue-800">
                  Order Information
                </h3>
                <div className="flex space-x-2">
                  <Badge className={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={getPriorityColor(order.priority)}
                  >
                    {order.priority} Priority
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <div className="flex items-center mb-2">
                    <User className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm text-gray-600">Customer</span>
                  </div>
                  <p className="font-medium">{order.customer}</p>
                </div>
                <div>
                  <div className="flex items-center mb-2">
                    <Package className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm text-gray-600">Buyer PO</span>
                  </div>
                  <p className="font-medium">{order.buyerPO || "N/A"}</p>
                </div>
                <div>
                  <div className="flex items-center mb-2">
                    <Target className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm text-gray-600">Quantity</span>
                  </div>
                  <p className="font-medium">
                    {order.quantity?.toLocaleString()} {order.unit}
                  </p>
                </div>
                <div>
                  <div className="flex items-center mb-2">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm text-gray-600">Delivery Date</span>
                  </div>
                  <p className="font-medium">{order.deliveryDate}</p>
                </div>
                <div>
                  <div className="flex items-center mb-2">
                    <Package className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm text-gray-600">Fabric Type</span>
                  </div>
                  <p className="font-medium">{order.fabric}</p>
                </div>
                <div>
                  <div className="flex items-center mb-2">
                    <Settings className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm text-gray-600">Construction</span>
                  </div>
                  <p className="font-medium">{order.construction}</p>
                </div>
                <div>
                  <div className="flex items-center mb-2">
                    <TrendingUp className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm text-gray-600">GSM</span>
                  </div>
                  <p className="font-medium">{order.gsm || "N/A"}</p>
                </div>
                <div>
                  <div className="flex items-center mb-2">
                    <Target className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm text-gray-600">Rate</span>
                  </div>
                  <p className="font-medium">{order.rate || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Technical Specifications */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 className="font-semibold text-yellow-800 mb-3">
                Technical Specifications
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Fabric Stock</p>
                  <p className="font-medium">{order.fabricStock || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">To be Produced</p>
                  <p className="font-medium">{order.toBeProduced || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Warp Ends/Beam</p>
                  <p className="font-medium">{order.warpEndsBeam || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Warp Crimp %</p>
                  <p className="font-medium">{order.warpCrimp || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Warp Meter Required</p>
                  <p className="font-medium">{order.warpMeterReqd || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Warp Yarn Count</p>
                  <p className="font-medium">{order.warpYarnCount || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Reqd Yarn in KGS</p>
                  <p className="font-medium">{order.reedYarnKgs || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Reed Space</p>
                  <p className="font-medium">{order.reedSpace || "N/A"}</p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Production Planning */}
          <TabsContent value="production" className="space-y-6">
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-purple-800 mb-3">
                Production Planning
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <div>
  <p className="text-sm text-gray-600">Loom Type</p>
  <p className="font-medium">
    {Array.isArray(order.loomType) && order.loomType.length > 0
      ? order.loomType.join(", ")
      : "N/A"}
  </p>
</div>

                <div>
                  <p className="text-sm text-gray-600">Production/Day/Loom</p>
                  <p className="font-medium">
                    {order.productionPerDayLoom || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Available Days</p>
                  <p className="font-medium">{order.availableDays || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Looms Required</p>
                  <p className="font-medium text-red-600">
                    {order.loomsRequired || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Looms Planned</p>
                  <p className="font-medium text-blue-600">
                    {order.loomsPlanned || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Job Work</p>
                  <Badge
                    className={
                      order.isJobWork
                        ? "bg-orange-500 text-white"
                        : "bg-green-500 text-white"
                    }
                  >
                    {order.isJobWork ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 3: Loom Assignment */}
          <TabsContent value="looms" className="space-y-6">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-800 mb-3">
                Assigned Looms
              </h3>
              {order.selectedLooms && order.selectedLooms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {order.selectedLooms.map((loom: any, index) => (
                    <div key={index} className="bg-white p-3 rounded border">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{loom.name}</span>
                        <Badge
                          className={
                            loom.status === "Running"
                              ? "bg-green-500 text-white"
                              : loom.status === "Idle"
                                ? "bg-blue-500 text-white"
                                : loom.status === "Maintenance"
                                  ? "bg-orange-500 text-white"
                                  : "bg-gray-500 text-white"
                          }
                        >
                          {loom.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">
                  {order.isJobWork
                    ? "Job Work - No looms assigned"
                    : "No looms assigned"}
                </p>
              )}
            </div>
          </TabsContent>

          {/* Tab 4: T&A Timeline */}
          {/* <TabsContent value="timeline" className="space-y-6">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h3 className="font-semibold text-red-800 mb-3">
                Time & Action Plan
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-lg font-bold text-green-600">
                    {order.progress}%
                  </span>
                </div>
                <Progress value={order.progress} className="w-full" />
                <p className="text-sm text-gray-600">
                  Based on T&A plan completion
                </p>
              </div>

              {order.timeActionPlan && order.timeActionPlan.length > 0 ? (
                <div className="mt-4 space-y-2">
                  <h4 className="font-medium">Recent Activities:</h4>
                  {order.timeActionPlan.slice(0, 5).map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white p-2 rounded border"
                    >
                      <span className="text-sm">{formatActivityProcess(activity.process)}</span>
                      <Badge
                        className={
                          activity.completed
                            ? "bg-green-500 text-white"
                            : "bg-yellow-500 text-white"
                        }
                      >
                        {activity.completed ? "Completed" : "Pending"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 mt-4">
                  No T&A plan available for this order
                </p>
              )}
            </div>
          </TabsContent> */}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
