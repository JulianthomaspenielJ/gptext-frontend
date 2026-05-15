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
import { Calendar, Wrench, Clock, AlertTriangle } from "lucide-react";

interface MaintenanceSchedulerProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  loomId?: string;
  onSchedule: (data: any) => void;
}

export const MaintenanceScheduler: React.FC<MaintenanceSchedulerProps> = ({
  isOpen,
  setIsOpen,
  loomId = "",
  onSchedule,
}) => {
  const [formData, setFormData] = useState({
    loomId: loomId,
    maintenanceType: "",
    scheduledDate: "",
    estimatedDuration: "",
    priority: "medium",
    description: "",
    assignedTechnician: "",
    spareParts: "",
  });

  const looms = ["MK-1", "MK-2", "MK-3", "AJ-1", "AJ-2", "SZ-1", "SZ-2"];
  const maintenanceTypes = [
    "Preventive Maintenance",
    "Corrective Maintenance",
    "Predictive Maintenance",
    "Emergency Repair",
  ];
  const technicians = [
    "Vikram Patel",
    "Arjun Reddy",
    "Mohan Singh",
    "Prakash Rao",
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const maintenanceData = {
      ...formData,
      id: Date.now().toString(),
      createdDate: new Date().toISOString().split("T")[0],
      status: "Scheduled",
    };
    onSchedule(maintenanceData);
    setIsOpen(false);
    setFormData({
      loomId: "",
      maintenanceType: "",
      scheduledDate: "",
      estimatedDuration: "",
      priority: "medium",
      description: "",
      assignedTechnician: "",
      spareParts: "",
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600";
      case "medium":
        return "text-yellow-600";
      case "low":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Wrench className="mr-2 h-5 w-5" />
            Schedule Maintenance
          </DialogTitle>
          <DialogDescription>
            Schedule maintenance for loom equipment
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="loomId">Loom ID *</Label>
              <Select
                value={formData.loomId}
                onValueChange={(value) => handleInputChange("loomId", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select loom" />
                </SelectTrigger>
                <SelectContent>
                  {looms.map((loom) => (
                    <SelectItem key={loom} value={loom}>
                      {loom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="maintenanceType">Maintenance Type *</Label>
              <Select
                value={formData.maintenanceType}
                onValueChange={(value) =>
                  handleInputChange("maintenanceType", value)
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {maintenanceTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Scheduling Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="scheduledDate">Scheduled Date *</Label>
              <div className="relative">
                <Input
                  id="scheduledDate"
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) =>
                    handleInputChange("scheduledDate", e.target.value)
                  }
                  required
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <Label htmlFor="estimatedDuration">
                Estimated Duration (hours)
              </Label>
              <div className="relative">
                <Input
                  id="estimatedDuration"
                  type="number"
                  step="0.5"
                  value={formData.estimatedDuration}
                  onChange={(e) =>
                    handleInputChange("estimatedDuration", e.target.value)
                  }
                  placeholder="e.g., 4"
                />
                <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Priority and Assignment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <SelectItem value="low">
                    <span className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                      Low Priority
                    </span>
                  </SelectItem>
                  <SelectItem value="medium">
                    <span className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
                      Medium Priority
                    </span>
                  </SelectItem>
                  <SelectItem value="high">
                    <span className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                      High Priority
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="assignedTechnician">Assigned Technician</Label>
              <Select
                value={formData.assignedTechnician}
                onValueChange={(value) =>
                  handleInputChange("assignedTechnician", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select technician" />
                </SelectTrigger>
                <SelectContent>
                  {technicians.map((tech) => (
                    <SelectItem key={tech} value={tech}>
                      {tech}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description and Parts */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Describe the maintenance work to be performed"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="spareParts">Required Spare Parts</Label>
              <Textarea
                id="spareParts"
                value={formData.spareParts}
                onChange={(e) =>
                  handleInputChange("spareParts", e.target.value)
                }
                placeholder="List any spare parts or materials needed"
                rows={2}
              />
            </div>
          </div>

          {/* Priority Warning */}
          {formData.priority === "high" && (
            <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-sm text-red-700">
                High priority maintenance will require immediate attention and
                may impact production schedules.
              </span>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              <Wrench className="mr-2 h-4 w-4" />
              Schedule Maintenance
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
