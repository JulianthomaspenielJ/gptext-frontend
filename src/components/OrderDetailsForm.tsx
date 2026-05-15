import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Save, Package, Calendar, User } from "lucide-react";

interface OrderData {
  id: string;
  customer: string;
  fabric: string;
  construction: string;
  quantity: number;
  unit: string;
  orderDate: string;
  deliveryDate: string;
  status: string;
  progress: number;
  priority: string;
  rate?: number;
  buyerPO?: string;
  gsm?: string;
  width?: string;
  remarks?: string;
}

interface OrderDetailsFormProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  order: OrderData | null;
  mode: "view" | "edit";
  onSave: (orderData: OrderData) => void;
}

export const OrderDetailsForm: React.FC<OrderDetailsFormProps> = ({
  isOpen,
  setIsOpen,
  order,
  mode,
  onSave,
}) => {
  const [formData, setFormData] = useState<OrderData>({
    id: order?.id || "",
    customer: order?.customer || "",
    fabric: order?.fabric || "",
    construction: order?.construction || "",
    quantity: order?.quantity || 0,
    unit: order?.unit || "meters",
    orderDate: order?.orderDate || "",
    deliveryDate: order?.deliveryDate || "",
    status: order?.status || "Planning",
    progress: order?.progress || 0,
    priority: order?.priority || "Medium",
    rate: order?.rate || 0,
    buyerPO: order?.buyerPO || "",
    gsm: order?.gsm || "",
    width: order?.width || "",
    remarks: order?.remarks || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form data when order prop changes
  useEffect(() => {
    if (order) {
      setFormData({
        id: order.id || "",
        customer: order.customer || "",
        fabric: order.fabric || "",
        construction: order.construction || "",
        quantity: order.quantity || 0,
        unit: order.unit || "meters",
        orderDate: order.orderDate || "",
        deliveryDate: order.deliveryDate || "",
        status: order.status || "Planning",
        progress: order.progress || 0,
        priority: order.priority || "Medium",
        rate: order.rate || 0,
        buyerPO: order.buyerPO || "",
        gsm: order.gsm || "",
        width: order.width || "",
        remarks: order.remarks || "",
      });
    }
  }, [order]);

  const handleInputChange = (field: keyof OrderData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      onSave(formData);
      setIsOpen(false);
    } catch (error) {
      console.error("Error saving order:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Package className="mr-2 h-5 w-5" />
            {mode === "edit"
              ? `Edit Order ${formData.id}`
              : `Order ${formData.id} Details`}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update order information and specifications"
              : "View order details and current status"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Status Overview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Order ID</p>
                <p className="text-lg font-bold">{formData.id}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Status</p>
                <Badge className={getStatusColor(formData.status)}>
                  {formData.status}
                </Badge>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Progress</p>
                <p className="text-lg font-bold">{formData.progress}%</p>
                <Progress value={formData.progress} className="mt-1" />
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Priority</p>
                <Badge
                  variant="outline"
                  className={getPriorityColor(formData.priority)}
                >
                  {formData.priority}
                </Badge>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer">Customer *</Label>
              <div className="relative">
                <Input
                  id="customer"
                  value={formData.customer}
                  onChange={(e) =>
                    handleInputChange("customer", e.target.value)
                  }
                  disabled={mode === "view"}
                  required
                />
                <User className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <Label htmlFor="buyerPO">Buyer PO</Label>
              <Input
                id="buyerPO"
                value={formData.buyerPO}
                onChange={(e) => handleInputChange("buyerPO", e.target.value)}
                disabled={mode === "view"}
              />
            </div>
            <div>
              <Label htmlFor="orderDate">Order Date</Label>
              <div className="relative">
                <Input
                  id="orderDate"
                  type="date"
                  value={formData.orderDate}
                  onChange={(e) =>
                    handleInputChange("orderDate", e.target.value)
                  }
                  disabled={mode === "view"}
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <Label htmlFor="deliveryDate">Delivery Date *</Label>
              <div className="relative">
                <Input
                  id="deliveryDate"
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) =>
                    handleInputChange("deliveryDate", e.target.value)
                  }
                  disabled={mode === "view"}
                  required
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Fabric Specifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fabric">Fabric Type *</Label>
              <Input
                id="fabric"
                value={formData.fabric}
                onChange={(e) => handleInputChange("fabric", e.target.value)}
                disabled={mode === "view"}
                required
              />
            </div>
            <div>
              <Label htmlFor="construction">Construction *</Label>
              <Input
                id="construction"
                value={formData.construction}
                onChange={(e) =>
                  handleInputChange("construction", e.target.value)
                }
                disabled={mode === "view"}
                required
              />
            </div>
            <div>
              <Label htmlFor="gsm">GSM</Label>
              <Input
                id="gsm"
                value={formData.gsm}
                onChange={(e) => handleInputChange("gsm", e.target.value)}
                disabled={mode === "view"}
              />
            </div>
            <div>
              <Label htmlFor="width">Width</Label>
              <Input
                id="width"
                value={formData.width}
                onChange={(e) => handleInputChange("width", e.target.value)}
                disabled={mode === "view"}
              />
            </div>
          </div>

          {/* Quantity and Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) =>
                  handleInputChange("quantity", Number(e.target.value))
                }
                disabled={mode === "view"}
                required
              />
            </div>
            <div>
              <Label htmlFor="unit">Unit</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => handleInputChange("unit", value)}
                disabled={mode === "view"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meters">Meters</SelectItem>
                  <SelectItem value="yards">Yards</SelectItem>
                  <SelectItem value="pieces">Pieces</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="rate">Rate per unit</Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                value={formData.rate}
                onChange={(e) =>
                  handleInputChange("rate", Number(e.target.value))
                }
                disabled={mode === "view"}
              />
            </div>
          </div>

          {/* Status and Progress */}
          {mode === "edit" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planning">Planning</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    handleInputChange("priority", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="progress">Progress (%)</Label>
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) =>
                    handleInputChange("progress", Number(e.target.value))
                  }
                />
              </div>
            </div>
          )}

          {/* Remarks */}
          <div>
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) => handleInputChange("remarks", e.target.value)}
              disabled={mode === "view"}
              placeholder="Additional notes about the order"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              {mode === "view" ? "Close" : "Cancel"}
            </Button>
            {mode === "edit" && (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
