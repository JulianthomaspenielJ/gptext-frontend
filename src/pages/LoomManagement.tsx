import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MaintenanceScheduler } from "@/components/MaintenanceScheduler";
import { LoomForm } from "@/components/LoomForm";
import { LoomStatusUpdate } from "@/components/LoomStatusUpdate";
import { LoomAlerts } from "@/components/LoomAlerts";
import { SearchFilter } from "@/components/SearchFilter";
import { LoomStorage, Loom } from "@/lib/loomStorage";
import { DataStore } from "@/lib/dataStore";
import * as XLSX from "xlsx";

import {
  Factory,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  Wrench,
  Eye,
  Edit,
  Trash2,
  User,
  Search,
  Filter,
  Upload,
} from "lucide-react";
import { loomApi, loomOptionsApi } from "@/services/api2";
import { useToast } from "@/hooks/use-toast";

const getStatusColor = (status: string) => {
  switch (status) {
    case "Running":
      return "bg-green-500";
    case "Maintenance":
      return "bg-yellow-500";
    case "Idle":
      return "bg-gray-500";
    default:
      return "bg-red-500";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "Running":
      return <CheckCircle className="h-4 w-4" />;
    case "Maintenance":
      return <Wrench className="h-4 w-4" />;
    case "Idle":
      return <Clock className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

export default function LoomManagement() {
  const [looms, setLooms] = useState([]);
  const [filteredLooms, setFilteredLooms] = useState([]);
  const [isMaintenanceSchedulerOpen, setIsMaintenanceSchedulerOpen] =
    useState(false);
  const [selectedLoomForMaintenance, setSelectedLoomForMaintenance] =
    useState("");
  const [isLoomFormOpen, setIsLoomFormOpen] = useState(false);
  const [selectedLoom, setSelectedLoom] = useState<Loom | null>(null);
  const [formMode, setFormMode] = useState<"view" | "edit" | "create">("view");
  const [isStatusUpdateOpen, setIsStatusUpdateOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  const { toast } = useToast();
  const [loomOptions, setLoomOptions] = useState({
    loomTypes: [],
    loomStatus: [],
  });
  // useEffect(() => {
  //   // Load looms from LoomStorage
  //   const loomData = LoomStorage.getLooms();
  //   setLooms(loomData);
  //   setFilteredLooms(loomData);
  // }, []);

  useEffect(() => {
    const fetchLooms = async () => {
      setLoading(true);

      try {
        const response = await loomApi.get("/loom-getall");
        // console.log(response);
        setLooms(response.data.loom);
        setFilteredLooms(response.data.loom);
        setError("");
      } catch (err) {
        setError(err.response?.error || "Error fetching looms");
      } finally {
        setLoading(false);
      }
    };

    fetchLooms();
  }, []);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await loomOptionsApi.get("/loom-options");
        // console.log(response);
        // setWeavers(response.data.weaver);
        // setFilteredWeavers(response.data.weaver);
        const loomTypes = (response.data.loomTypes || []).map(
          (lt: any) => lt.loomtype,
        );
        const loomStatus = (response.data.loomStatus || []).map(
          (ls: any) => ls.loomstatus,
        );

        setLoomOptions({ loomTypes, loomStatus });
      } catch (err) {
        setError(err.response?.error || "Error fetching options");
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, []);

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredLooms(looms);
      return;
    }

    const filtered = looms.filter((loom) =>
      // loom.id.toLowerCase().includes(query.toLowerCase()) ||
      // loom.loomtype.toLowerCase().includes(query.toLowerCase()) ||
      // loom.assignedweaver.toLowerCase().includes(query.toLowerCase()) ||
      // loom.location.toLowerCase().includes(query.toLowerCase()),
      loom.name.toLowerCase().includes(query.toLowerCase()),
    );
    setFilteredLooms(filtered);
  };

  const handleFilter = (filters: any) => {
    let filtered = [...looms];

    if (filters.status) {
      filtered = filtered.filter((loom) => loom.status === filters.status);
    }

    if (filters.type) {
      filtered = filtered.filter((loom) => loom.loomtype === filters.type);
    }

    setFilteredLooms(filtered);
  };

  const handleClearFilters = () => {
    setFilteredLooms(looms);
  };

  const handleMaintenanceSchedule = (data: any) => {
    console.log("Maintenance scheduled:", data);
    alert(
      `Maintenance scheduled for ${data.loomId}\nType: ${data.maintenanceType}\nDate: ${data.scheduledDate}\nTechnician: ${data.assignedTechnician || "TBD"}`,
    );
  };

  const handleViewLoom = (loom: Loom) => {
    setSelectedLoom(loom);
    setFormMode("view");
    setIsLoomFormOpen(true);
  };

  const handleEditLoom = (loom: Loom) => {
    setSelectedLoom(loom);
    setFormMode("edit");
    setIsLoomFormOpen(true);
  };

  const handleAddLoom = () => {
    setSelectedLoom(null);
    setFormMode("create");
    setIsLoomFormOpen(true);
  };

  // const handleDeleteLoom = (loomId: string) => {
  //   if (confirm("Are you sure you want to delete this loom?")) {
  //     LoomStorage.deleteLoom(loomId);
  //     const updatedLooms = LoomStorage.getLooms();
  //     setLooms(updatedLooms);
  //     setFilteredLooms(updatedLooms);
  //   }
  // };

  const handleDeleteLoom = (loomId: string) => {
    if (confirm("Are you sure you want to delete this loom?")) {
      const deleteLoom = async () => {
        try {
          const response = await loomApi.delete(`/loom-delete/${loomId}`);
          // console.log(response);
          setLooms((prevWeavers) => prevWeavers.filter((w) => w.id !== loomId));
          setFilteredLooms((prevWeavers) =>
            prevWeavers.filter((w) => w.id !== loomId),
          );

          // setWeavers(response.data.weaver);
          // setFilteredWeavers(response.data.weaver);
          setError("");
          toast({
            title: "Success",
            description: `Loom deleted successfully`,
          });
        } catch (err) {
          setError(err.response?.error || "Error deleting loom");
          console.log(err);
          toast({
            title: "Error",
            description:
              err.response.data.error ||
              "Failed to delete loom. Please try again.",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      };

      deleteLoom();
      // WeaverStorage.deleteWeaver(weaverId);
      // setWeavers(WeaverStorage.getWeavers());
    }
  };

  // const handleSaveLoom = (loomData: Loom) => {
  //   if (formMode === "create") {
  //     LoomStorage.addLoom(loomData);
  //   } else {
  //     LoomStorage.updateLoom(loomData.id, loomData);
  //   }
  //   const updatedLooms = LoomStorage.getLooms();
  //   setLooms(updatedLooms);
  //   setFilteredLooms(updatedLooms);
  // };

  const handleSaveLoom = (loomData: any) => {
    console.log(loomData);
    if (formMode === "create") {
      // WeaverStorage.addWeaver(weaverData);
      setLooms((prevLooms) => [loomData, ...prevLooms]); // add to end
      setFilteredLooms((prevFiltered) => [loomData, ...prevFiltered]); // if you have filtered list
    } else if (formMode === "edit") {
      // WeaverStorage.updateWeaver(weaverData.id, weaverData);
      setLooms((prevWeavers) =>
        prevWeavers.map((w) => (w.id === loomData.id ? loomData : w)),
      );

      setFilteredLooms((prevFiltered) =>
        prevFiltered.map((w) => (w.id === loomData.id ? loomData : w)),
      );
    }
    // const updatedWeavers = WeaverStorage.getWeavers();
    // setWeavers(weaverData);
    // setFilteredWeavers(weaverData);

    // navigate(0);
    setIsLoomFormOpen(false);
    // console.log(looms);
  };

  const handleStatusUpdate = (loomId: string, newStatus: string) => {
    LoomStorage.updateLoom(loomId, { status: newStatus as any });
    const updatedLooms = LoomStorage.getLooms();
    setLooms(updatedLooms);
    setFilteredLooms(updatedLooms);
  };

  const getLoomAlerts = () => {
    const today = new Date();
    const alerts = [];

    looms.forEach((loom) => {
      // Maintenance alerts
      if (loom.status === "Maintenance") {
        alerts.push({
          id: `${loom.id}-maintenance`,
          type: "warning",
          message: `Loom ${loom.id} is currently under maintenance`,
          loomId: loom.id,
          priority: "High",
        });
      }

      // Upcoming maintenance
      const maintenanceDate = new Date(loom.nextMaintenance);
      const daysUntilMaintenance = Math.ceil(
        (maintenanceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysUntilMaintenance <= 7 && daysUntilMaintenance > 0) {
        alerts.push({
          id: `${loom.id}-upcoming`,
          type: "info",
          message: `Loom ${loom.id} maintenance due in ${daysUntilMaintenance} days`,
          loomId: loom.id,
          priority: daysUntilMaintenance <= 3 ? "High" : "Medium",
        });
      }

      // Overdue maintenance
      if (daysUntilMaintenance < 0) {
        alerts.push({
          id: `${loom.id}-overdue`,
          type: "error",
          message: `Loom ${loom.id} maintenance is ${Math.abs(daysUntilMaintenance)} days overdue`,
          loomId: loom.id,
          priority: "Critical",
        });
      }

      // Low efficiency alerts
      if (loom.efficiency < 80 && loom.status === "Running") {
        alerts.push({
          id: `${loom.id}-efficiency`,
          type: "warning",
          message: `Loom ${loom.id} efficiency is low (${loom.efficiency}%)`,
          loomId: loom.id,
          priority: "Medium",
        });
      }
    });

    return alerts;
  };

  // if (loading) {
  //   return (
  //     <div className="flex justify-center items-center h-64">
  //       <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
  //     </div>
  //   );
  // }
  const ThreeDots = () => (
    <div className="flex space-x-2">
      <div className="h-2 w-2 bg-gray-600 rounded-full animate-bounce"></div>
      <div className="h-2 w-2 bg-gray-600 rounded-full animate-bounce delay-200"></div>
      <div className="h-2 w-2 bg-gray-600 rounded-full animate-bounce delay-400"></div>
    </div>
  );
  // const excelDateToISO = (excelDate: number) => {
  //   if (!excelDate) return null;

  //   const jsDate = new Date(Math.round((excelDate - 25569) * 86400 * 1000));

  //   return jsDate.toISOString().split("T")[0]; // yyyy-mm-dd
  // };

  const excelDateToISO = (excelDate: number) => {
    if (!excelDate) return null;

    // Excel dates: days since 1900-01-01
    const jsDate = new Date((excelDate - 25569) * 86400 * 1000);

    // Construct date in local time, ignoring timezone shift
    const year = jsDate.getUTCFullYear();
    const month = String(jsDate.getUTCMonth() + 1).padStart(2, "0");
    const day = String(jsDate.getUTCDate()).padStart(2, "0");

    return `${year}-${month}-${day}`; // yyyy-mm-dd
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const jsonData: any[] = XLSX.utils.sheet_to_json(sheet, {
        defval: "",
      });

      if (!jsonData.length) {
        throw new Error("Excel file is empty");
      }

      // Map Excel → API format
      const looms = jsonData.map((row) => ({
        name: row["Loom Name"],
        type: row["Loom Type"],
        status: row["Status"] || "Idle",
        efficiency: Number(row["Efficiency"]) || 0,
        location: row["Location"],
        manufacturer: row["Manufacturer"],
        model: row["Model"],
        width: Number(row["Width"]) || 180,
        reedSpace: Number(row["Reed Space"]) || 72,
        maxRPM: Number(row["Max RPM"]) || 300,
        loomSpeed: Number(row["Max RPM"]) || 300,
        fullLength: Number(row["Full Length"]),
        leftLength: Number(row["Left Length"]),
        weaverName: row["Weaver Name"] || null,
        // nextMaintenance: row["Next Maintenance"] || null,
        nextMaintenance:
          typeof row["Next Maintenance"] === "number"
            ? excelDateToISO(row["Next Maintenance"])
            : row["Next Maintenance"] || null,
      }));

      // Send to backend
      const response = await loomApi.post("/loom-import", { looms });
      const importedLooms = response.data.data; // <-- array returned by backend

      // console.log(importedLooms);
      setLooms((prev) => [...importedLooms, ...prev]);
      setFilteredLooms((prev) => [...importedLooms, ...prev]);

      toast({
        title: "Import Success",
        description: `${looms.length} looms imported successfully`,
      });

      // onclose();
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Import Failed",
        description: err.message || "Failed to import Excel",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  return (
    <div className="relative">
      <input
        type="file"
        accept=".xlsx,.xls"
        id="loomExcelImport"
        hidden
        onChange={handleExcelImport}
      />

      {/* ========== LOADING OVERLAY ========== */}
      {loading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50">
          {/* <div className="animate-spin h-10 w-10 border-4 border-gray-400 border-t-primary rounded-full"></div> */}
          <ThreeDots />
        </div>
      )}
      <div
        className={`${loading ? "blur-sm pointer-events-none select-none" : ""}`}
      >
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Loom Management
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Monitor and manage all production looms
              </p>
            </div>
            <div className="flex flex-col xs:flex-row items-stretch xs:items-center space-y-2 xs:space-y-0 xs:space-x-2">
              <SearchFilter
                onSearch={handleSearch}
                onFilter={handleFilter}
                onClearFilters={handleClearFilters}
                filterOptions={{
                  // status: ["Running", "Idle", "Maintenance"],
                  // type: ["Rapier", "Airjet", "Sulzer"],
                  status: loomOptions.loomStatus,
                  type: loomOptions.loomTypes,
                }}
                placeholder="Search looms..."
              />
              <Button
                onClick={handleAddLoom}
                className="w-full xs:w-auto text-xs sm:text-sm px-3 sm:px-4"
              >
                <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Add Loom</span>
                <span className="xs:hidden">Add</span>
              </Button>

              <Button
                variant="outline"
                onClick={() =>
                  document.getElementById("loomExcelImport")?.click()
                }
                className="w-full xs:w-auto text-xs sm:text-sm px-3 sm:px-4"
              >
                <Upload className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Import Excel</span>
                <span className="xs:hidden">Import</span>
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          {(() => {
            const totalLooms = looms.length;
            const activeLooms = looms.filter(
              (loom) => loom.status === "Running",
            ).length;
            const maintenanceLooms = looms.filter(
              (loom) => loom.status === "Maintenance",
            ).length;
            const idleLooms = looms.filter(
              (loom) => loom.status === "Idle",
            ).length;

            return (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Looms</p>
                        <p className="text-2xl font-bold">{totalLooms}</p>
                      </div>
                      <Factory className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Active Looms</p>
                        <p className="text-2xl font-bold text-green-600">
                          {activeLooms}
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">
                          Under Maintenance
                        </p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {maintenanceLooms}
                        </p>
                      </div>
                      <Wrench className="h-8 w-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Idle Looms</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {idleLooms}
                        </p>
                      </div>
                      <Clock className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })()}

          {/* Loom List */}
          <Card>
            <CardHeader>
              <CardTitle>Loom Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredLooms.map((loom) => (
                  <Card key={loom.id} className="border-2">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-lg">{loom.name}</h3>
                        <Badge
                          className={`${getStatusColor(loom.status)} text-white`}
                        >
                          <span className="flex items-center">
                            {getStatusIcon(loom.status)}
                            <span className="ml-1">{loom.status}</span>
                          </span>
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type:</span>
                          <span className="font-medium">{loom.loomtype}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Location:</span>
                          <span className="font-medium">{loom.location}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Efficiency:</span>
                          <span className="font-medium">
                            {loom.efficiency}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Weaver:</span>
                          <span className="font-medium text-purple-600 flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {loom.assignedweaver || "Unassigned"}
                          </span>
                        </div>
                        {loom.currentOrder && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              Current Order:
                            </span>
                            <span className="font-medium text-blue-600">
                              {loom.currentOrder}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Next Maintenance:
                          </span>
                          <span className="font-medium">
                            {/* {loom.nextmaintenance} */}
                            {new Date(loom.nextmaintenance).toLocaleDateString(
                              "en-GB",
                            )}
                          </span>
                        </div>
                      </div>

                      {loom.status === "Running" && (
                        <div className="mt-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Efficiency</span>
                            <span>{loom.efficiency}%</span>
                          </div>
                          <Progress value={loom.efficiency} />
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-1 mt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewLoom(loom)}
                          className="text-xs px-1 py-1 h-8"
                        >
                          <Eye className="h-3 w-3 mr-0 xs:mr-1" />
                          <span className="hidden xs:inline">View</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditLoom(loom)}
                          className="text-xs px-1 py-1 h-8"
                        >
                          <Edit className="h-3 w-3 mr-0 xs:mr-1" />
                          <span className="hidden xs:inline">Edit</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 text-xs px-1 py-1 h-8"
                          onClick={() => handleDeleteLoom(loom.id)}
                        >
                          <Trash2 className="h-3 w-3 mr-0 xs:mr-1" />
                          <span className="hidden xs:inline">Del</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <Button
                  variant="outline"
                  className="h-16 sm:h-20 flex-col text-xs sm:text-sm"
                  onClick={() => setIsMaintenanceSchedulerOpen(true)}
                >
                  <Factory className="h-4 w-4 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
                  <span className="text-center">Schedule Maintenance</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-16 sm:h-20 flex-col text-xs sm:text-sm"
                  onClick={() => setIsStatusUpdateOpen(true)}
                >
                  <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
                  <span className="text-center">Update Loom Status</span>
                  <span className="text-xs mt-1 hidden sm:block">
                    Bulk status updates
                  </span>
                </Button>
                <Button
                  variant="outline"
                  className="h-16 sm:h-20 flex-col text-xs sm:text-sm"
                  onClick={() => setIsAlertsOpen(true)}
                >
                  <AlertCircle className="h-4 w-4 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
                  <span className="text-center">View Alerts</span>
                  <span className="text-xs mt-1">
                    {getLoomAlerts().length} alerts
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Maintenance Scheduler */}
          <MaintenanceScheduler
            isOpen={isMaintenanceSchedulerOpen}
            setIsOpen={setIsMaintenanceSchedulerOpen}
            loomId={selectedLoomForMaintenance}
            onSchedule={handleMaintenanceSchedule}
          />

          {/* Loom Form */}
          <LoomForm
            isOpen={isLoomFormOpen}
            onClose={() => setIsLoomFormOpen(false)}
            loom={selectedLoom}
            mode={formMode}
            onSave={handleSaveLoom}
          />

          {/* Loom Status Update */}
          <LoomStatusUpdate
            isOpen={isStatusUpdateOpen}
            onClose={() => setIsStatusUpdateOpen(false)}
            looms={looms}
            onStatusUpdate={handleStatusUpdate}
          />

          {/* Loom Alerts */}
          <LoomAlerts
            isOpen={isAlertsOpen}
            onClose={() => setIsAlertsOpen(false)}
            alerts={getLoomAlerts()}
            onLoomAction={(loomId, action) => {
              if (action === "view_details") {
                const loom = looms.find((l) => l.id === loomId);
                if (loom) {
                  handleViewLoom(loom);
                }
              } else if (action === "schedule_maintenance") {
                setSelectedLoomForMaintenance(loomId);
                setIsMaintenanceSchedulerOpen(true);
              }
              setIsAlertsOpen(false);
            }}
          />
        </div>
      </div>
    </div>
  );
}
