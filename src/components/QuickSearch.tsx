import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Search,
  Factory,
  ShoppingCart,
  Package,
  Users,
  CheckSquare,
  TrendingUp,
  Settings,
  Calendar,
} from "lucide-react";

interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: string;
  url: string;
  icon: any;
}

const searchData: SearchResult[] = [
  // Looms
  {
    id: "loom-mk1",
    title: "MK-1 Rapier Loom",
    description: "92% efficiency, currently running GPT-447",
    category: "Looms",
    url: "/looms",
    icon: Factory,
  },
  {
    id: "loom-aj2",
    title: "AJ-2 Airjet Loom",
    description: "88% efficiency, currently running GPT-448",
    category: "Looms",
    url: "/looms",
    icon: Factory,
  },
  // Orders
  {
    id: "order-447",
    title: "GPT-447 Sri Enterprises",
    description: "H/B Blue Stripe, 12,000m, 65% complete",
    category: "Orders",
    url: "/orders",
    icon: ShoppingCart,
  },
  {
    id: "order-448",
    title: "GPT-448 Texworth Industries",
    description: "T/C Plain, 8,500m, 25% complete",
    category: "Orders",
    url: "/orders",
    icon: ShoppingCart,
  },
  // Materials
  {
    id: "material-cotton",
    title: "Cotton Yarn 40s",
    description: "Material tracking and availability",
    category: "Materials",
    url: "/orders",
    icon: Package,
  },
  {
    id: "material-polyester",
    title: "Polyester Yarn 20s",
    description: "Material status and requirements",
    category: "Materials",
    url: "/orders",
    icon: Package,
  },
  // Users
  {
    id: "user-sarath",
    title: "V. Sarath",
    description: "Yarn Supervisor, active",
    category: "Users",
    url: "/users",
    icon: Users,
  },
  {
    id: "user-amit",
    title: "Amit Sharma",
    description: "Weaving Supervisor, active",
    category: "Users",
    url: "/users",
    icon: Users,
  },
  // Tasks
  {
    id: "task-yarn-delivery",
    title: "Yarn delivery to sizing",
    description: "GPT-447, assigned to V. Sarath, completed",
    category: "Tasks",
    url: "/tasks",
    icon: CheckSquare,
  },
  // Navigation
  {
    id: "nav-production-planning",
    title: "Production Planning",
    description: "Gantt charts and production schedules",
    category: "Navigation",
    url: "/production-planning",
    icon: Calendar,
  },
  {
    id: "nav-daily-production",
    title: "Daily Production",
    description: "Record and monitor daily output",
    category: "Navigation",
    url: "/daily-production",
    icon: TrendingUp,
  },
  {
    id: "nav-settings",
    title: "Settings",
    description: "System configuration and preferences",
    category: "Navigation",
    url: "/settings",
    icon: Settings,
  },
];

interface QuickSearchProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const QuickSearch: React.FC<QuickSearchProps> = ({
  isOpen,
  setIsOpen,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const filteredResults = searchData.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSelect = (result: SearchResult) => {
    navigate(result.url);
    setIsOpen(false);
    setSearchQuery("");
  };

  const groupedResults = filteredResults.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, SearchResult[]>,
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center">
            <Search className="mr-2 h-5 w-5" />
            Quick Search
          </DialogTitle>
          <DialogDescription>
            Search for looms, orders, materials, users, and more
          </DialogDescription>
        </DialogHeader>

        <Command className="border-0">
          <CommandInput
            placeholder="Type to search..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="border-0 focus:ring-0"
          />
          <CommandList className="max-h-96">
            <CommandEmpty>
              <div className="text-center py-6">
                <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No results found</p>
                <p className="text-sm text-gray-400 mt-1">
                  Try searching for looms, orders, or material items
                </p>
              </div>
            </CommandEmpty>

            {Object.entries(groupedResults).map(([category, results]) => (
              <CommandGroup key={category} heading={category}>
                {results.map((result) => (
                  <CommandItem
                    key={result.id}
                    onSelect={() => handleSelect(result)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center space-x-3 w-full">
                      <result.icon className="h-4 w-4 text-gray-500" />
                      <div className="flex-1">
                        <p className="font-medium">{result.title}</p>
                        <p className="text-sm text-gray-500">
                          {result.description}
                        </p>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>

        <div className="border-t p-3 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Press Enter to select</span>
            <span>
              <kbd className="bg-white border rounded px-1">Ctrl</kbd> +{" "}
              <kbd className="bg-white border rounded px-1">K</kbd> to search
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
