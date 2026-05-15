// User roles and permissions system based on organizational structure

export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  level: "Admin" | "hod" | "ic" | "entry";
}

export interface User {
  id: string;
  name: string;
  email: string;
  roleId: string;
  department: string;
  isActive: boolean;
  createdDate: string;
  lastLogin?: string;
}

// Define all available permissions
export const PERMISSIONS: Permission[] = [
  // Order Management
  {
    id: "order.view",
    name: "View Orders",
    description: "View order details and status",
    module: "Order Management",
  },
  {
    id: "order.create",
    name: "Create Orders",
    description: "Create new orders",
    module: "Order Management",
  },
  {
    id: "order.edit",
    name: "Edit Orders",
    description: "Modify existing orders",
    module: "Order Management",
  },
  {
    id: "order.delete",
    name: "Delete Orders",
    description: "Remove orders from system",
    module: "Order Management",
  },
  {
    id: "order.approve",
    name: "Approve Orders",
    description: "Approve order changes and pricing",
    module: "Order Management",
  },

  // Production Planning
  {
    id: "production.view",
    name: "View Production Plans",
    description: "View production schedules and plans",
    module: "Production Planning",
  },
  {
    id: "production.plan",
    name: "Create Production Plans",
    description: "Create and schedule production",
    module: "Production Planning",
  },
  {
    id: "production.edit",
    name: "Edit Production Plans",
    description: "Modify production schedules",
    module: "Production Planning",
  },
  {
    id: "production.assign",
    name: "Assign Looms",
    description: "Assign looms to production orders",
    module: "Production Planning",
  },
  {
    id: "production.approve",
    name: "Approve Production Plans",
    description: "Approve production schedules",
    module: "Production Planning",
  },

  // Loom Management
  {
    id: "loom.view",
    name: "View Looms",
    description: "View loom status and details",
    module: "Loom Management",
  },
  {
    id: "loom.manage",
    name: "Manage Looms",
    description: "Add, edit, and maintain looms",
    module: "Loom Management",
  },
  {
    id: "loom.maintenance",
    name: "Schedule Maintenance",
    description: "Schedule and track loom maintenance",
    module: "Loom Management",
  },
  {
    id: "loom.assign",
    name: "Assign Weavers",
    description: "Assign weavers to looms",
    module: "Loom Management",
  },

  // Weaver Management
  {
    id: "weaver.view",
    name: "View Weavers",
    description: "View weaver information",
    module: "Weaver Management",
  },
  {
    id: "weaver.manage",
    name: "Manage Weavers",
    description: "Add, edit weaver details",
    module: "Weaver Management",
  },
  {
    id: "weaver.performance",
    name: "View Performance",
    description: "View weaver performance metrics",
    module: "Weaver Management",
  },

  // Daily Production
  {
    id: "daily.view",
    name: "View Daily Production",
    description: "View daily production records",
    module: "Daily Production",
  },
  {
    id: "daily.enter",
    name: "Enter Production Data",
    description: "Record daily production data",
    module: "Daily Production",
  },
  {
    id: "daily.edit",
    name: "Edit Production Data",
    description: "Modify production records",
    module: "Daily Production",
  },
  {
    id: "daily.approve",
    name: "Approve Production Data",
    description: "Approve daily production entries",
    module: "Daily Production",
  },

  // Quality Control
  {
    id: "qc.view",
    name: "View Quality Reports",
    description: "View quality control reports",
    module: "Quality Control",
  },
  {
    id: "qc.inspect",
    name: "Quality Inspection",
    description: "Perform quality inspections",
    module: "Quality Control",
  },
  {
    id: "qc.approve",
    name: "Approve Quality",
    description: "Approve quality standards",
    module: "Quality Control",
  },
  {
    id: "qc.reject",
    name: "Reject Products",
    description: "Reject products not meeting standards",
    module: "Quality Control",
  },

  // Sourcing & Purchase
  {
    id: "sourcing.view",
    name: "View Sourcing",
    description: "View sourcing information",
    module: "Sourcing",
  },
  {
    id: "sourcing.manage",
    name: "Manage Sourcing",
    description: "Manage supplier relationships",
    module: "Sourcing",
  },
  {
    id: "purchase.view",
    name: "View Purchases",
    description: "View purchase orders",
    module: "Purchase",
  },
  {
    id: "purchase.create",
    name: "Create Purchase Orders",
    description: "Create new purchase orders",
    module: "Purchase",
  },
  {
    id: "purchase.approve",
    name: "Approve Purchases",
    description: "Approve purchase orders",
    module: "Purchase",
  },

  // Yarn & Fabric Management
  {
    id: "yarn.view",
    name: "View Yarn Inventory",
    description: "View yarn stock and details",
    module: "Yarn Management",
  },
  {
    id: "yarn.manage",
    name: "Manage Yarn",
    description: "Manage yarn inventory and sourcing",
    module: "Yarn Management",
  },
  {
    id: "fabric.view",
    name: "View Fabric Inventory",
    description: "View fabric stock and details",
    module: "Fabric Management",
  },
  {
    id: "fabric.manage",
    name: "Manage Fabric",
    description: "Manage fabric inventory and quality",
    module: "Fabric Management",
  },

  // Supply Chain Management
  {
    id: "scm.view",
    name: "View Supply Chain",
    description: "View supply chain metrics",
    module: "Supply Chain",
  },
  {
    id: "scm.manage",
    name: "Manage Supply Chain",
    description: "Manage supply chain operations",
    module: "Supply Chain",
  },
  {
    id: "scm.logistics",
    name: "Manage Logistics",
    description: "Coordinate logistics and delivery",
    module: "Supply Chain",
  },

  // Sizing Operations
  {
    id: "sizing.view",
    name: "View Sizing",
    description: "View sizing operations",
    module: "Sizing",
  },
  {
    id: "sizing.manage",
    name: "Manage Sizing",
    description: "Manage sizing processes",
    module: "Sizing",
  },
  {
    id: "sizing.schedule",
    name: "Schedule Sizing",
    description: "Schedule sizing operations",
    module: "Sizing",
  },

  // User Management
  {
    id: "user.view",
    name: "View Users",
    description: "View user accounts",
    module: "User Management",
  },
  {
    id: "user.manage",
    name: "Manage Users",
    description: "Create and edit user accounts",
    module: "User Management",
  },
  {
    id: "user.roles",
    name: "Manage Roles",
    description: "Assign and modify user roles",
    module: "User Management",
  },

  // Reports & Analytics
  {
    id: "reports.view",
    name: "View Reports",
    description: "View system reports",
    module: "Reports",
  },
  {
    id: "reports.export",
    name: "Export Reports",
    description: "Export reports and data",
    module: "Reports",
  },
  {
    id: "analytics.view",
    name: "View Analytics",
    description: "View analytics dashboards",
    module: "Analytics",
  },

  // System Settings
  {
    id: "settings.view",
    name: "View Settings",
    description: "View system settings",
    module: "Settings",
  },
  {
    id: "settings.manage",
    name: "Manage Settings",
    description: "Modify system configurations",
    module: "Settings",
  },
];

// Define roles based on the organizational chart
export const ROLES: Role[] = [
  {
    id: "Admin",
    name: "Admin",
    description: "System Administrator with full access",
    level: "Admin",
    permissions: PERMISSIONS.map((p) => p.id), // All permissions
  },
  {
    id: "prdn_hod",
    name: "Production HoD",
    description: "Head of Production Department",
    level: "hod",
    permissions: [
      "order.view",
      "order.approve",
      "production.view",
      "production.plan",
      "production.edit",
      "production.assign",
      "production.approve",
      "loom.view",
      "loom.manage",
      "loom.maintenance",
      "loom.assign",
      "weaver.view",
      "weaver.manage",
      "weaver.performance",
      "daily.view",
      "daily.approve",
      "reports.view",
      "reports.export",
      "analytics.view",
    ],
  },
  {
    id: "planning_ic",
    name: "Planning In-charge",
    description: "Production Planning In-charge",
    level: "ic",
    permissions: [
      "order.view",
      "production.view",
      "production.plan",
      "production.edit",
      "production.assign",
      "loom.view",
      "loom.assign",
      "weaver.view",
      "weaver.performance",
      "daily.view",
      "reports.view",
    ],
  },
  {
    id: "sourcing_hod",
    name: "Sourcing HoD",
    description: "Head of Sourcing Department",
    level: "hod",
    permissions: [
      "order.view",
      "sourcing.view",
      "sourcing.manage",
      "purchase.view",
      "purchase.approve",
      "yarn.view",
      "yarn.manage",
      "fabric.view",
      "fabric.manage",
      "scm.view",
      "scm.manage",
      "reports.view",
      "reports.export",
    ],
  },
  {
    id: "purchase_ic",
    name: "Purchase In-charge",
    description: "Purchase Department In-charge",
    level: "ic",
    permissions: [
      "sourcing.view",
      "purchase.view",
      "purchase.create",
      "yarn.view",
      "fabric.view",
      "reports.view",
    ],
  },
  {
    id: "sizing_ic",
    name: "Sizing In-charge",
    description: "Sizing Operations In-charge",
    level: "ic",
    permissions: [
      "order.view",
      "production.view",
      "sizing.view",
      "sizing.manage",
      "sizing.schedule",
      "yarn.view",
      "daily.view",
      "daily.enter",
      "reports.view",
    ],
  },
  {
    id: "weaving_ic",
    name: "Weaving In-charge",
    description: "Weaving Operations In-charge",
    level: "ic",
    permissions: [
      "order.view",
      "production.view",
      "loom.view",
      "loom.maintenance",
      "weaver.view",
      "weaver.manage",
      "weaver.performance",
      "daily.view",
      "daily.enter",
      "daily.edit",
      "reports.view",
    ],
  },
  {
    id: "qc_hod",
    name: "QC HoD",
    description: "Head of Quality Control",
    level: "hod",
    permissions: [
      "order.view",
      "production.view",
      "qc.view",
      "qc.inspect",
      "qc.approve",
      "qc.reject",
      "daily.view",
      "fabric.view",
      "reports.view",
      "reports.export",
    ],
  },
  {
    id: "scm_hod",
    name: "SCM HoD",
    description: "Head of Supply Chain Management",
    level: "hod",
    permissions: [
      "order.view",
      "production.view",
      "sourcing.view",
      "purchase.view",
      "scm.view",
      "scm.manage",
      "scm.logistics",
      "yarn.view",
      "fabric.view",
      "reports.view",
      "reports.export",
    ],
  },
  {
    id: "yarn_ic",
    name: "Yarn In-charge",
    description: "Yarn Management In-charge",
    level: "ic",
    permissions: [
      "order.view",
      "production.view",
      "sourcing.view",
      "purchase.view",
      "yarn.view",
      "yarn.manage",
      "reports.view",
    ],
  },
  {
    id: "fabric_ic",
    name: "Fabric In-charge",
    description: "Fabric Management In-charge",
    level: "ic",
    permissions: [
      "order.view",
      "production.view",
      "qc.view",
      "qc.inspect",
      "fabric.view",
      "fabric.manage",
      "reports.view",
    ],
  },
  {
    id: "data_entry_1",
    name: "Data Entry-1",
    description: "Data Entry Operator - Production",
    level: "entry",
    permissions: [
      "order.view",
      "production.view",
      "loom.view",
      "weaver.view",
      "daily.view",
      "daily.enter",
    ],
  },
  {
    id: "data_entry_2",
    name: "Data Entry-2",
    description: "Data Entry Operator - Inventory",
    level: "entry",
    permissions: [
      "order.view",
      "sourcing.view",
      "purchase.view",
      "yarn.view",
      "fabric.view",
    ],
  },
];

// Demo users with realistic names
export const DEMO_USERS: User[] = [
  {
    id: "USR-001",
    name: "Arjun Mehta",
    email: "arjun.mehta@stritntextile.com",
    roleId: "Admin",
    department: "IT",
    isActive: true,
    createdDate: "2024-01-01",
    lastLogin: "2024-06-20T10:30:00Z",
  },
  {
    id: "USR-002",
    name: "Priya Sharma",
    email: "priya.sharma@stritntextile.com",
    roleId: "prdn_hod",
    department: "Production",
    isActive: true,
    createdDate: "2024-01-15",
    lastLogin: "2024-06-20T09:15:00Z",
  },
  {
    id: "USR-003",
    name: "Rajesh Kumar",
    email: "rajesh.kumar@stritntextile.com",
    roleId: "planning_ic",
    department: "Production",
    isActive: true,
    createdDate: "2024-02-01",
    lastLogin: "2024-06-20T08:45:00Z",
  },
  {
    id: "USR-004",
    name: "Sunita Patel",
    email: "sunita.patel@stritntextile.com",
    roleId: "sourcing_hod",
    department: "Sourcing",
    isActive: true,
    createdDate: "2024-01-20",
    lastLogin: "2024-06-19T16:30:00Z",
  },
  {
    id: "USR-005",
    name: "Vikram Singh",
    email: "vikram.singh@stritntextile.com",
    roleId: "purchase_ic",
    department: "Purchase",
    isActive: true,
    createdDate: "2024-02-10",
    lastLogin: "2024-06-20T07:20:00Z",
  },
  {
    id: "USR-006",
    name: "Meera Joshi",
    email: "meera.joshi@stritntextile.com",
    roleId: "sizing_ic",
    department: "Production",
    isActive: true,
    createdDate: "2024-02-15",
    lastLogin: "2024-06-19T18:10:00Z",
  },
  {
    id: "USR-007",
    name: "Suresh Reddy",
    email: "suresh.reddy@stritntextile.com",
    roleId: "weaving_ic",
    department: "Production",
    isActive: true,
    createdDate: "2024-02-20",
    lastLogin: "2024-06-20T06:50:00Z",
  },
  {
    id: "USR-008",
    name: "Anjali Gupta",
    email: "anjali.gupta@stritntextile.com",
    roleId: "qc_hod",
    department: "Quality",
    isActive: true,
    createdDate: "2024-03-01",
    lastLogin: "2024-06-19T17:45:00Z",
  },
  {
    id: "USR-009",
    name: "Ravi Agarwal",
    email: "ravi.agarwal@stritntextile.com",
    roleId: "scm_hod",
    department: "Supply Chain",
    isActive: true,
    createdDate: "2024-03-05",
    lastLogin: "2024-06-20T11:20:00Z",
  },
  {
    id: "USR-010",
    name: "Kavita Desai",
    email: "kavita.desai@stritntextile.com",
    roleId: "yarn_ic",
    department: "Sourcing",
    isActive: true,
    createdDate: "2024-03-10",
    lastLogin: "2024-06-19T15:30:00Z",
  },
  {
    id: "USR-011",
    name: "Deepak Verma",
    email: "deepak.verma@stritntextile.com",
    roleId: "fabric_ic",
    department: "Quality",
    isActive: true,
    createdDate: "2024-03-15",
    lastLogin: "2024-06-20T12:40:00Z",
  },
  {
    id: "USR-012",
    name: "Pooja Nair",
    email: "pooja.nair@stritntextile.com",
    roleId: "data_entry_1",
    department: "Production",
    isActive: true,
    createdDate: "2024-04-01",
    lastLogin: "2024-06-20T09:25:00Z",
  },
  {
    id: "USR-013",
    name: "Amit Yadav",
    email: "amit.yadav@stritntextile.com",
    roleId: "data_entry_2",
    department: "Sourcing",
    isActive: true,
    createdDate: "2024-04-05",
    lastLogin: "2024-06-20T10:15:00Z",
  },
  {
    id: "USR-014",
    name: "Neha Bansal",
    email: "neha.bansal@stritntextile.com",
    roleId: "weaving_ic",
    department: "Production",
    isActive: false,
    createdDate: "2024-01-10",
    lastLogin: "2024-05-15T14:20:00Z",
  },
];

// Utility functions
export class UserRoleManager {
  static getRoleById(roleId: string): Role | undefined {
    return ROLES.find((role) => role.id === roleId);
  }

  static getUsersByRole(roleId: string): User[] {
    return DEMO_USERS.filter((user) => user.roleId === roleId);
  }

  static getUserPermissions(userId: string): Permission[] {
    const user = DEMO_USERS.find((u) => u.id === userId);
    if (!user) return [];

    const role = this.getRoleById(user.roleId);
    if (!role) return [];

    return PERMISSIONS.filter((permission) =>
      role.permissions.includes(permission.id),
    );
  }

  static hasPermission(userId: string, permissionId: string): boolean {
    const userPermissions = this.getUserPermissions(userId);
    return userPermissions.some((p) => p.id === permissionId);
  }

  static getRolesByLevel(level: Role["level"]): Role[] {
    return ROLES.filter((role) => role.level === level);
  }

  static getPermissionsByModule(module: string): Permission[] {
    return PERMISSIONS.filter((permission) => permission.module === module);
  }

  static getActiveUsers(): User[] {
    return DEMO_USERS.filter((user) => user.isActive);
  }

  static getDepartmentUsers(department: string): User[] {
    return DEMO_USERS.filter((user) => user.department === department);
  }
}
