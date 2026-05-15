import React from "react";
import { Button } from "@/components/ui/button";
import { List, Grid3X3 } from "lucide-react";

interface ViewToggleProps {
  view: "list" | "grid";
  onViewChange: (view: "list" | "grid") => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({
  view,
  onViewChange,
}) => {
  return (
    <div className="flex items-center border rounded-lg overflow-hidden">
      <Button
        variant={view === "list" ? "default" : "ghost"}
        size="sm"
        className="rounded-none text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9"
        onClick={() => onViewChange("list")}
      >
        <List className="h-3 w-3 sm:h-4 sm:w-4" />
        <span className="ml-1 sm:ml-2 hidden xs:inline">List</span>
      </Button>
      <Button
        variant={view === "grid" ? "default" : "ghost"}
        size="sm"
        className="rounded-none text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9"
        onClick={() => onViewChange("grid")}
      >
        <Grid3X3 className="h-3 w-3 sm:h-4 sm:w-4" />
        <span className="ml-1 sm:ml-2 hidden xs:inline">Grid</span>
      </Button>
    </div>
  );
};
