import React, { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Save, AlertTriangle, CheckCircle } from "lucide-react";
import ENDPOINTS from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface ProductionRecordFormProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  loomId: string;
  loomName: string;
  weaverId: string;
  gptId: string;
  targetProduction: number;
  currentProduction: number;
  orderId: string;
  onSubmit: (data: any) => void;
  selectedDate: string;
}

export const ProductionRecordForm: React.FC<ProductionRecordFormProps> = ({
  isOpen,
  setIsOpen,
  loomId,
  loomName,
  weaverId,
  gptId,
  targetProduction,
  currentProduction,
  orderId,
  onSubmit,
  selectedDate
  
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    loomId: loomId,
    weaverId: weaverId,
    actualProduction: currentProduction,
    downtime: 0,
    downtimeReason: "",
    qualityIssues: "",
    operatorNotes: "",
    shiftHours: 8,
    efficiency: 0,
    operatornotes: "",
    createdby: null
  });

  const calculateEfficiency = () => {
    if (targetProduction > 0) {
      return Math.round((formData.actualProduction / targetProduction) * 100);
    }
    return 0;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "actualProduction") {
        updated.efficiency = calculateEfficiency();
      }
      return updated;
    });
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!formData.actualProduction || formData.actualProduction <= 0) {
    toast({
      title: "Validation Error",
      description: "Please enter actual production",
      variant: "destructive",
    });
    return;
  }

  setLoading(true);
  try {


    // This one tiny cast removes the TS warning while keeping your exact style
    await (ENDPOINTS.updateProduction as any)({
      loomId,
      weaverId,
      orderId,
      gptId,
      actualProduction: Number(formData.actualProduction),
      shiftHours: formData.shiftHours || null,
      downtime: formData.downtime || null,
      downtimeReason: formData.downtimeReason || null,
      qualityIssues: formData.qualityIssues || null,
      additionalRemarks: formData.operatorNotes || null,
      date: selectedDate,
    });

    onSubmit(formData);     // refreshes dashboard
    setIsOpen(false);       // closes modal
  } catch (err: any) {
    console.error(err);
    const errorMessage = err.response?.data?.details || err.response?.data?.message || err.message || "Server error";
    toast({
      title: err.response?.data?.error || "Production Update Failed",
      description: errorMessage,
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};
  const currentEfficiency = calculateEfficiency();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg sm:text-xl">
            <Save className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            Record Production - {loomName}
          </DialogTitle>
          <DialogDescription className="text-sm">
            Record actual production output and any issues for {gptId}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Production Summary */}
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Target</p>
                <p className="text-lg sm:text-xl font-bold text-blue-600">
                  {targetProduction}m
                </p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Actual</p>
                <p className="text-lg sm:text-xl font-bold text-green-600">
                  {formData.actualProduction}m
                </p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Efficiency</p>
                <div className="text-lg sm:text-xl font-bold">
                  <Badge
                    className={
                      currentEfficiency >= 90
                        ? "bg-green-500 text-white"
                        : currentEfficiency >= 80
                          ? "bg-yellow-500 text-white"
                          : "bg-red-500 text-white"
                    }
                  >
                    {currentEfficiency}%
                  </Badge>
                </div>
              </div>
            </div>
            <Progress value={currentEfficiency} className="mt-4" />
          </div>

          {/* Production Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="actualProduction">
                Actual Production (meters)*
              </Label>
              <Input
                id="actualProduction"
                type="number"
                value={formData.actualProduction}
                onChange={(e) =>
                  handleInputChange("actualProduction", Number(e.target.value))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="shiftHours">Shift Hours</Label>
              <Input
                id="shiftHours"
                type="number"
                step="0.5"
                value={formData.shiftHours}
                onChange={(e) =>
                  handleInputChange("shiftHours", Number(e.target.value))
                }
              />
            </div>
            <div>
              <Label htmlFor="downtime">Downtime (minutes)</Label>
              <Input
                id="downtime"
                type="number"
                value={formData.downtime}
                onChange={(e) =>
                  handleInputChange("downtime", Number(e.target.value))
                }
              />
            </div>
            <div>
              <Label htmlFor="downtimeReason">Downtime Reason</Label>
              <Select
                value={formData.downtimeReason}
                onValueChange={(value) =>
                  handleInputChange("downtimeReason", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Downtime</SelectItem>
                  <SelectItem value="maintenance">
                    Scheduled Maintenance
                  </SelectItem>
                  <SelectItem value="breakdown">Machine Breakdown</SelectItem>
                  <SelectItem value="material">Material Issue</SelectItem>
                  <SelectItem value="power">Power Issue</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quality and Notes */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="qualityIssues">Quality Issues (if any)</Label>
              <Textarea
                id="qualityIssues"
                value={formData.qualityIssues}
                onChange={(e) =>
                  handleInputChange("qualityIssues", e.target.value)
                }
                placeholder="Describe any quality issues encountered"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="operatorNotes">Operator Notes</Label>
              <Textarea
                id="operatorNotes"
                value={formData.operatorNotes}
                onChange={(e) =>
                  handleInputChange("operatorNotes", e.target.value)
                }
                placeholder="Additional notes or observations"
                rows={2}
              />
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center space-x-4">
            {currentEfficiency >= 100 && (
              <div className="flex items-center text-green-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                <span className="text-sm">Target Exceeded!</span>
              </div>
            )}
            {currentEfficiency < 80 && (
              <div className="flex items-center text-red-600">
                <AlertTriangle className="h-4 w-4 mr-1" />
                <span className="text-sm">Below Expected Performance</span>
              </div>
            )}
          </div>

          <div className="flex flex-col xs:flex-row justify-end space-y-2 xs:space-y-0 xs:space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="w-full xs:w-auto text-xs sm:text-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="w-full xs:w-auto text-xs sm:text-sm"
              disabled={loading}
            >
              <Save className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Save Production Record</span>
              <span className="xs:hidden">Save Record</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
