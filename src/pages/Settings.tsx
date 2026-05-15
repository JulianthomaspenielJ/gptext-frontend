import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Eye, EyeOff } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings as SettingsIcon,
  Building,
  Bell,
  Save,
  RefreshCw,
  FileText,
  Download,
} from "lucide-react";


import {
  organizationApi,
  organizationOptionsApi,
  usersApi,
  weaverApi,
} from "@/services/api2";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const [allOptions, setAllOptions] = useState({
    currency: [],
  });
  const [companySettings, setCompanySettings] = useState(() => ({
    name: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    gst: "",
    currency: "",
    timezone: "",
    logo: null,
  }));
  const [previewOpen, setPreviewOpen] = useState(false);

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    lowStockAlerts: true,
    maintenanceReminders: true,
    orderDeadlines: true,
    taskAssignments: true,
  });

  const [productionSettings, setProductionSettings] = useState({
    defaultShiftHours: 8,
    overtimeThreshold: 40,
    qualityCheckMandatory: true,
    autoAssignLooms: true,
    defaultEfficiencyTarget: 90,
    breakTimeDuration: 30,
  });
  const [securitySettings, setSecuritySettings] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    if (companySettings.logo instanceof File) {
      const objectUrl = URL.createObjectURL(companySettings.logo);
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [companySettings.logo]);

  useEffect(() => {
    const fetchOrganization = async () => {
      setLoading(true);

      try {
        const response = await organizationApi.get("/organization-getbyid");
        // console.log(response);
        const org = response.data.organization[0];
        // setCompanySettings(response.data.organization);
        setCompanySettings((prev) => ({
          ...prev, // keep defaults
          name: org.name ?? prev.name,
          address: org.address ?? prev.address,
          phone: org.phone ?? prev.phone,
          email: org.email ?? prev.email,
          website: org.website ?? prev.website,
          gst: org.gst ?? prev.gst,
          currency: org.currency ?? prev.currency,
          // timezone: org.timezone ?? prev.timezone,
          logo: org.logo ?? prev.logo,
        }));
        setError("");
      } catch (err) {
        setError(err.response?.error || "Error fetching organization");
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, []);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await organizationOptionsApi.get(
          "/organization-options",
        );
        // console.log(response);
        // setWeavers(response.data.weaver);
        // setFilteredWeavers(response.data.weaver);
        setAllOptions({
          currency: response.data.currency || [],
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
  // const handleSaveSettings = (section: string) => {
  //   console.log(`Saving ${section} settings...`);
  //   console.log("Saving Company Settings:", companySettings);

  //   if (section === "company") {
  //     // // Save company settings for order number generation
  //     // saveCompanySettings({
  //     //   name: companySettings.name,
  //     //   logo: companySettings.logo,
  //     // });
  //     // alert(
  //     //   "Company settings saved successfully! Order numbers will now use the updated company prefix.",
  //     // );
  //     // API call
  //     const response = organizationApi.post("/organization-update", {
  //       companySettings,
  //     });
  //     console.log(response);
  //     // setError("");

  //     toast({
  //       title: "Success",
  //       description: `Company settings saved successfully`,
  //     });
  //   } else {
  //     alert(
  //       `${section.charAt(0).toUpperCase() + section.slice(1)} settings saved successfully!`,
  //     );
  //   }
  // };

  const handleSaveSettings = async (section: string) => {
    if (section !== "company") return;

    try {
      const formData = new FormData();

      formData.append("name", companySettings.name);
      formData.append("address", companySettings.address);
      formData.append("phone", companySettings.phone);
      formData.append("email", companySettings.email);
      formData.append("website", companySettings.website);
      formData.append("gst", companySettings.gst);
      formData.append("currency", companySettings.currency);

      // append file if exists
      if (companySettings.logo instanceof File) {
        formData.append("logo", companySettings.logo);
      }

      await organizationApi.post("/organization-update", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast({
        title: "Success",
        description: "Company settings saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save settings",
        variant: "destructive",
      });
    }
  };
  const handleSaveSecurity = async () => {
    if (securitySettings.newPassword !== securitySettings.confirmPassword) {
      toast({
        title: "Error",
        description: "New password and confirm password do not match",
        variant: "destructive",
      });
      return;
    }
    let user = null;
    const userData = localStorage.getItem("user");
    if (userData !== null) {
      user = JSON.parse(userData);
    }
    const userId = user.id;

    try {
      await usersApi.post("/change-password", {
        currentPassword: securitySettings.currentPassword,
        newPassword: securitySettings.newPassword,
        userid: userId,
      });

      toast({
        title: "Success",
        description: "Password updated successfully",
      });

      setSecuritySettings({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to update password",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">
            Configure system preferences and company information
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>

          {/* <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger> */}
        </TabsList>

        {/* Company Settings */}
        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="mr-2 h-5 w-5" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={companySettings.name}
                    maxLength={250}
                    onChange={(e) =>
                      setCompanySettings((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="companyPhone">Phone</Label>
                  <Input
                    id="companyPhone"
                    value={companySettings.phone}
                    maxLength={10}
                    onChange={(e) =>
                      setCompanySettings((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="companyEmail">Email</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={companySettings.email}
                    onChange={(e) =>
                      setCompanySettings((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="companyWebsite">Website</Label>
                  <Input
                    id="companyWebsite"
                    value={companySettings.website}
                    maxLength={150}
                    onChange={(e) =>
                      setCompanySettings((prev) => ({
                        ...prev,
                        website: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="companyGst">GST Number</Label>
                  <Input
                    id="companyGst"
                    value={companySettings.gst}
                    maxLength={25}
                    onChange={(e) =>
                      setCompanySettings((prev) => ({
                        ...prev,
                        gst: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="companyCurrency">Currency</Label>
                  <Select
                    value={companySettings.currency}
                    onValueChange={(value) =>
                      setCompanySettings((prev) => ({
                        ...prev,
                        currency: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    {/* <SelectContent>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent> */}
                    <SelectContent>
                      {allOptions.currency.map((item) => (
                        <SelectItem key={item.id} value={item.currency}>
                          {item.currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="companyAddress">Address</Label>
                <Textarea
                  id="companyAddress"
                  value={companySettings.address}
                  maxLength={500}
                  onChange={(e) =>
                    setCompanySettings((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="companyLogo">Company Logo</Label>
                <div className="space-y-2">
                  <Input
                    id="companyLogo"
                    type="file"
                    accept="image/*"
                    // onChange={(e) => {
                    //   const file = e.target.files?.[0];
                    //   if (file) {
                    //     const reader = new FileReader();
                    //     reader.onload = (event) => {
                    //       setCompanySettings((prev) => ({
                    //         ...prev,
                    //         logo: event.target?.result as string,
                    //       }));
                    //     };
                    //     reader.readAsDataURL(file);
                    //   }
                    // }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      setCompanySettings((prev) => ({
                        ...prev,
                        logo: file, // store File
                      }));
                    }}
                  />
                  {/* {companySettings.logo && (
                    <div className="mt-2">
                      <img
                        src={companySettings.logo}
                        alt="Company Logo"
                        className="h-20 w-20 object-contain border rounded"
                      />
                    </div>
                  )} */}
                  {/* {companySettings.logo && (
                    <img
                      src={`http://localhost:5000${companySettings.logo}`}
                      alt="Company Logo"
                    />
                  )} */}
                  {previewOpen && (
                    <div
                      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
                      onClick={() => setPreviewOpen(false)}
                    >
                      <div
                        className="relative"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <img
                          src={
                            companySettings.logo instanceof File
                              ? URL.createObjectURL(companySettings.logo)
                              : `${import.meta.env.VITE_API_IMAGE_BASE_URL}${companySettings.logo}`

                            // : `http://localhost:5000${companySettings.logo}`
                          }
                          alt="Company Logo Preview"
                          className="object-contain rounded shadow-lg"
                          style={{
                            maxWidth: "90vw",
                            maxHeight: "90vh",
                            width: "auto",
                            height: "auto",
                          }}
                        />

                        <button
                          className="absolute -top-3 -right-3 bg-white text-black rounded-full w-8 h-8 flex items-center justify-center font-bold shadow"
                          onClick={() => setPreviewOpen(false)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}

                  {companySettings.logo && (
                    <img
                      src={
                        companySettings.logo instanceof File
                          ? URL.createObjectURL(companySettings.logo)
                          : // : `http://localhost:5000${companySettings.logo}`
                            `${import.meta.env.VITE_API_IMAGE_BASE_URL}${companySettings.logo}`
                      }
                      alt="Company Logo"
                      className="h-20 w-20 object-contain border rounded"
                      onClick={() => setPreviewOpen(true)}
                    />
                  )}

                  <p className="text-xs text-gray-500">
                    Upload your company logo (PNG, JPG, SVG). This will be used
                    in PDF reports.
                  </p>
                </div>
              </div>
              <Button onClick={() => handleSaveSettings("company")}>
                <Save className="mr-2 h-4 w-4" />
                Save Company Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <SettingsIcon className="mr-2 h-5 w-5" />
                Security Settings
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  maxLength={100}
                  value={securitySettings.currentPassword}
                  onChange={(e) =>
                    setSecuritySettings((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                />
              </div> */}
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>

                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPassword.current ? "text" : "password"}
                    maxLength={100}
                    value={securitySettings.currentPassword}
                    onChange={(e) =>
                      setSecuritySettings((prev) => ({
                        ...prev,
                        currentPassword: e.target.value,
                      }))
                    }
                  />

                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    onClick={() =>
                      setShowPassword((prev) => ({
                        ...prev,
                        current: !prev.current,
                      }))
                    }
                  >
                    {showPassword.current ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={securitySettings.newPassword}
                  maxLength={100}
                  onChange={(e) =>
                    setSecuritySettings((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                />
              </div> */}
              <div>
                <Label htmlFor="newPassword">New Password</Label>

                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword.new ? "text" : "password"}
                    maxLength={100}
                    value={securitySettings.newPassword}
                    onChange={(e) =>
                      setSecuritySettings((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                      }))
                    }
                  />

                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    onClick={() =>
                      setShowPassword((prev) => ({
                        ...prev,
                        new: !prev.new,
                      }))
                    }
                  >
                    {showPassword.new ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={securitySettings.confirmPassword}
                  maxLength={100}
                  onChange={(e) =>
                    setSecuritySettings((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                />
              </div> */}
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>

                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPassword.confirm ? "text" : "password"}
                    maxLength={100}
                    value={securitySettings.confirmPassword}
                    onChange={(e) =>
                      setSecuritySettings((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                  />

                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    onClick={() =>
                      setShowPassword((prev) => ({
                        ...prev,
                        confirm: !prev.confirm,
                      }))
                    }
                  >
                    {showPassword.confirm ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <Button onClick={handleSaveSecurity}>
                <Save className="mr-2 h-4 w-4" />
                Update Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        {/* <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-600">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        emailNotifications: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-gray-600">
                      Receive notifications via SMS
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.smsNotifications}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        smsNotifications: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Low Stock Alerts</Label>
                    <p className="text-sm text-gray-600">
                      Alert when inventory is low
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.lowStockAlerts}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        lowStockAlerts: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Maintenance Reminders</Label>
                    <p className="text-sm text-gray-600">
                      Remind about scheduled maintenance
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.maintenanceReminders}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        maintenanceReminders: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Order Deadlines</Label>
                    <p className="text-sm text-gray-600">
                      Alert about approaching deadlines
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.orderDeadlines}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        orderDeadlines: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Task Assignments</Label>
                    <p className="text-sm text-gray-600">
                      Notify when tasks are assigned
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.taskAssignments}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        taskAssignments: checked,
                      }))
                    }
                  />
                </div>
              </div>
              <Button onClick={() => handleSaveSettings("notifications")}>
                <Save className="mr-2 h-4 w-4" />
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent> */}

        {/* Production Settings */}
        {/* <TabsContent value="production" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <SettingsIcon className="mr-2 h-5 w-5" />
                Production Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shiftHours">Default Shift Hours</Label>
                  <Input
                    id="shiftHours"
                    type="number"
                    value={productionSettings.defaultShiftHours}
                    onChange={(e) =>
                      setProductionSettings((prev) => ({
                        ...prev,
                        defaultShiftHours: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="overtimeThreshold">
                    Overtime Threshold (hours/week)
                  </Label>
                  <Input
                    id="overtimeThreshold"
                    type="number"
                    value={productionSettings.overtimeThreshold}
                    onChange={(e) =>
                      setProductionSettings((prev) => ({
                        ...prev,
                        overtimeThreshold: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="efficiencyTarget">
                    Default Efficiency Target (%)
                  </Label>
                  <Input
                    id="efficiencyTarget"
                    type="number"
                    value={productionSettings.defaultEfficiencyTarget}
                    onChange={(e) =>
                      setProductionSettings((prev) => ({
                        ...prev,
                        defaultEfficiencyTarget: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="breakTime">
                    Break Time Duration (minutes)
                  </Label>
                  <Input
                    id="breakTime"
                    type="number"
                    value={productionSettings.breakTimeDuration}
                    onChange={(e) =>
                      setProductionSettings((prev) => ({
                        ...prev,
                        breakTimeDuration: Number(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Quality Check Mandatory</Label>
                    <p className="text-sm text-gray-600">
                      Require quality check for all production
                    </p>
                  </div>
                  <Switch
                    checked={productionSettings.qualityCheckMandatory}
                    onCheckedChange={(checked) =>
                      setProductionSettings((prev) => ({
                        ...prev,
                        qualityCheckMandatory: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto Assign Looms</Label>
                    <p className="text-sm text-gray-600">
                      Automatically assign available looms to orders
                    </p>
                  </div>
                  <Switch
                    checked={productionSettings.autoAssignLooms}
                    onCheckedChange={(checked) =>
                      setProductionSettings((prev) => ({
                        ...prev,
                        autoAssignLooms: checked,
                      }))
                    }
                  />
                </div>
              </div>

              <Button onClick={() => handleSaveSettings("production")}>
                <Save className="mr-2 h-4 w-4" />
                Save Production Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent> */}

        {/* Documentation Settings */}
        {/* <TabsContent value="documentation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                System Documentation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">
                  Working Manual
                </h4>
                <p className="text-blue-700 text-sm mb-4">
                  Export a comprehensive PDF manual covering the complete system
                  architecture, data flow, module interconnections, user
                  workflows, and technical implementation details.
                </p>
                <Button
                  onClick={() => {
                    try {
                      exportWorkingManualToPDF();
                      alert(
                        "Working manual has been generated and downloaded as PDF successfully!",
                      );
                    } catch (error) {
                      console.error("Error generating manual:", error);
                      alert("Error generating manual. Please try again.");
                    }
                  }}
                  className="w-full sm:w-auto"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Working Manual (PDF)
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h5 className="font-medium mb-2">Manual Contents</h5>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• Application Overview & Starting Point</li>
                    <li>• System Architecture & Data Flow</li>
                    <li>• Module Interconnections</li>
                    <li>• Complete User Workflows</li>
                    <li>• Charts & Graphs Data Mapping</li>
                    <li>• Technical Implementation Details</li>
                    <li>• Getting Started Guide</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h5 className="font-medium mb-2">System Information</h5>
                  <div className="text-sm space-y-2 text-gray-600">
                    <div className="flex justify-between">
                      <span>Application:</span>
                      <span className="font-medium">Textile ERP</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Version:</span>
                      <span className="font-medium">1.0.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Company:</span>
                      <span className="font-medium">
                        {companySettings.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Updated:</span>
                      <span className="font-medium">
                        {new Date().toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h5 className="font-medium text-yellow-900 mb-2">
                  📋 How to Use This Manual
                </h5>
                <div className="text-sm text-yellow-800 space-y-1">
                  <p>
                    • The manual is automatically generated with current system
                    configuration
                  </p>
                  <p>
                    • Keep it updated by re-downloading after major system
                    changes
                  </p>
                  <p>
                    • Share with new users for comprehensive system
                    understanding
                  </p>
                  <p>• Use as reference for training and system maintenance</p>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <h5 className="font-medium text-green-900 mb-3">
                  🔍 Data Consistency Check
                </h5>
                <p className="text-sm text-green-700 mb-4">
                  Ensure all data across modules is consistent and identify any
                  mismatches or issues.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      try {
                        const report = checkDataConsistency();
                        let message = `Data Consistency Check Results:\n\n`;
                        message += `Status: ${report.isConsistent ? "✅ Consistent" : "⚠️ Issues Found"}\n\n`;

                        if (report.issues.length > 0) {
                          message += `Issues (${report.issues.length}):\n`;
                          report.issues.forEach(
                            (issue) => (message += `• ${issue}\n`),
                          );
                          message += "\n";
                        }

                        if (report.warnings.length > 0) {
                          message += `Warnings (${report.warnings.length}):\n`;
                          report.warnings.forEach(
                            (warning) => (message += `• ${warning}\n`),
                          );
                          message += "\n";
                        }

                        const recommendations = getRecommendations();
                        if (recommendations.length > 0) {
                          message += `Recommendations (${recommendations.length}):\n`;
                          recommendations.forEach(
                            (rec) => (message += `• ${rec}\n`),
                          );
                        }

                        alert(message);
                      } catch (error) {
                        console.error("Error checking consistency:", error);
                        alert(
                          "Error checking data consistency. Please try again.",
                        );
                      }
                    }}
                  >
                    Check Data Consistency
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      try {
                        const fixedIssues = autoFixData();
                        if (fixedIssues.length > 0) {
                          alert(
                            `Auto-fixed ${fixedIssues.length} issues:\n\n${fixedIssues.join("\n")}`,
                          );
                        } else {
                          alert(
                            "No issues found that could be automatically fixed.",
                          );
                        }
                      } catch (error) {
                        console.error("Error auto-fixing data:", error);
                        alert("Error auto-fixing data. Please try again.");
                      }
                    }}
                  >
                    Auto-Fix Issues
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent> */}
      </Tabs>
    </div>
  );
}
