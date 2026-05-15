import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ViewToggle } from "@/components/ViewToggle";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
} from "lucide-react";
import {
  DEMO_USERS,
  ROLES,
  PERMISSIONS,
  UserRoleManager,
  User,
  Role,
  Permission,
} from "@/lib/userRoles";
import { usersApi } from "@/services/api2";
import { useToast } from "@/hooks/use-toast";
import { Value } from "@radix-ui/react-select";

export default function UserManagement() {
  const [users, setUsers] = useState<any>([]);
  const [filteredUsers, setFilteredUsers] = useState<any>([]);
  const [view, setView] = useState<"list" | "grid">("list");
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [isRoleFormOpen, setIsRoleFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit" | "view">(
    "create",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<any>([]);

  const { toast } = useToast();
  const [usersOptions, setUsersOptions] = useState({
    roles: [],
    departments: [],
  });
  const initialFormData = {
    id: "",
    name: "",
    email: "",
    role: "",
    department: "",
    status: "",
  };
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (!isUserFormOpen) {
      setFormData(initialFormData);
      setSelectedUser(null);
      setFormMode("create"); // optional: reset mode to "create"
    }
  }, [isUserFormOpen]);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);

      try {
        const response = await usersApi.get("/users-getall");
        // console.log(response);
        // setUsers(response.data.users);
        // setFilteredUsers(response.data.users);
        // Transform users to include isActive
        const usersWithStatus = response.data.users.map((user: any) => ({
          ...user,
          isActive: user.status?.toLowerCase() === "active",
        }));

        setUsers(usersWithStatus);
        setFilteredUsers(usersWithStatus);
        setError("");
      } catch (err) {
        setError(err.response.data.error || "Error fetching users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await usersApi.get("/roles-getall");
        // console.log(response);
        // setUsers(response.data.users);
        // setFilteredUsers(response.data.users);

        setRoles(response.data.roles);
        setError("");
      } catch (err) {
        setError(err.response.data.error || "Error fetching roles");
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, []);
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await usersApi.get("/users-options");
        // console.log(response);
        // setWeavers(response.data.weaver);
        // setFilteredWeavers(response.data.weaver);
        setUsersOptions({
          roles: response.data.roles || [],
          departments: response.data.departments || [],
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
  const getRoleBadgeColor = (roleId: string) => {
    const role = UserRoleManager.getRoleById(roleId);
    if (!role) return "bg-gray-500";

    switch (role.level) {
      case "Admin":
        return "bg-red-500";
      case "hod":
        return "bg-blue-500";
      case "ic":
        return "bg-green-500";
      case "entry":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive ? "bg-green-500" : "bg-red-500";
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    filterUsers(term, selectedDepartment, selectedRoleFilter);
  };

  const handleDepartmentFilter = (dept: string) => {
    setSelectedDepartment(dept);
    filterUsers(searchTerm, dept, selectedRoleFilter);
  };

  const handleRoleFilter = (roleId: string) => {
    setSelectedRoleFilter(roleId);
    filterUsers(searchTerm, selectedDepartment, roleId);
  };

  const filterUsers = (search: string, dept: string, roleId: string) => {
    let filtered = [...users];

    if (search) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(search.toLowerCase()) ||
          user.email.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (dept !== "all") {
      filtered = filtered.filter((user) => user.department === dept);
    }

    if (roleId !== "all") {
      filtered = filtered.filter((user) => user.roleId === roleId);
    }

    setFilteredUsers(filtered);
  };

  const handleNewUser = () => {
    setSelectedUser(null);
    setFormMode("create");
    setIsUserFormOpen(true);
  };

  const handleViewUser = (user: any) => {
    setSelectedUser(user);
    setFormData({
      id: user.id || "",
      name: user.name || "",
      email: user.email || "",
      role: user.roleid || "",
      department: user.department || "",
      status: user.status,
    });
    setFormMode("view");
    setIsUserFormOpen(true);
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    // console.log(user.id);
    setFormData({
      id: user.id || "",
      name: user.name || "",
      email: user.email || "",
      role: user.roleid || "",
      department: user.department || "",
      status: user.status,
    });
    setFormMode("edit");
    setIsUserFormOpen(true);
  };

  const handleViewRole = (roleId: string) => {
    const role = getRoleById(roleId);
    setSelectedRole(role || null);
    setIsRoleFormOpen(true);
  };

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.status.toLowerCase() == "active").length,
    adminUsers: users.filter((u) => {
      const role = UserRoleManager.getRoleById(u.roleId);
      return role?.level === "Admin";
    }).length,
    hodUsers: users.filter((u) => {
      const role = UserRoleManager.getRoleById(u.roleId);
      return role?.level === "hod";
    }).length,
  };

  const handleInputChange = (field: string, value: string) => {
    // console.log(field, value);
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (formMode === "view") {
      // onClose();
      setIsUserFormOpen(false);
      return;
    }

    // if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const userData = {
        // id:
        //   formMode === "edit" && users
        //     ? users.id
        //     : formData.id || `LM-${Date.now().toString().slice(-3)}`,
        id: formData.id,
        name: formData.name,
        email: formData.email,
        status: formData.status as any,
        role: formData.role,
        department: formData.department,
        // createdDate: formMode === "edit" && users ? users.createdDate : "",
        updatedDate: "",
        mode: formMode,
      };

      // console.log(userData);

      const response = await usersApi.post("/users-create", { userData });
      // console.log(response);
      const updatedUser = response.data.users;
      setIsUserFormOpen(false);

      const normalizedUser = {
        ...updatedUser,
        isActive: updatedUser.status?.toLowerCase() === "active",
      };
      setUsers((prev) => {
        if (formMode === "create") return [normalizedUser, ...prev];

        return prev.map((u) =>
          u.id === normalizedUser.id ? normalizedUser : u,
        );
      });

      setFilteredUsers((prev) => {
        if (formMode === "create") return [normalizedUser, ...prev];

        return prev.map((u) =>
          u.id === normalizedUser.id ? normalizedUser : u,
        );
      });

      // onSave(loomData);
      // onSave(response.data.weaver);

      toast({
        title: "Success",
        description: `User ${formMode === "create" ? "created" : "updated"} successfully`,
      });

      // onClose();
      setFormData({
        id: "",
        name: "",
        email: "",
        role: "",
        department: "",
        status: "",
      });
      setSelectedUser(null);
    } catch (error) {
      console.error("Error saving user:", error);

      console.error("Error saving user:", error);
      toast({
        title: "Error",
        description:
          error.response.data.error || "Failed to save user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const isReadOnly = formMode === "view";

  const getRoleById = (roleId: any) => {
    return roles.find((role) => role.id === roleId) || null;
  };
  // if (loading) {
  //   return (
  //     <div className="flex justify-center items-center h-64">
  //       <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
  //     </div>
  //   );
  // }
  // if (loading) {
  //   return (
  //     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  //       {[...Array(4)].map((_, i) => (
  //         <div
  //           key={i}
  //           className="animate-pulse bg-gray-200 h-40 rounded-lg"
  //         ></div>
  //       ))}
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
                User Management
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Manage users, roles, and permissions across the organization
              </p>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select
                  value={selectedDepartment}
                  onValueChange={handleDepartmentFilter}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="Production">Production</SelectItem>
                    <SelectItem value="Sourcing">Sourcing</SelectItem>
                    <SelectItem value="Purchase">Purchase</SelectItem>
                    <SelectItem value="Quality">Quality</SelectItem>
                    <SelectItem value="Supply Chain">Supply Chain</SelectItem>
                    <SelectItem value="IT">IT</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={selectedRoleFilter}
                  onValueChange={handleRoleFilter}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {ROLES.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <ViewToggle view={view} onViewChange={setView} />
                <Button onClick={handleNewUser} className="text-xs sm:text-sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Users</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.activeUsers}
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
                    <p className="text-sm text-gray-600">Administrators</p>
                    <p className="text-2xl font-bold">{stats.adminUsers}</p>
                  </div>
                  <Shield className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Department Heads</p>
                    <p className="text-2xl font-bold">{stats.hodUsers}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users List/Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Users ({filteredUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {view === "list" ? (
                <div className="space-y-4">
                  {filteredUsers.map((user) => {
                    const role = getRoleById(user.roleid);
                    return (
                      <Card
                        key={user.id}
                        className="border-l-4 border-l-primary"
                      >
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 space-y-2 sm:space-y-0">
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarFallback>
                                  {user.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold">{user.name}</h3>
                                <p className="text-sm text-gray-600">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Badge
                                className={`${getRoleBadgeColor(user.roleid)} text-white text-xs`}
                              >
                                {role?.name || "Unknown Role"}
                              </Badge>
                              <Badge
                                className={`${getStatusBadgeColor(user.isActive)} text-white text-xs`}
                              >
                                {user.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                            <div>
                              <p className="text-xs text-gray-600">
                                Department
                              </p>
                              <p className="font-medium text-sm">
                                {user.department}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">
                                Role Level
                              </p>
                              <p className="font-medium text-sm capitalize">
                                {/* {user?.roleid || "Unknown"} */}
                                {getRoleById(user?.roleid)?.name}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Joined</p>
                              <p className="font-medium text-sm">
                                {user.createddate
                                  ? new Date(
                                      user.createddate,
                                    ).toLocaleDateString("en-GB") // DD/MM/YYYY
                                  : "N/A"}{" "}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">
                                Last Login
                              </p>
                              <p className="font-medium text-sm">
                                {user.lastlogin
                                  ? new Date(
                                      user.lastlogin,
                                    ).toLocaleDateString()
                                  : "Never"}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewUser(user)}
                              className="text-xs"
                            >
                              <Eye className="mr-1 h-3 w-3" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditUser(user)}
                              className="text-xs"
                            >
                              <Edit className="mr-1 h-3 w-3" />
                              Edit
                            </Button>
                            {/* <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewRole(user.roleId)}
                              className="text-xs"
                            >
                              <Shield className="mr-1 h-3 w-3" />
                              Role Details
                            </Button> */}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredUsers.map((user) => {
                    const role = UserRoleManager.getRoleById(user.roleId);
                    return (
                      <Card key={user.id} className="h-full">
                        <CardContent className="p-4">
                          <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between mb-3">
                              <Avatar>
                                <AvatarFallback>
                                  {user.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <Badge
                                className={`${getStatusBadgeColor(user.isActive)} text-white text-xs`}
                              >
                                {user.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>

                            <h3 className="font-semibold mb-1 line-clamp-1">
                              {user.name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                              {user.email}
                            </p>

                            <div className="space-y-2 flex-1">
                              <div>
                                <p className="text-xs text-gray-600">Role</p>
                                <Badge
                                  className={`${getRoleBadgeColor(user.roleId)} text-white text-xs`}
                                >
                                  {role?.name || "Unknown"}
                                </Badge>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600">
                                  Department
                                </p>
                                <p className="font-medium text-sm">
                                  {user.department}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600">Level</p>
                                <p className="font-medium text-sm capitalize">
                                  {role?.level || "Unknown"}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-col space-y-1 mt-4">
                              <div className="flex space-x-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 text-xs"
                                  onClick={() => handleViewUser(user)}
                                >
                                  View
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 text-xs"
                                  onClick={() => handleEditUser(user)}
                                >
                                  Edit
                                </Button>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full text-xs"
                                onClick={() => handleViewRole(user.roleId)}
                              >
                                <Shield className="mr-1 h-3 w-3" />
                                Role Details
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Role Details Dialog */}
          <Dialog open={isRoleFormOpen} onOpenChange={setIsRoleFormOpen}>
            <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Role Details: {selectedRole?.name}
                </DialogTitle>
                <DialogDescription>
                  {selectedRole?.description}
                </DialogDescription>
              </DialogHeader>

              {selectedRole && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Role Level</Label>
                      <Badge
                        className={`${getRoleBadgeColor(selectedRole.id)} text-white mt-1`}
                      >
                        {selectedRole.level.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Users with this role
                      </Label>
                      <p className="text-lg font-semibold">
                        {UserRoleManager.getUsersByRole(selectedRole.id).length}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-3 block">
                      Permissions
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(
                        PERMISSIONS.reduce(
                          (acc, permission) => {
                            if (!acc[permission.module])
                              acc[permission.module] = [];
                            acc[permission.module].push(permission);
                            return acc;
                          },
                          {} as Record<string, Permission[]>,
                        ),
                      ).map(([module, permissions]) => (
                        <Card key={module}>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">{module}</CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="space-y-2">
                              {permissions.map((permission) => (
                                <div
                                  key={permission.id}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    checked={selectedRole.permissions.includes(
                                      permission.id,
                                    )}
                                    disabled
                                  />
                                  <div>
                                    <p className="text-sm">{permission.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {permission.description}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* User Form Dialog */}
          <Dialog
            open={isUserFormOpen}
            onOpenChange={setIsUserFormOpen}
            // onOpenChange={(open) => {
            //   setIsUserFormOpen(open);

            //   // Reset form when closing
            //   if (!open) {
            //     setFormData(initialFormData);
            //     setSelectedUser(null);
            //     setFormMode("create");
            //   }
            // }}
          >
            <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {formMode === "create"
                    ? "Add New User"
                    : formMode === "edit"
                      ? "Edit User"
                      : "User Details"}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="userName">Name *</Label>
                    <Input
                      id="userName"
                      value={formData.name || ""}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      placeholder="Enter user name"
                      disabled={formMode === "view"}
                    />
                  </div>
                  <div>
                    <Label htmlFor="userEmail">Email *</Label>
                    <Input
                      id="userEmail"
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      placeholder="Enter email address"
                      disabled={formMode === "view"}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="userRole">Role *</Label>
                    {/* <Select
                  defaultValue={formData.role || ""}
                  disabled={formMode === "view"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select> */}
                    <Select
                      value={formData.role}
                      onValueChange={(value) =>
                        handleInputChange("role", value)
                      }
                      disabled={isReadOnly}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Role" />
                      </SelectTrigger>

                      <SelectContent className="max-h-80 overflow-y-auto">
                        {usersOptions.roles.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="userDepartment">Department</Label>
                    <Input
                      id="userDepartment"
                      value={formData.department || ""}
                      onChange={(e) =>
                        handleInputChange("department", e.target.value)
                      }
                      placeholder="Enter department"
                      disabled={formMode === "view"}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="userStatus">Status</Label>
                  <Select
                    // value={formData.status ? "active" : "inactive"}
                    value={
                      formData.status?.toLowerCase() === "active"
                        ? "active"
                        : "inactive"
                    }
                    onValueChange={(value) =>
                      handleInputChange("status", value)
                    }
                    disabled={formMode === "view"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formMode !== "view" && (
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsUserFormOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      // onClick={() => {
                      //   alert(
                      //     `${formMode === "create" ? "User created" : "User updated"} successfully!`,
                      //   );
                      //   setIsUserFormOpen(false);
                      // }}
                      onClick={handleSubmit}
                    >
                      {formMode === "create" ? "Create User" : "Update User"}
                    </Button>
                  </div>
                )}

                {formMode === "view" && (
                  <div className="flex justify-end pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsUserFormOpen(false)}
                    >
                      Close
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
