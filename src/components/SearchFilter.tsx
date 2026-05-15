import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Search, Filter, X } from "lucide-react";

interface SearchFilterProps {
  onSearch: (query: string) => void;
  onFilter: (filters: any) => void;
  onClearFilters: () => void;
  filterOptions?: {
    status?: string[];
    type?: string[];
    priority?: string[];
    dateRange?: boolean;
    [key: string]: any;
  };
  placeholder?: string;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  onSearch,
  onFilter,
  onClearFilters,
  filterOptions = {},
  placeholder = "Search...",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<any>({});

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch(query);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const clearSpecificFilter = (key: string) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    setFilters(newFilters);
  };

  const applyFilters = () => {
    onFilter(filters);
    setIsFilterOpen(false);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery("");
    onClearFilters();
    setIsFilterOpen(false);
  };

  const hasActiveFilters = Object.keys(filters).some((key) => filters[key]);

  return (
    <div className="flex flex-col xs:flex-row space-y-2 xs:space-y-0 xs:space-x-2">
      {/* Search Input */}
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-2 xs:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 xs:h-4 xs:w-4 text-gray-500" />
        <Input
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-8 xs:pl-10 text-xs xs:text-sm h-8 xs:h-10"
        />
      </div>

      <div className="flex space-x-1 xs:space-x-2">
        {/* Filter Button */}
        <Button
          variant="outline"
          onClick={() => setIsFilterOpen(true)}
          className={`text-xs xs:text-sm px-2 xs:px-3 h-8 xs:h-10 ${hasActiveFilters ? "bg-blue-50 border-blue-200" : ""}`}
        >
          <Filter className="mr-1 xs:mr-2 h-3 w-3 xs:h-4 xs:w-4" />
          <span className="hidden xs:inline">Filter</span>
          {hasActiveFilters && (
            <span className="ml-1 bg-blue-500 text-white rounded-full px-1.5 py-0.5 text-xs">
              {Object.keys(filters).filter((key) => filters[key]).length}
            </span>
          )}
        </Button>

        {/* Clear Filters Button */}
        {(hasActiveFilters || searchQuery) && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="text-red-600 hover:text-red-700 text-xs xs:text-sm px-2 xs:px-3 h-8 xs:h-10"
          >
            <X className="h-3 w-3 xs:h-4 xs:w-4" />
          </Button>
        )}
      </div>

      {/* Filter Dialog */}
      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">Filter Options</DialogTitle>
            <DialogDescription className="text-sm">
              Apply filters to narrow down the results
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Status Filter */}
            {filterOptions.status && (
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="status">Status</Label>
                  {filters.status && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => clearSpecificFilter("status")}
                      className="h-6 px-2 text-xs"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <Select
                  value={filters.status || ""}
                  onValueChange={(value) => handleFilterChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.status.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Type Filter */}
            {filterOptions.type && (
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="type">Type</Label>
                  {filters.type && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => clearSpecificFilter("type")}
                      className="h-6 px-2 text-xs"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <Select
                  value={filters.type || ""}
                  onValueChange={(value) => handleFilterChange("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.type.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Priority Filter */}
            {filterOptions.priority && (
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="priority">Priority</Label>
                  {filters.priority && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => clearSpecificFilter("priority")}
                      className="h-6 px-2 text-xs"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <Select
                  value={filters.priority || ""}
                  onValueChange={(value) =>
                    handleFilterChange("priority", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.priority.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priority}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Date Range Filter */}
            {/* {filterOptions.dateRange && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="dateFrom">From Date</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={filters.dateFrom || ""}
                    onChange={(e) =>
                      handleFilterChange("dateFrom", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="dateTo">To Date</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={filters.dateTo || ""}
                    onChange={(e) =>
                      handleFilterChange("dateTo", e.target.value)
                    }
                  />
                </div>
              </div>
            )} */}
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={clearFilters}>
              Clear All
            </Button>
            <Button onClick={applyFilters}>Apply Filters</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
