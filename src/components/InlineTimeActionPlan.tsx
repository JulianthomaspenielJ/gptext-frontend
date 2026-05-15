import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Save,
  Calculator,
  AlertCircle,
  Loader2,
  Download,
} from "lucide-react";
import ENDPOINTS from "@/services/api";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CellInput } from "jspdf-autotable";
import { loomApi } from "@/services/api2";

interface TAProcess {
  id: string; // ← REAL backend UUID
  process: string;
  days: number;
  responsible: string;
  status: "pending" | "in-progress" | "completed" | "delayed";
  targetDate: string;
  actualDate?: string;
  loomId: string;
  warpMetersPlanned: number;
  beamIndex: any;
}

interface InlineTimeActionPlanProps {
  orderId: string;
  customer: string;
  onSave: (processes: TAProcess[]) => void;
  onProgressUpdate?: (orderId: string, progress: number) => void;
}

export const InlineTimeActionPlan: React.FC<InlineTimeActionPlanProps> = ({
  orderId,
  customer,
  onSave,
  onProgressUpdate,
}) => {
  const [processes, setProcesses] = useState<TAProcess[]>([]);
  const [editingProcess, setEditingProcess] = useState<
    Record<string, Partial<TAProcess>>
  >({});
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<any>(null);
  const [looms, setLooms] = useState<any>(null);

  const { toast } = useToast();
  const [selectedWarpPlan, setSelectedWarpPlan] = useState<string>("all");

  // Convert ISO → YYYY-MM-DD
  const formatDate = (date: string | null): string => {
    if (!date) return "";
    return new Date(date).toISOString().split("T")[0];
  };

  const toIsoDate = (date: string): string | null => {
    return date ? new Date(date + "T00:00:00.000Z").toISOString() : null;
  };

  const recalculateDates = () => {
    const firstProcess = processes[0];
    if (!firstProcess?.targetDate) return;

    const startDate = new Date(firstProcess.targetDate);

    // Validate start date
    if (isNaN(startDate.getTime())) {
      toast({
        variant: "destructive",
        title: "Invalid Date",
        description: "Cannot recalculate dates due to invalid start date.",
      });
      return;
    }

    let currentDate = new Date(startDate);

    const updatedProcesses = visibleProcesses.map((process, index) => {
      if (index === 0) {
        return process;
      }

      currentDate.setDate(currentDate.getDate() + process.days);

      // Validate calculated date
      if (isNaN(currentDate.getTime())) {
        console.error(
          `Invalid date calculated for process: ${process.process}`,
        );
        currentDate = new Date(); // Reset to current date
      }

      const newTargetDate = new Date(currentDate).toISOString().split("T")[0];

      return {
        ...process,
        targetDate: newTargetDate,
      };
    });

    setProcesses(updatedProcesses);

    onSave(updatedProcesses);

    toast({
      title: "Dates Recalculated",
      description: "All target dates have been updated based on dependencies.",
    });
  };

  // Fetch + Map using real backend ID
  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await ENDPOINTS.getOrderById(orderId);
      const order = res.data.order;

      setOrderData(order);
      console.log(order);

      const taPlans = order.timeAndActionPlans || [];
      const mapped: TAProcess[] = taPlans.map((p: any) => ({
        id: p.id, // ← REAL ID
        process: p.process,
        days: parseInt(p.days),
        responsible: p.responsible,
        status: p.tastatus,
        targetDate: formatDate(p.targetdate),
        actualDate: p.actualdate ? formatDate(p.actualdate) : undefined,
        loomId: p.loomid,
        warpMetersPlanned: Number(p.warpmetersplanned),
        beamIndex: Number(p.beamindex),
      }));

      console.log(mapped);
      setProcesses(mapped);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to load",
        description: err.message || "Could not load Time & Action Plan",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchLooms = async () => {
      setLoading(true);

      try {
        const response = await loomApi.get("/loom-getall");
        // console.log(response);
        setLooms(response.data.loom);
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };

    fetchLooms();
  }, []);

  const warpPlanOptions = React.useMemo(() => {
    const map = new Map<
      string,
      { loomId: string; warp: number; beamIndex: number }
    >();

    processes.forEach((p) => {
      const key = `${p.loomId}|${p.warpMetersPlanned}|${p.beamIndex}`;
      if (!map.has(key)) {
        map.set(key, {
          loomId: p.loomId,
          warp: p.warpMetersPlanned,
          beamIndex: p.beamIndex,
        });
      }
    });

    return Array.from(map.values());
  }, [processes]);

  const visibleProcesses =
    selectedWarpPlan === "all"
      ? processes
      : processes.filter(
          (p) =>
            `${p.loomId}|${p.warpMetersPlanned}|${p.beamIndex}` ===
            selectedWarpPlan,
        );

  useEffect(() => {
    if (orderId) fetchOrder();
  }, [orderId]);

  // Calculate metrics
  const metrics = (() => {
    const yarnReq = processes.find((p) => p.process === "Yarn Requirement");
    const production = processes.find((p) => p.process === "Production");
    const dispatch = processes.find(
      (p) => p.process === "Fabric Dispatch Completed",
    );

    return {
      yarnReqDate: yarnReq?.targetDate || "N/A",
      productionStartDate: production?.targetDate || "N/A",
      estimatedCompletionDate: dispatch?.targetDate || "N/A",
      totalDays:
        yarnReq && dispatch
          ? Math.ceil(
              (new Date(dispatch.targetDate).getTime() -
                new Date(yarnReq.targetDate).getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : 0,
    };
  })();

  const completedCount = processes.filter(
    (p) => p.status === "completed",
  ).length;
  const progressPercentage = processes.length
    ? Math.round((completedCount / processes.length) * 100)
    : 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "in-progress":
        return <Clock className="h-5 w-5 text-blue-600" />;
      case "delayed":
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "delayed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const startEdit = (process: TAProcess) => {
    setEditingProcess((prev) => ({
      ...prev,
      [process.id]: { ...process },
    }));
  };

  const updateField = (id: string, field: keyof TAProcess, value: string) => {
    setEditingProcess((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [field]: value },
    }));
  };

  const cancelEdit = (id: string) => {
    setEditingProcess((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  // const saveProcess = async (id: string) => {
  //   const changes = editingProcess[id];
  //   if (!changes) return;

  //   if (changes.status === "completed" && !changes.actualDate) {
  //     toast({
  //       variant: "destructive",
  //       title: "Actual Date Required",
  //       description: "Please set actual date when marking as completed",
  //     });
  //     return;
  //   }

  //   setSavingIds(prev => new Set([...prev, id]));

  //   try {
  //     await ENDPOINTS.updateTAPlan( id, {
  //       tastatus: changes.status,
  //       actualdate: changes.actualDate ? toIsoDate(changes.actualDate) : null,
  //       targetdate: toIsoDate(changes.targetDate || ""),
  //     });

  //     await fetchOrder(); // ← Always fresh data

  //     toast({ title: "Saved", description: `${changes.process} updated successfully` });
  //   } catch (err: any) {
  //     toast({
  //       variant: "destructive",
  //       title: "Save Failed",
  //       description: err.response?.data?.message || "Please try again",
  //     });
  //   } finally {
  //     setSavingIds(prev => {
  //       const s = new Set(prev);
  //       s.delete(id);
  //       return s;
  //     });
  //     cancelEdit(id);
  //   }
  // };

  // Excel Export

  const saveProcess = async (id: string) => {
    const changes = editingProcess[id];
    if (!changes) return;

    if (changes.status === "completed" && !changes.actualDate) {
      toast({
        variant: "destructive",
        title: "Actual Date Required",
        description: "Please set actual date when marking as completed",
      });
      return;
    }

    setSavingIds((prev) => new Set([...prev, id]));

    try {
      // Temporarily apply changes locally to calculate new progress accurately
      const tempProcesses = visibleProcesses.map((p) =>
        p.id === id ? { ...p, ...changes } : p,
      );

      const completedCount = tempProcesses.filter(
        (p) => p.status === "completed",
      ).length;
      const newProgressPercentage = tempProcesses.length
        ? Math.round((completedCount / tempProcesses.length) * 100)
        : 0;

      // Single API call: update process + send progress
      await ENDPOINTS.updateTAPlan(id, {
        tastatus: changes.status,
        actualdate: changes.actualDate ? toIsoDate(changes.actualDate) : null,
        targetdate: changes.targetDate
          ? toIsoDate(changes.targetDate || "")
          : undefined,
        progressPercentage: newProgressPercentage, // ← Sent in the same payload!
      });

      // Refetch to sync with backend
      await fetchOrder();

      // Notify parent
      onProgressUpdate?.(orderId, newProgressPercentage);

      toast({
        title: "Saved",
        description: `${changes.process || "Process"} updated successfully`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: err.response?.data?.message || "Please try again",
      });
    } finally {
      setSavingIds((prev) => {
        const s = new Set(prev);
        s.delete(id);
        return s;
      });
      cancelEdit(id);
    }
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("T&A Plan");

    sheet.mergeCells("A1:I1");
    sheet.getCell("A1").value = `Time & Action Plan - ${orderId}`;
    sheet.getCell("A1").font = { size: 16, bold: true };

    sheet.addRow([
      `Customer: ${customer}`,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      `Date: ${new Date().toLocaleDateString()}`,
    ]);

    sheet.addRow([]);
    sheet.addRow(["Yarn Requirement Date", metrics.yarnReqDate]);
    sheet.addRow(["Production Start", metrics.productionStartDate]);
    sheet.addRow(["Estimated Completion", metrics.estimatedCompletionDate]);
    sheet.addRow(["Total Duration", `${metrics.totalDays} days`]);

    sheet.addRow([]);
    const header = sheet.addRow([
      "Step",
      "Process",
      "Responsible",
      "Days",
      "Target Date",
      "Actual Date",
      "Status",
      "Progress",
    ]);
    header.font = { bold: true, color: { argb: "FFFFFFFF" } };
    header.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E40AF" },
    };

    processes.forEach((p, i) => {
      const row = sheet.addRow([
        i + 1,
        p.process,
        p.responsible,
        p.days,
        p.targetDate,
        p.actualDate || "Not set",
        p.status.toUpperCase(),
        p.status === "completed"
          ? "100%"
          : p.status === "in-progress"
            ? "50%"
            : "0%",
      ]);
      if (p.status === "completed")
        row.getCell(7).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFDCFCE7" },
        };
      if (p.status === "delayed")
        row.getCell(7).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFEF2F2" },
        };
    });

    sheet.columns.forEach((col) => (col.width = 20));

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer]),
      `TA_Plan_${orderId}_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  const formatDDMMYYYY = (date?: string) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("en-GB"); // dd-mm-yyyy
  };

  const exportToPDF = () => {
    // A4 Landscape ONLY
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 6;
    const marginTop = 6;
    const usableWidth = pageWidth - marginX * 2;

    /**
     * STEP 1: BUILD WARP PLANS (loomId + warpMetersPlanned)
     */
    // type WarpPlan = {
    //   key: string;
    //   loomId: string;
    //   warp: number;
    //   label: string;
    // };

    // const warpPlans: WarpPlan[] = Array.from(
    //   new Map(
    //     processes.map((p, index) => {
    //       const key = `${p.loomId}|${p.warpMetersPlanned}`;
    //       return [
    //         key,
    //         {
    //           key,
    //           loomId: p.loomId,
    //           warp: p.warpMetersPlanned,
    //           label: `${p.loomId.slice(0, 6)} (${p.warpMetersPlanned} m)`,
    //         },
    //       ];
    //     }),
    //   ).values(),
    // );

    /**
     * STEP 1: BUILD WARP PLANS (loomName + warpMetersPlanned)
     */
    type WarpPlan = {
      key: string;
      loomId: string;
      loomName: string; // ✅ add loomName
      warp: number;
      label: string;
    };

    console.log(orderData);
    // Map loomId → loomName for easy lookup
    const loomMap = new Map(
      orderData.productionPlanning[0].loomsselected.map((l) => [l.id, l.name]),
    );
    const weaverMap = new Map(
      orderData.productionPlanning[0].loomsselected.map((l) => [
        l.id,
        l.assignedweaver,
      ]),
    );

    const warpPlans = Array.from(
      new Map(
        processes.map((p) => {
          const loomName = loomMap.get(p.loomId) || p.loomId; // fallback to id
          const key = `${p.loomId}|${p.warpMetersPlanned}|${p.beamIndex}`;
          return [
            key,
            {
              key,
              loomId: p.loomId,
              loomName,
              warp: p.warpMetersPlanned,
              label: `${loomName} (${p.warpMetersPlanned} m)`, // use name here
            },
          ];
        }),
      ).values(),
    );

    /**
     * STEP 2: GROUP BY PROCESS → WARP PLAN
     */
    const processMap = new Map<
      string,
      Record<string, { target?: string; actual?: string; responsible?: string }>
    >();

    processes.forEach((p) => {
      if (!processMap.has(p.process)) processMap.set(p.process, {});
      const key = `${p.loomId}|${p.warpMetersPlanned}|${p.beamIndex}`;

      processMap.get(p.process)![key] = {
        target: formatDDMMYYYY(p.targetDate),
        actual: formatDDMMYYYY(p.actualDate),
        responsible: p.responsible,
      };
    });

    /**
     * STEP 3: HEADER ROWS
     */
    const headerRow1: CellInput[] = [
      {
        content: "Time & Action Plan",
        styles: { halign: "center" as const, fontStyle: "bold" },
      },
      ...warpPlans.flatMap((w): CellInput[] => [
        {
          content: w.label,
          colSpan: 2,
          styles: { halign: "center" as const, fontStyle: "bold" },
        },
      ]),
    ];

    const headerRow2: CellInput[] = [
      { content: "Process", styles: { fontStyle: "bold" } },
      ...warpPlans.flatMap(() => [
        { content: "Target", styles: { halign: "center" as const } },
        { content: "Actual", styles: { halign: "center" as const } },
      ]),
    ];

    /**
     * STEP 4: BODY ROWS
     */
    const bodyRows: (string | CellInput)[][] = [];

    processMap.forEach((warpData, processName) => {
      const row: (string | CellInput)[] = [processName];

      warpPlans.forEach((w) => {
        const data = warpData[w.key];
        row.push(data?.target || "");
        row.push(data?.actual || "");
      });

      bodyRows.push(row);
    });

    /**
     * STEP 5: WARP METER PLANNED ROW
     */
    const warpRow: (string | CellInput)[] = ["Warp Meter Planned"];
    warpPlans.forEach((w) => {
      warpRow.push(w.warp.toString());
      warpRow.push("");
    });
    bodyRows.push(warpRow);

    /**
     * STEP 6: WEAVER ROW
     */
    const weaverRow: (string | CellInput)[] = ["Weaver"];
    warpPlans.forEach((w) => {
      const p = processes.find(
        (x) => x.loomId === w.loomId && x.warpMetersPlanned === w.warp,
      );
      weaverMap.get(p.loomId) || p.loomId;
      weaverRow.push(weaverMap.get(p.loomId) || p.responsible);
      weaverRow.push("");
    });
    bodyRows.push(weaverRow);

    /**
     * STEP 7: FORCE FULL WIDTH + REDUCE HEIGHT
     */
    const processColWidth = 46; // smaller to save height
    const remainingWidth = usableWidth - processColWidth;
    const perColWidth = remainingWidth / (warpPlans.length * 2);

    const columnStyles: any = {
      0: {
        cellWidth: processColWidth,
        overflow: "ellipsize", // prevent tall rows
      },
    };

    let col = 1;
    warpPlans.forEach(() => {
      columnStyles[col++] = { cellWidth: perColWidth };
      columnStyles[col++] = { cellWidth: perColWidth };
    });

    /**
     * STEP 8: DRAW TABLE (HEIGHT-COMPACT SETTINGS)
     */
    autoTable(doc, {
      head: [headerRow1, headerRow2],
      body: bodyRows,
      startY: marginTop,
      margin: { left: marginX, right: marginX },
      theme: "grid",

      styles: {
        fontSize: 9, // 🔑 VERY IMPORTANT
        cellPadding: 3.3, // 🔑 REDUCE ROW HEIGHT
        valign: "middle",
        overflow: "linebreak",
      },

      headStyles: {
        fillColor: [30, 64, 175],
        textColor: 255,
        fontSize: 9,
        halign: "center",
        valign: "middle",
      },

      columnStyles,

      pageBreak: "avoid",
      rowPageBreak: "avoid",
    });

    /**
     * STEP 9: SAVE
     */
    doc.save(`TA_Plan_${orderData.gptid}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
        <span>Loading Time & Action Plan...</span>
      </div>
    );
  }
  // const loomMap = useMemo(() => {
  //   const map = {};
  //   looms.forEach((loom) => {
  //     map[loom.id] = loom.name;
  //   });
  //   return map;
  // }, [looms]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white p-4 border rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="w-full md:w-1/2">
          <Label>Loom / Warp Plan</Label>
          <Select value={selectedWarpPlan} onValueChange={setSelectedWarpPlan}>
            <SelectTrigger>
              <SelectValue placeholder="Select Loom & Warp Plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Looms / All Warp Plans</SelectItem>
              {/* {warpPlanOptions.map((o) => { */}
              {/* {[...warpPlanOptions]
                .sort((a, b) => a.beamIndex - b.beamIndex)
                .map((o) => {
                  const key = `${o.loomId}|${o.warp}|${o.beamIndex}`;
                  return (
              
                    <SelectItem key={key} value={key}>
                      {looms.find((l) => l.id === o.loomId)?.name || o.loomId} –{" "}
                      {o.warp} meters – {o.beamIndex}
                    </SelectItem>
                  );
                })} */}
              {/* {Object.entries(
                [...warpPlanOptions]
                  .sort((a, b) => a.beamIndex - b.beamIndex) // sort first
                  .reduce((acc, o) => {
                    acc[o.loomId] = acc[o.loomId] || [];
                    acc[o.loomId].push(o);
                    return acc;
                  }, {}),
              ).map(([loomId, plans]) => (
                <div key={loomId}>
                  <div className="px-2 py-1 text-xs font-semibold text-gray-500">
                    {looms.find((l) => l.id === loomId)?.name || loomId}
                  </div>

                  {plans.map((o) => {
                    const key = `${o.loomId}|${o.warp}|${o.beamIndex}`;
                    return (
                      <SelectItem key={key} value={key}>
                        {o.warp} meters – Beam {o.beamIndex}
                      </SelectItem>
                    );
                  })}
                </div>
              ))} */}

              {[...warpPlanOptions]
                .sort((a, b) => {
                  if (a.loomId === b.loomId) {
                    return a.beamIndex - b.beamIndex; // same loom → sort by beam
                  }
                  return a.loomId.localeCompare(b.loomId); // different loom
                })
                .map((o, index, arr) => {
                  const showLoomHeader =
                    index === 0 || arr[index - 1].loomId !== o.loomId;

                  const loomName =
                    looms.find((l) => l.id === o.loomId)?.name || o.loomId;

                  const key = `${o.loomId}|${o.warp}|${o.beamIndex}`;

                  return (
                    <div key={key}>
                      {showLoomHeader && (
                        <div className="px-2 py-1 text-xs font-semibold text-gray-500">
                          {loomName}
                        </div>
                      )}

                      <SelectItem value={key}>
                        {o.warp} meters – Beam {o.beamIndex}
                      </SelectItem>
                    </div>
                  );
                })}
            </SelectContent>
          </Select>
        </div>

        {selectedWarpPlan !== "all" && (
          <div className="bg-blue-50 border border-blue-200 rounded-md px-4 py-2 text-sm">
            <div>
              <strong>Loom:</strong>{" "}
              {looms.find((l) => l.id === selectedWarpPlan.split("|")[0])?.name}
              {/* {selectedWarpPlan.split("|")[0].slice(0, 6)} */}
            </div>
            <div>
              <strong>Warp Meters Planned:</strong>{" "}
              {selectedWarpPlan.split("|")[1]} m
            </div>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold">
              Overall Time & Action Plan
            </h3>
            <p className="text-sm text-gray-600">
              {orderData?.gptid} - {customer}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-600">
              {progressPercentage}%
            </div>
            <div className="text-sm text-gray-500">
              {completedCount}/{processes.length} completed
            </div>
          </div>
        </div>
        <Progress value={progressPercentage} className="h-3" />
      </div>

      {/* Metrics */}
      {/* <div className="bg-amber-50 p-6 rounded-lg border border-amber-200">
        <div className="flex items-center mb-3">
          <Calculator className="h-5 w-5 text-amber-600 mr-2" />
          <h4 className="font-semibold text-amber-800">
            Formula-Based Calculations
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-amber-700">
          <div>
            <strong>Yarn Requirement Date:</strong> {metrics.yarnReqDate}
            <span className="text-xs block text-amber-600">
              (Order Creation Date)
            </span>
          </div>
          <div>
            <strong>Production Start:</strong> {metrics.productionStartDate}
          </div>
          <div>
            <strong>Estimated Completion:</strong>{" "}
            {metrics.estimatedCompletionDate}
          </div>
          <div>
            <strong>Total Duration:</strong> {metrics.totalDays} days
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="mt-4"
          onClick={recalculateDates}
        >
          <Calculator className="h-4 w-4 mr-2" />
          Recalculate Dates
        </Button>
      </div> */}

      {/* Process List */}

      <div className="space-y-4">
        <h4 className="text-lg font-semibold mb-4">Process Timeline</h4>

        {visibleProcesses.length === 0 ? (
          <div className="bg-white p-6 border rounded-lg text-center text-gray-500">
            No T&amp; A Plan
          </div>
        ) : (
          visibleProcesses.map((process, index) => {
            const isEditing = !!editingProcess[process.id];
            const current = isEditing
              ? { ...process, ...(editingProcess[process.id] || {}) }
              : process;
            const isSaving = savingIds.has(process.id);

            return (
              <div
                key={process.id}
                className="bg-white p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(current.status)}
                    <div>
                      <h5 className="font-semibold">{current.process}</h5>
                      <p className="text-sm text-gray-500">
                        Step {index + 1} • {current.days} day(s) •{" "}
                        {current.responsible}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={getStatusColor(current.status)}
                    >
                      {current.status.replace("-", " ").toUpperCase()}
                    </Badge>
                    {!isEditing ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(process)}
                      >
                        Edit
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={current.status}
                      onValueChange={(v) =>
                        updateField(process.id, "status", v)
                      }
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="delayed">Delayed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Target Date</Label>
                    <Input
                      type="date"
                      value={current.targetDate}
                      onChange={(e) =>
                        updateField(process.id, "targetDate", e.target.value)
                      }
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label>
                      Actual Date{" "}
                      {current.status === "completed" && (
                        <span className="text-red-500">*</span>
                      )}
                    </Label>
                    <Input
                      type="date"
                      value={current.actualDate || ""}
                      onChange={(e) =>
                        updateField(process.id, "actualDate", e.target.value)
                      }
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => cancelEdit(process.id)}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => saveProcess(process.id)}
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving..." : <>Save Process</>}
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* <div className="space-y-4">
        <h4 className="text-lg font-semibold mb-4">Process Timeline</h4>
        {visibleProcesses.map((process, index) => {
          const isEditing = !!editingProcess[process.id];
          const current = isEditing
            ? { ...process, ...(editingProcess[process.id] || {}) }
            : process;
          const isSaving = savingIds.has(process.id);

          return (
            <div
              key={process.id}
              className="bg-white p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(current.status)}
                  <div>
                    <h5 className="font-semibold">{current.process}</h5>
                    <p className="text-sm text-gray-500">
                      Step {index + 1} • {current.days} day(s) •{" "}
                      {current.responsible}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={getStatusColor(current.status)}
                  >
                    {current.status.replace("-", " ").toUpperCase()}
                  </Badge>
                  {!isEditing ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(process)}
                    >
                      Edit
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label>Status</Label>
                  <Select
                    value={current.status}
                    onValueChange={(v) => updateField(process.id, "status", v)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="delayed">Delayed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Target Date</Label>
                  <Input
                    type="date"
                    value={current.targetDate}
                    onChange={(e) =>
                      updateField(process.id, "targetDate", e.target.value)
                    }
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label>
                    Actual Date{" "}
                    {current.status === "completed" && (
                      <span className="text-red-500">*</span>
                    )}
                  </Label>
                  <Input
                    type="date"
                    value={current.actualDate || ""}
                    onChange={(e) =>
                      updateField(process.id, "actualDate", e.target.value)
                    }
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => cancelEdit(process.id)}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => saveProcess(process.id)}
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : <>Save Process</>}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div> */}

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t">
        <Button variant="outline" size="lg" onClick={exportToPDF}>
          <Download className="h-4 w-4 mr-2" />
          Export T&A Plan
        </Button>
      </div>
    </div>
  );
};
