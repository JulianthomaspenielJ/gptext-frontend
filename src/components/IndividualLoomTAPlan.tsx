import React, { useState, useEffect, useRef } from "react";

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
  AlertCircle,
  Factory,
  Loader2,
  Download,
} from "lucide-react";
import ENDPOINTS from "@/services/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

interface TAProcess {
  id: string; // ← Real backend UUID
  process: string;
  days: number;
  responsible: string;
  status: "pending" | "in-progress" | "completed" | "delayed";
  targetDate: string;
  actualDate?: string;
  loomId: string;
}

interface IndividualLoomTAPlanProps {
  orderId: string;
  customer: string;
  selectedLooms: { id: string; name?: string }[];
  onSave: (loomPlans: { [loomId: string]: TAProcess[] }) => void;
  onProgressUpdate?: (orderId: string, progress: number) => void;
}

export const IndividualLoomTAPlan: React.FC<IndividualLoomTAPlanProps> = ({
  orderId,
  customer,
  selectedLooms,
  onSave,
  onProgressUpdate,
}) => {
  const [loomPlans, setLoomPlans] = useState<{ [loomId: string]: TAProcess[] }>(
    {},
  );
  const [editingProcess, setEditingProcess] = useState<
    Record<string, Partial<TAProcess>>
  >({});
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const { toast } = useToast();
  const [loomNameMap, setLoomNameMap] = useState<Record<string, string>>({});
  const loomIds = selectedLooms.map((l) => l.id);
  const getLoomName = (loomId: string): string => {
    const loom = selectedLooms.find((l) => l.id === loomId);
    return loom?.name || loomId;
  };

  const formatDate = (date: string | null): string =>
    date ? new Date(date).toISOString().split("T")[0] : "";

  const toIsoDate = (dateStr: string): string =>
    new Date(dateStr + "T00:00:00.000Z").toISOString();

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await ENDPOINTS.getOrderById(orderId);
      const order = res.data.order;
      console.log(order);

      const newPlans: { [loomId: string]: TAProcess[] } = {};

      loomIds.forEach((loomId) => {
        const loomSpecificPlans = (order.timeAndActionPlans || []).filter(
          (p: any) => p.loomid === loomId,
        );

        if (loomSpecificPlans.length > 0) {
          newPlans[loomId] = loomSpecificPlans.map((p: any) => ({
            id: p.id,
            process: p.process,
            days: parseInt(p.days),
            responsible: p.responsible,
            status: p.tastatus,
            targetDate: formatDate(p.targetdate),
            actualDate: p.actualdate ? formatDate(p.actualdate) : undefined,
            loomId,
          }));
        } else {
          // Fallback: generate default plan if none exists
          newPlans[loomId] = [];
        }
      });

      setLoomPlans(newPlans);
      setActiveTab(loomIds[0] || "");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Load Failed",
        description: "Could not load loom plans",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId && loomIds.length > 0 && Object.keys(loomPlans).length === 0) {
      fetchOrder();
    }
  }, [orderId, loomIds]);

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
    setEditingProcess((prev) => ({ ...prev, [process.id]: { ...process } }));
  };

  const updateField = (
    processId: string,
    field: keyof TAProcess,
    value: string,
  ) => {
    setEditingProcess((prev) => ({
      ...prev,
      [processId]: { ...(prev[processId] || {}), [field]: value },
    }));
  };

  const cancelEdit = (processId: string) => {
    setEditingProcess((prev) => {
      const updated = { ...prev };
      delete updated[processId];
      return updated;
    });
  };

  const saveProcess = async (processId: string) => {
    const changes = editingProcess[processId];
    if (!changes) return;

    if (changes.status === "completed" && !changes.actualDate) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Actual date required for Completed",
      });
      return;
    }

    setSavingIds((prev) => new Set([...prev, processId]));

    try {
      // Apply changes locally (temporarily) so we can accurately calculate new overall progress
      const tempLoomPlans = { ...loomPlans };
      Object.keys(tempLoomPlans).forEach((loomId) => {
        tempLoomPlans[loomId] = tempLoomPlans[loomId].map((p) =>
          p.id === processId ? { ...p, ...changes } : p,
        );
      });

      // Calculate overall progress across ALL looms
      const allProcesses = Object.values(tempLoomPlans).flat();
      const completedCount = allProcesses.filter(
        (p) => p.status === "completed",
      ).length;
      const newOverallProgress = allProcesses.length
        ? Math.round((completedCount / allProcesses.length) * 100)
        : 0;

      // Build payload – include progressPercentage
      const payload: any = {
        tastatus: changes.status,
        progressPercentage: newOverallProgress, // ← This will update orders.progresspercentage
      };

      if (changes.targetDate !== undefined) {
        payload.targetdate = toIsoDate(changes.targetDate);
      }
      if (changes.actualDate !== undefined) {
        payload.actualdate = changes.actualDate
          ? toIsoDate(changes.actualDate)
          : null;
      }

      // Single API call: update the process + send overall progress
      await ENDPOINTS.updateTAPlan(processId, payload);

      // Refetch fresh data from backend (ensures sync)
      await fetchOrder();

      // Notify parent component (e.g., order list) about new overall progress
      onProgressUpdate?.(orderId, newOverallProgress);

      toast({ title: "Saved", description: "Process updated successfully" });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: err.response?.data?.message || "Could not update process",
      });
    } finally {
      setSavingIds((prev) => {
        const s = new Set(prev);
        s.delete(processId);
        return s;
      });
      cancelEdit(processId);
    }
  };

  const getLoomProgress = (loomId: string) => {
    const procs = loomPlans[loomId] || [];
    const completed = procs.filter((p) => p.status === "completed").length;
    return procs.length ? Math.round((completed / procs.length) * 100) : 0;
  };

  const getOverallProgress = () => {
    const all = Object.values(loomPlans).flat();
    const completed = all.filter((p) => p.status === "completed").length;
    return all.length ? Math.round((completed / all.length) * 100) : 0;
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Loom T&A Plans");

    sheet.mergeCells("A1:J1");
    sheet.getCell("A1").value =
      `Individual Loom T&A Plans - ${orderId} - ${customer}`;
    sheet.getCell("A1").font = { size: 16, bold: true };

    let rowNum = 3;
    for (const loomId of loomIds) {
      const plans = loomPlans[loomId] || [];
      if (plans.length === 0) continue;

      sheet.addRow([
        `Loom: ${getLoomName(loomId)}`,
        "",
        "",
        "",
        "",
        "",
        `Progress: ${getLoomProgress(loomId)}%`,
      ]);
      sheet.getRow(rowNum).font = { bold: true, size: 13 };
      rowNum++;

      const header = sheet.addRow([
        "Step",
        "Process",
        "Responsible",
        "Days",
        "Target",
        "Actual",
        "Status",
      ]);
      header.font = { bold: true, color: { argb: "FFFFFFFF" } };
      header.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF6366F1" },
      };

      plans.forEach((p, i) => {
        const row = sheet.addRow([
          i + 1,
          p.process,
          p.responsible,
          p.days,
          p.targetDate,
          p.actualDate || "-",
          p.status.toUpperCase(),
        ]);
        if (p.status === "completed")
          row.getCell(7).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFDCFCE7" },
          };
      });

      rowNum += plans.length + 2;
    }

    sheet.columns.forEach((c) => (c.width = 18));
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer]),
      `Loom_TA_Plans_${orderId}_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  // Index of the currently active loom tab (must be before early returns for stable hook order)
  const currentIndex = loomIds.indexOf(activeTab || loomIds[0]);

  // Keep a ref to the tabs list so we can scroll the active tab into view
  const tabsListRef = useRef<HTMLDivElement | null>(null);

  // Whenever the active tab changes, make sure its trigger is scrolled into view
  useEffect(() => {
    if (!tabsListRef.current) return;
    const activeEl = tabsListRef.current.querySelector(
      '[data-state="active"]',
    ) as HTMLElement | null;

    if (activeEl && typeof activeEl.scrollIntoView === "function") {
      activeEl.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [activeTab, loomIds.length]);

  const goToPrevLoom = () => {
    if (!loomIds.length) return;
    const safeIndex = currentIndex >= 0 ? currentIndex : 0;
    const prevIndex = Math.max(0, safeIndex - 1);
    setActiveTab(loomIds[prevIndex]);
  };

  const goToNextLoom = () => {
    if (!loomIds.length) return;
    const safeIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex = Math.min(loomIds.length - 1, safeIndex + 1);
    setActiveTab(loomIds[nextIndex]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600 mr-3" />
        <span>Loading Individual Loom Plans...</span>
      </div>
    );
  }

  if (selectedLooms.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">No looms selected</div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg border border-purple-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Individual Loom T&A Plans
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {orderId} - {customer}
            </p>
            <p className="text-sm text-gray-500">
              Managing {loomIds.length} looms
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-600">
              {getOverallProgress()}%
            </div>
            <div className="text-sm text-gray-500">Overall Progress</div>
          </div>
        </div>
        <Progress value={getOverallProgress()} className="h-3" />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* Loom header strip with prev/next controls */}
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={goToPrevLoom}
            disabled={currentIndex <= 0}
          >
            &#8249;
          </Button>

          {/* Horizontally scrollable loom headers, showing ~2 at a time */}
          <TabsList
            ref={tabsListRef}
            className="flex-1 w-full overflow-x-auto overflow-y-hidden flex gap-2 pb-1 [&::-webkit-scrollbar]:hidden scrollbar-none"
          >
            {loomIds.map((loomId) => (
              <TabsTrigger
                key={loomId}
                value={loomId}
                className="flex-0 min-w-[50%] flex items-center justify-center whitespace-nowrap border border-transparent data-[state=active]:border-purple-500 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-900 rounded-md"
              >
                <Factory className="h-4 w-4 mr-2" />
                Loom {getLoomName(loomId)}
                <Badge className="ml-2 text-xs" variant="outline">
                  {getLoomProgress(loomId)}%
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={goToNextLoom}
            disabled={currentIndex >= loomIds.length - 1}
          >
            &#8250;
          </Button>
        </div>

        {loomIds.map((loomId) => (
          <TabsContent key={loomId} value={loomId} className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-blue-800">
                    Loom {getLoomName(loomId)} T&A Plan
                  </h4>
                  <p className="text-sm text-blue-600">
                    {(loomPlans[loomId] || []).length} processes
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {getLoomProgress(loomId)}%
                  </div>
                  <div className="text-sm text-blue-500">
                    {
                      (loomPlans[loomId] || []).filter(
                        (p) => p.status === "completed",
                      ).length
                    }
                    /{(loomPlans[loomId] || []).length}
                  </div>
                </div>
              </div>
              <Progress value={getLoomProgress(loomId)} className="mt-3 h-2" />
            </div>

            <div className="space-y-4">
              {(loomPlans[loomId] || []).map((process, idx) => {
                const isEditing = !!editingProcess[process.id];
                const current = isEditing
                  ? { ...process, ...editingProcess[process.id] }
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
                            Step {idx + 1} • {current.days} day(s) •{" "}
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
                        {!isEditing && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(process)}
                          >
                            Edit
                          </Button>
                        )}
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
                            <SelectItem value="in-progress">
                              In Progress
                            </SelectItem>
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
                            updateField(
                              process.id,
                              "targetDate",
                              e.target.value,
                            )
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
                            updateField(
                              process.id,
                              "actualDate",
                              e.target.value,
                            )
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
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Footer */}
      <div className="flex justify-between items-center pt-6 border-t">
        <Button variant="outline" size="lg" onClick={exportToExcel}>
          <Download className="h-4 w-4 mr-2" />
          Export All Loom Plans
        </Button>
      </div>
    </div>
  );
};
