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
import { Progress } from "@/components/ui/progress";
import { Save, Factory, Calendar } from "lucide-react";

interface LoomData {
  id: string;
  type: string;
  status: string;
  efficiency: number;
  currentOrder: string | null;
  nextMaintenance: string;
  location: string;
  manufacturer?: string;
  model?: string;
  installDate?: string;
  lastMaintenance?: string;
  notes?: string;
}

interface LoomDetailsFormProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  loom: LoomData | null;
  mode: "view" | "edit" | "add";
  onSave: (loomData: LoomData) => void;
}

export const LoomDetailsForm: React.FC<LoomDetailsFormProps> = ({
  isOpen,
  setIsOpen,
  loom,
  mode,
  onSave,
}) => {
  const [formData, setFormData] = useState<LoomData>({
    id: loom?.id || "",
    type: loom?.type || "",
    status: loom?.status || "Idle",
    efficiency: loom?.efficiency || 0,
    currentOrder: loom?.currentOrder || null,
    nextMaintenance: loom?.nextMaintenance || "",
    location: loom?.location || "",
    manufacturer: loom?.manufacturer || "",
    model: loom?.model || "",
    installDate: loom?.installDate || "",
    lastMaintenance: loom?.lastMaintenance || "",
    notes: loom?.notes || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof LoomData, value: any) => {
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
      console.error("Error saving loom:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Running":
        return "bg-green-500 text-white";
      case "Maintenance":
        return "bg-yellow-500 text-white";
      case "Idle":
        return "bg-gray-500 text-white";
      default:
        return "bg-red-500 text-white";
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "add":
        return "Add New Loom";
      case "edit":
        return `Edit Loom ${formData.id}`;
      default:
        return `Loom ${formData.id} Details`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Factory className="mr-2 h-5 w-5" />
            {getTitle()}
          </DialogTitle>
          <DialogDescription>
            {mode === "view"
              ? "View loom details and current status"
              : mode === "edit"
                ? "Update loom information and settings"
                : "Add a new loom to the production floor"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Status Overview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Loom ID</p>
                <p className="text-lg font-bold">{formData.id}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Status</p>
                <Badge className={getStatusColor(formData.status)}>
                  {formData.status}
                </Badge>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Efficiency</p>
                <p className="text-lg font-bold">{formData.efficiency}%</p>
                <Progress value={formData.efficiency} className="mt-1" />
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Current Order</p>
                <p className="text-lg font-bold">
                  {formData.currentOrder || "None"}
                </p>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="id">Loom ID *</Label>
              <Input
                id="id"
                value={formData.id}
                onChange={(e) => handleInputChange("id", e.target.value)}
                disabled={mode === "view" || (mode === "edit" && loom?.id)}
                required
                placeholder="e.g., MK-5"
              />
            </div>
            <div>
              <Label htmlFor="type">Loom Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleInputChange("type", value)}
                disabled={mode === "view"}
                required
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
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange("status", value)}
                disabled={mode === "view"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Running">Running</SelectItem>
                  <SelectItem value="Idle">Idle</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Breakdown">Breakdown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                disabled={mode === "view"}
                placeholder="e.g., Section A"
              />
            </div>
            <div>
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) =>
                  handleInputChange("manufacturer", e.target.value)
                }
                disabled={mode === "view"}
                placeholder="e.g., Toyota"
              />
            </div>
            <div>
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => handleInputChange("model", e.target.value)}
                disabled={mode === "view"}
                placeholder="e.g., JAT610"
              />
            </div>
          </div>

          {/* Performance and Maintenance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="efficiency">Current Efficiency (%)</Label>
              <Input
                id="efficiency"
                type="number"
                min="0"
                max="100"
                value={formData.efficiency}
                onChange={(e) =>
                  handleInputChange("efficiency", Number(e.target.value))
                }
                disabled={mode === "view"}
              />
            </div>
            <div>
              <Label htmlFor="currentOrder">Current Order</Label>
              <Input
                id="currentOrder"
                value={formData.currentOrder || ""}
                onChange={(e) =>
                  handleInputChange("currentOrder", e.target.value || null)
                }
                disabled={mode === "view"}
                placeholder="e.g., BTC-101"
              />
            </div>
            <div>
              <Label htmlFor="installDate">Install Date</Label>
              <div className="relative">
                <Input
                  id="installDate"
                  type="date"
                  value={formData.installDate}
                  onChange={(e) =>
                    handleInputChange("installDate", e.target.value)
                  }
                  disabled={mode === "view"}
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <Label htmlFor="lastMaintenance">Last Maintenance</Label>
              <div className="relative">
                <Input
                  id="lastMaintenance"
                  type="date"
                  value={formData.lastMaintenance}
                  onChange={(e) =>
                    handleInputChange("lastMaintenance", e.target.value)
                  }
                  disabled={mode === "view"}
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="nextMaintenance">Next Maintenance Date</Label>
            <div className="relative">
              <Input
                id="nextMaintenance"
                type="date"
                value={formData.nextMaintenance}
                onChange={(e) =>
                  handleInputChange("nextMaintenance", e.target.value)
                }
                disabled={mode === "view"}
                required
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              disabled={mode === "view"}
              placeholder="Additional notes about the loom"
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
            {mode !== "view" && (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {mode === "add" ? "Add Loom" : "Save Changes"}
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
