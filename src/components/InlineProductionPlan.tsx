import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Modal } from "@/components/Modal";
import {
  Calendar,
  Factory,
  User,
  Clock,
  Package,
  CheckCircle,
  Edit,
  FileText,
  Download,
  TrendingUp,
  Eye,
} from "lucide-react";
import { InlineFormCard } from "./InlineFormCard";
import { IndividualLoomTAPlan } from "./IndividualLoomTAPlan";
import { Order } from "@/lib/orderStorage";
import ENDPOINTS from "@/services/api";
import { InlineTimeActionPlan } from "./InlineTimeActionPlan";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useRef } from "react";

interface InlineProductionPlanProps {
  plan: any;
  onEdit?: (plan: any) => void;
}

export const InlineProductionPlan: React.FC<InlineProductionPlanProps> = ({
  plan,
  onEdit,
}) => {
  // Modal states
  const [showTAPlanModal, setShowTAPlanModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [selectedOrderForTA, setSelectedOrderForTA] = useState<string | null>(
    null,
  );
  const [orders, setOrders] = useState<Order[]>([]);
  const reportRef = useRef<HTMLDivElement>(null);

  // Form states
  const [progressData, setProgressData] = useState({
    currentProgress: plan.progress || 0,
    metersCompleted: "",
    dateUpdated: new Date().toISOString().split("T")[0],
    notes: "",
    status: plan.status || "In Progress",
  });

  const [reportData, setReportData] = useState({
    reportType: "production",
    dateFrom: "",
    dateTo: "",
    includeDetails: true,
  });

  const [timelineData, setTimelineData] = useState({
    format: "excel",
    includeProgress: true,
    includeMilestones: true,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress":
        return "bg-blue-500 text-white";
      case "Planning":
        return "bg-yellow-500 text-white";
      case "Completed":
        return "bg-green-500 text-white";
      case "Delayed":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const handleProgressUpdate = () => {
    console.log("Updating progress:", progressData);
    // Here you would typically save to storage
    alert(
      `Progress updated for ${plan.orderId}: ${progressData.currentProgress}% completed`,
    );
    setShowProgressModal(false);
  };

  // const handleGenerateReport = () => {
  //   console.log("Generating report:", reportData);
  //   alert(
  //     `Production report generated for ${plan.orderId} and saved to Downloads folder`,
  //   );
  //   setShowReportModal(false);
  // };

  const handleGenerateReport = async () => {
    // console.log("**********1", reportRef.current);

    if (!reportRef.current) {
      console.error("Report ref not found");
      return;
    }

    // console.log("**********2");

    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Production_Report_${plan.orderId}.pdf`);

    setShowReportModal(false);
  };


  const handleExportTimeline = () => {
    console.log("Exporting timeline:", timelineData);
    alert(
      `Timeline exported for ${plan.orderId} in ${timelineData.format.toUpperCase()} format`,
    );
    setShowTimelineModal(false);
  };

  const fetchAndRefresh = async () => {
    try {
      const response = await ENDPOINTS.getOrdersList();
      if (response?.data?.success && response?.data?.orders) {
        const mappedOrders = response.data.orders;
        setOrders(mappedOrders);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
    }
  };

  useEffect(() => {
    fetchAndRefresh();
  }, []);
  const selectedOrderForTAPlan = orders.find(
    (order) => order.id === selectedOrderForTA,
  );

  {
    /* Hidden PDF Content */
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xl font-bold">{plan.orderId}</h3>
            <p className="text-gray-600">{plan.customer}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(plan.status)}>{plan.status}</Badge>
            {/* {onEdit && (
              <Button size="sm" onClick={() => onEdit(plan)}>
                <Edit className="h-4 w-4 mr-1" />
                Edit Plan
              </Button>
            )} */}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-2xl font-bold text-blue-600">
            {plan.progress}%
          </div>
          <Progress value={plan.progress} className="flex-1" />
          <div className="text-sm text-gray-600">
            {plan.meters?.toLocaleString()}m
          </div>
        </div>
      </div>

      {/* Plan Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-3 bg-white border rounded-lg">
            <Calendar className="h-5 w-5 text-blue-500" />
            <div>
              <p className="font-medium">Duration</p>
              <p className="text-sm text-gray-600">
                {/* {plan.startDate} to {plan.endDate} */}
                {new Date(plan.startDate).toLocaleDateString("en-GB")} to{" "}
                {new Date(plan.endDate).toLocaleDateString("en-GB")}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-white border rounded-lg">
            <Factory className="h-5 w-5 text-green-500" />
            <div>
              <p className="font-medium">Loom Type</p>
              <p className="text-sm text-gray-600">{plan.loomType}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-white border rounded-lg">
            <User className="h-5 w-5 text-purple-500" />
            <div>
              <p className="font-medium">Supervisor</p>
              <p className="text-sm text-gray-600">
                {plan.supervisor || "Not assigned"}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-3 bg-white border rounded-lg">
            <Package className="h-5 w-5 text-orange-500" />
            <div>
              <p className="font-medium">Quantity</p>
              <p className="text-sm text-gray-600">
                {plan.meters?.toLocaleString()} meters
              </p>
            </div>
          </div>

          <div className="p-3 bg-white border rounded-lg">
            <p className="font-medium mb-2">Assigned Looms</p>
            <div className="flex flex-wrap gap-2">
              {plan.looms?.map((loom: string) => (
                <Badge key={loom} variant="outline">
                  {loom}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-white border rounded-lg">
            <Clock className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="font-medium">Status</p>
              <p className="text-sm text-gray-600">{plan.status}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div>
        <h4 className="font-medium mb-3">Production Timeline</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Plan Created</span>
            </div>
            <span className="text-sm text-gray-600">
              {/* {plan.startDate || "Pending"} */}
              {new Date(plan.startDate).toLocaleDateString("en-GB") ||
                "Pending"}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span>Production Started</span>
            </div>
            <span className="text-sm text-gray-600">
              {plan.progress > 0 ? plan.startDate : "Pending"}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span>Expected Completion</span>
            </div>
            <span className="text-sm text-gray-600">
              {new Date(plan.endDate).toLocaleDateString("en-GB")}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-4 border-t">
        <div className="space-x-2">
          <Button variant="outline" onClick={() => setShowReportModal(true)}>
            <FileText className="h-4 w-4 mr-1" />
            Generate Report
          </Button>
          {/* <Button variant="outline" onClick={() => setShowTimelineModal(true)}>
            <Download className="h-4 w-4 mr-1" />
            Export Timeline
          </Button> */}
        </div>
        <div className="space-x-2">
          {/* <Button variant="outline" onClick={() => setShowProgressModal(true)}>
            <TrendingUp className="h-4 w-4 mr-1" />
            Update Progress
          </Button> */}
          <Button
            // onClick={() => setShowTAPlanModal(true)}
            onClick={() => {
              setSelectedOrderForTA(plan.orderId); // or order.id
              // setSelectedOrderForTAPlan(plan.orderId); // whatever object you need
            }}
          >
            <Eye className="h-4 w-4 mr-1" />
            View T&A Plan
          </Button>
        </div>
      </div>

      {/* Modals */}

      {/* View T&A Plan Modal */}

      <InlineFormCard
        title="Time & Action Plan"
        isVisible={!!selectedOrderForTA}
        onClose={() => setSelectedOrderForTA(null)}
      >
        {selectedOrderForTAPlan && (
          <>
            {selectedOrderForTAPlan.selectedLooms &&
            selectedOrderForTAPlan.selectedLooms.length < 1 ? (
              <IndividualLoomTAPlan
                orderId={selectedOrderForTAPlan.id}
                customer={selectedOrderForTAPlan.customer}
                selectedLooms={selectedOrderForTAPlan.selectedLooms.map(
                  (loom: any) => ({ id: loom.id, name: loom.name }),
                )}
                onSave={async () => {
                  await fetchAndRefresh();
                }}
                onProgressUpdate={async () => {
                  await fetchAndRefresh();
                }}
              />
            ) : (
              <InlineTimeActionPlan
                orderId={selectedOrderForTAPlan.id}
                customer={selectedOrderForTAPlan.customer}
                onSave={() => fetchAndRefresh()}
                onProgressUpdate={() => fetchAndRefresh()}
              />
            )}
          </>
        )}
      </InlineFormCard>

      {/* <Modal
        isOpen={showTAPlanModal}
        onClose={() => setShowTAPlanModal(false)}
        title={`Time & Action Plan - ${plan.orderId}`}
        size="xl"
      >
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900">Production Timeline</h4>
            <p className="text-blue-700 mt-1">
              Detailed breakdown of production phases and milestones
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h5 className="font-medium mb-2">Pre-Production Phase</h5>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Yarn procurement
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Loom preparation
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    First piece approval
                  </li>
                </ul>
              </div>
              <div className="border rounded-lg p-4">
                <h5 className="font-medium mb-2">Production Phase</h5>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <Clock className="h-4 w-4 text-blue-500 mr-2" />
                    Daily production monitoring
                  </li>
                  <li className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-400 mr-2" />
                    Quality checks
                  </li>
                  <li className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-400 mr-2" />
                    Final inspection
                  </li>
                </ul>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h5 className="font-medium mb-2">Timeline Details</h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Start Date</p>
                  <p className="font-medium">{plan.startDate}</p>
                </div>
                <div>
                  <p className="text-gray-600">Expected Completion</p>
                  <p className="font-medium">{plan.endDate}</p>
                </div>
                <div>
                  <p className="text-gray-600">Current Progress</p>
                  <p className="font-medium">{plan.progress}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal> */}

      {/* Update Progress Modal */}
      <Modal
        isOpen={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        title={`Update Progress - ${plan.orderId}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="currentProgress">Current Progress (%)</Label>
              <Input
                id="currentProgress"
                type="number"
                min="0"
                max="100"
                value={progressData.currentProgress}
                onChange={(e) =>
                  setProgressData((prev) => ({
                    ...prev,
                    currentProgress: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="metersCompleted">Meters Completed</Label>
              <Input
                id="metersCompleted"
                type="number"
                value={progressData.metersCompleted}
                onChange={(e) =>
                  setProgressData((prev) => ({
                    ...prev,
                    metersCompleted: e.target.value,
                  }))
                }
                placeholder="Enter meters completed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateUpdated">Date Updated</Label>
              <Input
                id="dateUpdated"
                type="date"
                value={progressData.dateUpdated}
                onChange={(e) =>
                  setProgressData((prev) => ({
                    ...prev,
                    dateUpdated: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={progressData.status}
                onValueChange={(value) =>
                  setProgressData((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planning">Planning</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Delayed">Delayed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Progress Notes</Label>
            <Textarea
              id="notes"
              value={progressData.notes}
              onChange={(e) =>
                setProgressData((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Add any relevant notes about the progress..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowProgressModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleProgressUpdate}>Update Progress</Button>
          </div>
        </div>
      </Modal>

      {/* Generate Report Modal */}
      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title={`Generate Report - ${plan.orderId}`}
        size="lg"
      >
        <div className="space-y-4">
          {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reportType">Report Type</Label>
              <Select
                value={reportData.reportType}
                onValueChange={(value) =>
                  setReportData((prev) => ({ ...prev, reportType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">Production Summary</SelectItem>
                  <SelectItem value="detailed">Detailed Analysis</SelectItem>
                  <SelectItem value="efficiency">Efficiency Report</SelectItem>
                  <SelectItem value="quality">Quality Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                id="includeDetails"
                checked={reportData.includeDetails}
                onChange={(e) =>
                  setReportData((prev) => ({
                    ...prev,
                    includeDetails: e.target.checked,
                  }))
                }
                className="rounded"
              />
              <Label htmlFor="includeDetails">Include detailed breakdown</Label>
            </div>
          </div> */}

          {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={reportData.dateFrom}
                onChange={(e) =>
                  setReportData((prev) => ({
                    ...prev,
                    dateFrom: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={reportData.dateTo}
                onChange={(e) =>
                  setReportData((prev) => ({ ...prev, dateTo: e.target.value }))
                }
              />
            </div>
          </div> */}

          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium mb-2">Report will include:</h5>
            <ul className="text-sm space-y-1">
              <li>• Production summary and statistics</li>
              <li>• Loom utilization data</li>
              <li>• Quality metrics</li>
              <li>• Timeline analysis</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShowReportModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateReport}>Generate Report</Button>
          </div>
        </div>
      </Modal>

      {/* Export Timeline Modal */}
      <Modal
        isOpen={showTimelineModal}
        onClose={() => setShowTimelineModal(false)}
        title={`Export Timeline - ${plan.orderId}`}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="format">Export Format</Label>
            <Select
              value={timelineData.format}
              onValueChange={(value) =>
                setTimelineData((prev) => ({ ...prev, format: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                <SelectItem value="csv">CSV (.csv)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="includeProgress"
                checked={timelineData.includeProgress}
                onChange={(e) =>
                  setTimelineData((prev) => ({
                    ...prev,
                    includeProgress: e.target.checked,
                  }))
                }
                className="rounded"
              />
              <Label htmlFor="includeProgress">Include progress data</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="includeMilestones"
                checked={timelineData.includeMilestones}
                onChange={(e) =>
                  setTimelineData((prev) => ({
                    ...prev,
                    includeMilestones: e.target.checked,
                  }))
                }
                className="rounded"
              />
              <Label htmlFor="includeMilestones">Include milestone dates</Label>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2">
              Timeline Export will include:
            </h5>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Start and end dates</li>
              <li>• Daily production targets</li>
              <li>• Actual vs planned progress</li>
              <li>• Critical milestones</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowTimelineModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleExportTimeline}>Export Timeline</Button>
          </div>
        </div>
      </Modal>

      <div
        ref={reportRef}
        className="absolute -left-[9999px] top-0 w-[800px] bg-white p-6"
      >
        <h1 className="text-xl font-bold mb-2">Production Report</h1>
        <p>
          <b>Order:</b> {plan.orderId}
        </p>
        <p>
          <b>Customer:</b> {plan.customer}
        </p>
        <p>
          <b>Date:</b> {new Date().toLocaleDateString()}
        </p>

        <hr className="my-4" />

        <h2 className="font-semibold mb-2">Production Summary</h2>
        <p>Total Meters: {plan.meters}</p>
        <p>Progress: {plan.progress}%</p>

        <h2 className="font-semibold mt-4 mb-2">Assigned Looms</h2>
        <ul>{plan.looms?.map((loom: string) => <li key={loom}>{loom}</li>)}</ul>
      </div>
    </div>
  );
};
