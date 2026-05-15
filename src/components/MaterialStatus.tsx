import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  Truck,
  X,
} from "lucide-react";

interface MaterialStatusProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MaterialStatus: React.FC<MaterialStatusProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState("yarn");

  const yarnInventory = [
    {
      id: "Y001",
      type: "Cotton 10s OE",
      currentStock: 2450,
      minimumStock: 2000,
      unit: "kg",
      supplier: "Sivaraj Republic",
      lastDelivery: "2024-06-10",
      status: "good",
    },
    {
      id: "Y002",
      type: "Cotton 20s Combed",
      currentStock: 1200,
      minimumStock: 1500,
      unit: "kg",
      supplier: "Arvind Mills",
      lastDelivery: "2024-06-08",
      status: "low",
    },
    {
      id: "Y003",
      type: "Polyester 150D",
      currentStock: 850,
      minimumStock: 1000,
      unit: "kg",
      supplier: "Reliance Textiles",
      lastDelivery: "2024-06-05",
      status: "critical",
    },
  ];

  const chemicals = [
    {
      id: "C001",
      name: "Sizing Agent",
      currentStock: 150,
      minimumStock: 100,
      unit: "L",
      supplier: "Chemical Corp",
      expiryDate: "2024-12-15",
      status: "good",
    },
    {
      id: "C002",
      name: "Warp Lubricant",
      currentStock: 75,
      minimumStock: 80,
      unit: "L",
      supplier: "Textile Chemicals Ltd",
      expiryDate: "2024-08-20",
      status: "low",
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "good":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "low":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "critical":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Package className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "bg-green-500 text-white";
      case "low":
        return "bg-yellow-500 text-white";
      case "critical":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getStockPercentage = (current: number, minimum: number) => {
    return Math.min((current / minimum) * 100, 100);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center">
                <Package className="mr-2 h-5 w-5" />
                Material Status & Inventory
              </DialogTitle>
              <DialogDescription>
                Track raw materials, yarn inventory, and chemical supplies
              </DialogDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="yarn">Yarn Inventory</TabsTrigger>
            <TabsTrigger value="chemicals">Chemicals</TabsTrigger>
            <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
          </TabsList>

          {/* Yarn Inventory Tab */}
          <TabsContent value="yarn" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2">
                  Total Stock
                </h3>
                <p className="text-2xl font-bold text-blue-700">
                  {yarnInventory
                    .reduce((sum, item) => sum + item.currentStock, 0)
                    .toLocaleString()}{" "}
                  kg
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h3 className="font-semibold text-yellow-800 mb-2">
                  Low Stock Items
                </h3>
                <p className="text-2xl font-bold text-yellow-700">
                  {
                    yarnInventory.filter(
                      (item) =>
                        item.status === "low" || item.status === "critical",
                    ).length
                  }
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h3 className="font-semibold text-red-800 mb-2">
                  Critical Items
                </h3>
                <p className="text-2xl font-bold text-red-700">
                  {
                    yarnInventory.filter((item) => item.status === "critical")
                      .length
                  }
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {yarnInventory.map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(item.status)}
                      <div>
                        <h3 className="font-semibold">{item.type}</h3>
                        <p className="text-sm text-gray-600">ID: {item.id}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(item.status)}>
                      {item.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-gray-600">Current Stock</p>
                      <p className="font-semibold">
                        {item.currentStock.toLocaleString()} {item.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Minimum Stock</p>
                      <p className="font-semibold">
                        {item.minimumStock.toLocaleString()} {item.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Supplier</p>
                      <p className="font-semibold">{item.supplier}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Last Delivery</p>
                      <p className="font-semibold">{item.lastDelivery}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Stock Level</span>
                      <span>
                        {getStockPercentage(
                          item.currentStock,
                          item.minimumStock,
                        ).toFixed(0)}
                        %
                      </span>
                    </div>
                    <Progress
                      value={getStockPercentage(
                        item.currentStock,
                        item.minimumStock,
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Chemicals Tab */}
          <TabsContent value="chemicals" className="space-y-4">
            <div className="space-y-4">
              {chemicals.map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(item.status)}
                      <div>
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-gray-600">ID: {item.id}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(item.status)}>
                      {item.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Current Stock</p>
                      <p className="font-semibold">
                        {item.currentStock} {item.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Minimum Stock</p>
                      <p className="font-semibold">
                        {item.minimumStock} {item.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Supplier</p>
                      <p className="font-semibold">{item.supplier}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Expiry Date</p>
                      <p className="font-semibold">{item.expiryDate}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Purchase Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <div className="bg-green-50 p-6 rounded-lg border border-green-200 text-center">
              <Truck className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                Purchase Order Management
              </h3>
              <p className="text-green-700 mb-4">
                Track and manage purchase orders for raw materials and supplies
              </p>
              <Button className="bg-green-600 hover:bg-green-700">
                Create Purchase Order
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
