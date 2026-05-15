import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, User, X } from "lucide-react";
import { taskOptionsApi } from "@/services/api2";
import ENDPOINTS from "@/services/api";

export interface TaskFilters {
  status?: string;
  priority?: string;
  assignedto?: string;
  gptid?:string;
}

interface TaskFilterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: TaskFilters) => void;
  currentFilters: TaskFilters;
  assignees?: string[];
}

const statuses = ["Pending", "In Progress", "Completed"] as const;
const priorities = ["Low", "Medium", "High"] as const;


const filterLabels: Record<keyof TaskFilters, string> = {
  status: "Status",
  priority: "Priority",
  assignedto: "Assigned to",
  gptid:"GPT Id"
};

export const TaskFilterDialog: React.FC<TaskFilterDialogProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
  currentFilters,
  assignees,
}) => {
  const [filters, setFilters] = React.useState(currentFilters);
  const [employees, setEmployees] = React.useState([]);
    const [orders, setOrders] = React.useState([]);

  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    if (!isOpen) return;
    setFilters(currentFilters);
  }, [currentFilters, isOpen]);

  React.useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await taskOptionsApi.get("/task-options");
        const orderResponse = await ENDPOINTS.getOrdersList();
        // console.log(response);
        setEmployees(response.data.users);
        setOrders(orderResponse.data.orders);
        // setAllOptions({
        //   taskCategories: response.data.taskCategory || [],
        //   users: response.data.users || [],
        // });
        setError("");
      } catch (err) {
        setError(err.response?.error || "Error fetching options");
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, []);
  const setFilterValue = (
    key: keyof TaskFilters,
    value: string | undefined,
  ) => {
    setFilters((prev) => {
      if (!value) {
        const { [key]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: value };
    });

      // console.log(filters);

  };

  //   const availableAssignees = (
  //     assignees && assignees.length > 0 ? assignees : [...employees]
  //   ).filter((name) => name.trim().length > 0);

  const activeFilterCount = Object.keys(filters).length;

  const handleApply = () => {
    console.log(filters)
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({});
  };

  const employeeMap = React.useMemo(() => {
    return Object.fromEntries(employees.map((e) => [e.id, e]));
  }, [employees]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filter Tasks
          </DialogTitle>
          <DialogDescription>
            Select filters to narrow down the task list
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.status ?? "all"}
                onValueChange={(value) =>
                  setFilterValue("status", value === "all" ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={filters.priority ?? "all"}
                onValueChange={(value) =>
                  setFilterValue(
                    "priority",
                    value === "all" ? undefined : value,
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {priorities.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div> */}

            <div className="space-y-2">
              <Label>Assigned to</Label>
              <Select
                value={filters.assignedto ?? "all"}
                onValueChange={(value) =>
                  setFilterValue(
                    "assignedto",
                    value === "all" ? undefined : value,
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Anyone" />
                </SelectTrigger>
                {/* <SelectContent>
                  <SelectItem value="all">Anyone</SelectItem>
                  {availableAssignees.map((employee) => (
                    <SelectItem key={employee} value={employee}>
                      {employee}
                    </SelectItem>
                  ))}
                </SelectContent> */}
                <SelectContent>
                  <SelectItem value="all">Anyone</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      <div className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <div>
                          <div className="font-medium">{employee.name}</div>
                          <div className="text-sm text-gray-500">
                            {employee.role}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>GPT Id</Label>
              <Select
                value={filters.gptid ?? "all"}
                onValueChange={(value) =>
                  setFilterValue("gptid", value === "allorders" ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Orders" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="allorders">All Orders</SelectItem>
                  {orders.map((order) => (
                    <SelectItem key={order.gptid} value={order.gptid}>
                      <div className="flex items-center">
                        <div>
                          <div className="font-medium">{order.gptid}</div>
                          <div className="text-sm text-gray-500">
                            {order.customername}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {activeFilterCount > 0 && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-blue-900">
                  Active Filters ({activeFilterCount})
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(filters).map(([key, value]) => {
                  if (!value) return null;
                  const label = filterLabels[key as keyof TaskFilters] ?? key;

                  return (
                    <Badge
                      key={key}
                      variant="secondary"
                      className="flex items-center gap-2"
                    >
                      {/* {label}: {value} */}
                      {label}:{" "}
                      {key === "assignedto"
                        ? (employeeMap[value]?.name ?? value)
                        : value}
                      <button
                        type="button"
                        onClick={() =>
                          setFilterValue(key as keyof TaskFilters, undefined)
                        }
                        className="ml-1 hover:opacity-70"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={activeFilterCount === 0}
          >
            Reset
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleApply}>
            Apply Filters
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
