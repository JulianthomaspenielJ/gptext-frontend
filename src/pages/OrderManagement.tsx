import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EnhancedOrderForm } from "@/components/EnhancedOrderForm";
import { OrderDetailsView } from "@/components/OrderDetailsView";
import { MaterialStatus } from "@/components/MaterialStatus";
import { CustomerReports } from "@/components/CustomerReports";
import { SearchFilter } from "@/components/SearchFilter";
import { ViewToggle } from "@/components/ViewToggle";
import { InlineTimeActionPlanNew } from "@/components/InlineTimeActionPlanNew";
import { IndividualLoomTAPlan } from "@/components/IndividualLoomTAPlan";
import { InlineFormCard } from "@/components/InlineFormCard";
import { OrderStorage, Order } from "@/lib/orderStorage";

import {
  ShoppingCart,
  Plus,
  Calendar,
  Package,
  User,
  Clock,
} from "lucide-react";
import ENDPOINTS from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";
import { InlineTimeActionPlan } from "@/components/InlineTimeActionPlan";

const getStatusColor = (status: string) => {
  switch (status) {
    case "In Progress":
      return "bg-blue-500";
    case "Planning":
      return "bg-yellow-500";
    case "Completed":
      return "bg-green-500";
    case "On Hold":
      return "bg-red-500";
    default:
      return "bg-gray-500";
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

// Helper to map API response order to local Order type
const mapApiOrderToLocal = (apiOrder: any): Order => ({
  id: apiOrder.id || "Unknown",
  gptid: apiOrder.gptid || "Unknown",
  customer: apiOrder.customername || "Unknown Customer",
  fabric: apiOrder.fabrictype || "Unknown",
  construction: `${apiOrder.constructionvalue1 || ""} x ${apiOrder.constructionvalue2 || ""} / ${apiOrder.constructionvalue3 || ""} x ${apiOrder.constructionvalue4 || ""}`,
  orderDate: apiOrder.orderdate ? apiOrder.orderdate.split("T")[0] : "Unknown",
  deliveryDate: apiOrder.deliverydate
    ? apiOrder.deliverydate.split("T")[0]
    : "Unknown",
  status: apiOrder.status || "Planning",
  progress: apiOrder.progress ?? 0,
  unit: apiOrder.unit || "Meters",
  quantity: apiOrder.quantity || 0,
  priority: apiOrder.priority || "Medium",
  timeActionPlan: apiOrder.timeAndActionPlans || [],
  tasks: apiOrder.tasks || [],
  selectedLooms: apiOrder.productionPlanning?.[0]?.loomsselected || [],
  orderState: apiOrder.orderstate || "In Progress",
});

export default function OrderManagement() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  // const [selectedOrderForTA, setSelectedOrderForTA] = useState<string | null>(
  //   null,
  // );
  const [selectedOrderForTAView, setSelectedOrderForTAView] = useState<
    string | null
  >(null);
  const [selectedOrderForTAAdd, setSelectedOrderForTAAdd] = useState<
    string | null
  >(null);

  const [isUpdateFormOpen, setIsUpdateFormOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderFormMode, setOrderFormMode] = useState<"view">("view");
  const [isMaterialStatusOpen, setIsMaterialStatusOpen] = useState(false);
  const [isCustomerReportOpen, setIsCustomerReportOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<"list" | "grid">("list");
  const [apiStats, setApiStats] = useState({
    totalOrders: 0,
    totalInProgress: 0,
    totalPlanning: 0,
    totalOverdue: 0,
  });

  const fetchAndRefresh = async () => {
    setIsLoading(true);
    try {
      const response = await ENDPOINTS.getOrdersList();
      if (response?.data?.success && response?.data?.orders) {
        setApiStats({
          totalOrders: parseInt(response.data.totalOrders) || 0,
          totalInProgress: parseInt(response.data.totalInProgress) || 0,
          totalPlanning: parseInt(response.data.totalPlanning) || 0,
          totalOverdue: parseInt(response.data.totalOverdue) || 0,
        });

        const mappedOrders = response.data.orders.map(mapApiOrderToLocal);
        setOrders(mappedOrders);
        setFilteredOrders(mappedOrders);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAndRefresh();
  }, []);

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredOrders(orders);
      return;
    }

    const filtered = orders.filter(
      (order) =>
        order.id.toLowerCase().includes(query.toLowerCase()) ||
        order.customer.toLowerCase().includes(query.toLowerCase()) ||
        order.fabric.toLowerCase().includes(query.toLowerCase()) ||
        order.status.toLowerCase().includes(query.toLowerCase()) ||
        order.gptid.toLowerCase().includes(query.toLowerCase()),
    );
    setFilteredOrders(filtered);
  };

  const handleFilter = (filters: any) => {
    let filtered = [...orders];

    if (filters.status) {
      filtered = filtered.filter((order) => order.status === filters.status);
    }

    if (filters.priority) {
      filtered = filtered.filter(
        (order) => order.priority === filters.priority,
      );
    }

    if (filters.dateFrom && filters.dateTo) {
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.orderDate);
        const fromDate = new Date(filters.dateFrom);
        const toDate = new Date(filters.dateTo);
        return orderDate >= fromDate && orderDate <= toDate;
      });
    }

    setFilteredOrders(filtered);
  };

  const handleClearFilters = () => {
    setFilteredOrders(orders);
  };

  const handleNewOrder = async (orderData: Order) => {
    // Generate T&A plan and tasks based on order creation date
    const timeActionPlan = OrderStorage.generateTimeActionPlan(
      orderData.orderDate,
    );
    const tasks = OrderStorage.generateTasksFromTA(
      orderData.id,
      orderData.customer,
      timeActionPlan,
    );

    const completeOrder = {
      ...orderData,
      timeActionPlan,
      tasks,
    };

    try {
      await fetchAndRefresh();
    } catch (error) {
      console.error("Failed to refresh orders after creation:", error);
    }
  };

  const handleViewOrder = (orderId: string) => {
    setSelectedOrderId(orderId); // optional, if needed elsewhere
    setOrderFormMode("view");
    setIsOrderDetailsOpen(true);
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrderId(order.id);
    setIsUpdateFormOpen(true);
  };

  const handleDeleteOrder = async (orderId: string) => {
    const confirmed = confirm(
      "Are you sure you want to delete this order? This action cannot be undone.",
    );

    if (!confirmed) return;

    try {
      // Call API delete endpoint
      await ENDPOINTS.deleteOrder(orderId);

      // Refresh orders list from API after deletion
      const response = await ENDPOINTS.getOrdersList();

      if (response?.data?.success && response?.data?.orders) {
        const mappedOrders: Order[] =
          response.data.orders.map(mapApiOrderToLocal);

        setOrders(mappedOrders);
        setFilteredOrders(mappedOrders);

        // Update stats (same logic as useEffect)
        setApiStats({
          totalOrders: parseInt(response?.data?.totalOrders) || 0,
          totalInProgress: parseInt(response?.data?.totalInProgress) || 0,
          totalPlanning: parseInt(response?.data?.totalPlanning) || 0,
          totalOverdue: parseInt(response?.data?.totalOverdue) || 0,
        });
      }
    } catch (error) {
      console.error("Failed to delete order:", error);
      alert("Failed to delete order. Please try again.");
    }
  };

  const selectedOrderForTAPlan = orders.find(
    (order) => order.id === selectedOrderForTAView,
  );

  const handleMaterialStatus = () => {
    setIsMaterialStatusOpen(true);
  };

  const handleCustomerReports = () => {
    setIsCustomerReportOpen(true);
  };

  // const completedCount = orders.timeAndActionPlans.filter(
  //   (p) => p.status === "completed",
  // ).length;
  // const progressPercentage = orders.timeAndActionPlans.length
  //   ? Math.round((completedCount / orders.timeAndActionPlans.length) * 100)
  //   : 0;
  const calculateProgress = (timeAndActionPlans = []) => {
    console.log(timeAndActionPlans);
    if (!timeAndActionPlans.length) return 0;

    const completed = timeAndActionPlans.filter(
      (p) => p.tastatus === "completed",
    ).length;

    console.log(Math.round((completed / timeAndActionPlans.length) * 100));
    return Math.round((completed / timeAndActionPlans.length) * 100);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600">
            Manage all production orders and customer requirements
          </p>
        </div>
        <div className="flex flex-col space-y-2">
          <div className="flex flex-col xs:flex-row items-stretch xs:items-center space-y-2 xs:space-y-0 xs:space-x-2">
            <div className="flex-1">
              <SearchFilter
                onSearch={handleSearch}
                onFilter={handleFilter}
                onClearFilters={handleClearFilters}
                filterOptions={{
                  status: [
                    "Planning",
                    "In Progress",
                    "Completed",
                    // "On Hold",
                    "Job Work",
                  ],
                  priority: ["High", "Medium", "Low"],
                  dateRange: true,
                }}
                placeholder="Search orders..."
              />
            </div>
            <ViewToggle view={view} onViewChange={setView} />
          </div>
          <Button
            onClick={() => setIsOrderFormOpen(true)}
            className="w-full xs:w-auto text-xs sm:text-sm"
          >
            <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            New Order
          </Button>
        </div>
      </div>

      {/* SUMMARY CARDS WITH LOADING */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-32 mb-3" />
                <Skeleton className="h-10 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold">{apiStats.totalOrders}</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {apiStats.totalInProgress}
                  </p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Planning</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {apiStats.totalPlanning}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">
                    {apiStats.totalOverdue}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Orders List/Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Current Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div
              className={
                view === "list"
                  ? "space-y-4"
                  : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              }
            >
              {[...Array(view === "list" ? 5 : 8)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-8 w-48 mb-4" />
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                    <Skeleton className="h-20 w-full mt-6" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <p className="text-center py-12 text-gray-500">No orders found</p>
          ) : view === "list" ? (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const progress = calculateProgress(order.timeActionPlan);
                return (
                  <Card key={order.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                          <h3 className="text-lg sm:text-xl font-bold">
                            {order.gptid}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2">
                            {/* <Badge
                            className={`${getStatusColor(order.status)} text-white text-xs`}
                          >
                            {order.status}
                          </Badge> */}
                            {order.status === "Job Work" && (
                              <Badge
                                className={`${getStatusColor(order.status)} text-white text-xs`}
                              >
                                {order.status}
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className={`${getStatusColor(order.orderState)} text-xs`}
                            >
                              {order.orderState}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`${getPriorityColor(order.priority)} text-xs`}
                            >
                              {order.priority}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 xs:gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewOrder(order.id)}
                            className="text-xs xs:text-sm px-2 xs:px-3 h-8"
                          >
                            <span className="hidden xs:inline">
                              View Details
                            </span>
                            <span className="xs:hidden">View</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditOrder(order)}
                            className={`text-xs xs:text-sm px-2 xs:px-3 h-8 ${
                              order.orderState === "Completed"
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                            disabled={order.orderState === "Completed"}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteOrder(order.id)}
                            className="text-xs xs:text-sm px-2 xs:px-3 h-8 text-red-600 hover:text-red-700"
                          >
                            Delete
                          </Button>
                          <Button
                            size="sm"
                            // onClick={() => setSelectedOrderForTA(order.id)}
                            onClick={() => setSelectedOrderForTAView(order.id)}
                            disabled={
                              order.status === "Job Work" ||
                              order.orderState === "Completed"
                            }
                            className={`text-xs xs:text-sm px-2 xs:px-3 h-8 ${
                              order.status === "Job Work"
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            <span className="hidden xs:inline">
                              {order.status === "Job Work"
                                ? "T&A Not Applicable"
                                : "T&A Plan"}
                            </span>
                            <span className="xs:hidden">
                              {order.status === "Job Work" ? "N/A" : "T&A"}
                            </span>
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setSelectedOrderForTAAdd(order.id)}
                            disabled={
                              order.status === "Job Work" ||
                              order.orderState === "Completed"
                            }
                          >
                            Add T&A Plan
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div>
                          <div className="flex items-center mb-2">
                            <User className="h-4 w-4 mr-2 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              Customer
                            </span>
                          </div>
                          <p className="font-medium">{order.customer}</p>
                        </div>
                        <div>
                          <div className="flex items-center mb-2">
                            <Package className="h-4 w-4 mr-2 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              Fabric Details
                            </span>
                          </div>
                          <p className="font-medium">{order.fabric}</p>
                        </div>
                        <div>
                          <div className="flex items-center mb-2">
                            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              Delivery
                            </span>
                          </div>
                          <p className="font-medium">{order.deliveryDate}</p>
                          <p className="text-sm text-gray-500">
                            Ordered: {order.orderDate}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                        <div>
                          <p className="text-sm text-gray-600">
                            Quantity:{" "}
                            <span className="font-medium">
                              {order.quantity} {order.unit}
                            </span>
                          </p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Progress</p>
                            <p className="font-medium text-green-600">
                              {progress}%
                            </p>
                            <p className="text-xs text-gray-500">
                              Based on T&A completion
                            </p>
                          </div>
                          <Progress
                            value={progress}
                            className={`w-32 transition-all duration-500 ${
                              order.progress > 50
                                ? "progress-green"
                                : "progress-blue"
                            }`}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredOrders.map((order) => {
                const progress = calculateProgress(order.timeActionPlan);
                return (
                  <Card key={order.id} className="h-full">
                    <CardContent className="p-4">
                      <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between mb-3">
                          <Badge
                            className={`${getStatusColor(order.status)} text-white text-xs`}
                          >
                            {order.status}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`${getStatusColor(order.orderState)} text-xs`}
                          >
                            {order.orderState}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`${getPriorityColor(order.priority)} text-xs`}
                          >
                            {order.priority}
                          </Badge>
                        </div>

                        <h3 className="text-lg font-bold mb-2 line-clamp-1">
                          {order.gptid}
                        </h3>

                        <div className="space-y-3 flex-1">
                          <div>
                            <p className="text-sm text-gray-600">Customer</p>
                            <p className="font-medium text-sm line-clamp-1">
                              {order.customer}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Fabric</p>
                            <p className="font-medium text-sm line-clamp-1">
                              {order.fabric}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Delivery</p>
                            <p className="font-medium text-sm">
                              {order.deliveryDate}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Quantity</p>
                            <p className="font-medium text-sm">
                              {order.quantity} {order.unit}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">
                              Progress
                            </span>
                            <span className="text-sm font-medium">
                              {progress}%
                            </span>
                          </div>
                          <Progress value={progress} className="mb-3" />
                        </div>

                        <div className="flex flex-col space-y-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-xs h-8"
                            onClick={() => handleViewOrder(order.id)}
                          >
                            View Details
                          </Button>
                          <div className="flex flex-col space-y-1">
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                // className="flex-1 text-xs h-8"
                                className={`flex-1 text-xs h-8 ${
                                  order.orderState === "Completed"
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }`}
                                onClick={() => handleEditOrder(order)}
                                disabled={order.orderState === "Completed"}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 text-xs h-8 text-red-600 hover:text-red-700"
                                onClick={() => handleDeleteOrder(order.id)}
                              >
                                Delete
                              </Button>
                            </div>
                            <Button
                              size="sm"
                              className="w-full text-xs h-8"
                              // onClick={() => setSelectedOrderForTA(order.id)}
                              onClick={() =>
                                setSelectedOrderForTAView(order.id)
                              }
                              disabled={
                                order.status === "Job Work" ||
                                order.orderState === "Completed"
                              }
                              variant={
                                order.status === "Job Work"
                                  ? "secondary"
                                  : "default"
                              }
                            >
                              {order.status === "Job Work"
                                ? "T&A Not Applicable"
                                : "T&A Plan"}
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setSelectedOrderForTAAdd(order.id)}
                              disabled={
                                order.status === "Job Work" ||
                                order.orderState === "Completed"
                              }
                            >
                              Add T&A Plan
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Order Form - Create */}
      <EnhancedOrderForm
        isOpen={isOrderFormOpen}
        setIsOpen={setIsOrderFormOpen}
        onSubmit={handleNewOrder}
        onCancel={() => setIsOrderFormOpen(false)}
        mode="create"
      />

      {/* Order Details View */}
      <OrderDetailsView
        isOpen={isOrderDetailsOpen}
        onClose={() => {
          setIsOrderDetailsOpen(false);
          setSelectedOrder(null);
          setSelectedOrderId(null);
        }}
        orderId={selectedOrderId}
      />

      {/* Enhanced Order Form - Edit */}
      <EnhancedOrderForm
        isOpen={isUpdateFormOpen}
        setIsOpen={setIsUpdateFormOpen}
        onSubmit={async () => {
          await fetchAndRefresh();
        }}
        onCancel={() => {
          setIsUpdateFormOpen(false);
          setSelectedOrder(null);
          setSelectedOrderId(null);
        }}
        mode="edit"
        orderId={selectedOrderId}
      />

      {/* T&A Plan Inline Form */}
      <InlineFormCard
        title="Time & Action Plan"
        isVisible={!!selectedOrderForTAView}
        onClose={() => setSelectedOrderForTAView(null)}
      >
        {selectedOrderForTAPlan && (
          <>
            {selectedOrderForTAPlan.selectedLooms &&
            selectedOrderForTAPlan.selectedLooms.length < 1 ? (
              <IndividualLoomTAPlan
                orderId={selectedOrderForTAPlan.id}
                customer={selectedOrderForTAPlan.customer}
                selectedLooms={selectedOrderForTAPlan.selectedLooms.map(
                  (loom: any) => ({
                    id: loom.id,
                    name: loom.name,
                  }),
                )}
                onSave={async () => {
                  await fetchAndRefresh();
                }}
                onProgressUpdate={async () => {
                  await fetchAndRefresh();
                }}
              />
            ) : (
              <InlineTimeActionPlan
                orderId={selectedOrderForTAPlan.id}
                customer={selectedOrderForTAPlan.customer}
                onSave={() => fetchAndRefresh()}
                onProgressUpdate={() => fetchAndRefresh()}
              />
            )}
          </>
        )}
      </InlineFormCard>

      <InlineFormCard
        title="Add Time & Action Plan"
        isVisible={!!selectedOrderForTAAdd}
        onClose={() => setSelectedOrderForTAAdd(null)}
      >
        {selectedOrderForTAAdd && (
          <InlineTimeActionPlanNew
            orderId={selectedOrderForTAAdd}
            customer={
              orders.find((o) => o.id === selectedOrderForTAAdd)?.customer || ""
            }
            // onSave={fetchAndRefresh}
            onSave={async () => {
              await fetchAndRefresh(); // refresh orders
              setSelectedOrderForTAAdd(null); // ✅ CLOSE PANEL
            }}
          />
        )}
      </InlineFormCard>

      {/* Material Status Dialog */}
      <MaterialStatus
        isOpen={isMaterialStatusOpen}
        onClose={() => setIsMaterialStatusOpen(false)}
      />

      {/* Customer Reports Dialog */}
      <CustomerReports
        isOpen={isCustomerReportOpen}
        onClose={() => setIsCustomerReportOpen(false)}
        orders={orders}
      />
    </div>
  );
}
