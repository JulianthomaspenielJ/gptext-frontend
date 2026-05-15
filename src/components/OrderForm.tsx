import { useState } from "react";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar, Calculator, Plus, X, RefreshCw } from "lucide-react";
import { generateOrderNumber } from "@/lib/orderNumberGenerator";
import {
  calculateProductionPerDayPerLoom,
  parseYarnCount,
  formatProduction,
  validateProductionInputs,
} from "@/lib/productionCalculations";

interface OrderFormProps {
  onSubmit: (orderData: any) => void;
  onCancel: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const OrderForm: React.FC<OrderFormProps> = ({
  onSubmit,
  onCancel,
  isOpen,
  setIsOpen,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    orderNo: generateOrderNumber(),
    customer: "",
    buyerPO: "",
    fabric: "",
    construction: "",
    gsm: "",
    width: "",
    quantity: "",
    rate: "",
    deliveryDate: "",
    warpYarnCount: "",
    weftYarnCount: "",
    warpCrimp: "",
    loomType: "",
    remarks: "",
    productionPerDayPerLoom: "", // New field for calculated production
  });

  const [calculatedProduction, setCalculatedProduction] = useState<number>(0);

  const [availableLooms, setAvailableLooms] = useState([
    {
      id: "MK-1",
      type: "Rapier",
      available: true,
      efficiency: 92,
      maxRPM: 180,
      width: 200,
    },
    {
      id: "MK-2",
      type: "Rapier",
      available: true,
      efficiency: 88,
      maxRPM: 175,
      width: 200,
    },
    {
      id: "AJ-1",
      type: "Airjet",
      available: false,
      efficiency: 0,
      maxRPM: 250,
      width: 220,
    },
    {
      id: "AJ-2",
      type: "Airjet",
      available: true,
      efficiency: 85,
      maxRPM: 240,
      width: 220,
    },
    {
      id: "SZ-1",
      type: "Sulzer",
      available: true,
      efficiency: 95,
      maxRPM: 200,
      width: 190,
    },
  ]);

  const calculateProduction = (
    warpYarnCount: string,
    loomType: string,
    width: string,
  ) => {
    if (!warpYarnCount || !loomType || !width) {
      return 0;
    }

    // Get loom specifications based on type
    const loomSpecs = availableLooms.find((loom) => loom.type === loomType);
    if (!loomSpecs) return 0;

    const warpCount = parseYarnCount(warpYarnCount);
    const loomWidth = parseFloat(width) || 0;
    const loomSpeed = loomSpecs.maxRPM || 150; // Default speed if not available

    if (warpCount === 0 || loomWidth === 0) return 0;

    return calculateProductionPerDayPerLoom(loomSpeed, warpCount, loomWidth);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Auto-suggest loom type based on yarn and quantity
    if (field === "warpYarnCount" || field === "quantity") {
      suggestLoomType();
    }

    // Calculate production when relevant fields change
    if (
      field === "warpYarnCount" ||
      field === "loomType" ||
      field === "width"
    ) {
      const newFormData = { ...formData, [field]: value };
      const production = calculateProduction(
        newFormData.warpYarnCount,
        newFormData.loomType,
        newFormData.width,
      );
      setCalculatedProduction(production);
      setFormData((prev) => ({
        ...prev,
        [field]: value,
        productionPerDayPerLoom: formatProduction(production),
      }));
    }
  };

  const suggestLoomType = () => {
    const quantity = parseFloat(formData.quantity);
    const warpCount = parseFloat(formData.warpYarnCount);

    if (quantity > 10000) {
      setFormData((prev) => ({ ...prev, loomType: "Airjet" }));
    } else if (warpCount > 20) {
      setFormData((prev) => ({ ...prev, loomType: "Sulzer" }));
    } else {
      setFormData((prev) => ({ ...prev, loomType: "Rapier" }));
    }
  };

  const calculateRequiredLooms = () => {
    const quantity = parseFloat(formData.quantity) || 0;
    const targetDays = 15; // Default production timeline
    const dailyOutput = 800; // Average daily output per loom
    return Math.ceil(quantity / (targetDays * dailyOutput));
  };

  const getFilteredLooms = () => {
    return availableLooms.filter(
      (loom) => loom.type === formData.loomType && loom.available,
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const requiredLooms = calculateRequiredLooms();
      const orderData = {
        ...formData,
        id: `GPT-${Date.now().toString().slice(-3)}`,
        orderDate: new Date().toLocaleDateString("en-GB"),
        status: "Planning",
        progress: 0,
        requiredLooms,
        estimatedDays: Math.ceil(
          parseFloat(formData.quantity) / (800 * requiredLooms),
        ),
      };
      onSubmit(orderData);
      setIsOpen(false);
      setFormData({
        orderNo: "",
        customer: "",
        buyerPO: "",
        fabric: "",
        construction: "",
        gsm: "",
        width: "",
        quantity: "",
        rate: "",
        deliveryDate: "",
        warpYarnCount: "",
        weftYarnCount: "",
        warpCrimp: "",
        loomType: "",
        remarks: "",
        productionPerDayPerLoom: "",
      });
      setCalculatedProduction(0);
    } catch (error) {
      console.error("Error creating order:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Plus className="mr-2 h-5 w-5" />
            New Production Order
          </DialogTitle>
          <DialogDescription>
            Create a new production order with technical specifications and
            planning details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Order Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="orderNo">Order Number</Label>
                <div className="flex space-x-2">
                  <Input
                    id="orderNo"
                    value={formData.orderNo}
                    onChange={(e) =>
                      handleInputChange("orderNo", e.target.value)
                    }
                    placeholder="Auto-generated"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleInputChange("orderNo", generateOrderNumber())
                    }
                    className="px-3"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="customer">Customer *</Label>
                <Input
                  id="customer"
                  value={formData.customer}
                  onChange={(e) =>
                    handleInputChange("customer", e.target.value)
                  }
                  placeholder="Customer name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="buyerPO">Buyer PO No</Label>
                <Input
                  id="buyerPO"
                  value={formData.buyerPO}
                  onChange={(e) => handleInputChange("buyerPO", e.target.value)}
                  placeholder="Buyer PO number"
                />
              </div>
              <div>
                <Label htmlFor="deliveryDate">Delivery Date *</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) =>
                    handleInputChange("deliveryDate", e.target.value)
                  }
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Fabric Specifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fabric Specifications</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="fabric">Fabric Type *</Label>
                <Select
                  onValueChange={(value) => handleInputChange("fabric", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select fabric type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plain">Plain</SelectItem>
                    <SelectItem value="twill">Twill</SelectItem>
                    <SelectItem value="sateen">Sateen</SelectItem>
                    <SelectItem value="duck">Duck</SelectItem>
                    <SelectItem value="herringbone">
                      H/B (Herringbone)
                    </SelectItem>
                    <SelectItem value="tc">T/C (Polycotton)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="construction">Construction *</Label>
                <Input
                  id="construction"
                  value={formData.construction}
                  onChange={(e) =>
                    handleInputChange("construction", e.target.value)
                  }
                  placeholder="e.g., 40x40x70"
                  required
                />
              </div>
              <div>
                <Label htmlFor="gsm">GSM</Label>
                <Input
                  id="gsm"
                  value={formData.gsm}
                  onChange={(e) => handleInputChange("gsm", e.target.value)}
                  placeholder="Grams per sq meter"
                />
              </div>
              <div>
                <Label htmlFor="width">Width (inches)</Label>
                <Input
                  id="width"
                  value={formData.width}
                  onChange={(e) => handleInputChange("width", e.target.value)}
                  placeholder="Fabric width"
                />
              </div>
            </CardContent>
          </Card>

          {/* Production Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Production Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="quantity">Quantity (meters) *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) =>
                    handleInputChange("quantity", e.target.value)
                  }
                  placeholder="Production quantity"
                  required
                />
              </div>
              <div>
                <Label htmlFor="rate">Rate (per meter)</Label>
                <Input
                  id="rate"
                  type="number"
                  step="0.01"
                  value={formData.rate}
                  onChange={(e) => handleInputChange("rate", e.target.value)}
                  placeholder="Rate per meter"
                />
              </div>
              <div>
                <Label htmlFor="warpYarnCount">Warp Yarn Count</Label>
                <Input
                  id="warpYarnCount"
                  value={formData.warpYarnCount}
                  onChange={(e) =>
                    handleInputChange("warpYarnCount", e.target.value)
                  }
                  placeholder="e.g., 40s"
                />
              </div>
              <div>
                <Label htmlFor="weftYarnCount">Weft Yarn Count</Label>
                <Input
                  id="weftYarnCount"
                  value={formData.weftYarnCount}
                  onChange={(e) =>
                    handleInputChange("weftYarnCount", e.target.value)
                  }
                  placeholder="e.g., 40s"
                />
              </div>
              <div>
                <Label htmlFor="productionPerDayPerLoom">
                  Production/Day/Loom (meters)
                </Label>
                <div className="relative">
                  <Input
                    id="productionPerDayPerLoom"
                    value={formData.productionPerDayPerLoom}
                    readOnly
                    className="bg-gray-50"
                    placeholder="Auto-calculated"
                  />
                  <Calculator className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                </div>
                {calculatedProduction > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    Formula: (Speed × 60 × 24 × 0.65) ÷ (39.36 × Warp Count) ×
                    Width
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Loom Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Calculator className="mr-2 h-5 w-5" />
                Loom Planning
              </CardTitle>
              <CardDescription>
                Based on yarn type and quantity, the system suggests optimal
                loom type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="loomType">Suggested Loom Type</Label>
                  <Select
                    value={formData.loomType}
                    onValueChange={(value) =>
                      handleInputChange("loomType", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select loom type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Rapier">Rapier</SelectItem>
                      <SelectItem value="Airjet">Airjet</SelectItem>
                      <SelectItem value="Sulzer">Sulzer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Required Looms</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="outline" className="text-lg px-3 py-1">
                      {calculateRequiredLooms()} looms
                    </Badge>
                    <span className="text-sm text-gray-500">
                      for{" "}
                      {Math.ceil(
                        parseFloat(formData.quantity) /
                          (800 * calculateRequiredLooms()),
                      )}{" "}
                      days
                    </span>
                  </div>
                </div>
              </div>

              {formData.loomType && (
                <div className="mt-4">
                  <Label>Available {formData.loomType} Looms</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                    {getFilteredLooms().map((loom) => (
                      <Card key={loom.id} className="border-2">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{loom.id}</span>
                            <Badge
                              className={
                                loom.available
                                  ? "bg-green-500 text-white"
                                  : "bg-red-500 text-white"
                              }
                            >
                              {loom.available ? "Available" : "Busy"}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            Efficiency: {loom.efficiency}%
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  value={formData.remarks}
                  onChange={(e) => handleInputChange("remarks", e.target.value)}
                  placeholder="Any special instructions or remarks"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Order
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
