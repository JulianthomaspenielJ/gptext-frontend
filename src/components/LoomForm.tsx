import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Loom } from "@/lib/loomStorage";
import { WeaverStorage } from "@/lib/weaverStorage";
import { useToast } from "@/hooks/use-toast";
import { Factory, Settings, User } from "lucide-react";
import { loomApi, loomOptionsApi, weaverApi } from "@/services/api2";

interface LoomFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (loom: any) => void;
  loom?: any | null;
  mode: "create" | "edit" | "view";
  preselectedWeaver?: {
    id: string;
    name: string;
  } | null;
}

export const LoomForm: React.FC<LoomFormProps> = ({
  isOpen,
  onClose,
  onSave,
  loom,
  mode,
  preselectedWeaver = null,
}) => {
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    loomType: "",
    status: "Idle",
    efficiency: "0",
    currentOrder: "",
    currentOrderGptId: "",
    // currentOrderId: "",
    nextMaintenance: "",
    location: "",
    manufacturer: "",
    model: "",
    weaver: "",
    weaverId: "",
    width: "",
    reedSpace: "",
    maxRPM: "",
    fullLength: "",
    leftLength: "",
  });

  const [weavers, setWeavers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [allOptions, setAllOptions] = useState({
    loomTypes: [],
    loomStatus: [],
    orders: [],
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await loomOptionsApi.get("/loom-options");
        // console.log(response);
        // setWeavers(response.data.weaver);
        // setFilteredWeavers(response.data.weaver);
        setAllOptions({
          loomTypes: response.data.loomTypes || [],
          loomStatus: response.data.loomStatus || [],
          orders: response.data.orders || [],
        });
        setError("");
      } catch (err) {
        setError(err.response?.error || "Error fetching options");
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, []);

  useEffect(() => {
    const fetchWeavers = async () => {
      try {
        const response = await weaverApi.get("/weaver-getall");
        // console.log(response);
        setWeavers(response.data.weaver);
        // setFilteredWeavers(response.data.weaver);
        setError("");
      } catch (err) {
        setError(err.response?.error || "Error fetching weavers");
      } finally {
        setLoading(false);
      }
    };

    fetchWeavers();
  }, []);

  // Load weavers for selection
  // useEffect(() => {
  //   const storedWeavers = WeaverStorage.getWeavers();
  //   setWeavers(storedWeavers);
  // }, []);

  // Load loom data when editing/viewing
  useEffect(() => {
    if (mode !== "create" && loom) {
      // console.log(new Date(loom.nextmaintenance).toLocaleDateString("en-GB"));
      setFormData({
        id: loom.id,
        name: loom.name,
        loomType: loom.loomtype,
        status: loom.status,
        efficiency: loom.efficiency.toString(),
        currentOrder: loom.currentorder || "",
        currentOrderGptId: loom.gptid,
        // currentOrderId: loom.currentorderid || "",
        // nextMaintenance: loom.nextmaintenance,
        // nextMaintenance: loom.nextmaintenance
        //   ? new Date(loom.nextmaintenance).toISOString().split("T")[0]
        //   : "",
        nextMaintenance:
          new Date(loom.nextmaintenance).toLocaleDateString("en-CA") || "",
        location: loom.location,
        manufacturer: loom.manufacturer,
        model: loom.model,
        weaver: loom.assignedweaver,
        weaverId: loom.assignedweaverid,
        width: loom.width?.toString(),
        reedSpace: loom.reedspace?.toString(),
        maxRPM: loom.maxrpm?.toString(),
        fullLength: loom.fulllength?.toString() || "",
        leftLength: loom.leftlength?.toString() || "",
      });
    } else if (mode === "create") {
      // Set preselected weaver if provided
      if (preselectedWeaver) {
        setFormData((prev) => ({
          ...prev,
          weaverId: preselectedWeaver.id,
          weaver: preselectedWeaver.name,
        }));
      } else {
        // Reset form for create mode
        setFormData({
          id: "",
          name: "",
          loomType: "",
          status: "Idle",
          efficiency: "0",
          currentOrder: "",
          currentOrderGptId: "",
          // currentOrderId: "",
          nextMaintenance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0], // 30 days from now
          location: "",
          manufacturer: "",
          model: "",
          weaver: "",
          weaverId: "",
          width: "",
          reedSpace: "",
          maxRPM: "",
          fullLength: "",
          leftLength: "",
        });
      }
    }
  }, [mode, loom, isOpen, preselectedWeaver]);

  const handleInputChange = (field: string, value: string) => {
    if (field === "currentOrder") {
      const selectedOrder = allOptions.orders.find((item) => item.id === value);

      setFormData((prev) => ({
        ...prev,
        currentOrder: value,
        currentOrderGptId: selectedOrder?.gptid ?? "",
      }));
      return;
    }
    if (field === "efficiency") {
      let num = Number(value);
      if (num > 100) num = 100;
      if (num < 0) num = 0;
      value = num.toString();
    }
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleWeaverChange = (weaverId: string) => {
    const selectedWeaver = weavers.find((w) => w.id === weaverId);
    if (selectedWeaver) {
      setFormData((prev) => ({
        ...prev,
        weaverId: weaverId,
        weaver: selectedWeaver.name,
      }));
    }
  };

  const validateForm = () => {
    const required = ["name", "loomType", "location", "manufacturer", "model"];
    for (const field of required) {
      if (!formData[field as keyof typeof formData]) {
        toast({
          title: "Validation Error",
          description: `${field.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())} is required`,
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (mode === "view") {
      onClose();
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const loomData = {
        id:
          mode === "edit" && loom
            ? loom.id
            : formData.id || `LM-${Date.now().toString().slice(-3)}`,
        name: formData.name,
        type: formData.loomType,
        status: formData.status as any,
        efficiency: parseInt(formData.efficiency) || 0,
        currentOrder: formData.currentOrder || null,
        currentOrderGptId: formData.currentOrderGptId || null,
        nextMaintenance: formData.nextMaintenance,
        location: formData.location,
        manufacturer: formData.manufacturer,
        model: formData.model,
        weaver: formData.weaver,
        weaverId: formData.weaverId,
        width: parseInt(formData.width) || 180,
        reedSpace: parseInt(formData.reedSpace) || 72,
        maxRPM: parseInt(formData.maxRPM) || 300,
        fullLength: parseInt(formData.fullLength),
        leftLength: parseInt(formData.leftLength),

        createdDate: mode === "edit" && loom ? loom.createdDate : "",
        updatedDate: "",
        mode: mode,
      };

      // console.log(loomData);

      const response = await loomApi.post("/loom-create", { loomData });
      // console.log(response);

      // onSave(loomData);
      onSave(response.data.weaver);

      toast({
        title: "Success",
        description: `Loom ${mode === "create" ? "created" : "updated"} successfully`,
      });

      onClose();
    } catch (error) {
      console.error("Error saving loom:", error);
      toast({
        title: "Error",
        description: "Failed to save loom. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isReadOnly = mode === "view";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg sm:text-xl">
            <Factory className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            {mode === "create"
              ? "Add New Loom"
              : mode === "edit"
                ? "Edit Loom"
                : "View Loom Details"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {mode === "create"
              ? "Create a new loom and assign it to a weaver"
              : mode === "edit"
                ? "Update loom information and assignments"
                : "View loom details and specifications"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Loom Information */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
              <Factory className="mr-2 h-4 w-4" />
              Loom Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="loomName">Loom Name *</Label>
                <Input
                  id="loomName"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="LOOM 1"
                  disabled={mode === "edit" || isReadOnly}
                  readOnly={isReadOnly}
                  maxLength={200}
                />
              </div>
              <div>
                <Label htmlFor="type">Loom Type *</Label>
                <Select
                  value={formData.loomType}
                  onValueChange={(value) =>
                    handleInputChange("loomType", value)
                  }
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select loom type" />
                  </SelectTrigger>
                  {/* <SelectContent>
                    <SelectItem value="Rapier">Rapier</SelectItem>
                    <SelectItem value="Airjet">Airjet</SelectItem>
                    <SelectItem value="Sulzer">Sulzer</SelectItem>
                  </SelectContent> */}

                  <SelectContent>
                    {allOptions.loomTypes.map((item) => (
                      <SelectItem key={item.id} value={item.loomtype}>
                        {item.loomtype}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange("status", value)}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  {/* <SelectContent>
                    <SelectItem value="Running">Running</SelectItem>
                    <SelectItem value="Idle">Idle</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                  </SelectContent> */}
                  <SelectContent>
                    {allOptions.loomStatus.map((item) => (
                      <SelectItem key={item.id} value={item.loomstatus}>
                        {item.loomstatus}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="efficiency">Efficiency (%)</Label>
                <Input
                  id="efficiency"
                  type="number"
                  value={formData.efficiency}
                  onChange={(e) =>
                    handleInputChange("efficiency", e.target.value)
                  }
                  placeholder="85"
                  min={0}
                  max={100}
                  readOnly={isReadOnly}
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <Label htmlFor="currentOrder">Current Order</Label>
                {/* <Input
                  id="currentOrder"
                  value={formData.currentOrder}
                  onChange={(e) =>
                    handleInputChange("currentOrder", e.target.value)
                  }
                  placeholder="BTC-101"
                  readOnly={isReadOnly}
                /> */}
                <Select
                  value={formData.currentOrder}
                  onValueChange={(value) =>
                    handleInputChange("currentOrder", value)
                  }
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select order" />
                  </SelectTrigger>

                  <SelectContent>
                    {allOptions.orders.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.gptid}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="nextMaintenance">Next Maintenance</Label>
                <Input
                  id="nextMaintenance"
                  type="date"
                  value={formData.nextMaintenance}
                  onChange={(e) =>
                    handleInputChange("nextMaintenance", e.target.value)
                  }
                  readOnly={isReadOnly}
                />
              </div>
            </div>
          </div>

          {/* Technical Specifications */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-800 mb-3 flex items-center">
              <Settings className="mr-2 h-4 w-4" />
              Technical Specifications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    handleInputChange("location", e.target.value)
                  }
                  placeholder="Section A"
                  readOnly={isReadOnly}
                  required
                  maxLength={250}
                />
              </div>
              <div>
                <Label htmlFor="manufacturer">Manufacturer *</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) =>
                    handleInputChange("manufacturer", e.target.value)
                  }
                  placeholder="Toyota"
                  readOnly={isReadOnly}
                  required
                  maxLength={250}
                />
              </div>
              <div>
                <Label htmlFor="model">Model *</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => handleInputChange("model", e.target.value)}
                  placeholder="JAT610"
                  readOnly={isReadOnly}
                  required
                  maxLength={250}
                />
              </div>
              <div>
                <Label htmlFor="width">Width (inches)</Label>
                <Input
                  id="width"
                  type="number"
                  value={formData.width}
                  // onChange={(e) => handleInputChange("width", e.target.value)}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.length <= 7) {
                      handleInputChange("width", val);
                    }
                  }}
                  placeholder="180"
                  readOnly={isReadOnly}
                  maxLength={7}
                />
              </div>
              <div>
                <Label htmlFor="reedSpace">Reed Space</Label>
                <Input
                  id="reedSpace"
                  type="number"
                  value={formData.reedSpace}
                  // onChange={(e) =>
                  //   handleInputChange("reedSpace", e.target.value)
                  // }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.length <= 7) {
                      handleInputChange("reedSpace", val);
                    }
                  }}
                  placeholder="72"
                  readOnly={isReadOnly}
                  maxLength={7}
                />
              </div>
              <div>
                <Label htmlFor="maxRPM">Max RPM</Label>
                <Input
                  id="maxRPM"
                  type="number"
                  value={formData.maxRPM}
                  // onChange={(e) => handleInputChange("maxRPM", e.target.value)}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.length <= 7) {
                      handleInputChange("maxRPM", val);
                    }
                  }}
                  placeholder="300"
                  readOnly={isReadOnly}
                  maxLength={7}
                />
              </div>
              <div>
                <Label htmlFor="fullLength">Full Length (in meters)</Label>
                <Input
                  id="fullLength"
                  type="number"
                  value={formData.fullLength}
                  // onChange={(e) => handleInputChange("maxRPM", e.target.value)}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.length <= 7) {
                      handleInputChange("fullLength", val);
                    }
                  }}
                  placeholder="5000"
                  readOnly={isReadOnly}
                  maxLength={7}
                />
              </div>{" "}
              <div>
                <Label htmlFor="leftLength">Left Length (in meters)</Label>
                <Input
                  id="leftLength"
                  type="number"
                  value={formData.leftLength}
                  // onChange={(e) => handleInputChange("maxRPM", e.target.value)}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.length <= 7) {
                      handleInputChange("leftLength", val);
                    }
                  }}
                  placeholder="3000"
                  readOnly={isReadOnly}
                  maxLength={7}
                />
              </div>
            </div>
          </div>

          {/* Weaver Assignment */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h3 className="font-semibold text-yellow-800 mb-3 flex items-center">
              <User className="mr-2 h-4 w-4" />
              Weaver Assignment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weaver">Assigned Weaver</Label>
                <Select
                  value={formData.weaverId}
                  onValueChange={handleWeaverChange}
                  disabled={isReadOnly || !!preselectedWeaver}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select weaver" />
                  </SelectTrigger>
                  <SelectContent>
                    {weavers.map((weaver) => (
                      <SelectItem key={weaver.id} value={weaver.id}>
                        {weaver.name} ({weaver.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {preselectedWeaver && (
                  <p className="text-xs text-gray-500 mt-1">
                    Pre-selected from weaver form
                  </p>
                )}
              </div>
              {formData.weaver && (
                <div>
                  <Label>Current Assignment</Label>
                  <div className="mt-2">
                    <Badge variant="outline" className="bg-blue-50">
                      {formData.weaver} ({formData.weaverId})
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col xs:flex-row justify-end space-y-2 xs:space-y-0 xs:space-x-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full xs:w-auto text-xs sm:text-sm"
          >
            {mode === "view" ? "Close" : "Cancel"}
          </Button>
          {mode !== "view" && (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full xs:w-auto text-xs sm:text-sm"
            >
              {isSubmitting ? (
                <>
                  <div className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span className="hidden xs:inline">
                    {mode === "create" ? "Creating..." : "Updating..."}
                  </span>
                  <span className="xs:hidden">Wait...</span>
                </>
              ) : (
                <>
                  <span className="hidden xs:inline">
                    {mode === "create" ? "Create Loom" : "Update Loom"}
                  </span>
                  <span className="xs:hidden">
                    {mode === "create" ? "Create" : "Update"}
                  </span>
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
