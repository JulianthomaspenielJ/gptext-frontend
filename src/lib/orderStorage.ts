// Order Storage Service for persisting orders across sessions
import { DataSync } from "./dataSync";
export interface Order {
  id: string;
  gptid: string;
  customer: string;
  fabric: string;
  construction: string;
  quantity: number;
  unit: string;
  orderDate: string;
  deliveryDate: string;
  status: string;
  progress: number;
  priority: string;
  loomType?: string;
  selectedLooms?: string[];
  timeActionPlan?: TAProcess[];
  tasks?: Task[];
  orderState: string;
}

export interface TAProcess {
  id: number;
  process: string;
  targetDate: string;
  actualDate?: string;
  status: "pending" | "in-progress" | "completed" | "delayed";
  responsible: string;
  days: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  assignedTo: string;
  status: string;
  priority: string;
  category: string;
  orderId: string;
}

const ORDERS_KEY = "gp_textiles_orders";

// Helper function to parse dates in various formats
function parseDate(dateString: string): Date {
  if (!dateString) {
    return new Date();
  }

  // Try parsing as-is first
  let date = new Date(dateString);

  // If invalid, try DD-MM-YYYY format
  if (isNaN(date.getTime())) {
    const parts = dateString.split(/[-\/]/);
    if (parts.length === 3) {
      // Assume DD-MM-YYYY or DD/MM/YYYY
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
      const year = parseInt(parts[2], 10);

      if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year > 1900) {
        date = new Date(year, month, day);
      }
    }
  }

  // If still invalid, return current date
  if (isNaN(date.getTime())) {
    console.warn(`Could not parse date: ${dateString}, using current date`);
    return new Date();
  }

  return date;
}

// Default sample orders
// const defaultOrders: Order[] = [
//   {
//     id: "BTC-101",
//     customer: "Blue Ocean Textiles",
//     fabric: "Cotton Twill",
//     construction: "20x20x60x58",
//     quantity: 12000,
//     unit: "meters",
//     orderDate: "2025-05-30",
//     deliveryDate: "2025-06-29",
//     status: "In Progress",
//     progress: 65,
//     priority: "High",
//   },
//   {
//     id: "VTS-205",
//     customer: "Victory Fabrics Ltd",
//     fabric: "Polyester Canvas",
//     construction: "40x40x70",
//     quantity: 8500,
//     unit: "meters",
//     orderDate: "2025-06-02",
//     deliveryDate: "2025-07-15",
//     status: "Planning",
//     progress: 25,
//     priority: "Medium",
//   },
//   {
//     id: "FTC-309",
//     customer: "Future Textile Corp",
//     fabric: "Cotton Plain",
//     construction: "30x30x68",
//     quantity: 6200,
//     unit: "meters",
//     orderDate: "2025-06-05",
//     deliveryDate: "2025-07-08",
//     status: "In Progress",
//     progress: 80,
//     priority: "High",
//   },
// ];

// Standard T&A processes with dependencies
export const standardProcesses = [
  {
    name: "Yarn Requirement",
    days: 1,
    responsible: "Planning Incharge",
    processstep: 1,
  },
  {
    name: "Yarn Purchase",
    days: 4,
    responsible: "Purchase Incharge",
    processstep: 2,
  },
  {
    name: "Yarn Deliver to Warping/Sizing",
    days: 1,
    responsible: "Dispatch Incharge Yarn",
    processstep: 3,
  },
  {
    name: "Warping & Sizing",
    days: 1,
    responsible: "Sizing Incharge",
    processstep: 4,
  },
  {
    name: "Warp Deliver to Weaving",
    days: 1,
    responsible: "Sizing Incharge",
    processstep: 5,
  },
  {
    name: "Weft Deliver to Weaving",
    days: 1,
    responsible: "Dispatch Incharge Yarn",
    processstep: 6,
  },
  {
    name: "Loom Drawing",
    days: 1,
    responsible: "Weaving Incharge",
    processstep: 7,
  },
  {
    name: "Loom Start Date",
    days: 1,
    responsible: "Weaving Incharge",
    processstep: 8,
  },
  {
    name: "First Piece Approval",
    days: 1,
    responsible: "Weaving Incharge",
    processstep: 9,
  },
  {
    name: "Production",
    days: 15,
    responsible: "Weaving Incharge",
    processstep: 10,
  },
  {
    name: "Loom Completion Date",
    days: 1,
    responsible: "Weaving Incharge",
    processstep: 11,
  },
  {
    name: "Fabric Handover To SCM",
    days: 1,
    responsible: "Weaving Incharge",
    processstep: 12,
  },
  {
    name: "Fabric Checking Completed",
    days: 1,
    responsible: "QC Incharge",
    processstep: 13,
  },
  {
    name: "Fabric Dispatch Completed",
    days: 2,
    responsible: "Dispatch Incharge Fabric",
    processstep: 14,
  },
];

export class OrderStorage {
  // static getOrders(): Order[] {
  //   try {
  //     const stored = localStorage.getItem(ORDERS_KEY);
  //     if (stored) {
  //       const orders = JSON.parse(stored);
  //       // Validate and fix any invalid dates in stored orders
  //       const validatedOrders = orders.map((order: Order) => ({
  //         ...order,
  //         orderDate: this.validateDateString(order.orderDate),
  //         deliveryDate: this.validateDateString(order.deliveryDate),
  //       }));
  //       return validatedOrders;
  //     }
  //     // Initialize with default orders if none exist
  //     this.setOrders(defaultOrders);
  //     return defaultOrders;
  //   } catch (error) {
  //     console.error("Error loading orders:", error);
  //     return defaultOrders;
  //   }
  // }

  // Helper method to validate and fix date strings
  static validateDateString(dateString: string): string {
    if (!dateString) {
      return new Date().toISOString().split("T")[0];
    }

    const parsedDate = parseDate(dateString);
    return parsedDate.toISOString().split("T")[0];
  }

  static setOrders(orders: Order[]): void {
    try {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
      DataSync.notifyChange(DataSync.DATA_TYPES.ORDERS);
      DataSync.notifyChange(DataSync.DATA_TYPES.DASHBOARD);
    } catch (error) {
      console.error("Error saving orders:", error);
    }
  }

  // static addOrder(order: Order): void {
  //   // const orders = this.getOrders();
  //   // orders.unshift(order); // Add to beginning
  //   // this.setOrders(orders);
  // }

  // static updateOrder(orderId: string, updates: Partial<Order>): void {
  //   // const orders = this.getOrders();
  //   const index = orders.findIndex((o) => o.id === orderId);
  //   if (index !== -1) {
  //     orders[index] = { ...orders[index], ...updates };
  //     this.setOrders(orders);
  //   }
  // }

  // static deleteOrder(orderId: string): void {
  //   const orders = this.getOrders();
  //   const filtered = orders.filter((o) => o.id !== orderId);
  //   this.setOrders(filtered);
  // }

  // static getOrder(orderId: string): Order | undefined {
  //   const orders = this.getOrders();
  //   return orders.find((o) => o.id === orderId);
  // }

  // Generate formula-based T&A plan from order creation date
  static generateTimeActionPlan(orderCreationDate: string): TAProcess[] {
    // Parse the input date using helper function
    const startDate = parseDate(orderCreationDate);
    let currentDate = new Date(startDate);

    return standardProcesses.map((process, index) => {
      // For yarn requirement, use order creation date
      if (index === 0) {
        currentDate = new Date(startDate);
      }

      const targetDate = new Date(currentDate);
      targetDate.setDate(currentDate.getDate() + process.days);

      // Additional safety check for target date
      if (isNaN(targetDate.getTime())) {
        console.error(
          `Invalid target date calculated for process: ${process.name}`,
        );
        targetDate.setTime(new Date().getTime()); // Fallback to current date
      }

      const taProcess: TAProcess = {
        id: index + 1,
        process: process.name,
        targetDate: targetDate.toISOString().split("T")[0],
        responsible: process.responsible,
        status: "pending",
        actualDate: undefined,
        days: process.days,
      };

      // Move to next working day (skip weekends for some processes)
      currentDate = new Date(targetDate);
      if (process.name.includes("Purchase") && currentDate.getDay() === 6) {
        currentDate.setDate(currentDate.getDate() + 2); // Skip weekend
      }

      return taProcess;
    });
  }

  // Generate tasks from T&A plan
  static generateTasksFromTA(
    orderId: string,
    customer: string,
    timeActionPlan: TAProcess[],
  ): Task[] {
    return timeActionPlan.map((item, index) => ({
      id: `${orderId}-task-${index + 1}`,
      title: `${item.process} - ${orderId}`,
      description: `Complete ${item.process.toLowerCase()} for order ${orderId} (${customer})`,
      dueDate: item.targetDate,
      assignedTo: item.responsible,
      status: "Pending",
      priority: index < 5 ? "High" : "Medium",
      category: item.process.includes("Yarn")
        ? "Yarn Management"
        : item.process.includes("Loom")
          ? "Loom Operations"
          : "Quality Control",
      orderId: orderId,
    }));
  }

  // Calculate production metrics
  // static getProductionMetrics(orderId: string): {
  //   yarnReqDate: string;
  //   productionStartDate: string;
  //   estimatedCompletionDate: string;
  //   totalDays: number;
  // } {
  //   const order = this.getOrder(orderId);
  //   if (!order || !order.timeActionPlan) {
  //     return {
  //       yarnReqDate: "",
  //       productionStartDate: "",
  //       estimatedCompletionDate: "",
  //       totalDays: 0,
  //     };
  //   }

  //   const yarnReqProcess = order.timeActionPlan.find(
  //     (p) => p.process === "Yarn Requirement",
  //   );
  //   const productionProcess = order.timeActionPlan.find(
  //     (p) => p.process === "Production",
  //   );
  //   const dispatchProcess = order.timeActionPlan.find(
  //     (p) => p.process === "Fabric Dispatch Completed",
  //   );

  //   const yarnReqDate = yarnReqProcess?.targetDate || "";
  //   const productionStartDate = productionProcess?.targetDate || "";
  //   const estimatedCompletionDate = dispatchProcess?.targetDate || "";

  //   const totalDays =
  //     yarnReqDate && estimatedCompletionDate
  //       ? Math.ceil(
  //           (new Date(estimatedCompletionDate).getTime() -
  //             new Date(yarnReqDate).getTime()) /
  //             (1000 * 60 * 60 * 24),
  //         )
  //       : 0;

  //   return {
  //     yarnReqDate,
  //     productionStartDate,
  //     estimatedCompletionDate,
  //     totalDays,
  //   };
  // }
}
