import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download } from "lucide-react";
import ENDPOINTS from "@/services/api";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { loomApi, orderApi } from "@/services/api2";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { standardProcesses } from "@/lib/orderStorage";

interface TAProcess {
  id: string;
  process: string;
  days: number;
  responsible: string;
  status: "pending" | "in-progress" | "completed" | "delayed";
  targetDate: string;
  loomId?: string;
  loomName?: string;
}

interface InlineTimeActionPlanNewProps {
  orderId: string;
  customer: string;
  onSave: (processes: TAProcess[]) => void;
  // onSave: (data: { processes: TAProcess[]; fullLength: number }) => void;
}

export const InlineTimeActionPlanNew: React.FC<
  InlineTimeActionPlanNewProps
> = ({ orderId, customer, onSave }) => {
  const [processes, setProcesses] = useState<TAProcess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // const [loomId, setLoomId] = useState("");
  const [selectedLoom, setSelectedLoom] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [warpMeter, setwarpMeter] = useState<string>("");
  const [beamCount, setbeamCount] = useState("");
  const [availableWarp, setAvailableWarp] = useState<number | null>(null);

  const { toast } = useToast();
  const [looms, setLooms] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const formatDateFromString = (date: string | null): string =>
    date ? new Date(date).toISOString().split("T")[0] : "";

  const formatDateFromDate = (date: Date): string =>
    date.toISOString().split("T")[0];

  // const buildDefaultProcesses = () =>
  //   standardProcesses.map((p, index) => ({
  //     id: String(index),
  //     process: p.name,
  //     days: p.days,
  //     responsible: p.responsible,
  //     // status: "pending",
  //     status: "pending" as "pending" | "in-progress" | "completed" | "delayed",

  //     targetDate: "",
  //   }));

  // useEffect(() => {
  //   const fetchLooms = async () => {
  //     try {
  //       const response = await loomApi.get("/loom-getall");
  //       // console.log(response);
  //       setLooms(response.data.loom);
  //       // setFilteredWeavers(response.data.weaver);
  //       setError("");
  //     } catch (err) {
  //       setError(err.response?.error || "Error fetching looms");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchLooms();
  // }, []);

  const buildDefaultProcesses = () => {
    let currentDate = new Date();

    return standardProcesses.map((p, index) => {
      currentDate = addDays(currentDate, p.days);

      return {
        id: String(index),
        process: p.name,
        days: p.days,
        responsible: p.responsible,
        processstep: p.processstep,
        status: "pending" as const,
        targetDate: formatDateFromDate(currentDate), // ✅ correct
      };
    });
  };

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await ENDPOINTS.getOrderById(orderId);
      const order = res.data.order;
      console.log(order);

      // const mapped: TAProcess[] = (order.timeAndActionPlans || []).map(
      //   (p: any) => ({
      //     id: p.id,
      //     process: p.process,
      //     days: Number(p.days),
      //     responsible: p.responsible,
      //     status: p.tastatus || "pending",
      //     targetDate: formatDate(p.targetdate),
      //   }),
      // );

      // setProcesses(mapped);
      setProcesses(buildDefaultProcesses());

      console.log(order.productionPlanning[0].loomsselected);
      setLooms(order.productionPlanning[0].loomsselected);
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
    if (orderId) fetchOrder();
  }, [orderId]);

  const updateTargetDate = (id: string, value: string) => {
    setProcesses((prev) =>
      prev.map((p) => (p.id === id ? { ...p, targetDate: value } : p)),
    );
  };

  // const saveAll = async () => {
  //   if (isSaving) return; // extra safety

  //   const missing = processes.some((p) => !p.targetDate);

  //   if (!warpMeter) {
  //     toast({
  //       variant: "destructive",
  //       title: "Warp Meter Required",
  //       description: "Please Enter Warp Meter Planned",
  //     });
  //     return;
  //   }

  //   if (!selectedLoom) {
  //     toast({
  //       variant: "destructive",
  //       title: "Loom is Required",
  //       description: "Please select Loom",
  //     });
  //     return;
  //   }

  //   if (missing) {
  //     toast({
  //       variant: "destructive",
  //       title: "Target Date Required",
  //       description: "Please select Target Date for all processes",
  //     });
  //     return;
  //   }

  //   try {
  //     setIsSaving(true);

  //     const updatedProcesses = processes.map((p) => ({
  //       ...p,
  //       loomId: selectedLoom.id,
  //       loomName: selectedLoom.name,
  //       warpMeter,
  //       orderid: orderId,
  //     }));

  //     await orderApi.post("/taplan-create", {
  //       updatedProcesses,
  //     });

  //     toast({
  //       title: "Saved",
  //       description: "Time & Action Plan saved successfully",
  //     });
  //     onSave(processes);
  //   } catch (err: any) {
  //     console.log(err);
  //     if (err.response.data.details !== undefined) {
  //       setAvailableWarp(err.response.data.details.available);
  //     }

  //     toast({
  //       variant: "destructive",
  //       title: "Save Failed",
  //       description:
  //         err.response.data.error || "Unable to save Time & Action Plan",
  //     });
  //   } finally {
  //     setIsSaving(false);
  //   }
  // };

  const saveAll = async () => {
    if (isSaving) return; // extra safety

    const missing = processes.some((p) => !p.targetDate);

    if (!warpMeter) {
      toast({
        variant: "destructive",
        title: "Warp Meter Required",
        description: "Please Enter Warp Meter Planned",
      });
      return;
    }
    if (!beamCount) {
      toast({
        variant: "destructive",
        title: "Beam Count Required",
        description: "Please Enter Beam Count",
      });
      return;
    }
    if (!selectedLoom) {
      toast({
        variant: "destructive",
        title: "Loom is Required",
        description: "Please select Loom",
      });
      return;
    }

    if (missing) {
      toast({
        variant: "destructive",
        title: "Target Date Required",
        description: "Please select Target Date for all processes",
      });
      return;
    }

    try {
      setIsSaving(true);

      const updatedProcesses = processes.map((p, index, arr) => {
        const prevDate = index === 0 ? null : arr[index - 1].targetDate;
        const days =
          prevDate && p.targetDate
            ? Math.max(
                Math.round(
                  (new Date(p.targetDate).getTime() -
                    new Date(prevDate).getTime()) /
                    (1000 * 60 * 60 * 24),
                ),
                0,
              )
            : 0;

        return {
          ...p,
          loomId: selectedLoom.id,
          loomName: selectedLoom.name,
          warpMeter,
          beamCount,
          orderid: orderId,
          days,
        };
      });

      await orderApi.post("/taplan-create", {
        updatedProcesses,
      });

      toast({
        title: "Saved",
        description: "Time & Action Plan saved successfully",
      });
      onSave(processes);
    } catch (err: any) {
      console.log(err);
      if (err.response.data.details !== undefined) {
        setAvailableWarp(err.response.data.details.available);
      }

      toast({
        variant: "destructive",
        title: "Save Failed",
        description:
          err.response.data.error || "Unable to save Time & Action Plan",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("T&A Plan");

    sheet.addRow(["Process", "Responsible", "Days", "Target Date", "Status"]);

    processes.forEach((p) =>
      sheet.addRow([p.process, p.responsible, p.days, p.targetDate, p.status]),
    );

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `TA_Plan_${orderId}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        Loading Time & Action Plan...
      </div>
    );
  }

  //   return (
  //     <div className="space-y-6">
  //       <Progress value={progressPercentage} />

  //       {processes.map((process, index) => (
  //         <div key={process.id} className="border p-5 rounded-lg">
  //           <h4 className="font-semibold">
  //             Step {index + 1}: {process.process}
  //           </h4>

  //           <div className="grid md:grid-cols-3 gap-4 mt-4 items-end">
  //             <div>
  //               <Label>Responsible</Label>
  //               <div className="text-sm">{process.responsible}</div>
  //             </div>

  //             <div>
  //               <Label>
  //                 Target Date <span className="text-red-500">*</span>
  //               </Label>
  //               <Input
  //                 type="date"
  //                 value={process.targetDate}
  //                 onChange={(e) => updateTargetDate(process.id, e.target.value)}
  //                 required
  //               />
  //             </div>

  //             <div>
  //               <Label>Days</Label>
  //               <div className="text-sm">{process.days}</div>
  //             </div>
  //           </div>
  //         </div>
  //       ))}

  //       <div className="flex justify-between">
  //         <Button variant="outline" onClick={exportToExcel}>
  //           <Download className="h-4 w-4 mr-2" />
  //           Export T&A Plan
  //         </Button>

  //         <Button onClick={saveAll}>Save All</Button>
  //       </div>
  //     </div>
  //   );

  return (
    <div className="space-y-3">
      {/* <Progress value={progressPercentage} className="h-2" /> */}
      <div className="grid md:grid-cols-2 gap-2 mt-2 items-end text-sm">
        <div className="space-y-1">
          <Label className="text-xs">Loom</Label>
          <Select
            value={selectedLoom?.id}
            onValueChange={(loomId) => {
              const loom = looms.find((l) => l.id === loomId);
              if (loom) {
                setSelectedLoom({ id: loom.id, name: loom.name });
              }
            }}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select loom" />
            </SelectTrigger>
            <SelectContent>
              {looms.map((loom) => (
                <SelectItem key={loom.id} value={loom.id}>
                  {loom.name} ({loom.id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="warpMeter" className="text-xs">
            Warp Meter Planned
          </Label>
          <Input
            id="warpMeter"
            type="number"
            value={warpMeter}
            onChange={(e) => {
              const val = e.target.value;
              if (val.length <= 7) {
                setwarpMeter(val);
              }
            }}
            placeholder="2500"
            className="h-8"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="beamCount" className="text-xs">
            Beam Count
          </Label>
          <Input
            id="beamCount"
            type="number"
            value={beamCount}
            onChange={(e) => {
              const val = e.target.value;
              if (val.length <= 7) {
                setbeamCount(val);
              }
            }}
            placeholder="1800"
            className="h-8"
          />
        </div>
        {availableWarp !== null && (
          <p className="text-xs text-red-500">
            Available warp meters: {availableWarp}
          </p>
        )}
      </div>
      {processes.map((process, index) => (
        <div key={process.id} className="border p-3 rounded-md">
          <h4 className="font-medium text-sm">
            {index + 1}. {process.process}
          </h4>

          <div className="grid md:grid-cols-2 gap-2 mt-2 items-end text-sm">
            <div>
              <Label className="text-xs">Responsible</Label>
              <div>{process.responsible}</div>
            </div>

            <div>
              <Label className="text-xs">
                Target Date <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={process.targetDate}
                onChange={(e) => updateTargetDate(process.id, e.target.value)}
                className="h-8"
                required
              />
            </div>

            {/* <div>
              <Label className="text-xs">Days</Label>
              <div>{process.days}</div>
            </div> */}
          </div>
        </div>
      ))}

      <div className="flex justify-between pt-1">
        <Button variant="outline" size="sm" onClick={exportToExcel}>
          <Download className="h-4 w-4 mr-1" />
          Export
        </Button>

        {/* <Button size="sm" onClick={saveAll}>
          Save
        </Button> */}
        <Button size="sm" onClick={saveAll} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Saving...
            </>
          ) : (
            "Save"
          )}
        </Button>
      </div>
    </div>
  );
};
