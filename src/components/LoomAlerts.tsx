import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  Wrench,
  TrendingDown,
  X,
} from "lucide-react";

interface Alert {
  id: string;
  type: "warning" | "info" | "error";
  message: string;
  loomId: string;
  priority: "Critical" | "High" | "Medium" | "Low";
}

interface LoomAlertsProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: Alert[];
  onLoomAction?: (loomId: string, action: string) => void;
}

export const LoomAlerts: React.FC<LoomAlertsProps> = ({
  isOpen,
  onClose,
  alerts,
  onLoomAction,
}) => {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "info":
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-red-500 text-white";
      case "High":
        return "bg-orange-500 text-white";
      case "Medium":
        return "bg-yellow-500 text-white";
      case "Low":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case "error":
        return "border-red-200 bg-red-50";
      case "warning":
        return "border-yellow-200 bg-yellow-50";
      case "info":
        return "border-blue-200 bg-blue-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  const groupedAlerts = alerts.reduce(
    (acc, alert) => {
      if (!acc[alert.priority]) {
        acc[alert.priority] = [];
      }
      acc[alert.priority].push(alert);
      return acc;
    },
    {} as Record<string, Alert[]>,
  );

  const priorityOrder = ["Critical", "High", "Medium", "Low"];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5" />
                Loom Alerts & Notifications
              </DialogTitle>
              <DialogDescription>
                View maintenance schedules, performance alerts, and system
                notifications
              </DialogDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Alert Summary */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-3">Alert Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {priorityOrder.map((priority) => {
                const count = groupedAlerts[priority]?.length || 0;
                return (
                  <div key={priority} className="text-center">
                    <div className="text-2xl font-bold">{count}</div>
                    <Badge className={`${getPriorityColor(priority)} text-xs`}>
                      {priority}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alert Details */}
          {alerts.length === 0 ? (
            <div className="bg-green-50 p-8 rounded-lg border border-green-200 text-center">
              <div className="text-green-600 mb-4">
                <svg
                  className="h-16 w-16 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                All Clear!
              </h3>
              <p className="text-green-700">
                No alerts or notifications at this time. All looms are operating
                normally.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {priorityOrder.map((priority) => {
                const priorityAlerts = groupedAlerts[priority];
                if (!priorityAlerts || priorityAlerts.length === 0) return null;

                return (
                  <div key={priority} className="space-y-2">
                    <h3 className="font-semibold text-gray-800 flex items-center">
                      <Badge className={`${getPriorityColor(priority)} mr-2`}>
                        {priority}
                      </Badge>
                      {priorityAlerts.length} Alert(s)
                    </h3>
                    <div className="space-y-2">
                      {priorityAlerts.map((alert) => (
                        <div
                          key={alert.id}
                          className={`p-4 rounded-lg border ${getAlertTypeColor(alert.type)}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              {getAlertIcon(alert.type)}
                              <div className="flex-1">
                                <p className="font-medium text-gray-800">
                                  {alert.message}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  Loom: {alert.loomId}
                                </p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              {alert.type === "warning" &&
                                alert.message.includes("maintenance") && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      onLoomAction?.(
                                        alert.loomId,
                                        "schedule_maintenance",
                                      )
                                    }
                                  >
                                    <Wrench className="h-3 w-3 mr-1" />
                                    Schedule
                                  </Button>
                                )}
                              {alert.message.includes("efficiency") && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    onLoomAction?.(
                                      alert.loomId,
                                      "check_performance",
                                    )
                                  }
                                >
                                  <TrendingDown className="h-3 w-3 mr-1" />
                                  Check
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  onLoomAction?.(alert.loomId, "view_details")
                                }
                              >
                                View Details
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
