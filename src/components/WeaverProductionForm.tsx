import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Users, Factory, Target, TrendingUp, Package } from "lucide-react";
import ENDPOINTS from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface Loom {
  id: string;
  name: string;
}
interface Weaver {
  orderId?: string;
  weaverId: string;
  gptId: string | string[];
  weaverName: string;
  assignedLooms: Loom[];
  totalTarget: number;
  efficiency: number;
  weaverNames?: string[];
  isOrderView?: boolean;
}

interface WeaverProductionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  weaver: Weaver;
  orderId?: string;
  gptId?: string | string[];
}

export const WeaverProductionForm: React.FC<WeaverProductionFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  weaver,
  gptId,
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    totalProduction: "",
    qualityIssues: "",
    downtime: "",
    downtimeReason: "",
    remarks: "",
    loomWiseProduction: {} as Record<string, string>,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (weaver) {
      // Initialize loom-wise production fields
      const loomProduction: Record<string, string> = {};
      weaver.assignedLooms.forEach((loom) => {
        loomProduction[loom.id] = "";
      });
      setFormData((prev) => ({
        ...prev,
        loomWiseProduction: loomProduction,
      }));
    }
  }, [weaver]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLoomProductionChange = (loomId: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      loomWiseProduction: {
        ...prev.loomWiseProduction,
        [loomId]: value,
      },
    }));
  };

  const calculateTotalFromLooms = () => {
    const total = Object.values(formData.loomWiseProduction).reduce(
      (sum, value) => sum + (parseFloat(value) || 0),
      0,
    );
    setFormData((prev) => ({
      ...prev,
      totalProduction: total.toString(),
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);

    const totalProd = parseFloat(formData.totalProduction) || 0;
    if (totalProd <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter valid production",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      // ONLY ENDPOINTS.updateProduction — NO fetch, NO axios, NO api
      const response = await ENDPOINTS.updateProduction({
        weaverId: weaver.weaverId,
        actualProduction: totalProd,
        shiftHours: formData.downtime ? null : 8,
        downtime: formData.downtime ? Number(formData.downtime) : null,
        downtimeReason: formData.downtimeReason || null,
        qualityIssues: formData.qualityIssues || null,
        additionalRemarks: formData.remarks || null,
        createdBy: null, // replace with real user
        date: formData.date,
        loomWiseProduction: formData.loomWiseProduction,
        // Compulsory fields for all production updates
        loomId: weaver.assignedLooms.map((loom) => loom.id),
        gpt_id: Array.isArray(weaver.gptId) ? weaver.gptId : [weaver.gptId],
        // order_id: weaver.orderId || (Array.isArray(weaver.gptId) ? weaver.gptId[0] : null)
        orderId: weaver.orderId,
      });

      if (!response.data) {
        const errorData = await response.data;
        throw new Error(errorData.error || "Failed to save");
      }

      toast({
        title: "Success",
        description: "Production saved successfully!",
      });
      onSubmit(formData);
      onClose();
    } catch (err: any) {
      console.error("Save failed:", err);
      const errorMessage =
        err.response?.data?.details ||
        err.response?.data?.message ||
        err.message ||
        "Failed to save production";
      toast({
        title: err.response?.data?.error || "Production Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!weaver) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg sm:text-xl">
            <Users className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            Record Production -{" "}
            {weaver.isOrderView
              ? Array.isArray(weaver.gptId)
                ? weaver.gptId.join(", ")
                : weaver.gptId
              : weaver.weaverName}
          </DialogTitle>
          <DialogDescription className="text-sm">
            Update daily production output for{" "}
            {weaver.isOrderView ? "order" : "weaver"} and assigned looms
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Weaver/Order Summary */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-3">
              {weaver.isOrderView ? "Weaver Details" : "Order Details"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {weaver.isOrderView ? (
                <>
                  <div>
                    <div className="flex items-center mb-2">
                      <Users className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm text-gray-600">Weaver</span>
                    </div>
                    <p className="font-medium">
                      {weaver.weaverNames
                        ? weaver.weaverNames.join(", ")
                        : weaver.weaverName}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <div className="flex items-center mb-2">
                      <Package className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm text-gray-600">Order</span>
                    </div>
                    <p className="font-medium">
                      {Array.isArray(weaver.gptId)
                        ? weaver.gptId.join(", ")
                        : weaver.gptId}
                    </p>
                  </div>
                </>
              )}
              <div>
                <div className="flex items-center mb-2">
                  <Factory className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm text-gray-600">Assigned Looms</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {weaver.assignedLooms.map((loom) => (
                    <Badge key={loom.id} variant="outline" className="text-xs">
                      {loom.name}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center mb-2">
                  <Target className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm text-gray-600">Target</span>
                </div>
                <p className="font-medium">{weaver.totalTarget}m</p>
              </div>
              <div>
                <div className="flex items-center mb-2">
                  <TrendingUp className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    Current Efficiency
                  </span>
                </div>
                <p className="font-medium text-green-600">
                  {weaver.efficiency}%
                </p>
              </div>
            </div>
          </div>

          {/* Production Recording */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-800 mb-3">
              Production Recording
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="totalProduction">
                  Actual Production (meters)
                </Label>
                <Input
                  id="totalProduction"
                  type="number"
                  value={formData.totalProduction}
                  onChange={(e) =>
                    handleInputChange("totalProduction", e.target.value)
                  }
                  placeholder="Enter total production"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={calculateTotalFromLooms}
                  className="w-full text-xs sm:text-sm h-8 sm:h-10"
                >
                  <span className="hidden xs:inline">Calculate from Looms</span>
                  <span className="xs:hidden">Calculate</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Loom-wise Production */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h3 className="font-semibold text-yellow-800 mb-3">
              Loom-wise Production
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {weaver.assignedLooms.map((loom) => (
                <div key={loom.id}>
                  <Label
                    htmlFor={`loom-${loom.id}`}
                    className="text-xs sm:text-sm"
                  >
                    {loom.name} Production (meters)
                  </Label>
                  <Input
                    id={`loom-${loom.id}`}
                    type="number"
                    value={formData.loomWiseProduction[loom.id] || ""}
                    onChange={(e) =>
                      handleLoomProductionChange(loom.id, e.target.value)
                    }
                    placeholder="Enter production"
                    className="text-xs sm:text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Quality and Issues */}
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h3 className="font-semibold text-red-800 mb-3">
              Quality & Issues
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="qualityIssues">Quality Issues</Label>
                <Textarea
                  id="qualityIssues"
                  value={formData.qualityIssues}
                  onChange={(e) =>
                    handleInputChange("qualityIssues", e.target.value)
                  }
                  placeholder="Any quality issues observed"
                  rows={3}
                />
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="downtime">Downtime (hours)</Label>
                  <Input
                    id="downtime"
                    type="number"
                    step="0.5"
                    value={formData.downtime}
                    onChange={(e) =>
                      handleInputChange("downtime", e.target.value)
                    }
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="downtimeReason">Downtime Reason</Label>
                  <Input
                    id="downtimeReason"
                    value={formData.downtimeReason}
                    onChange={(e) =>
                      handleInputChange("downtimeReason", e.target.value)
                    }
                    placeholder="Reason for downtime"
                  />
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="remarks">Additional Remarks</Label>
              <Textarea
                id="remarks"
                value={formData.remarks}
                onChange={(e) => handleInputChange("remarks", e.target.value)}
                placeholder="Any additional notes or observations"
                rows={2}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col xs:flex-row justify-end space-y-2 xs:space-y-0 xs:space-x-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full xs:w-auto text-xs sm:text-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full xs:w-auto text-xs sm:text-sm"
          >
            <span className="hidden xs:inline">Save Production Record</span>
            <span className="xs:hidden">Save Record</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
