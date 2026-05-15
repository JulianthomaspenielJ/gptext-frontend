import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Order } from "@/lib/orderStorage";
import {
  User,
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Package,
  X,
} from "lucide-react";

interface CustomerReportsProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
}

export const CustomerReports: React.FC<CustomerReportsProps> = ({
  isOpen,
  onClose,
  orders,
}) => {
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [reportType, setReportType] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const customers = [...new Set(orders.map((order) => order.customer))];

  const getCustomerStats = (customerName: string) => {
    const customerOrders = orders.filter(
      (order) => order.customer === customerName,
    );

    const totalOrders = customerOrders.length;
    const totalQuantity = customerOrders.reduce(
      (sum, order) => sum + (order.quantity || 0),
      0,
    );
    const completedOrders = customerOrders.filter(
      (order) => order.status === "Completed",
    ).length;
    const onTimeDeliveries = customerOrders.filter(
      (order) =>
        order.status === "Completed" &&
        new Date(order.deliveryDate) >= new Date(),
    ).length;

    return {
      totalOrders,
      totalQuantity,
      completedOrders,
      onTimeDeliveries,
      completionRate:
        totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
      onTimeRate:
        completedOrders > 0 ? (onTimeDeliveries / completedOrders) * 100 : 0,
    };
  };

  const generateReport = () => {
    let reportData = "";
    let filename = "";

    if (reportType === "customer-summary" && selectedCustomer) {
      const stats = getCustomerStats(selectedCustomer);
      const customerOrders = orders.filter(
        (order) => order.customer === selectedCustomer,
      );

      reportData = `
CUSTOMER SUMMARY REPORT
Customer: ${selectedCustomer}
Generated on: ${new Date().toLocaleString()}

SUMMARY:
- Total Orders: ${stats.totalOrders}
- Total Quantity: ${stats.totalQuantity.toLocaleString()} meters
- Completed Orders: ${stats.completedOrders}
- Completion Rate: ${stats.completionRate.toFixed(1)}%
- On-Time Delivery Rate: ${stats.onTimeRate.toFixed(1)}%

ORDER DETAILS:
${customerOrders
  .map(
    (order) => `
Order ID: ${order.id}
Date: ${order.orderDate}
Fabric: ${order.fabric}
Quantity: ${(order.quantity || 0).toLocaleString()} meters
Status: ${order.status}
Delivery Date: ${order.deliveryDate}
Progress: ${order.progress}%
`,
  )
  .join("\n")}
      `;
      filename = `customer-report-${selectedCustomer.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.txt`;
    } else if (reportType === "all-customers") {
      reportData = `
ALL CUSTOMERS SUMMARY REPORT
Generated on: ${new Date().toLocaleString()}

OVERVIEW:
- Total Customers: ${customers.length}
- Total Orders: ${orders.length}
- Total Production: ${orders.reduce((sum, order) => sum + (order.quantity || 0), 0).toLocaleString()} meters

CUSTOMER BREAKDOWN:
${customers
  .map((customer) => {
    const stats = getCustomerStats(customer);
    return `
Customer: ${customer}
- Orders: ${stats.totalOrders}
- Quantity: ${stats.totalQuantity.toLocaleString()} meters
- Completion Rate: ${stats.completionRate.toFixed(1)}%
- On-Time Rate: ${stats.onTimeRate.toFixed(1)}%
`;
  })
  .join("\n")}
      `;
      filename = `all-customers-report-${new Date().toISOString().split("T")[0]}.txt`;
    } else if (reportType === "performance") {
      const performanceData = customers.map((customer) => {
        const stats = getCustomerStats(customer);
        return { customer, ...stats };
      });

      performanceData.sort((a, b) => b.totalQuantity - a.totalQuantity);

      reportData = `
CUSTOMER PERFORMANCE REPORT
Generated on: ${new Date().toLocaleString()}

TOP CUSTOMERS BY VOLUME:
${performanceData
  .slice(0, 5)
  .map(
    (data, index) => `
${index + 1}. ${data.customer}
   Volume: ${data.totalQuantity.toLocaleString()} meters
   Orders: ${data.totalOrders}
   Completion Rate: ${data.completionRate.toFixed(1)}%
   On-Time Rate: ${data.onTimeRate.toFixed(1)}%
`,
  )
  .join("\n")}

PERFORMANCE METRICS:
${performanceData
  .map(
    (data) => `
${data.customer}:
  Completion Rate: ${data.completionRate.toFixed(1)}%
  On-Time Rate: ${data.onTimeRate.toFixed(1)}%
`,
  )
  .join("\n")}
      `;
      filename = `customer-performance-report-${new Date().toISOString().split("T")[0]}.txt`;
    }

    if (reportData) {
      // Generate PDF instead of text file
      generateCustomerReportPDF(reportType, reportData, filename);
    }
  };

  const generateCustomerReportPDF = (
    reportType: string,
    reportData: string,
    filename: string,
  ) => {
    import("jspdf").then((jsPDFModule) => {
      const jsPDF = jsPDFModule.default;
      const doc = new jsPDF();

      // Parse the text content and format for PDF
      const lines = reportData.split("\n").filter((line) => line.trim() !== "");
      let yPos = 20;

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");

      // Extract title from first line
      const title = lines[0] || "Customer Report";
      doc.text(title, 105, yPos, { align: "center" });

      yPos += 20;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      // Process each line
      lines.slice(1).forEach((line) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        if (line.includes(":") && !line.startsWith(" ")) {
          // This is a header or key-value pair
          doc.setFont("helvetica", "bold");
          doc.text(line, 20, yPos);
          doc.setFont("helvetica", "normal");
        } else {
          // Regular content
          doc.text(line, 20, yPos);
        }

        yPos += 7;
      });

      // Save PDF with same filename but .pdf extension
      const pdfFilename = filename.replace(".txt", ".pdf");
      doc.save(pdfFilename);
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Customer Reports & Analytics
              </DialogTitle>
              <DialogDescription>
                Generate comprehensive reports for customer analysis and
                performance tracking
              </DialogDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="generate">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate">Generate Reports</TabsTrigger>
            <TabsTrigger value="analytics">Customer Analytics</TabsTrigger>
          </TabsList>

          {/* Generate Reports Tab */}
          <TabsContent value="generate" className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-3">
                Report Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reportType">Report Type</Label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer-summary">
                        Customer Summary
                      </SelectItem>
                      <SelectItem value="all-customers">
                        All Customers Summary
                      </SelectItem>
                      <SelectItem value="performance">
                        Performance Analysis
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {reportType === "customer-summary" && (
                  <div>
                    <Label htmlFor="customer">Select Customer</Label>
                    <Select
                      value={selectedCustomer}
                      onValueChange={setSelectedCustomer}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer} value={customer}>
                            {customer}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="dateFrom">From Date (Optional)</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="dateTo">To Date (Optional)</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-4">
                <Button
                  onClick={generateReport}
                  disabled={
                    !reportType ||
                    (reportType === "customer-summary" && !selectedCustomer)
                  }
                  className="w-full md:w-auto"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Generate & Download Report
                </Button>
              </div>
            </div>

            {/* Report Templates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4">
                <FileText className="h-8 w-8 text-blue-500 mb-3" />
                <h3 className="font-semibold mb-2">Customer Summary</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Detailed report for a specific customer including order
                  history and performance metrics.
                </p>
                <Badge variant="outline">Individual Customer</Badge>
              </div>

              <div className="border rounded-lg p-4">
                <TrendingUp className="h-8 w-8 text-green-500 mb-3" />
                <h3 className="font-semibold mb-2">All Customers</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Comprehensive overview of all customers with summary
                  statistics and order breakdown.
                </p>
                <Badge variant="outline">Complete Overview</Badge>
              </div>

              <div className="border rounded-lg p-4">
                <Package className="h-8 w-8 text-purple-500 mb-3" />
                <h3 className="font-semibold mb-2">Performance Analysis</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Performance rankings, completion rates, and delivery analytics
                  across all customers.
                </p>
                <Badge variant="outline">Analytics</Badge>
              </div>
            </div>
          </TabsContent>

          {/* Customer Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2">
                  Total Customers
                </h3>
                <p className="text-2xl font-bold text-blue-700">
                  {customers.length}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-800 mb-2">
                  Total Orders
                </h3>
                <p className="text-2xl font-bold text-green-700">
                  {orders.length}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-purple-800 mb-2">
                  Total Volume
                </h3>
                <p className="text-2xl font-bold text-purple-700">
                  {orders
                    .reduce((sum, order) => sum + (order.quantity || 0), 0)
                    .toLocaleString()}{" "}
                  m
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {customers.map((customer) => {
                const stats = getCustomerStats(customer);
                return (
                  <div key={customer} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{customer}</h3>
                      <Badge
                        className={
                          stats.totalOrders >= 5
                            ? "bg-green-500 text-white"
                            : stats.totalOrders >= 2
                              ? "bg-blue-500 text-white"
                              : "bg-gray-500 text-white"
                        }
                      >
                        {stats.totalOrders >= 5
                          ? "VIP"
                          : stats.totalOrders >= 2
                            ? "Regular"
                            : "New"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Orders</p>
                        <p className="font-semibold">{stats.totalOrders}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Volume</p>
                        <p className="font-semibold">
                          {stats.totalQuantity.toLocaleString()} m
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Completion Rate</p>
                        <p className="font-semibold">
                          {stats.completionRate.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">On-Time Rate</p>
                        <p className="font-semibold">
                          {stats.onTimeRate.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
