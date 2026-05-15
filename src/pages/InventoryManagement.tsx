import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  AlertTriangle,
  CheckCircle,
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  supplier: string;
  lastUpdated: string;
  cost: number;
}

const initialInventory: InventoryItem[] = [
  {
    id: "1",
    name: "Cotton Yarn 40s",
    category: "Raw Material",
    currentStock: 1500,
    minStock: 500,
    maxStock: 3000,
    unit: "kg",
    supplier: "Sivaraj Regular",
    lastUpdated: "2024-06-15",
    cost: 180,
  },
  {
    id: "2",
    name: "Polyester Yarn 20s",
    category: "Raw Material",
    currentStock: 200,
    minStock: 400,
    maxStock: 2000,
    unit: "kg",
    supplier: "Textile Corp",
    lastUpdated: "2024-06-14",
    cost: 150,
  },
  {
    id: "3",
    name: "Sizing Chemicals",
    category: "Chemicals",
    currentStock: 50,
    minStock: 20,
    maxStock: 100,
    unit: "liters",
    supplier: "Chemical Works",
    lastUpdated: "2024-06-10",
    cost: 250,
  },
  {
    id: "4",
    name: "Machine Oil",
    category: "Maintenance",
    currentStock: 25,
    minStock: 10,
    maxStock: 50,
    unit: "liters",
    supplier: "Industrial Supply",
    lastUpdated: "2024-06-12",
    cost: 300,
  },
];

export default function InventoryManagement() {
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    name: "",
    category: "",
    currentStock: 0,
    minStock: 0,
    maxStock: 0,
    unit: "",
    supplier: "",
    cost: 0,
  });

  const categories = [
    "Raw Material",
    "Chemicals",
    "Maintenance",
    "Spare Parts",
  ];

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock <= item.minStock) return "critical";
    if (item.currentStock <= item.minStock * 1.5) return "low";
    return "normal";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical":
        return "bg-red-100 text-red-700 border-red-200";
      case "low":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-green-100 text-green-700 border-green-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "critical":
        return <AlertTriangle className="h-4 w-4" />;
      case "low":
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleAddItem = () => {
    const id = Date.now().toString();
    const item: InventoryItem = {
      ...newItem,
      id,
      lastUpdated: new Date().toISOString().split("T")[0],
    } as InventoryItem;

    setInventory((prev) => [...prev, item]);
    setNewItem({
      name: "",
      category: "",
      currentStock: 0,
      minStock: 0,
      maxStock: 0,
      unit: "",
      supplier: "",
      cost: 0,
    });
    setIsAddDialogOpen(false);
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setNewItem(item);
    setIsAddDialogOpen(true);
  };

  const handleUpdateItem = () => {
    if (editingItem) {
      setInventory((prev) =>
        prev.map((item) =>
          item.id === editingItem.id
            ? ({
                ...newItem,
                id: editingItem.id,
                lastUpdated: new Date().toISOString().split("T")[0],
              } as InventoryItem)
            : item,
        ),
      );
      setEditingItem(null);
      setNewItem({
        name: "",
        category: "",
        currentStock: 0,
        minStock: 0,
        maxStock: 0,
        unit: "",
        supplier: "",
        cost: 0,
      });
      setIsAddDialogOpen(false);
    }
  };

  const handleDeleteItem = (id: string) => {
    setInventory((prev) => prev.filter((item) => item.id !== id));
  };

  const criticalItems = inventory.filter(
    (item) => getStockStatus(item) === "critical",
  ).length;
  const lowStockItems = inventory.filter(
    (item) => getStockStatus(item) === "low",
  ).length;
  const totalValue = inventory.reduce(
    (sum, item) => sum + item.currentStock * item.cost,
    0,
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Inventory Management
          </h1>
          <p className="text-gray-600">
            Monitor and manage raw materials and supplies
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Package className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold">{inventory.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical Stock</p>
                <p className="text-2xl font-bold text-red-600">
                  {criticalItems}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {lowStockItems}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold">
                  ₹{totalValue.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search items or suppliers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inventory List */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredInventory.map((item) => {
              const status = getStockStatus(item);
              return (
                <Card key={item.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-bold text-lg">{item.name}</h3>
                        <Badge
                          variant="outline"
                          className={getStatusColor(status)}
                        >
                          <span className="flex items-center">
                            {getStatusIcon(status)}
                            <span className="ml-1 capitalize">{status}</span>
                          </span>
                        </Badge>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditItem(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-gray-600">Category</p>
                        <p className="font-medium">{item.category}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Current Stock</p>
                        <p className="font-medium">
                          {item.currentStock} {item.unit}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Supplier</p>
                        <p className="font-medium">{item.supplier}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Cost per unit</p>
                        <p className="font-medium">₹{item.cost}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Stock Range: {item.minStock} - {item.maxStock}{" "}
                        {item.unit}
                      </div>
                      <div className="text-sm text-gray-500">
                        Last updated: {item.lastUpdated}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Item" : "Add New Item"}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Update the inventory item details"
                : "Add a new item to inventory"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Item Name</Label>
              <Input
                id="name"
                value={newItem.name}
                onChange={(e) =>
                  setNewItem((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter item name"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={newItem.category}
                onValueChange={(value) =>
                  setNewItem((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="currentStock">Current Stock</Label>
              <Input
                id="currentStock"
                type="number"
                value={newItem.currentStock}
                onChange={(e) =>
                  setNewItem((prev) => ({
                    ...prev,
                    currentStock: Number(e.target.value),
                  }))
                }
                placeholder="Current stock"
              />
            </div>
            <div>
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={newItem.unit}
                onChange={(e) =>
                  setNewItem((prev) => ({ ...prev, unit: e.target.value }))
                }
                placeholder="kg, liters, pieces"
              />
            </div>
            <div>
              <Label htmlFor="minStock">Minimum Stock</Label>
              <Input
                id="minStock"
                type="number"
                value={newItem.minStock}
                onChange={(e) =>
                  setNewItem((prev) => ({
                    ...prev,
                    minStock: Number(e.target.value),
                  }))
                }
                placeholder="Minimum stock level"
              />
            </div>
            <div>
              <Label htmlFor="maxStock">Maximum Stock</Label>
              <Input
                id="maxStock"
                type="number"
                value={newItem.maxStock}
                onChange={(e) =>
                  setNewItem((prev) => ({
                    ...prev,
                    maxStock: Number(e.target.value),
                  }))
                }
                placeholder="Maximum stock level"
              />
            </div>
            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={newItem.supplier}
                onChange={(e) =>
                  setNewItem((prev) => ({ ...prev, supplier: e.target.value }))
                }
                placeholder="Supplier name"
              />
            </div>
            <div>
              <Label htmlFor="cost">Cost per Unit (₹)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={newItem.cost}
                onChange={(e) =>
                  setNewItem((prev) => ({
                    ...prev,
                    cost: Number(e.target.value),
                  }))
                }
                placeholder="Cost per unit"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setEditingItem(null);
                setNewItem({
                  name: "",
                  category: "",
                  currentStock: 0,
                  minStock: 0,
                  maxStock: 0,
                  unit: "",
                  supplier: "",
                  cost: 0,
                });
              }}
            >
              Cancel
            </Button>
            <Button onClick={editingItem ? handleUpdateItem : handleAddItem}>
              {editingItem ? "Update Item" : "Add Item"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
