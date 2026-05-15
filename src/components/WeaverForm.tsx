import { useState, useEffect } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Weaver } from "@/lib/weaverStorage";
import { LoomStorage, Loom } from "@/lib/loomStorage";
import { LoomForm } from "@/components/LoomForm";
import { useToast } from "@/hooks/use-toast";
import { weaverApi } from "../services/api2";

interface WeaverFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (weaver: any) => void;
  weaver?: any | null;
  mode: "create" | "edit" | "view";
}

export const WeaverForm: React.FC<WeaverFormProps> = ({
  isOpen,
  onClose,
  onSave,
  weaver,
  mode,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    // loomWidth: "",
    // loomTypeModel: "",
    // loomType: "",
    // reedAvailability: "",
    address: "",
    city: "",
    state: "",
    gstNumber: "",
    panNumber: "",
    numberOfLooms: "",
    // loomRPM: "",
    phoneNumber: "",
    email: "",
    status: "Active" as "Active" | "Inactive",
    // assignedLooms: [] as string[],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoomFormOpen, setIsLoomFormOpen] = useState(false);
  const [loomsToCreate, setLoomsToCreate] = useState(0);
  const [createdLooms, setCreatedLooms] = useState<Loom[]>([]);
  const [currentLoomIndex, setCurrentLoomIndex] = useState(0);
  const { toast } = useToast();

  // Load weaver data when editing or viewing
  useEffect(() => {
    if ((mode === "edit" || mode === "view") && weaver) {
      // console.log(weaver);
      setFormData({
        name: weaver.name,
        // loomWidth: weaver.loomWidth.toString(),
        // loomTypeModel: weaver.loomTypeModel,
        // loomType: weaver.loomType,
        // reedAvailability: weaver.reedAvailability,
        address: weaver.address,
        city: weaver.city,
        state: weaver.state,
        gstNumber: weaver.gstnumber,
        panNumber: weaver.pannumber,
        numberOfLooms: weaver.numberoflooms,
        // loomRPM: weaver.loomRPM.toString(),
        phoneNumber: weaver.phone,
        email: weaver.email,
        status: weaver.status,
        // assignedLooms: weaver.assignedLooms,
      });
    } else {
      // Reset form for create mode
      setFormData({
        name: "",
        // loomWidth: "",
        // loomTypeModel: "",
        // loomType: "",
        // reedAvailability: "",
        address: "",
        city: "",
        state: "",
        gstNumber: "",
        panNumber: "",
        numberOfLooms: "",
        // loomRPM: "",
        phoneNumber: "",
        email: "",
        status: "Active",
        // assignedLooms: [],
      });
    }
  }, [mode, weaver, isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    const required = [
      "name",
      // "loomWidth",
      // "loomTypeModel",
      // "loomType",
      "numberOfLooms",
    ];
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

    // Validate GST number format
    if (
      formData.gstNumber &&
      !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
        formData.gstNumber,
      )
    ) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid GST number",
        variant: "destructive",
      });
      return false;
    }

    // Validate PAN number format
    if (
      formData.panNumber &&
      !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber)
    ) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid PAN number",
        variant: "destructive",
      });
      return false;
    }

    if (
      formData.email &&
      !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)
    ) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleLoomsFieldChange = (value: string) => {
    const numberOfLooms = parseInt(value) || 0;
    handleInputChange("numberOfLooms", value);

    // if (numberOfLooms > 0 && numberOfLooms !== loomsToCreate) {
    //   setLoomsToCreate(numberOfLooms);
    //   if (mode === "create") {
    //     // Ask user if they want to add loom details
    //     toast({
    //       title: "Loom Details Required",
    //       description: `Click "Add Loom Details" to configure ${numberOfLooms} loom(s)`,
    //     });
    //   }
    // }
  };

  const startLoomCreation = () => {
    if (loomsToCreate > 0) {
      setCurrentLoomIndex(0);
      setCreatedLooms([]);
      setIsLoomFormOpen(true);
    }
  };

  const handleLoomSave = (loomData: Loom) => {
    const newCreatedLooms = [...createdLooms, loomData];
    setCreatedLooms(newCreatedLooms);

    if (newCreatedLooms.length < loomsToCreate) {
      // More looms to create
      setCurrentLoomIndex(newCreatedLooms.length);
      // Keep form open for next loom
      toast({
        title: "Loom Added",
        description: `Loom ${newCreatedLooms.length} of ${loomsToCreate} created. Add next loom.`,
      });
    } else {
      // All looms created
      setIsLoomFormOpen(false);
      setFormData((prev) => ({
        ...prev,
        assignedLooms: newCreatedLooms.map((loom) => loom.id),
      }));
      toast({
        title: "All Looms Created",
        description: `Successfully created ${newCreatedLooms.length} looms for this weaver.`,
      });
    }
  };

  // const handleSubmit = async (e) => {
  //   if (mode === "view") {
  //     onClose();
  //     return;
  //   }

  //   if (!validateForm()) return;

  //   setIsSubmitting(true);

  //   try {
  //     const weaverData = {
  //       id: mode === "edit" && weaver ? weaver.id : "",
  //       name: formData.name,
  //       // loomWidth: parseInt(formData.loomWidth),
  //       // loomTypeModel: formData.loomTypeModel,
  //       // loomType: formData.loomType,
  //       // reedAvailability: formData.reedAvailability,
  //       address: formData.address,
  //       city: formData.city,
  //       state: formData.state,
  //       gstNumber: formData.gstNumber,
  //       panNumber: formData.panNumber,
  //       numberOfLooms: parseInt(formData.numberOfLooms),
  //       // loomRPM: parseInt(formData.loomRPM),
  //       phoneNumber: formData.phoneNumber,
  //       email: formData.email,
  //       status: formData.status,
  //       // assignedLooms: formData.assignedLooms,
  //       createdDate: mode === "edit" && weaver ? weaver.createdDate : "",
  //       updatedDate: "",
  //     };
  //   e.preventDefault();

  //   try {
  //     const response = await api.post("/weaver-create", { weaverData });

  //     setError("");
  //   } catch (err) {
  //     setError(err.response?.data?.error || "Error creating weaver");
  //   } finally {
  //     setLoading(false);
  //   }

  //     toast({
  //       title: "Success",
  //       description: `Weaver ${mode === "create" ? "created" : "updated"} successfully`,
  //     });

  //     // Save created looms to storage
  //     if (createdLooms.length > 0) {
  //       createdLooms.forEach((loom) => {
  //         LoomStorage.addLoom(loom);
  //       });
  //     }

  //     console.log(weaverData);
  //     onSave(weaverData);
  //     onClose();
  //   } catch (error) {
  //     console.error("Error saving weaver:", error);
  //     toast({
  //       title: "Error",
  //       description: "Failed to save weaver. Please try again.",
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

  const handleSubmit = async () => {
    if (mode === "view") {
      onClose();
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const weaverData = {
        id: mode === "edit" && weaver ? weaver.id : "",
        name: formData.name,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        gstNumber: formData.gstNumber,
        panNumber: formData.panNumber,
        numberOfLooms: parseInt(formData.numberOfLooms),
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        status: formData.status,
        createdDate: mode === "edit" && weaver ? weaver.createdDate : "",
        updatedDate: "",
        mode: mode,
      };

      // API call
      const response = await weaverApi.post("/weaver-create", { weaverData });
      // console.log(response);
      // setError("");

      toast({
        title: "Success",
        description: `Weaver ${mode === "create" ? "created" : "updated"} successfully`,
      });

      // Save created looms to storage
      // if (createdLooms.length > 0) {
      //   createdLooms.forEach((loom) => {
      //     LoomStorage.addLoom(loom);
      //   });
      // }

      // console.log(weaverData);
      onSave(response.data.weaver);
      onClose();
    } catch (error) {
      console.error("Error saving weaver:", error);
      toast({
        title: "Error",
        description: "Failed to save weaver. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? "Add New Weaver"
              : mode === "edit"
                ? "Edit Weaver"
                : "View Weaver Details"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new weaver profile with loom details"
              : mode === "edit"
                ? "Update weaver information and loom assignments"
                : "View weaver information and assigned looms"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-3">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Weaver Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter weaver name"
                  required
                  readOnly={mode === "view"}
                  disabled={mode === "view"}
                  maxLength={100}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange("status", value)}
                  disabled={mode === "view"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    handleInputChange("phoneNumber", e.target.value)
                  }
                  placeholder="9876543210"
                  readOnly={mode === "view"}
                  disabled={mode === "view"}
                  maxLength={10}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="weaver@email.com"
                  readOnly={mode === "view"}
                  disabled={mode === "view"}
                  maxLength={100}
                />
              </div>
            </div>
          </div>

          {/* Loom Details */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-800 mb-3">Loom Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* <div>
                <Label htmlFor="loomWidth">Width of Loom (inches) *</Label>
                <Input
                  id="loomWidth"
                  type="number"
                  value={formData.loomWidth}
                  onChange={(e) =>
                    handleInputChange("loomWidth", e.target.value)
                  }
                  placeholder="180"
                  required
                  readOnly={mode === "view"}
                  disabled={mode === "view"}
                />
              </div>
              <div>
                <Label htmlFor="loomTypeModel">Loom Type Model *</Label>
                <Select
                  value={formData.loomTypeModel}
                  onValueChange={(value) =>
                    handleInputChange("loomTypeModel", value)
                  }
                  disabled={mode === "view"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select loom model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Airjet">Airjet</SelectItem>
                    <SelectItem value="Rapier">Rapier</SelectItem>
                    <SelectItem value="Sulzer">Sulzer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="loomType">Loom Type *</Label>
                <Select
                  value={formData.loomType}
                  onValueChange={(value) =>
                    handleInputChange("loomType", value)
                  }
                  disabled={mode === "view"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select loom type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cam">Cam</SelectItem>
                    <SelectItem value="Dobby">Dobby</SelectItem>
                    <SelectItem value="Cam, Dobby">Cam, Dobby</SelectItem>
                  </SelectContent>
                </Select>
              </div> */}
              <div>
                <Label htmlFor="numberOfLooms">No. of Looms *</Label>
                <Input
                  id="numberOfLooms"
                  type="number"
                  value={parseInt(formData.numberOfLooms)}
                  // onChange={(e) => handleLoomsFieldChange(e.target.value)}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.length <= 7) {
                      handleLoomsFieldChange(val);
                    }
                  }}
                  placeholder="2"
                  required
                  readOnly={mode === "view"}
                  disabled={mode === "view"}
                  maxLength={7}
                />
                {/* {mode === "create" && loomsToCreate > 0 && (
                  <div className="mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={startLoomCreation}
                      className="w-full"
                    >
                      Add Loom Details ({createdLooms.length}/{loomsToCreate})
                    </Button>
                  </div>
                )} */}
              </div>
              {/* <div>
                <Label htmlFor="loomRPM">Loom RPM</Label>
                <Input
                  id="loomRPM"
                  type="number"
                  value={formData.loomRPM}
                  onChange={(e) => handleInputChange("loomRPM", e.target.value)}
                  placeholder="300"
                  readOnly={mode === "view"}
                  disabled={mode === "view"}
                />
              </div> */}
            </div>
            {/* <div className="mt-4">
              <Label htmlFor="reedAvailability">Reed Availability</Label>
              <Textarea
                id="reedAvailability"
                value={formData.reedAvailability}
                onChange={(e) =>
                  handleInputChange("reedAvailability", e.target.value)
                }
                placeholder="e.g., 20/2, 40/2, 44/2, 50/2 Available"
                rows={3}
                readOnly={mode === "view"}
                disabled={mode === "view"}
              />
            </div> */}
          </div>

          {/* Address & Tax Details */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h3 className="font-semibold text-yellow-800 mb-3">
              Address & Tax Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Street address, locality"
                  rows={2}
                  readOnly={mode === "view"}
                  disabled={mode === "view"}
                  maxLength={250}
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="Coimbatore"
                  readOnly={mode === "view"}
                  disabled={mode === "view"}
                  maxLength={250}
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  placeholder="Tamil Nadu"
                  readOnly={mode === "view"}
                  disabled={mode === "view"}
                  maxLength={250}
                />
              </div>
              <div>
                <Label htmlFor="gstNumber">GST No</Label>
                <Input
                  id="gstNumber"
                  value={formData.gstNumber}
                  onChange={(e) =>
                    handleInputChange("gstNumber", e.target.value.toUpperCase())
                  }
                  placeholder="33ABCDE1234F1Z5"
                  maxLength={15}
                  readOnly={mode === "view"}
                  disabled={mode === "view"}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: 22AAAAA0000A1Z5
                </p>
              </div>
              <div>
                <Label htmlFor="panNumber">PAN No</Label>
                <Input
                  id="panNumber"
                  value={formData.panNumber}
                  onChange={(e) =>
                    handleInputChange("panNumber", e.target.value.toUpperCase())
                  }
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  readOnly={mode === "view"}
                  disabled={mode === "view"}
                />
                <p className="text-xs text-gray-500 mt-1">Format: AAAAA1234A</p>
              </div>
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
                    {mode === "create" ? "Create Weaver" : "Update Weaver"}
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

      {/* Loom Creation Form */}
      <LoomForm
        isOpen={isLoomFormOpen}
        onClose={() => setIsLoomFormOpen(false)}
        onSave={handleLoomSave}
        mode="create"
        preselectedWeaver={{
          id: formData.name ? `WVR-${Date.now().toString().slice(-3)}` : "",
          name: formData.name,
        }}
      />
    </Dialog>
  );
};
