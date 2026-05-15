import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import jsPDF from "jspdf";
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
import { OrderStorage } from "@/lib/orderStorage";
import { WeaverStorage } from "@/lib/weaverStorage";
import { ProductionStorage } from "@/lib/productionStorage";
import { DataSync } from "@/lib/dataSync";
import { exportBeamReconciliationToPDF } from "@/lib/beamPdfExport";
import {
  Package,
  Plus,
  Edit,
  Eye,
  Download,
  Calculator,
  FileText,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Scale,
  Clock,
} from "lucide-react";
import ENDPOINTS from "@/services/api";
import { weaverApi } from "@/services/api2";

interface YarnOutwardEntry {
  date: string;
  dcNo: string;
  mill: string;
  lot: string;
  kgs: number;
  signature: string;
}

interface YarnReturnEntry {
  date: string;
  dcNo: string;
  mill: string;
  lot: string;
  kgs: number;
  signature: string;
}

interface WeftQualityDetails {
  count: string;
  mill: string;
  kgs: number;
}

interface WarpCrimpReport {
  warpMtr: number;
  fabricMtr: number;
  crimpMtr: number;
  crimpPercentage: number;
}

interface SaleOrderSplit {
  percentage: number;
  saleOrderNo: string;
  saleOrderDate: string;
}

interface BeamReconciliationRecord {
  id: string;
  slNo: string;
  gptNo: string;
  jobOrderNo: string;
  jobOrderDate: string;
  createdDateTime: string; // Non-editable current date & time
  loomId: string;
  weaverName: string;
  weaverInvNo?: string;

  // Construction Details (5 fields matching order form)
  construction: {
    construction: string;
    gsm: string;
    width: string;
    warpYarnCount: string;
    weftYarnCount: string;
  };
  warpMtr: number;
  expectedFabricMeters: number;
  ends: number;
  endsPerDent: number; // New field - missing in Technical tab
  reedSpace: number;
  weftWt: number; // New field - missing in Technical tab
  reedCount: number;
  crimpPercentage: number;
  reqWeft: number;

  // Quality Details
  weftQuality: WeftQualityDetails;
  yarnOutwardDetails: YarnOutwardEntry[];
  yarnReturnDetails: YarnReturnEntry[];
  warpCrimpReport: WarpCrimpReport;

  // Sale Order Details
  saleOrderSplits: SaleOrderSplit[];

  // Status and Tracking
  status: "pending" | "in-progress" | "completed" | "approved";
  remarks: string;
  preparedBy: string;
  approvedBy?: string;
  createdDate: string;
  updatedDate: string;
}

export default function BeamReconciliation() {
  const [reconciliationRecords, setReconciliationRecords] = useState<
    BeamReconciliationRecord[]
  >([]);
  const [filteredRecords, setFilteredRecords] = useState<
    BeamReconciliationRecord[]
  >([]);
  const [currentTab, setCurrentTab] = useState<"basic" | "technical" | "yarn" | "quality">("basic");
  const [selectedRecord, setSelectedRecord] =
    useState<BeamReconciliationRecord | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [orders, setOrders] = useState<any[]>([]);
  const [availableGptNumbers, setAvailableGptNumbers] = useState<string[]>([]);
  const [weavers, setWeavers] = useState<any[]>([]);
  const [completedProduction, setCompletedProduction] = useState<any[]>([]);
  const [stats, setStats] = useState({
  totalRecords: 0,
  pending: 0,
  inProgress: 0,
  approved: 0,
  completed: 0,
});

  const [loading, setLoading] = useState(true);
  // Form State
  const [formData, setFormData] = useState<Partial<BeamReconciliationRecord>>({
    slNo: "",
    gptNo: "",
    jobOrderNo: "",
    jobOrderDate: "",
    createdDateTime: new Date().toLocaleString(),
    loomId: "",
    weaverName: "",
    construction: {
      construction: "",
      gsm: "",
      width: "",
      warpYarnCount: "",
      weftYarnCount: "",
    },
    warpMtr: 0,
    expectedFabricMeters: 0,
    ends: 0,
    endsPerDent: 0,
    reedSpace: 0,
    weftWt: 0,
    reedCount: 0,
    crimpPercentage: 0,
    reqWeft: 0,
    weftQuality: {
      count: "",
      mill: "",
      kgs: 0,
    },
    yarnOutwardDetails: [],
    yarnReturnDetails: [],
    warpCrimpReport: {
      warpMtr: 0,
      fabricMtr: 0,
      crimpMtr: 0,
      crimpPercentage: 0,
    },
    saleOrderSplits: [],
    status: "pending",
    remarks: "",
    preparedBy: "",
  });

  
 useEffect(() => {
  if (isFormOpen) {
    const fetchDropdownData = async () => {
      try {
        setLoading(true);
        console.log("Fetching orders and weavers...");

        // Fetch Orders
        const ordersResponse = await ENDPOINTS.getOrdersList();
        console.log("Raw orders response:", ordersResponse);

        // Extract the actual array — adjust based on your API structure
        let ordersData = [];
        if (Array.isArray(ordersResponse.data)) {
          ordersData = ordersResponse.data;
        } else if (ordersResponse.data?.data && Array.isArray(ordersResponse.data.data)) {
          ordersData = ordersResponse.data.data;
        } else if (ordersResponse.data?.orders && Array.isArray(ordersResponse.data.orders)) {
          ordersData = ordersResponse.data.orders;
        } else {
          console.warn("Unexpected orders response structure:", ordersResponse.data);
          ordersData = [];
        }

        setOrders(ordersData);

        const gptNumbers = ordersData
          .map((order: any) => order.id )
          .filter(Boolean);
        setAvailableGptNumbers(gptNumbers);

        // Fetch Weavers
        const weaversResponse = await weaverApi.get("/weaver-getall");
        console.log("Raw weavers response:", weaversResponse);

        let weaversData = [];
        if (Array.isArray(weaversResponse.data)) {
          weaversData = weaversResponse.data;
        } else if (weaversResponse.data?.data && Array.isArray(weaversResponse.data.data)) {
          weaversData = weaversResponse.data.data;
        } else if (weaversResponse.data?.weaver && Array.isArray(weaversResponse.data.weaver)) {
          weaversData = weaversResponse.data.weaver;
        } else {
          console.warn("Unexpected weavers response structure:", weaversResponse.data);
          weaversData = [];
        }

        setWeavers(weaversData);

        console.log("Final GPT Numbers:", gptNumbers);
        console.log("Final Weavers:", weaversData);

      } catch (error: any) {
        console.error("API Error:", error);
        if (error.response) {
          console.error("Response data:", error.response.data);
          console.error("Status:", error.response.status);
        }
        alert("Failed to load data. Check console for details.");
      } finally {
        setLoading(false);
      }
    };

    fetchDropdownData();
  }
}, [isFormOpen]);


  // const loadData = () => {
  //   const ordersData = OrderStorage.getOrders();
  //   const weaversData = WeaverStorage.getWeavers();
  //   const productionData = ProductionStorage.getProductionRecords();

  //   // Filter completed orders for reconciliation
  //   const completedOrders = ordersData.filter(
  //     (order) => order.status === "Completed" || order.progress >= 90,
  //   );

  //   // Extract GPT numbers for dropdown
  //   const gptNumbers = ordersData.map((order) => order.id);
  //   setAvailableGptNumbers(gptNumbers);

  //   setOrders(ordersData);
  //   setWeavers(weaversData);
  //   setCompletedProduction(productionData);
  // };

  // Handle GPT No selection and auto-populate fields
const handleGptSelection = (gptNo: string) => {
  const selectedOrder = orders.find((order) => order.id === gptNo);

  if (selectedOrder) {
    // Use meters or quantity for warp meters (meters seems to be the required fabric meters)
    const warpMeters = parseFloat(selectedOrder.meters) || selectedOrder.quantity || 3060;
    const crimpPercentage = parseFloat(selectedOrder.warpcrimp) || 10;
    const expectedFabric = warpMeters - (warpMeters * crimpPercentage) / 100;
    const weftWt = parseFloat(selectedOrder.weftgmsmtr) || 0.146; // fallback if not available
    const reqWeft = expectedFabric * weftWt;

    // Extract weaver name from productionPlanning -> loomsselected -> assignedweaver
    let weaverName = "";
    if (
      selectedOrder.productionPlanning &&
      Array.isArray(selectedOrder.productionPlanning) &&
      selectedOrder.productionPlanning.length > 0
    ) {
      const planning = selectedOrder.productionPlanning[0];
      if (planning.loomsselected && Array.isArray(planning.loomsselected) && planning.loomsselected.length > 0) {
        // Take the first assigned weaver (common case: one loom per beam)
        weaverName = planning.loomsselected[0].assignedweaver || "";
      }
    }

    setFormData((prev) => ({
      ...prev,
      gptNo,
      jobOrderNo: selectedOrder.buyerponumber || "",
      jobOrderDate: selectedOrder.orderdate
        ? new Date(selectedOrder.orderdate).toLocaleDateString()
        : "",
      weaverName: weaverName, // ← Correctly auto-filled from assignedweaver
      construction: {
        construction: `${selectedOrder.constructionvalue1 || ""}x${selectedOrder.constructionvalue2 || ""}x${selectedOrder.constructionvalue3 || ""}`,
        gsm: selectedOrder.gsm || "",
        width: selectedOrder.constructionvalue5 || "", // usually width in inches
        warpYarnCount: selectedOrder.warpyarncount || "",
        weftYarnCount: selectedOrder.weftyarncount || "",
      },
      warpMtr: warpMeters,
      expectedFabricMeters: Math.round(expectedFabric),
      ends: parseInt(selectedOrder.warpendsbeam) || 3184,
      endsPerDent: parseInt(selectedOrder.endsdents) || 2,
      reedSpace: parseFloat(selectedOrder.reedspace) || parseFloat(selectedOrder.flangewidth) || 82.6,
      weftWt: weftWt,
      reedCount: parseInt(selectedOrder.reedonloom) || 40,
      crimpPercentage: crimpPercentage,
      reqWeft: Math.round(reqWeft),
      weftQuality: {
        ...prev.weftQuality,
        count: selectedOrder.weftyarncount || "",
        mill: selectedOrder.weftyarnmill || "",
        kgs: Math.round(reqWeft),
      },
    }));
  } else {
    console.warn("Selected GPT No not found in orders");
    setFormData((prev) => ({
      ...prev,
      gptNo,
      weaverName: "",
      jobOrderNo: "",
      // optionally reset other fields
    }));
  }
};


  // PDF Export function matching attachment format exactly
  const exportToPDF = (record: BeamReconciliationRecord) => {
    const doc = new jsPDF();
    let yPos = 20;

    // Header - "Beam wise Weft Reconciliation Report"
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Beam wise Weft Reconciliation Report", 105, 20, {
      align: "center",
    });

    // Draw header boxes and add content
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");

    // First row - Sl No, GPT No, L-1, Job Order No/Date
    let yStart = 30;
    doc.rect(10, yStart, 25, 10); // Sl No box
    doc.rect(35, yStart, 30, 10); // GPT No box
    doc.rect(65, yStart, 25, 10); // L-1 box
    doc.rect(90, yStart, 55, 10); // Job Order box
    doc.rect(145, yStart, 25, 10); // Number box
    doc.rect(170, yStart, 30, 10); // Date box

    doc.text("Sl No", 12, 37);
    doc.text(record.slNo || "GP-325/1", 37, 37);
    doc.text("GPT No", 67, 37);
    doc.text(record.gptNo || "GPT - 447", 92, 37);
    doc.text("L-1", 77, 37);
    doc.text("Job Order No /", 92, 35);
    doc.text("Date", 92, 38);
    doc.text(record.jobOrderNo || "364", 147, 37);
    doc.text(record.createdDateTime?.split(" ")[0] || "14-07-2025", 172, 35);
    doc.text(record.createdDateTime?.split(" ")[1] || "16:13", 172, 38);

    // Second row - Weaver
    yStart = 40;
    doc.rect(10, yStart, 25, 10);
    doc.rect(35, yStart, 110, 10);
    doc.rect(145, yStart, 55, 10);

    doc.text("Weaver", 12, 47);
    doc.text(record.weaverName || "Sona Tex (Set No :105)", 37, 47);
    doc.text("Weaver Inv No", 147, 47);

    // Third row - Construction (5 values)
    yStart = 50;
    doc.rect(10, yStart, 25, 10);
    doc.rect(35, yStart, 15, 10);
    doc.rect(50, yStart, 15, 10);
    doc.rect(65, yStart, 15, 10);
    doc.rect(80, yStart, 15, 10);
    doc.rect(95, yStart, 15, 10);
    doc.rect(110, yStart, 90, 10);

    doc.text("Construction", 12, 57);
    const construction = record.construction;
    if (construction && typeof construction === "object") {
      doc.text(construction.warpYarnCount || "20s", 37, 57);
      doc.text(construction.weftYarnCount || "16s", 52, 57);
      doc.text(construction.construction || "40x40x70", 67, 57);
      doc.text(construction.gsm || "280", 82, 57);
      doc.text(construction.width || "72", 97, 57);
    }

    // Fourth row - Warp Mtr, Crimp%, Expected Fabric Meters
    yStart = 60;
    doc.rect(10, yStart, 25, 10);
    doc.rect(35, yStart, 30, 10);
    doc.rect(65, yStart, 25, 10);
    doc.rect(90, yStart, 15, 10);
    doc.rect(105, yStart, 40, 10);
    doc.rect(145, yStart, 55, 10);

    doc.text("Warp Mtr", 12, 67);
    doc.text(record.warpMtr?.toString() || "3060.00", 37, 67);
    doc.text("Crimp %", 67, 67);
    doc.text(record.crimpPercentage?.toString() || "10", 92, 67);
    doc.text("Expected Fabric", 107, 65);
    doc.text("Meters", 107, 68);
    doc.text(record.expectedFabricMeters?.toString() || "2754", 147, 67);

    // Fifth row - Ends, Reed Count, Ends/Dent
    yStart = 70;
    doc.rect(10, yStart, 25, 10);
    doc.rect(35, yStart, 30, 10);
    doc.rect(65, yStart, 25, 10);
    doc.rect(90, yStart, 15, 10);
    doc.rect(105, yStart, 40, 10);
    doc.rect(145, yStart, 55, 10);

    doc.text("Ends", 12, 77);
    doc.text(record.ends?.toString() || "3184", 37, 77);
    doc.text("Reed Count", 67, 77);
    doc.text(record.reedCount?.toString() || "40", 92, 77);
    doc.text("Ends / Dent", 107, 77);
    doc.text(record.endsPerDent?.toString() || "2", 147, 77);

    // Sixth row - Reed Space, Weft Wt, Reqd Weft
    yStart = 80;
    doc.rect(10, yStart, 25, 10);
    doc.rect(35, yStart, 30, 10);
    doc.rect(65, yStart, 25, 10);
    doc.rect(90, yStart, 55, 10);
    doc.rect(145, yStart, 30, 10);
    doc.rect(175, yStart, 25, 10);

    doc.text("Reed Space", 12, 87);
    doc.text(record.reedSpace?.toString() || "82.60", 37, 87);
    doc.text("Weft Wt", 67, 87);
    doc.text(`${record.weftWt || "0.146"} Gms / Mtr`, 92, 87);
    doc.text("Reqd Weft", 147, 87);
    doc.text(`${record.reqWeft || "403"} Kgs`, 177, 87);

    // Yarn Outward Details and Weft Quality Details sections
    yStart = 95;
    doc.rect(10, yStart, 90, 40); // Left section
    doc.rect(100, yStart, 100, 40); // Right section

    doc.setFont("helvetica", "bold");
    doc.text("Yarn Outward Details", 12, 102);
    doc.text("Weft Quality Details", 102, 102);

    doc.setFont("helvetica", "normal");
    // Yarn outward table headers
    doc.text("Date", 12, 110);
    doc.text("DC No", 25, 110);
    doc.text("Mill", 40, 110);
    doc.text("LOT", 55, 110);
    doc.text("KGS", 70, 110);
    doc.text("Signature", 80, 110);

    // Weft quality details
    doc.text("Count", 102, 110);
    doc.text(record.weftQuality?.count || "10.00 OE", 125, 110);
    doc.text("Mill", 102, 120);
    doc.text(record.weftQuality?.mill || "Sivaraj Regular", 125, 120);
    doc.text("Kgs", 102, 130);
    doc.text(record.weftQuality?.kgs?.toString() || "403", 125, 130);

    // Yarn Return Details and Warp Crimp% Report
    yStart = 140;
    doc.rect(10, yStart, 90, 40);
    doc.rect(100, yStart, 100, 40);

    doc.setFont("helvetica", "bold");
    doc.text("Yarn Return Details", 12, 147);
    doc.text("Warp Crimp% Report", 102, 147);

    doc.setFont("helvetica", "normal");
    // Yarn return headers
    doc.text("Date", 12, 155);
    doc.text("DC No", 25, 155);
    doc.text("Mill", 40, 155);
    doc.text("LOT", 55, 155);
    doc.text("KGS", 70, 155);
    doc.text("Signature", 80, 155);

    // Warp crimp report
    doc.text("Warp Mtr", 102, 155);
    doc.text("Fabric Mtr", 102, 165);
    doc.text("Crimp - Mtr", 102, 175);
    doc.text("Crimp%", 102, 185);

    // Bottom section with Date/Qty and Sale Order Details
    yStart = 185;
    doc.rect(10, yStart, 40, 20);
    doc.rect(50, yStart, 150, 20);

    doc.text("DATE", 12, 192);
    doc.text("QTY", 25, 192);
    doc.text("16-05-2025", 12, 200);
    doc.text("403", 25, 200);

    doc.text("Sale Order Details", 102, 192);
    doc.text("70%", 140, 192);
    doc.text("30%", 165, 192);
    doc.text("Sale Order NO", 102, 198);
    doc.text("325/1", 140, 198);
    doc.text("325/1/364", 165, 198);
    doc.text("Sale Order Date", 102, 204);
    doc.text("15-05-2025", 140, 204);
    doc.text("15-05-2025", 165, 204);

    // Remarks and signatures
    yStart = 210;
    doc.rect(10, yStart, 190, 20);
    doc.text("Remarks", 12, 217);

    yStart = 240;
    doc.rect(10, yStart, 95, 15);
    doc.rect(105, yStart, 95, 15);
    doc.text("Prepared By", 12, 250);
    doc.text("Approved by", 107, 250);

    // Save PDF
    doc.save(
      `beam-reconciliation-${record.gptNo}-${new Date().toISOString().split("T")[0]}.pdf`,
    );
  };

 

  const handleNewRecord = () => {
    setSelectedRecord(null);
    setFormData({
      slNo: "",
      gptNo: "",
      jobOrderNo: "",
      jobOrderDate: "",
      createdDateTime: new Date().toLocaleString(),
      loomId: "",
      weaverName: "",
      construction: {
        construction: "",
        gsm: "",
        width: "",
        warpYarnCount: "",
        weftYarnCount: "",
      },
      warpMtr: 0,
      expectedFabricMeters: 0,
      ends: 0,
      endsPerDent: 0,
      reedSpace: 0,
      weftWt: 0,
      reedCount: 0,
      crimpPercentage: 0,
      reqWeft: 0,
      weftQuality: {
        count: "",
        mill: "",
        kgs: 0,
      },
      yarnOutwardDetails: [],
      yarnReturnDetails: [],
      warpCrimpReport: {
        warpMtr: 0,
        fabricMtr: 0,
        crimpMtr: 0,
        crimpPercentage: 0,
      },
      saleOrderSplits: [],
      status: "pending",
      remarks: "",
      preparedBy: "",
    });
    setFormMode("create");
    setIsFormOpen(true);
  };

  const handleEditRecord = (record: BeamReconciliationRecord) => {
    setSelectedRecord(record);
    setFormData(record);
    setFormMode("edit");
    setIsFormOpen(true);
  };

  const handleViewRecord = (record: BeamReconciliationRecord) => {
    setSelectedRecord(record);
    setIsViewOpen(true);
  };

const handleSaveRecord = async () => {
  if (!formData.gptNo || !formData.jobOrderNo) {
    alert("GPT No and Job Order No are required!");
    return;
  }

  // Prepare data exactly as backend expects
  const payload = {
    sl_no: formData.slNo || null,
    gpt_no: formData.gptNo,
    job_order_no: formData.jobOrderNo,
    job_order_date: formData.jobOrderDate || null,
    loom_id: formData.loomId || null,
    weaver_name: formData.weaverName || null,
    weaver_inv_no: formData.weaverInvNo || null,
    construction: formData.construction || {},
    weft_quality: formData.weftQuality || {},
    warp_crimp_report: formData.warpCrimpReport || {},
    warp_mtr: formData.warpMtr || 0,
    expected_fabric_meters: formData.expectedFabricMeters || 0,
    ends: formData.ends || 0,
    ends_per_dent: formData.endsPerDent || 0,
    reed_space: formData.reedSpace || 0,
    weft_wt: formData.weftWt || 0,
    reed_count: formData.reedCount || 0,
    crimp_percentage: formData.crimpPercentage || 0,
    req_weft: formData.reqWeft || 0,
    yarn_outward_details: formData.yarnOutwardDetails || [],
    yarn_return_details: formData.yarnReturnDetails || [],
    sale_order_splits: formData.saleOrderSplits || [],
    status: formData.status || "pending",
    remarks: formData.remarks || "",
    prepared_by: formData.preparedBy || "",
    approved_by: formData.approvedBy || null,
  };

  try {
    setLoading(true);

    let response: any ;
    if (formMode === "create") {
      response = await ENDPOINTS.createBeamReconciliation(payload);
    } else {
      // formMode === "edit" → selectedRecord.id exists
      response = await ENDPOINTS.updateBeamReconciliation(selectedRecord!.id, payload);
    }

    if (response.data.success) {
      alert(`Beam Reconciliation ${formMode === "create" ? "created" : "updated"} successfully!`);
      setIsFormOpen(false);
      await fetchBeamReconciliation(); // Refresh list
    } else {
      alert("Error: " + response.data.message);
    }
  } catch (error: any) {
    console.error("Save failed:", error);
    alert("Failed to save: " + (error.response?.data?.message || error.message));
  } finally {
    setLoading(false);
  }
};

  const calculateEfficiency = (record: BeamReconciliationRecord): number => {
    if (record.warpMtr > 0 && record.warpCrimpReport?.fabricMtr) {
      return Math.round(
        (record.warpCrimpReport.fabricMtr / record.warpMtr) * 100,
      );
    }
    return 0;
  };

  const calculateWastage = (record: BeamReconciliationRecord): number => {
    const totalOutward = record.yarnOutwardDetails.reduce(
      (sum, entry) => sum + entry.kgs,
      0,
    );
    const totalReturn = record.yarnReturnDetails.reduce(
      (sum, entry) => sum + entry.kgs,
      0,
    );
    const actualUsed = totalOutward - totalReturn;
    const expectedUsed = record.reqWeft;

    if (expectedUsed > 0) {
      return Math.round(((actualUsed - expectedUsed) / expectedUsed) * 100);
    }
    return 0;
  };

  const handleExportReport = (record: BeamReconciliationRecord) => {
    // Use the existing PDF export function instead of text
    exportBeamReconciliationToPDF(record);
  };

  const generateReconciliationReport = (
    record: BeamReconciliationRecord,
  ): string => {
    let report = `BEAM WISE WEFT RECONCILIATION REPORT\n`;
    report += `==========================================\n\n`;
    report += `Sl No: ${record.slNo}\n`;
    report += `GPT No: ${record.gptNo}\n`;
    report += `Job Order: ${record.jobOrderNo}\n`;
    report += `Date: ${record.jobOrderDate}\n`;
    report += `Weaver: ${record.weaverName}\n`;
    report += `Construction: ${typeof record.construction === "object"
      ? record.construction?.construction || "N/A"
      : record.construction || "N/A"
      }\n\n`;

    report += `TECHNICAL DETAILS:\n`;
    report += `Warp Meters: ${record.warpMtr}\n`;
    report += `Expected Fabric Meters: ${record.expectedFabricMeters}\n`;
    report += `Ends: ${record.ends}\n`;
    report += `Reed Count: ${record.reedCount}\n`;
    report += `Crimp %: ${record.crimpPercentage}\n`;
    report += `Required Weft: ${record.reqWeft} Kgs\n\n`;

    report += `YARN OUTWARD DETAILS:\n`;
    record.yarnOutwardDetails.forEach((entry, index) => {
      report += `${index + 1}. Date: ${entry.date}, Mill: ${entry.mill}, Qty: ${entry.kgs} Kgs\n`;
    });

    report += `\nYARN RETURN DETAILS:\n`;
    record.yarnReturnDetails.forEach((entry, index) => {
      report += `${index + 1}. Date: ${entry.date}, Mill: ${entry.mill}, Qty: ${entry.kgs} Kgs\n`;
    });

    report += `\nWARP CRIMP REPORT:\n`;
    report += `Warp Meters: ${record.warpCrimpReport?.warpMtr || 0}\n`;
    report += `Fabric Meters: ${record.warpCrimpReport?.fabricMtr || 0}\n`;
    report += `Crimp Meters: ${record.warpCrimpReport?.crimpMtr || 0}\n`;
    report += `Crimp %: ${record.warpCrimpReport?.crimpPercentage || 0}\n\n`;

    report += `EFFICIENCY: ${calculateEfficiency(record)}%\n`;
    report += `WASTAGE: ${calculateWastage(record)}%\n\n`;

    report += `Status: ${record.status}\n`;
    report += `Prepared By: ${record.preparedBy}\n`;
    if (record.approvedBy) {
      report += `Approved By: ${record.approvedBy}\n`;
    }

    return report;
  };


  useEffect(() => {
    fetchBeamReconciliation();
  }, []);

  const fetchBeamReconciliation = async () => {
    try {
      setLoading(true);
      const res = await ENDPOINTS.getBeamReconciliationList();
setStats({
      totalRecords: res.data.totalRecords || 0,
      pending: res.data.pending || 0,
      inProgress: res.data.inProgress || 0,
      approved: res.data.approved || 0,
      completed: res.data.completed || 0,
    });
      // 🔹 INLINE MAPPING HERE
      const mappedData = res.data.data.map((item: any): BeamReconciliationRecord => ({
  id: item.id || `temp-${Date.now()}`,
  slNo: item.sl_no || "",
  gptNo: item.gpt_no || "",
  jobOrderNo: item.job_order_no || "",
  jobOrderDate: item.job_order_date || "",
  createdDateTime: item.created_at || new Date().toLocaleString(),
  loomId: item.loom_id || "",
  weaverName: item.weaver_name || "Unknown Weaver",
  weaverInvNo: item.weaver_inv_no,
  construction: {
    construction: item.construction?.construction || "",
    gsm: item.construction?.gsm || "",
    width: item.construction?.width || "",
    warpYarnCount: item.construction?.warpYarnCount || "",
    weftYarnCount: item.construction?.weftYarnCount || "",
  },
  warpMtr: Number(item.warp_mtr) || 0,
  expectedFabricMeters: Number(item.expected_fabric_meters) || 0,
  ends: Number(item.ends) || 0,
  endsPerDent: Number(item.ends_per_dent) || 0,
  reedSpace: Number(item.reed_space) || 0,
  weftWt: Number(item.weft_wt) || 0,
  reedCount: Number(item.reed_count) || 0,
  crimpPercentage: Number(item.crimp_percentage) || 0,
  reqWeft: Number(item.req_weft) || 0,
  weftQuality: {
    count: item.weft_quality?.count || "",
    mill: item.weft_quality?.mill || "",
    kgs: Number(item.weft_quality?.kgs) || 0,
  },
  yarnOutwardDetails: Array.isArray(item.yarn_outward_details)
    ? item.yarn_outward_details
    : [],
  yarnReturnDetails: Array.isArray(item.yarn_return_details)
    ? item.yarn_return_details
    : [],
  warpCrimpReport: {
    warpMtr: Number(item.warp_crimp_report?.warpMtr) || 0,
    fabricMtr: Number(item.warp_crimp_report?.fabricMtr) || 0,
    crimpMtr: Number(item.warp_crimp_report?.crimpMtr) || 0,
    crimpPercentage: Number(item.warp_crimp_report?.crimpPercentage) || 0,
  },
  saleOrderSplits: Array.isArray(item.sale_order_splits)
    ? item.sale_order_splits.map((s: any) => ({
        percentage: Number(s.percentage) || 0,
        saleOrderNo: s.sale_order_no || "",
        saleOrderDate: s.sale_order_date || "",
      }))
    : [],
  status: item.status || "pending",
  remarks: item.remarks || "",
  preparedBy: item.prepared_by || "",
  approvedBy: item.approved_by,
  createdDate: item.created_at || new Date().toISOString().split("T")[0],
  updatedDate: item.updated_at || new Date().toISOString().split("T")[0],
}));

      setFilteredRecords(mappedData);
    } catch (err) {
      console.error("Error fetching beam reconciliation", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "approved":
        return "bg-blue-500";
      case "in-progress":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };



  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Beam Reconciliation
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Post-production yarn reconciliation and quality control reporting
          </p>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleNewRecord} className="text-xs sm:text-sm">
            <Plus className="mr-2 h-4 w-4" />
            New Reconciliation
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
     {loading ? (
        <>
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      ) : (
        <>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Records</p>
                <p className="text-2xl font-bold">{stats.totalRecords}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.completed}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.approved}
                </p>
              </div>
              <Scale className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.pending}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        </>
        )}
      </div>  

      {/* Reconciliation Records List */}
      <Card>
        <CardHeader>
          <CardTitle>Beam Reconciliation Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
            // Show 5 skeleton cards while loading
            [...Array(5)].map((_, i) => (
              <Card key={i} className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 space-y-3 sm:space-y-0">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-8 w-48" />
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-9 w-20" />
                      <Skeleton className="h-9 w-20" />
                      <Skeleton className="h-9 w-24" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                    {[...Array(4)].map((_, j) => (
                      <div key={j}>
                        <Skeleton className="h-4 w-20 mb-2" />
                        <Skeleton className="h-5 w-32" />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="bg-gray-50 p-3 rounded-lg">
                        <Skeleton className="h-5 w-28 mb-1" />
                        <Skeleton className="h-8 w-24" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No reconciliation records found.
            </div>
          ) : (
            filteredRecords.map((record) => (
              <Card key={record.id} className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 space-y-2 sm:space-y-0">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-bold text-lg">
                        {record.gptNo} - {record.jobOrderNo}
                      </h3>
                      <Badge
                        className={`${getStatusColor(record.status)} text-white`}
                      >
                        {record.status.charAt(0).toUpperCase() +
                          record.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewRecord(record)}
                        className="text-xs"
                      >
                        <Eye className="mr-1 h-3 w-3" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditRecord(record)}
                        className="text-xs"
                      >
                        <Edit className="mr-1 h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => exportBeamReconciliationToPDF(record)}
                        className="text-xs"
                      >
                        <Download className="mr-1 h-3 w-3" />
                        Export PDF
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-gray-600">Weaver</p>
                      <p className="font-medium">{record.weaverName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Construction</p>
                      <p className="font-medium">
                        {typeof record.construction === "object"
                          ? record.construction?.construction || "N/A"
                          : record.construction || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Warp Meters</p>
                      <p className="font-medium">
                        {record.warpMtr.toLocaleString()}m
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Efficiency</p>
                      <p className="font-medium text-green-600">
                        {calculateEfficiency(record)}%
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-1">
                        Required Weft
                      </h4>
                      <p className="text-lg font-bold text-blue-600">
                        {record.reqWeft} Kgs
                      </p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-1">
                        Fabric Output
                      </h4>
                      <p className="text-lg font-bold text-green-600">
                        {record.expectedFabricMeters.toLocaleString()}m
                      </p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <h4 className="font-medium text-orange-800 mb-1">
                        Crimp %
                      </h4>
                      <p className="text-lg font-bold text-orange-600">
                        {record.crimpPercentage}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
           ))
          )}
          </div>
        </CardContent>
      </Card>

      {/* Reconciliation Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {formMode === "create"
                ? "Create New Reconciliation Record"
                : "Edit Reconciliation Record"}
            </DialogTitle>
            <DialogDescription>
              Enter beam reconciliation details for post-production analysis
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="technical">Technical</TabsTrigger>
                <TabsTrigger value="yarn">Yarn Details</TabsTrigger>
                <TabsTrigger value="quality">Quality</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="slNo">Sl No</Label>
                    <Input
                      id="slNo"
                      value={formData.slNo || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, slNo: e.target.value })
                      }
                      placeholder="GP-325/1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gptNo">GPT No *</Label>
                    {loading ? (
                      <Input disabled placeholder="Loading GPT numbers..." />
                    ) : (
                      <Select
                        value={formData.gptNo || ""}
                        onValueChange={(value) => handleGptSelection(value)}
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select GPT No" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableGptNumbers.length === 0 ? (
                            <SelectItem value="none" disabled>No orders found</SelectItem>
                          ) : (
                            availableGptNumbers.map((gptNo) => (
                              <SelectItem key={gptNo} value={gptNo}>
                                {gptNo}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="createdDateTime">Date & Time</Label>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <Input
                        id="createdDateTime"
                        value={formData.createdDateTime || ""}
                        readOnly
                        className="bg-gray-50"
                        placeholder="Current date & time"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="jobOrderNo">Job Order No</Label>
                    <Input
                      id="jobOrderNo"
                      value={formData.jobOrderNo || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, jobOrderNo: e.target.value })
                      }
                      placeholder="364"
                    />
                  </div>
                  <div>
                    <Label htmlFor="weaverName">Weaver Name</Label>
                    {loading ? (
                      <Input disabled placeholder="Loading weavers..." />
                    ) : (
                      <Select
                        value={formData.weaverName || ""}
                        onValueChange={(value) => setFormData({ ...formData, weaverName: value })}
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select weaver" />
                        </SelectTrigger>
                        <SelectContent>
                          {weavers.length === 0 ? (
                            <SelectItem value="none" disabled>No weavers found</SelectItem>
                          ) : (
                            weavers.map((weaver: any) => (
                              <SelectItem key={weaver.id || weaver.name} value={weaver.name}>
                                {weaver.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                {/* Construction Fields (5 fields matching order form) */}
                <div>
                  <Label className="text-base font-medium">
                    Construction Details (Auto-populated from GPT Order)
                  </Label>
                  <p className="text-sm text-gray-600 mb-3">
                    Select GPT No to auto-populate these values from the order
                  </p>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="construction">Construction</Label>
                      <Input
                        id="construction"
                        value={formData.construction?.construction || ""}
                        readOnly
                        className="bg-gray-50"
                        placeholder="40x40x70"
                      />
                    </div>
                    <div>
                      <Label htmlFor="gsm">GSM</Label>
                      <Input
                        id="gsm"
                        value={formData.construction?.gsm || ""}
                        readOnly
                        className="bg-gray-50"
                        placeholder="280"
                      />
                    </div>
                    <div>
                      <Label htmlFor="width">Width (inches)</Label>
                      <Input
                        id="width"
                        value={formData.construction?.width || ""}
                        readOnly
                        className="bg-gray-50"
                        placeholder="72"
                      />
                    </div>
                    <div>
                      <Label htmlFor="warpYarnCount">Warp Yarn Count</Label>
                      <Input
                        id="warpYarnCount"
                        value={formData.construction?.warpYarnCount || ""}
                        readOnly
                        className="bg-gray-50"
                        placeholder="20s"
                      />
                    </div>
                    <div>
                      <Label htmlFor="weftYarnCount">Weft Yarn Count</Label>
                      <Input
                        id="weftYarnCount"
                        value={formData.construction?.weftYarnCount || ""}
                        readOnly
                        className="bg-gray-50"
                        placeholder="16s"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="technical" className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <h4 className="font-medium text-blue-800 mb-2">
                    Auto-Calculated Values
                  </h4>
                  <p className="text-sm text-blue-600">
                    Values are auto-populated from the selected GPT order
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="warpMtr">Warp Meters</Label>
                    <Input
                      id="warpMtr"
                      type="number"
                      value={formData.warpMtr || ""}
                      onChange={(e) => {
                        const warpMtr = parseFloat(e.target.value) || 0;
                        const crimpPercentage = formData.crimpPercentage || 0;
                        const expectedFabric =
                          warpMtr - (warpMtr * crimpPercentage) / 100;
                        const weftWt = formData.weftWt || 0;
                        const reqWeft = expectedFabric * weftWt;

                        setFormData({
                          ...formData,
                          warpMtr,
                          expectedFabricMeters: expectedFabric,
                          reqWeft,
                          weftQuality: {
                            ...formData.weftQuality,
                            kgs: reqWeft,
                          },
                        });
                      }}
                      placeholder="3060"
                    />
                  </div>
                  <div>
                    <Label htmlFor="expectedFabricMeters">
                      Expected Fabric Meters (Auto-calculated)
                    </Label>
                    <Input
                      id="expectedFabricMeters"
                      type="number"
                      value={formData.expectedFabricMeters || ""}
                      readOnly
                      className="bg-gray-50"
                      placeholder="Calculated: Warp - (Warp × Crimp%)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ends">Ends</Label>
                    <Input
                      id="ends"
                      type="number"
                      value={formData.ends || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ends: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="3184"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="endsPerDent">Ends / Dent</Label>
                    <Input
                      id="endsPerDent"
                      type="number"
                      value={formData.endsPerDent || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          endsPerDent: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="weftWt">Weft Wt (Gms/Mtr)</Label>
                    <Input
                      id="weftWt"
                      type="number"
                      step="0.001"
                      value={formData.weftWt || ""}
                      onChange={(e) => {
                        const weftWt = parseFloat(e.target.value) || 0;
                        const expectedFabric =
                          formData.expectedFabricMeters || 0;
                        const reqWeft = expectedFabric * weftWt;

                        setFormData({
                          ...formData,
                          weftWt,
                          reqWeft,
                          weftQuality: {
                            ...formData.weftQuality,
                            kgs: reqWeft,
                          },
                        });
                      }}
                      placeholder="0.146"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reqWeftCalculated">
                      Required Weft (Auto-calculated)
                    </Label>
                    <Input
                      id="reqWeftCalculated"
                      type="number"
                      value={formData.reqWeft || ""}
                      readOnly
                      className="bg-gray-50"
                      placeholder="Expected Fabric × Weft Wt"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="reedCount">Reed Count</Label>
                    <Input
                      id="reedCount"
                      type="number"
                      value={formData.reedCount || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          reedCount: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="40"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reedSpace">Reed Space</Label>
                    <Input
                      id="reedSpace"
                      type="number"
                      step="0.01"
                      value={formData.reedSpace || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          reedSpace: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="82.60"
                    />
                  </div>
                  <div>
                    <Label htmlFor="crimpPercentage">Crimp %</Label>
                    <Input
                      id="crimpPercentage"
                      type="number"
                      value={formData.crimpPercentage || ""}
                      onChange={(e) => {
                        const crimpPercentage = parseFloat(e.target.value) || 0;
                        const warpMtr = formData.warpMtr || 0;
                        const expectedFabric =
                          warpMtr - (warpMtr * crimpPercentage) / 100;
                        const weftWt = formData.weftWt || 0;
                        const reqWeft = expectedFabric * weftWt;

                        setFormData({
                          ...formData,
                          crimpPercentage,
                          expectedFabricMeters: expectedFabric,
                          reqWeft,
                          weftQuality: {
                            ...formData.weftQuality,
                            kgs: reqWeft,
                          },
                        });
                      }}
                      placeholder="10"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="yarn" className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Yarn Outward Details</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Record yarn issued to weaver
                  </p>
                  <div className="space-y-3">
                    {(formData.yarnOutwardDetails || []).map((entry, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-1 md:grid-cols-6 gap-3 p-3 border rounded-lg"
                      >
                        <div>
                          <Label htmlFor={`outward-date-${index}`}>Date</Label>
                          <Input
                            id={`outward-date-${index}`}
                            type="date"
                            value={entry.date}
                            onChange={(e) => {
                              const updatedEntries = [
                                ...(formData.yarnOutwardDetails || []),
                              ];
                              updatedEntries[index] = {
                                ...entry,
                                date: e.target.value,
                              };
                              setFormData({
                                ...formData,
                                yarnOutwardDetails: updatedEntries,
                              });
                            }}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`outward-dc-${index}`}>DC No</Label>
                          <Input
                            id={`outward-dc-${index}`}
                            value={entry.dcNo}
                            onChange={(e) => {
                              const updatedEntries = [
                                ...(formData.yarnOutwardDetails || []),
                              ];
                              updatedEntries[index] = {
                                ...entry,
                                dcNo: e.target.value,
                              };
                              setFormData({
                                ...formData,
                                yarnOutwardDetails: updatedEntries,
                              });
                            }}
                            placeholder="DC No"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`outward-mill-${index}`}>Mill</Label>
                          <Input
                            id={`outward-mill-${index}`}
                            value={entry.mill}
                            onChange={(e) => {
                              const updatedEntries = [
                                ...(formData.yarnOutwardDetails || []),
                              ];
                              updatedEntries[index] = {
                                ...entry,
                                mill: e.target.value,
                              };
                              setFormData({
                                ...formData,
                                yarnOutwardDetails: updatedEntries,
                              });
                            }}
                            placeholder="Mill name"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`outward-lot-${index}`}>LOT</Label>
                          <Input
                            id={`outward-lot-${index}`}
                            value={entry.lot}
                            onChange={(e) => {
                              const updatedEntries = [
                                ...(formData.yarnOutwardDetails || []),
                              ];
                              updatedEntries[index] = {
                                ...entry,
                                lot: e.target.value,
                              };
                              setFormData({
                                ...formData,
                                yarnOutwardDetails: updatedEntries,
                              });
                            }}
                            placeholder="LOT No"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`outward-kgs-${index}`}>KGS</Label>
                          <Input
                            id={`outward-kgs-${index}`}
                            type="number"
                            value={entry.kgs}
                            onChange={(e) => {
                              const updatedEntries = [
                                ...(formData.yarnOutwardDetails || []),
                              ];
                              updatedEntries[index] = {
                                ...entry,
                                kgs: parseFloat(e.target.value) || 0,
                              };
                              setFormData({
                                ...formData,
                                yarnOutwardDetails: updatedEntries,
                              });
                            }}
                            placeholder="Weight"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const updatedEntries = (
                                formData.yarnOutwardDetails || []
                              ).filter((_, i) => i !== index);
                              setFormData({
                                ...formData,
                                yarnOutwardDetails: updatedEntries,
                              });
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const newEntry: YarnOutwardEntry = {
                          date: new Date().toISOString().split("T")[0],
                          dcNo: "",
                          mill: "",
                          lot: "",
                          kgs: 0,
                          signature: "",
                        };
                        setFormData({
                          ...formData,
                          yarnOutwardDetails: [
                            ...(formData.yarnOutwardDetails || []),
                            newEntry,
                          ],
                        });
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Outward Entry
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Yarn Return Details</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Record unused yarn returned by weaver
                  </p>
                  <div className="space-y-3">
                    {(formData.yarnReturnDetails || []).map((entry, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-1 md:grid-cols-6 gap-3 p-3 border rounded-lg"
                      >
                        <div>
                          <Label htmlFor={`return-date-${index}`}>Date</Label>
                          <Input
                            id={`return-date-${index}`}
                            type="date"
                            value={entry.date}
                            onChange={(e) => {
                              const updatedEntries = [
                                ...(formData.yarnReturnDetails || []),
                              ];
                              updatedEntries[index] = {
                                ...entry,
                                date: e.target.value,
                              };
                              setFormData({
                                ...formData,
                                yarnReturnDetails: updatedEntries,
                              });
                            }}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`return-dc-${index}`}>DC No</Label>
                          <Input
                            id={`return-dc-${index}`}
                            value={entry.dcNo}
                            onChange={(e) => {
                              const updatedEntries = [
                                ...(formData.yarnReturnDetails || []),
                              ];
                              updatedEntries[index] = {
                                ...entry,
                                dcNo: e.target.value,
                              };
                              setFormData({
                                ...formData,
                                yarnReturnDetails: updatedEntries,
                              });
                            }}
                            placeholder="DC No"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`return-mill-${index}`}>Mill</Label>
                          <Input
                            id={`return-mill-${index}`}
                            value={entry.mill}
                            onChange={(e) => {
                              const updatedEntries = [
                                ...(formData.yarnReturnDetails || []),
                              ];
                              updatedEntries[index] = {
                                ...entry,
                                mill: e.target.value,
                              };
                              setFormData({
                                ...formData,
                                yarnReturnDetails: updatedEntries,
                              });
                            }}
                            placeholder="Mill name"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`return-lot-${index}`}>LOT</Label>
                          <Input
                            id={`return-lot-${index}`}
                            value={entry.lot}
                            onChange={(e) => {
                              const updatedEntries = [
                                ...(formData.yarnReturnDetails || []),
                              ];
                              updatedEntries[index] = {
                                ...entry,
                                lot: e.target.value,
                              };
                              setFormData({
                                ...formData,
                                yarnReturnDetails: updatedEntries,
                              });
                            }}
                            placeholder="LOT No"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`return-kgs-${index}`}>KGS</Label>
                          <Input
                            id={`return-kgs-${index}`}
                            type="number"
                            value={entry.kgs}
                            onChange={(e) => {
                              const updatedEntries = [
                                ...(formData.yarnReturnDetails || []),
                              ];
                              updatedEntries[index] = {
                                ...entry,
                                kgs: parseFloat(e.target.value) || 0,
                              };
                              setFormData({
                                ...formData,
                                yarnReturnDetails: updatedEntries,
                              });
                            }}
                            placeholder="Weight"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const updatedEntries = (
                                formData.yarnReturnDetails || []
                              ).filter((_, i) => i !== index);
                              setFormData({
                                ...formData,
                                yarnReturnDetails: updatedEntries,
                              });
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const newEntry: YarnReturnEntry = {
                          date: new Date().toISOString().split("T")[0],
                          dcNo: "",
                          mill: "",
                          lot: "",
                          kgs: 0,
                          signature: "",
                        };
                        setFormData({
                          ...formData,
                          yarnReturnDetails: [
                            ...(formData.yarnReturnDetails || []),
                            newEntry,
                          ],
                        });
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Return Entry
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="quality" className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg mb-4">
                  <h4 className="font-medium text-green-800 mb-2">
                    Auto-Populated Quality Data
                  </h4>
                  <p className="text-sm text-green-600">
                    Mill and Kgs values are automatically filled from the
                    selected GPT order and calculated required weft
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Weft Quality Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="weftCount">Count</Label>
                      <Input
                        id="weftCount"
                        value={formData.weftQuality?.count || ""}
                        placeholder="10.00 OE"
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            weftQuality: {
                              ...formData.weftQuality,
                              count: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="weftMill">
                        Mill (Auto-populated from Order)
                      </Label>
                      <Input
                        id="weftMill"
                        value={formData.weftQuality?.mill || ""}
                        placeholder="Auto-filled from Warp Yarn Mill"
                        readOnly
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Value from selected GPT order's Warp Yarn Mill
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="weftKgs">Kgs (Auto-calculated)</Label>
                      <Input
                        id="weftKgs"
                        type="number"
                        value={formData.weftQuality?.kgs || ""}
                        readOnly
                        className="bg-gray-50"
                        placeholder="Auto-calculated from Required Weft"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Value from Technical Tab Required Weft calculation
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Status & Approval</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) =>
                          setFormData({ ...formData, status: value as any })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in-progress">
                            In Progress
                          </SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="preparedBy">Prepared By</Label>
                      <Input
                        id="preparedBy"
                        value={formData.preparedBy || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            preparedBy: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label htmlFor="remarks">Remarks</Label>
                    <Textarea
                      id="remarks"
                      value={formData.remarks || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, remarks: e.target.value })
                      }
                      placeholder="Any additional notes..."
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              {currentTab !== "basic" && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (currentTab === "technical") setCurrentTab("basic");
                    if (currentTab === "yarn") setCurrentTab("technical");
                    if (currentTab === "quality") setCurrentTab("yarn");
                  }}
                >
                  Previous
                </Button>
              )}

              {/* Next Button - only if not on last tab */}
              {currentTab !== "quality" && (
                <Button
                  onClick={() => {
                    if (currentTab === "basic") setCurrentTab("technical");
                    if (currentTab === "technical") setCurrentTab("yarn");
                    if (currentTab === "yarn") setCurrentTab("quality");
                  }}
                >
                  Next
                </Button>
              )}

              {/* Save Button - only on last tab */}
              {currentTab === "quality" && (
                <Button
                  onClick={handleSaveRecord}
                  disabled={!formData.gptNo || !formData.jobOrderNo}
                >
                  {formMode === "create" ? "Create Record" : "Update Record"}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Record Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="w-[95vw] max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Beam Reconciliation Report: {selectedRecord?.gptNo}
            </DialogTitle>
            <DialogDescription>
              {selectedRecord?.weaverName} -{" "}
              {typeof selectedRecord?.construction === "object"
                ? selectedRecord?.construction?.construction || "N/A"
                : selectedRecord?.construction || "N/A"}
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-2">Job Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>GPT No:</span>
                        <span className="font-medium">
                          {selectedRecord.gptNo}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Job Order:</span>
                        <span className="font-medium">
                          {selectedRecord.jobOrderNo}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Date:</span>
                        <span className="font-medium">
                          {selectedRecord.jobOrderDate}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <Badge
                          className={`${getStatusColor(selectedRecord.status)} text-white`}
                        >
                          {selectedRecord.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-2">Production Metrics</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Warp Meters:</span>
                        <span className="font-medium">
                          {selectedRecord.warpMtr.toLocaleString()}m
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Fabric Meters:</span>
                        <span className="font-medium">
                          {selectedRecord.expectedFabricMeters.toLocaleString()}
                          m
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Required Weft:</span>
                        <span className="font-medium">
                          {selectedRecord.reqWeft} Kgs
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Efficiency:</span>
                        <span className="font-medium text-green-600">
                          {calculateEfficiency(selectedRecord)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-2">Quality Parameters</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Crimp %:</span>
                        <span className="font-medium">
                          {selectedRecord.crimpPercentage}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Reed Count:</span>
                        <span className="font-medium">
                          {selectedRecord.reedCount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ends:</span>
                        <span className="font-medium">
                          {selectedRecord.ends.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Wastage:</span>
                        <span
                          className={`font-medium ${calculateWastage(selectedRecord) > 5
                            ? "text-red-600"
                            : "text-green-600"
                            }`}
                        >
                          {calculateWastage(selectedRecord)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Yarn Tracking</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-green-800 mb-2">
                          Outward Details
                        </h4>
                        {selectedRecord.yarnOutwardDetails.map(
                          (entry, index) => (
                            <div
                              key={index}
                              className="bg-green-50 p-3 rounded border-l-4 border-green-400"
                            >
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-gray-600">Date:</span>{" "}
                                  {entry.date}
                                </div>
                                <div>
                                  <span className="text-gray-600">Mill:</span>{" "}
                                  {entry.mill}
                                </div>
                                <div>
                                  <span className="text-gray-600">Qty:</span>{" "}
                                  {entry.kgs} Kgs
                                </div>
                                <div>
                                  <span className="text-gray-600">LOT:</span>{" "}
                                  {entry.lot}
                                </div>
                              </div>
                            </div>
                          ),
                        )}
                      </div>

                      <div>
                        <h4 className="font-medium text-orange-800 mb-2">
                          Return Details
                        </h4>
                        {selectedRecord.yarnReturnDetails.map(
                          (entry, index) => (
                            <div
                              key={index}
                              className="bg-orange-50 p-3 rounded border-l-4 border-orange-400"
                            >
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-gray-600">Date:</span>{" "}
                                  {entry.date}
                                </div>
                                <div>
                                  <span className="text-gray-600">Mill:</span>{" "}
                                  {entry.mill}
                                </div>
                                <div>
                                  <span className="text-gray-600">Qty:</span>{" "}
                                  {entry.kgs} Kgs
                                </div>
                                <div>
                                  <span className="text-gray-600">LOT:</span>{" "}
                                  {entry.lot}
                                </div>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Sale Order Splits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedRecord.saleOrderSplits.map((split, index) => (
                        <div
                          key={index}
                          className="bg-blue-50 p-3 rounded border-l-4 border-blue-400"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium">
                                {split.saleOrderNo}
                              </div>
                              <div className="text-sm text-gray-600">
                                Date: {split.saleOrderDate}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-blue-600">
                                {split.percentage}%
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {selectedRecord.remarks && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Remarks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{selectedRecord.remarks}</p>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-gray-600">
                  <p>
                    <strong>Prepared By:</strong> {selectedRecord.preparedBy}
                  </p>
                  {selectedRecord.approvedBy && (
                    <p>
                      <strong>Approved By:</strong> {selectedRecord.approvedBy}
                    </p>
                  )}
                </div>
                <Button
                  onClick={() =>
                    selectedRecord &&
                    exportBeamReconciliationToPDF(selectedRecord)
                  }
                  variant="outline"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
