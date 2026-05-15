// Centralized data store for consistent numbers across all modules
import { OrderStorage } from "./orderStorage";
import { LoomStorage } from "./loomStorage";
import { WeaverStorage } from "./weaverStorage";
import { ProductionStorage } from "./productionStorage";
import { getConsistentStats, getDemoOrders, getDemoLooms } from "./demoData";
import { productionPlanningApi } from "../services/api2";
import { loomApi } from "../services/api2";
import { weaverApi } from "../services/api2";
import { format } from "date-fns";

// import { workforceApi } from "@/api/workforceApi"; // if employees come from here

// Employee/Staff data - replacing old names
export const employees = [
  {
    id: "1",
    name: "Rajesh Verma",
    role: "Yarn Supervisor",
    email: "rajesh@stritntextile.com",
  },
  {
    id: "2",
    name: "Amit Sharma",
    role: "Weaving Supervisor",
    email: "amit@stritntextile.com",
  },
  {
    id: "3",
    name: "Sunil Gupta",
    role: "Production Manager",
    email: "sunil@stritntextile.com",
  },
  {
    id: "4",
    name: "Deepak Singh",
    role: "Quality Inspector",
    email: "deepak@stritntextile.com",
  },
  {
    id: "5",
    name: "Vikram Patel",
    role: "Maintenance Tech",
    email: "vikram@stritntextile.com",
  },
  {
    id: "6",
    name: "Arjun Reddy",
    role: "Shift Supervisor",
    email: "arjun@stritntextile.com",
  },
];

// Loom data for consistency
export const looms = [
  {
    id: "MK-1",
    type: "Rapier",
    status: "Running",
    efficiency: 92,
    currentOrder: "BTC-101",
    nextMaintenance: "2024-06-25",
    location: "Section A",
    manufacturer: "Toyota",
    model: "JAT610",
    weaver: "Rajesh Kumar",
    weaverId: "WVR-001",
  },
  {
    id: "MK-2",
    type: "Rapier",
    status: "Running",
    efficiency: 88,
    currentOrder: "VTS-205",
    nextMaintenance: "2024-06-28",
    location: "Section A",
    manufacturer: "Toyota",
    model: "JAT610",
    weaver: "Rajesh Kumar",
    weaverId: "WVR-001",
  },
  {
    id: "MK-3",
    type: "Rapier",
    status: "Idle",
    efficiency: 85,
    currentOrder: null,
    nextMaintenance: "2024-06-30",
    location: "Section A",
    manufacturer: "Toyota",
    model: "JAT610",
    weaver: "Priya Sharma",
    weaverId: "WVR-002",
  },
  {
    id: "AJ-1",
    type: "Airjet",
    status: "Maintenance",
    efficiency: 0,
    currentOrder: null,
    nextMaintenance: "2024-06-24",
    location: "Section B",
    manufacturer: "Picanol",
    model: "OptiMax",
  },
  {
    id: "AJ-2",
    type: "Airjet",
    status: "Running",
    efficiency: 85,
    currentOrder: "FTC-309",
    nextMaintenance: "2024-06-22",
    location: "Section B",
    manufacturer: "Picanol",
    model: "OptiMax",
  },
  {
    id: "AJ-3",
    type: "Airjet",
    status: "Idle",
    efficiency: 90,
    currentOrder: null,
    nextMaintenance: "2024-07-02",
    location: "Section B",
    manufacturer: "Picanol",
    model: "OptiMax",
  },
  {
    id: "SZ-1",
    type: "Sulzer",
    status: "Running",
    efficiency: 95,
    currentOrder: "BTC-101",
    nextMaintenance: "2024-07-01",
    location: "Section C",
    manufacturer: "Sulzer",
    model: "P7300",
  },
  {
    id: "SZ-2",
    type: "Sulzer",
    status: "Idle",
    efficiency: 87,
    currentOrder: null,
    nextMaintenance: "2024-07-05",
    location: "Section C",
    manufacturer: "Sulzer",
    model: "P7300",
  },
];

// // Central data calculation functions
// export class DataStore {
//   static getSystemStats() {
//     // Use consistent demo data calculations
//     const stats = getConsistentStats();
//     const orders = OrderStorage.getOrders();
//     const realLooms = LoomStorage.getLooms();
//     const loomStatus = ProductionStorage.getLoomStatus();

//     // Calculate task statistics from orders
//     const allTasks = orders.flatMap((order) => order.tasks || []);
//     const totalTasks = allTasks.length || stats.orders.inProgress * 3; // Estimate if no tasks
//     const completedTasks = allTasks.filter(
//       (task) => task.status === "Completed",
//     ).length;
//     const pendingTasks = allTasks.filter(
//       (task) => task.status === "Pending",
//     ).length;
//     const inProgressTasks = allTasks.filter(
//       (task) => task.status === "In Progress",
//     ).length;

//     // Calculate efficiency from real loom data
//     const runningLooms = loomStatus.filter((s) => s.status === "running");
//     const avgLoomEfficiency =
//       runningLooms.length > 0
//         ? runningLooms.reduce(
//             (sum, s) =>
//               sum + (realLooms.find((l) => l.id === s.loomId)?.efficiency || 0),
//             0,
//           ) / runningLooms.length
//         : 0;

//     return {
//       looms: {
//         total: stats.looms.total,
//         active: stats.looms.running,
//         idle: stats.looms.idle,
//         maintenance: stats.looms.maintenance,
//         delayed: stats.looms.delayed,
//         avgEfficiency: Math.round(avgLoomEfficiency * 10) / 10,
//       },
//       orders: {
//         total: stats.orders.total,
//         active: stats.orders.inProgress + stats.orders.planning,
//         completed: stats.orders.completed,
//         onHold: stats.orders.onHold,
//         planning: stats.orders.planning,
//         inProgress: stats.orders.inProgress,
//       },
//       production: {
//         target: stats.production.targetMeters,
//         actual: stats.production.actualMeters,
//         todaysProduction: Math.round(stats.production.actualMeters * 0.15),
//         efficiency: stats.production.efficiency,
//       },
//       tasks: {
//         total: totalTasks || stats.orders.inProgress * 3,
//         completed: completedTasks || Math.round(totalTasks * 0.3),
//         pending: pendingTasks || Math.round(totalTasks * 0.4),
//         inProgress: inProgressTasks || Math.round(totalTasks * 0.3),
//         overdue: stats.looms.delayed,
//       },
//       employees: {
//         total: employees.length,
//         active: employees.length - 1,
//       },
//     };
//   }

//   static getLoomStats() {
//     const stats = this.getSystemStats();
//     return {
//       totalLooms: stats.looms.total,
//       activeLooms: stats.looms.active,
//       underMaintenance: stats.looms.maintenance,
//       avgEfficiency: stats.looms.avgEfficiency,
//       idleLooms: stats.looms.idle,
//     };
//   }

//   static getOrderStats() {
//     const stats = this.getSystemStats();
//     return {
//       totalOrders: stats.orders.total,
//       inProgress: stats.orders.inProgress,
//       planning: stats.orders.planning,
//       completed: stats.orders.completed,
//       onHold: stats.orders.onHold,
//     };
//   }

//   static getTaskStats() {
//     const stats = this.getSystemStats();
//     return {
//       totalTasks: stats.tasks.total,
//       completed: stats.tasks.completed,
//       inProgress: stats.tasks.inProgress,
//       pending: stats.tasks.pending,
//       overdue: stats.tasks.overdue,
//     };
//   }

//   static getProductionStats() {
//     const stats = this.getSystemStats();
//     return {
//       todaysProduction: stats.production.todaysProduction,
//       targetProduction: stats.production.target,
//       actualProduction: stats.production.actual,
//       efficiency: stats.production.efficiency,
//     };
//   }

//   static getDashboardChartData() {
//     const stats = this.getSystemStats();
//     const orders = OrderStorage.getOrders();

//     return {
//       orderStatusChart: [
//         {
//           name: "In Progress",
//           value: stats.orders.inProgress,
//           color: "#3b82f6",
//         },
//         { name: "Planning", value: stats.orders.planning, color: "#eab308" },
//         { name: "Completed", value: stats.orders.completed, color: "#22c55e" },
//         { name: "On Hold", value: stats.orders.onHold, color: "#ef4444" },
//       ],
//       loomStatusChart: [
//         { name: "Active", value: stats.looms.active, color: "#22c55e" },
//         { name: "Idle", value: stats.looms.idle, color: "#6b7280" },
//         {
//           name: "Maintenance",
//           value: stats.looms.maintenance,
//           color: "#eab308",
//         },
//       ],
//       productionTrend: orders
//         .map((order, index) => ({
//           month: `Week ${index + 1}`,
//           target: Math.round(order.quantity * 0.2), // Weekly target
//           actual: Math.round(order.quantity * (order.progress / 100) * 0.2), // Weekly actual
//         }))
//         .slice(0, 6), // Last 6 weeks
//       efficiencyData: looms
//         .filter((l) => l.status === "Running")
//         .map((loom) => ({
//           loom: loom.id,
//           efficiency: loom.efficiency,
//           type: loom.type,
//         })),
//     };
//   }

//   static getEmployeeByRole(role: string) {
//     return employees.find((emp) => emp.role === role) || employees[0];
//   }

//   static getEmployees() {
//     return employees;
//   }

//   static getLooms() {
//     return looms;
//   }
// }

export class DataStore {
  // Central API call – all stats depend on these
  // static async fetchAllData() {
  //   const [orderRes, loomRes, weaverRes] = await Promise.all([
  //     productionPlanningApi.get("/productionplanning-getall"),
  //     loomApi.get("/loom-getall"),
  //     weaverApi.get("/weaver-getall"),
  //   ]);

  //   return {
  //     orders: orderRes.data.productionplanning || [],
  //     looms: loomRes.data.loom || [],
  //     employees: weaverRes.data.weaver || [],
  //   };
  // }

   private static cache: any = null;
  private static lastFetch = 0;

  static async fetchAllData(force = false) {
    const now = Date.now();

    if (!force && this.cache && now - this.lastFetch < 60_000) {
      return this.cache;
    }

    const [orderRes, loomRes, weaverRes] = await Promise.all([
      productionPlanningApi.get("/productionplanning-getall"),
      loomApi.get("/loom-getall"),
      weaverApi.get("/weaver-getall"),
    ]);

    this.cache = {
      orders: orderRes.data.productionplanning || [],
      looms: loomRes.data.loom || [],
      employees: weaverRes.data.weaver || [],
    };

    this.lastFetch = now;
    return this.cache;
  }

  // ===============================
  // MAIN SYSTEM STATS
  // ===============================
  static async getSystemStats() {
    const { orders, looms, employees } = await this.fetchAllData();
    // console.log(orders);

    // ----- ORDER TASKS -----
    const allTasks = orders.flatMap((o) => o.tasks || []);
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((t) => t.status === "Completed").length;
    const pendingTasks = allTasks.filter((t) => t.status === "Pending").length;
    const inProgressTasks = allTasks.filter((t) => t.status === "In Progress").length;

    // ----- LOOM STATUS -----
    const runningLooms = looms.filter((l) => l.status === "Running");
    const idleLooms = looms.filter((l) => l.status === "Idle");
    const maintenanceLooms = looms.filter((l) => l.status === "Maintenance");
    const delayedLooms = looms.filter((l) => l.status === "Delayed");

    const avgEfficiency =
      runningLooms.reduce((sum, l) => sum + (l.efficiency || 0), 0) /
        (runningLooms.length || 1);

    // ----- ORDERS -----
    const inProgressOrders = orders.filter((o) => Number(o.progress) > 0 && Number(o.progress) < 100);
    const completedOrders = orders.filter((o) => Number(o.progress) === 100);
    const planningOrders = orders.filter((o) => Number(o.progress) === 0);
        const today = format(new Date(), "yyyy-MM-dd");

    return {
      looms: {
        total: looms.length,
        active: runningLooms.length,
        idle: idleLooms.length,
        maintenance: maintenanceLooms.length,
        delayed: delayedLooms.length,
        avgEfficiency: Number(avgEfficiency.toFixed(1)),
      },

      orders: {
        total: orders.length,
        active: inProgressOrders.length + planningOrders.length,
        completed: completedOrders.length,
        onHold: 0, // unless you have field for on hold
        planning: planningOrders.length,
        inProgress: inProgressOrders.length,
      },

      // production: {
      //   target: orders.reduce((sum, o) => sum + Number(o.meters || 0), 0),
      //   actual: orders.reduce((sum, o) => sum + (o.actualproduction || 0), 0),
      //   todaysProduction: Math.round(
      //     orders.reduce((sum, o) => sum + (o.actualproduction || 0), 0) * 0.15
      //   ),
      //   efficiency:
      //     Math.round(
      //       (orders.reduce((s, o) => s + (o.actualproduction || 0), 0) /
      //         orders.reduce((s, o) => s + Number(o.meters || 0), 0)) *
      //         100
      //     ) || 0,
      // },
      
      production: {
        target: orders.reduce((sum, o) => sum + Number(o.meters || 0), 0),
        actual: orders.reduce((sum, o) => sum + Number(o.actualproduction || 0), 0),
        todaysProduction: Math.round(
          orders.reduce((sum, o) => sum + Number(o.actualproduction || 0), 0)
        ),

        // todaysProduction: orders
        //   .filter(o => o.orderdate === today)
        //   .reduce((s, o) => s + Number(o.actualproduction || 0), 0),

        efficiency:
          Math.round(
            (orders.reduce((s, o) => s + Number(o.actualproduction || 0), 0) /
              orders.reduce((s, o) => s + Number(o.meters || 0), 0)) *
              100
          ) || 0,
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks,
        inProgress: inProgressTasks,
        overdue: delayedLooms.length,
      },

      employees: {
        total: employees.length,
        active: employees.length - 1, // adjust if needed
      },
    };
  }

  // ===============================
  // INDIVIDUAL STAT GROUPS
  // ===============================

  static async getLoomStats() {
    const stats = await this.getSystemStats();
    return {
      totalLooms: stats.looms.total,
      activeLooms: stats.looms.active,
      underMaintenance: stats.looms.maintenance,
      avgEfficiency: stats.looms.avgEfficiency,
      idleLooms: stats.looms.idle,
    };
  }

  static async getOrderStats() {
    const stats = await this.getSystemStats();
    return {
      totalOrders: stats.orders.total,
      inProgress: stats.orders.inProgress,
      planning: stats.orders.planning,
      completed: stats.orders.completed,
      onHold: stats.orders.onHold,
    };
  }

  static async getTaskStats() {
    const stats = await this.getSystemStats();
    return {
      totalTasks: stats.tasks.total,
      completed: stats.tasks.completed,
      inProgress: stats.tasks.inProgress,
      pending: stats.tasks.pending,
      overdue: stats.tasks.overdue,
    };
  }

  static async getProductionStats() {
    const stats = await this.getSystemStats();
    return {
      todaysProduction: stats.production.todaysProduction,
      targetProduction: stats.production.target,
      actualProduction: stats.production.actual,
      efficiency: stats.production.efficiency,
    };
  }

  // ===============================
  // CHART DATA
  // ===============================

  static async getDashboardChartData() {
    const { orders, looms } = await this.fetchAllData();
    const stats = await this.getSystemStats();
    // console.log(stats)

    return {
      orderStatusChart: [
        { name: "In Progress", value: stats.orders.inProgress, color: "#3b82f6" },
        { name: "Planning", value: stats.orders.planning, color: "#eab308" },
        { name: "Completed", value: stats.orders.completed, color: "#22c55e" },
        { name: "On Hold", value: stats.orders.onHold, color: "#ef4444" },
      ],

      loomStatusChart: [
        { name: "Active", value: stats.looms.active, color: "#22c55e" },
        { name: "Idle", value: stats.looms.idle, color: "#6b7280" },
        { name: "Maintenance", value: stats.looms.maintenance, color: "#eab308" },
      ],

      productionTrend: orders.slice(0, 6).map((order, i) => ({
        month: `Week ${i + 1}`,
        // target: Math.round(order.quantity * 0.2),
        // actual: Math.round(order.quantity * (order.progress / 100) * 0.2),
        target: Math.round(order.quantity),
        actual: Math.round(order.actualproduction),
      })),

      efficiencyData: looms
        .filter((l) => l.status === "Running")
        .map((l) => ({
          loom: l.id,
          efficiency: l.efficiency,
          type: l.loomtype,
        })),
    };
  }

  // ===============================
  // EMPLOYEES & LOOMS
  // ===============================
  static async getEmployeeByRole(role: string) {
    const { employees } = await this.fetchAllData();
    return employees.find((e) => e.role === role) || employees[0];
  }

  static async getEmployees() {
    const { employees } = await this.fetchAllData();
    return employees;
  }

  static async getLooms() {
    const { looms } = await this.fetchAllData();
    return looms;
  }
}

