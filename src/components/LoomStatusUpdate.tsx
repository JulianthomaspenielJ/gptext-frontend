import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loom } from "@/lib/loomStorage";
import { useToast } from "@/hooks/use-toast";
import { Factory, CheckCircle } from "lucide-react";

interface LoomStatusUpdateProps {
  isOpen: boolean;
  onClose: () => void;
  looms: Loom[];
  onStatusUpdate: (loomId: string, newStatus: string) => void;
}

export const LoomStatusUpdate: React.FC<LoomStatusUpdateProps> = ({
  isOpen,
  onClose,
  looms,
  onStatusUpdate,
}) => {
  const [selectedLooms, setSelectedLooms] = useState<string[]>([]);
  const [newStatus, setNewStatus] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleLoomToggle = (loomId: string, checked: boolean) => {
    if (checked) {
      setSelectedLooms((prev) => [...prev, loomId]);
    } else {
      setSelectedLooms((prev) => prev.filter((id) => id !== loomId));
    }
  };

  const handleSelectAll = () => {
    if (selectedLooms.length === looms.length) {
      setSelectedLooms([]);
    } else {
      setSelectedLooms(looms.map((loom) => loom.id));
    }
  };

  const handleSubmit = async () => {
    if (selectedLooms.length === 0) {
      toast({
        title: "Selection Required",
        description: "Please select at least one loom to update",
        variant: "destructive",
      });
      return;
    }

    if (!newStatus) {
      toast({
        title: "Status Required",
        description: "Please select a new status",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      selectedLooms.forEach((loomId) => {
        onStatusUpdate(loomId, newStatus);
      });

      toast({
        title: "Status Updated",
        description: `Successfully updated status for ${selectedLooms.length} loom(s) to ${newStatus}`,
      });

      setSelectedLooms([]);
      setNewStatus("");
      onClose();
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update loom status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Running":
        return "bg-green-500 text-white";
      case "Idle":
        return "bg-gray-500 text-white";
      case "Maintenance":
        return "bg-yellow-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Factory className="mr-2 h-5 w-5" />
            Update Loom Status
          </DialogTitle>
          <DialogDescription>
            Select looms and update their status in bulk
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Selection */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-3">New Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="newStatus">Select New Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Running">Running</SelectItem>
                    <SelectItem value="Idle">Idle</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={handleSelectAll}
                  className="w-full"
                >
                  {selectedLooms.length === looms.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
              </div>
            </div>
          </div>

          {/* Loom Selection */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-3">
              Select Looms ({selectedLooms.length} of {looms.length} selected)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
              {looms.map((loom) => (
                <div key={loom.id} className="bg-white p-3 rounded border">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedLooms.includes(loom.id)}
                      onCheckedChange={(checked) =>
                        handleLoomToggle(loom.id, checked as boolean)
                      }
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{loom.id}</span>
                        <Badge className={getStatusColor(loom.status)}>
                          {loom.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        {loom.type} | {loom.weaver || "Unassigned"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          {selectedLooms.length > 0 && newStatus && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-800 mb-2">
                Update Summary
              </h3>
              <p className="text-green-700">
                {selectedLooms.length} loom(s) will be updated to status:{" "}
                <strong>{newStatus}</strong>
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedLooms.map((loomId) => (
                  <Badge key={loomId} variant="outline" className="text-xs">
                    {loomId}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Updating...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Update Status
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
