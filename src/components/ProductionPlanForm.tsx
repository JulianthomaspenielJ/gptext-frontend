import React, { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Save, Calendar, Factory, Plus } from "lucide-react";

interface ProductionPlanFormProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSave: (planData: any) => void;
}

const availableOrders = [
  {
    id: "BTC-101",
    customer: "Blue Ocean Textiles",
    quantity: 12000,
    fabric: "Cotton Twill",
  },
  {
    id: "VTS-205",
    customer: "Victory Fabrics Ltd",
    quantity: 8500,
    fabric: "Polyester Canvas",
  },
  {
    id: "FTC-309",
    customer: "Future Textile Corp",
    quantity: 6200,
    fabric: "Cotton Plain",
  },
  {
    id: "NTO-412",
    customer: "New Trends Outfitters",
    quantity: 15000,
    fabric: "Denim",
  },
];

const availableLooms = [
  { id: "MK-1", type: "Rapier", available: true, efficiency: 92 },
  { id: "MK-2", type: "Rapier", available: true, efficiency: 88 },
  { id: "MK-3", type: "Rapier", available: false, efficiency: 90 },
  { id: "AJ-1", type: "Airjet", available: false, efficiency: 0 },
  { id: "AJ-2", type: "Airjet", available: true, efficiency: 85 },
  { id: "SZ-1", type: "Sulzer", available: true, efficiency: 95 },
  { id: "SZ-2", type: "Sulzer", available: true, efficiency: 93 },
];

export const ProductionPlanForm: React.FC<ProductionPlanFormProps> = ({
  isOpen,
  setIsOpen,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    orderId: "",
    planName: "",
    startDate: "",
    endDate: "",
    estimatedDays: 0,
    selectedLooms: [] as string[],
    priority: "Medium",
    supervisor: "",
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Auto-calculate estimated days based on dates
    if (field === "startDate" || field === "endDate") {
      const start = new Date(field === "startDate" ? value : prev.startDate);
      const end = new Date(field === "endDate" ? value : prev.endDate);
      if (start && end && end > start) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setFormData((current) => ({
          ...current,
          estimatedDays: diffDays,
        }));
      }
    }
  };

  const handleLoomSelection = (loomId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      selectedLooms: checked
        ? [...prev.selectedLooms, loomId]
        : prev.selectedLooms.filter((id) => id !== loomId),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const selectedOrder = availableOrders.find(
        (o) => o.id === formData.orderId,
      );
      const planData = {
        ...formData,
        id: Date.now().toString(),
        customer: selectedOrder?.customer || "",
        quantity: selectedOrder?.quantity || 0,
        fabric: selectedOrder?.fabric || "",
        status: "Planning",
        progress: 0,
        createdDate: new Date().toISOString().split("T")[0],
      };

      onSave(planData);
      setIsOpen(false);
      setFormData({
        orderId: "",
        planName: "",
        startDate: "",
        endDate: "",
        estimatedDays: 0,
        selectedLooms: [],
        priority: "Medium",
        supervisor: "",
        notes: "",
      });
    } catch (error) {
      console.error("Error creating plan:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedOrder = availableOrders.find((o) => o.id === formData.orderId);
  const availableLoomsForSelection = availableLooms.filter((l) => l.available);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Plus className="mr-2 h-5 w-5" />
            Create New Production Plan
          </DialogTitle>
          <DialogDescription>
            Plan production schedule and assign looms for order execution
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Selection */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <Label htmlFor="orderId">Select Order *</Label>
            <Select
              value={formData.orderId}
              onValueChange={(value) => handleInputChange("orderId", value)}
              required
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Choose an order to plan" />
              </SelectTrigger>
              <SelectContent>
                {availableOrders.map((order) => (
                  <SelectItem key={order.id} value={order.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {order.id} - {order.customer}
                      </span>
                      <span className="text-sm text-gray-600">
                        {order.fabric} • {order.quantity.toLocaleString()}{" "}
                        meters
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedOrder && (
              <div className="mt-3 p-3 bg-white rounded border">
                <h4 className="font-medium mb-2">Order Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    Customer:{" "}
                    <span className="font-medium">
                      {selectedOrder.customer}
                    </span>
                  </div>
                  <div>
                    Quantity:{" "}
                    <span className="font-medium">
                      {selectedOrder.quantity.toLocaleString()}m
                    </span>
                  </div>
                  <div>
                    Fabric:{" "}
                    <span className="font-medium">{selectedOrder.fabric}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Plan Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="planName">Plan Name *</Label>
              <Input
                id="planName"
                value={formData.planName}
                onChange={(e) => handleInputChange("planName", e.target.value)}
                placeholder="e.g., Q2 Production Plan"
                required
              />
            </div>
            <div>
              <Label htmlFor="supervisor">Supervisor</Label>
              <Select
                value={formData.supervisor}
                onValueChange={(value) =>
                  handleInputChange("supervisor", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Assign supervisor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Production Manager">
                    Production Manager
                  </SelectItem>
                  <SelectItem value="Weaving Supervisor">
                    Weaving Supervisor
                  </SelectItem>
                  <SelectItem value="Shift Supervisor">
                    Shift Supervisor
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="startDate">Start Date *</Label>
              <div className="relative">
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    handleInputChange("startDate", e.target.value)
                  }
                  required
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <Label htmlFor="endDate">End Date *</Label>
              <div className="relative">
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange("endDate", e.target.value)}
                  required
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <Label htmlFor="estimatedDays">Estimated Days</Label>
              <Input
                id="estimatedDays"
                type="number"
                value={formData.estimatedDays}
                readOnly
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleInputChange("priority", value)}
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
          </div>

          {/* Loom Selection */}
          <div>
            <Label>Assign Looms *</Label>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableLoomsForSelection.map((loom) => (
                <div
                  key={loom.id}
                  className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                >
                  <Checkbox
                    id={loom.id}
                    checked={formData.selectedLooms.includes(loom.id)}
                    onCheckedChange={(checked) =>
                      handleLoomSelection(loom.id, checked as boolean)
                    }
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{loom.id}</span>
                      <Badge variant="outline">{loom.type}</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      Efficiency: {loom.efficiency}%
                    </div>
                  </div>
                  <Factory className="h-4 w-4 text-gray-400" />
                </div>
              ))}
            </div>
            {formData.selectedLooms.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                Selected {formData.selectedLooms.length} loom(s):{" "}
                {formData.selectedLooms.join(", ")}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Production Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Special instructions, quality requirements, or other notes"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || formData.selectedLooms.length === 0}
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating Plan...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Production Plan
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
