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
import { Filter, X } from "lucide-react";
import { loomOptionsApi } from "@/services/api2";

interface ProductionPlanFilterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: ProductionPlanFilters) => void;
  currentFilters: ProductionPlanFilters;
}

export interface ProductionPlanFilters {
  status?: string;
  loomtype?: string;
  priority?: string;
}

const statuses = ["Planning", "In Progress", "Completed", "Delayed"] as const;
const loomTypes = ["Rapier", "Airjet", "Sulzer"] as const;
const priorities = ["High", "Medium", "Low"] as const;

const filterLabels: Record<keyof ProductionPlanFilters, string> = {
  status: "Production Status",
  loomtype: "Loom Type",
  priority: "Priority",
};

export const ProductionPlanFilterDialog: React.FC<
  ProductionPlanFilterDialogProps
> = ({ isOpen, onClose, onApplyFilters, currentFilters }) => {
  const [filters, setFilters] =
    React.useState<ProductionPlanFilters>(currentFilters);
  const [allOptions, setAllOptions] = React.useState({
    loomTypes: [],
  });
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await loomOptionsApi.get("/loom-options");
        // console.log(response);
        // setWeavers(response.data.weaver);
        // setFilteredWeavers(response.data.weaver);
        setAllOptions({
          loomTypes: response.data.loomTypes || [],
          //   loomStatus: response.data.loomStatus || [],
          //   orders: response.data.orders || [],
        });
        setError("");
      } catch (err) {
        setError(err.response?.error || "Error fetching options");
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, []);
  React.useEffect(() => {
    if (!isOpen) return;
    setFilters(currentFilters);
  }, [currentFilters, isOpen]);

  const setFilterValue = (
    key: keyof ProductionPlanFilters,
    value: string | undefined,
  ) => {
    setFilters((prev) => {
      if (!value) {
        const { [key]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: value };
    });
  };

  const activeFilterCount = Object.keys(filters).length;

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({});
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filter Production Plans
          </DialogTitle>
          <DialogDescription>
            Select filters to narrow down the production plan list
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Production Status</Label>
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

            <div className="space-y-2">
              <Label>Loom Type</Label>
              <Select
                value={filters.loomtype ?? "all"}
                onValueChange={(value) =>
                  setFilterValue(
                    "loomtype",
                    value === "all" ? undefined : value,
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All loom types" />
                </SelectTrigger>
                {/* <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {loomTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent> */}
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {allOptions.loomTypes.map((item) => (
                    <SelectItem key={item.id} value={item.loomtype}>
                      {item.loomtype}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
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

                  const label =
                    filterLabels[key as keyof ProductionPlanFilters] ?? key;

                  return (
                    <Badge
                      key={key}
                      variant="secondary"
                      className="flex items-center gap-2"
                    >
                      {label}: {value}
                      <button
                        type="button"
                        onClick={() =>
                          setFilterValue(
                            key as keyof ProductionPlanFilters,
                            undefined,
                          )
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
