import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WeaverForm } from "@/components/WeaverForm";
import { SearchFilter } from "@/components/SearchFilter";
import { ViewToggle } from "@/components/ViewToggle";
import { WeaverStorage, Weaver } from "@/lib/weaverStorage";
import { DataSync } from "@/lib/dataSync";
import {
  Users,
  Plus,
  Settings,
  MapPin,
  Phone,
  Edit,
  Trash2,
  Factory,
  Eye,
} from "lucide-react";
import { weaverApi } from "../services/api2";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function WeaverManagement() {
  const [weavers, setWeavers] = useState([]);
  const [filteredWeavers, setFilteredWeavers] = useState([]);
  const [isWeaverFormOpen, setIsWeaverFormOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [selectedWeaver, setSelectedWeaver] = useState<Weaver | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit" | "view">(
    "create",
  );
  const [view, setView] = useState<"list" | "grid">("list");
  const { toast } = useToast();

  // Load weavers from storage and subscribe to changes
  // useEffect(() => {
  //   const loadWeavers = () => {
  //     const storedWeavers = WeaverStorage.getWeavers();
  //     setWeavers(storedWeavers);
  //     setFilteredWeavers(storedWeavers);
  //   };

  //   loadWeavers();

  //   // Subscribe to weaver data changes
  //   const unsubscribe = DataSync.subscribe(
  //     DataSync.DATA_TYPES.WEAVERS,
  //     loadWeavers,
  //   );

  //   return unsubscribe;
  // }, []);

  useEffect(() => {
    const fetchWeavers = async () => {
      setLoading(true);

      try {
        const response = await weaverApi.get("/weaver-getall");
        // console.log(response);
        setWeavers(response.data.weaver);
        setFilteredWeavers(response.data.weaver);
        setError("");
      } catch (err) {
        setError(err.response?.error || "Error fetching weavers");
      } finally {
        setLoading(false);
      }
    };

    fetchWeavers();
  }, []);

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredWeavers(weavers);
      return;
    }

    const filtered = weavers.filter(
      (weaver) =>
        weaver.name.toLowerCase().includes(query.toLowerCase()) ||
        // weaver.loomTypeModel.toLowerCase().includes(query.toLowerCase()) ||
        weaver.address.toLowerCase().includes(query.toLowerCase()) ||
        weaver.gstnumber.toLowerCase().includes(query.toLowerCase()),
    );
    setFilteredWeavers(filtered);
  };

  const handleFilter = (filters: any) => {
    let filtered = [...weavers];

    if (filters.status) {
      filtered = filtered.filter((weaver) => weaver.status === filters.status);
    }

    // if (filters.type) {
    //   filtered = filtered.filter(
    //     (weaver) => weaver.loomTypeModel === filters.type,
    //   );
    // }

    setFilteredWeavers(filtered);
  };

  const handleClearFilters = () => {
    setFilteredWeavers(weavers);
  };

  const handleNewWeaver = () => {
    setSelectedWeaver(null);
    setFormMode("create");
    setIsWeaverFormOpen(true);
  };

  const handleViewWeaver = (weaver) => {
    setSelectedWeaver(weaver);
    setFormMode("view");
    setIsWeaverFormOpen(true);
  };

  const handleEditWeaver = (weaver: Weaver) => {
    setSelectedWeaver(weaver);
    setFormMode("edit");
    setIsWeaverFormOpen(true);
  };

  const handleDeleteWeaver = (weaverId: string) => {
    if (confirm("Are you sure you want to delete this weaver?")) {
      const deleteWeaver = async () => {
        try {
          const response = await weaverApi.delete(`/weaver-delete/${weaverId}`);
          // console.log(response);
          setWeavers((prevWeavers) =>
            prevWeavers.filter((w) => w.id !== weaverId),
          );
          setFilteredWeavers((prevWeavers) =>
            prevWeavers.filter((w) => w.id !== weaverId),
          );

          // setWeavers(response.data.weaver);
          // setFilteredWeavers(response.data.weaver);
          setError("");
          toast({
            title: "Success",
            description: `Weaver deleted successfully`,
          });
        } catch (err) {
          setError(err.response?.error || "Error deleting weaver");
          toast({
            title: "Error",
            description:
              err.response.data.error ||
              "Failed to delete weaver. Please try again.",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      };

      deleteWeaver();
      // WeaverStorage.deleteWeaver(weaverId);
      // setWeavers(WeaverStorage.getWeavers());
    }
  };

  const handleSaveWeaver = (weaverData) => {
    // console.log(weaverData);
    if (formMode === "create") {
      // WeaverStorage.addWeaver(weaverData);
      setWeavers((prevWeavers) => [weaverData, ...prevWeavers]); // add to end
      setFilteredWeavers((prevFiltered) => [weaverData, ...prevFiltered]); // if you have filtered list
    } else if (formMode === "edit") {
      // WeaverStorage.updateWeaver(weaverData.id, weaverData);
      setWeavers((prevWeavers) =>
        prevWeavers.map((w) => (w.id === weaverData.id ? weaverData : w)),
      );

      setFilteredWeavers((prevFiltered) =>
        prevFiltered.map((w) => (w.id === weaverData.id ? weaverData : w)),
      );
    }
    // const updatedWeavers = WeaverStorage.getWeavers();
    // setWeavers(weaverData);
    // setFilteredWeavers(weaverData);

    // navigate(0);
    setIsWeaverFormOpen(false);
    // console.log(weavers);
  };

  const getWeaverStats = () => {
    // console.log(weavers);
    const totalWeavers = weavers.length;
    const totalLooms = weavers.reduce(
      (sum, weaver) => sum + Number(weaver.numberoflooms),
      0,
    );
    const activeWeavers = weavers.filter(
      (weaver) => weaver.status === "Active",
    ).length;
    const availableLooms = weavers.reduce(
      (sum, weaver) =>
        weaver.status === "Active" ? sum + Number(weaver.numberoflooms) : sum,
      0,
    );

    // console.log(totalLooms);
    return { totalWeavers, totalLooms, activeWeavers, availableLooms };
  };

  // if (loading) {
  //   return (
  //     <div className="flex justify-center items-center h-64">
  //       <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
  //     </div>
  //   );
  // }

  const stats = getWeaverStats();
  const ThreeDots = () => (
    <div className="flex space-x-2">
      <div className="h-2 w-2 bg-gray-600 rounded-full animate-bounce"></div>
      <div className="h-2 w-2 bg-gray-600 rounded-full animate-bounce delay-200"></div>
      <div className="h-2 w-2 bg-gray-600 rounded-full animate-bounce delay-400"></div>
    </div>
  );

  return (
    <div className="relative">
      {/* ========== LOADING OVERLAY ========== */}
      {loading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50">
          <ThreeDots />
        </div>
      )}
      <div
        className={`${loading ? "blur-sm pointer-events-none select-none" : ""}`}
      >
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col space-y-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Weaver Management
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Manage weaver master list and loom assignments
              </p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-2 flex-1 sm:mr-4">
                <SearchFilter
                  onSearch={handleSearch}
                  onFilter={handleFilter}
                  onClearFilters={handleClearFilters}
                  filterOptions={{
                    status: ["Active", "Inactive"],
                    // type: ["Airjet", "Rapier", "Sulzer"],
                  }}
                  placeholder="Search weavers..."
                />
                <ViewToggle view={view} onViewChange={setView} />
              </div>
              <Button
                onClick={handleNewWeaver}
                className="w-full sm:w-auto text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-10"
              >
                <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">New Weaver</span>
                <span className="xs:hidden">New</span>
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Weavers</p>
                    <p className="text-2xl font-bold">{stats.totalWeavers}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Weavers</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.activeWeavers}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Looms</p>
                    <p className="text-2xl font-bold">{stats.totalLooms}</p>
                  </div>
                  <Factory className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Available Looms</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {stats.availableLooms}
                    </p>
                  </div>
                  <Settings className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Weavers List/Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Weaver Master List</CardTitle>
            </CardHeader>
            <CardContent>
              {view === "list" ? (
                <div className="space-y-4">
                  {filteredWeavers.map((weaver) => (
                    <Card
                      key={weaver.id}
                      className="border-l-4 border-l-primary"
                    >
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                            <h3 className="text-lg sm:text-xl font-bold">
                              {weaver.name}
                            </h3>
                            <span className="text-sm text-gray-400 font-normal">
                              {weaver.id}
                            </span>
                            <div className="flex items-center space-x-2">
                              <Badge
                                className={
                                  weaver.status === "Active"
                                    ? "bg-green-500 text-white"
                                    : "bg-red-500 text-white"
                                }
                              >
                                {weaver.status}
                              </Badge>
                              <Badge variant="outline" className="bg-blue-50">
                                {weaver.numberoflooms} Looms
                              </Badge>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1 xs:gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewWeaver(weaver)}
                              className="text-xs xs:text-sm px-2 xs:px-3"
                            >
                              <Eye className="h-3 w-3 xs:h-4 xs:w-4 mr-0 xs:mr-1" />
                              <span className="hidden xs:inline">View</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditWeaver(weaver)}
                              className="text-xs xs:text-sm px-2 xs:px-3"
                            >
                              <Edit className="h-3 w-3 xs:h-4 xs:w-4 mr-0 xs:mr-1" />
                              <span className="hidden xs:inline">Edit</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 text-xs xs:text-sm px-2 xs:px-3"
                              onClick={() => handleDeleteWeaver(weaver.id)}
                            >
                              <Trash2 className="h-3 w-3 xs:h-4 xs:w-4 mr-0 xs:mr-1" />
                              <span className="hidden xs:inline">Delete</span>
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          {/* <div>
                        <div className="flex items-center mb-2">
                          <Factory className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            Loom Details
                          </span>
                        </div>
                        <p className="font-medium">
                          {weaver.loomTypeModel} - {weaver.loomType}
                        </p>
                        <p className="text-sm text-gray-500">
                          Width: {weaver.loomWidth}" | RPM: {weaver.loomRPM}
                        </p>
                      </div> */}
                          <div>
                            <div className="flex items-center mb-2">
                              <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                Address
                              </span>
                            </div>
                            <p className="font-medium">{weaver.address}</p>
                            <p className="text-sm text-gray-500">
                              {weaver.city}, {weaver.state}
                            </p>
                          </div>
                          <div>
                            <div className="flex items-center mb-2">
                              <Phone className="h-4 w-4 mr-2 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                Contact
                              </span>
                            </div>
                            <p className="font-medium">{weaver.phone}</p>
                            <p className="text-sm text-gray-500">
                              {weaver.email}
                            </p>
                          </div>
                          <div>
                            <div className="flex items-center mb-2">
                              <Settings className="h-4 w-4 mr-2 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                Tax Details
                              </span>
                            </div>
                            <p className="font-medium">
                              GST: {weaver.gstnumber}
                            </p>
                            <p className="text-sm text-gray-500">
                              PAN: {weaver.pannumber}
                            </p>
                          </div>
                        </div>

                        {/* <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Reed Availability</h4>
                      <p className="text-sm text-gray-600">
                        {weaver.reedAvailability}
                      </p>
                    </div> */}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredWeavers.map((weaver) => (
                    <Card key={weaver.id} className="h-full">
                      <CardContent className="p-4">
                        <div className="flex flex-col h-full">
                          <div className="flex items-center justify-between mb-3">
                            <Badge
                              className={
                                weaver.status === "Active"
                                  ? "bg-green-500 text-white"
                                  : "bg-red-500 text-white"
                              }
                            >
                              {weaver.status}
                            </Badge>
                            <Badge variant="outline" className="bg-blue-50">
                              {weaver.numberOfLooms} Looms
                            </Badge>
                          </div>

                          <h3 className="text-lg font-bold mb-2 line-clamp-1">
                            {weaver.name}
                          </h3>

                          <div className="space-y-3 flex-1">
                            <div>
                              <p className="text-sm text-gray-600">Loom Type</p>
                              <p className="font-medium text-sm">
                                {weaver.loomTypeModel}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Location</p>
                              <p className="font-medium text-sm line-clamp-2">
                                {weaver.city}, {weaver.state}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Contact</p>
                              <p className="font-medium text-sm">
                                {weaver.phone}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col space-y-2 mt-4">
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => handleViewWeaver(weaver)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => handleEditWeaver(weaver)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 text-red-600 hover:text-red-700"
                                onClick={() => handleDeleteWeaver(weaver.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weaver Form Dialog */}
          <WeaverForm
            isOpen={isWeaverFormOpen}
            onClose={() => setIsWeaverFormOpen(false)}
            onSave={handleSaveWeaver}
            weaver={selectedWeaver}
            mode={formMode}
          />
        </div>
      </div>
    </div>
  );
}
