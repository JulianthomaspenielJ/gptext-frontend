import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Home,
  Settings,
  Factory,
  ShoppingCart,
  Calendar,
  CheckSquare,
  TrendingUp,
  BarChart3,
  Users,
  Package,
  Truck,
  Scale,
  ListOrdered,
  BookType
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

// const navigation = [
//   { name: "Dashboard", href: "/dashboard", icon: Home },
//   { name: "Weaver Management", href: "/weavers", icon: Package },
//   { name: "Loom Management", href: "/looms", icon: Factory },
//   { name: "Order Management", href: "/orders", icon: ShoppingCart },
//   // { name: "Production Planning", href: "/production-planning", icon: Calendar },
//   { name: "Daily Production", href: "/daily-production", icon: TrendingUp },
//   { name: "Production Review", href: "/production-review", icon: BarChart3 },
//   { name: "Task Management", href: "/tasks", icon: CheckSquare },
//   { name: "Beam Reconciliation", href: "/beam-reconciliation", icon: Scale },
//   { name: "Delivery Schedule", href: "/delivery-schedule", icon: Truck },
//   { name: "Users", href: "/users", icon: Users },
//   { name: "Settings", href: "/settings", icon: Settings },
// ];
const navigation = [
  {
    section: "Overview",
    items: [{ name: "Dashboard", href: "/dashboard", icon: Home }],
  },
  {
    section: "Setup & Masters",
    items: [
      { name: "Weaver Management", href: "/weavers", icon: Package },
      { name: "Loom Management", href: "/looms", icon: Factory },
    ],
  },
  {
    section: "Orders & Production Plan",
    items: [
      { name: "Order Management", href: "/orders", icon: ShoppingCart },
      { name: "Delivery Schedule", href: "/delivery-schedule", icon: Truck },
      { name: "Daily Production", href: "/daily-production", icon: TrendingUp },
      {
        name: "Production Review",
        href: "/production-review",
        icon: BarChart3,
      },
      {
        name: "Beam Reconciliation",
        href: "/beam-reconciliation",
        icon: Scale,
      },
    ],
  },
  {
    section: "Tasks",
    items: [{ name: "Task Management", href: "/tasks", icon: CheckSquare }],
  },
  {
    section: "System",
    items: [
      { name: "Users", href: "/users", icon: Users },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
  {
    section: "Additional Masters",
    items: [
      { name: "Yarn Count", href: "/yarncount", icon: ListOrdered },
      { name: "Loom Type", href: "/loomtype", icon: BookType },
    ],
  },
  // {
  //   section: "Additional Masters",
  //   items: [{ name: "Loom Type", href: "/loomtype", icon: Home }],
  // },
];

interface SidebarProps {
  isOpen?: boolean;
  onNavigate?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen = true,
  onNavigate,
}) => {
  const location = useLocation();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");

  useEffect(() => {
    const initialState: Record<string, boolean> = {};

    navigation.forEach((group) => {
      initialState[group.section] = group.items.some(
        (item) => item.href === location.pathname,
      );
    });

    setOpenSections(initialState);
  }, [location.pathname]);

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };
  const handleNavClick = () => {
    // Auto-hide sidebar on mobile when a navigation item is clicked
    if (window.innerWidth < 768 && onNavigate) {
      onNavigate();
    }
  };
  const filteredNavigation = navigation
    .map((group) => {
      const filteredItems = group.items.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase()),
      );

      return {
        ...group,
        items: filteredItems,
      };
    })
    .filter((group) => group.items.length > 0);

  return (
    <div
      className={cn(
        "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r transition-all duration-300 z-40",
        isOpen ? "w-64" : "w-16",
        "md:translate-x-0", // Always visible on desktop
        !isOpen && "max-md:-translate-x-full", // Hide on mobile when closed
      )}
    >
      {/* <ScrollArea className="h-full">
        <div className={cn("p-4 space-y-2", !isOpen && "px-2")}>
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link key={item.name} to={item.href} onClick={handleNavClick}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full",
                    isOpen ? "justify-start" : "justify-center px-0",
                  )}
                  size={isOpen ? "default" : "icon"}
                  title={!isOpen ? item.name : undefined}
                >
                  <item.icon className="h-5 w-5" />
                  {isOpen && <span className="ml-2">{item.name}</span>}
                </Button>
              </Link>
            );
          })}
        </div>
      </ScrollArea> */}
      <ScrollArea className="h-full">
        <div className={cn("p-4 space-y-4", !isOpen && "px-2")}>
          {isOpen && (
            <div className="relative mb-3">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search modules..."
                className="pl-8 h-9"
              />
            </div>
          )}

          {filteredNavigation.map((group) => {
            // const isExpanded = !isOpen || openSections[group.section];
            const isExpanded =
              !isOpen || search.length > 0 || openSections[group.section];

            return (
              <div key={group.section} className="space-y-2">
                {/* Section Header (only when sidebar open) */}
                {isOpen && (
                  <button
                    onClick={() => toggleSection(group.section)}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:bg-muted transition"
                  >
                    <span>{group.section}</span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        isExpanded && "rotate-180",
                      )}
                    />
                  </button>
                )}

                {/* Section Items */}
                {isExpanded &&
                  group.items.map((item) => {
                    const isActive = location.pathname === item.href;

                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={handleNavClick}
                      >
                        <Button
                          variant={isActive ? "default" : "ghost"}
                          className={cn(
                            "w-full",
                            isOpen ? "justify-start" : "justify-center px-0",
                          )}
                          size={isOpen ? "default" : "icon"}
                          title={!isOpen ? item.name : undefined}
                        >
                          <item.icon className="h-5 w-5" />
                          {isOpen && <span className="ml-2">{item.name}</span>}
                        </Button>
                      </Link>
                    );
                  })}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
