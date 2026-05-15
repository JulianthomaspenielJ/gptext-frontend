// Delay calculation utility based on T&A plans and daily production
import { ProductionStorage } from "./productionStorage";
import { OrderStorage } from "./orderStorage";
import axios from "axios";
import { productionPlanningApi } from "@/services/api2";
import { DataStore } from "./dataStore";




// let cachedOrders: any[] | null = null;

// const fetchOrders = async () => {
//   if (cachedOrders) {
//     return cachedOrders; // return cached data
//   }

//   const orderResponse = await productionPlanningApi.get(
//     "/productionplanning-getall"
//   );
//   cachedOrders = orderResponse.data.productionplanning;
//   return cachedOrders;
// };


/**
 * Get T&A information for an order
 * This would typically come from T&A plan data, using order dates as fallback
 */
export const getTAInfo = async (orderId: string): Promise <any> => {
  // const orders = OrderStorage.getOrders();
  //  const orders = await fetchOrders();
    const { orders } = await DataStore.fetchAllData();

  //  console.log(orders)
  const order = orders.find((o) => o.orderid === orderId);

  if (!order) return null;

  // Extract T&A specific dates - in a real system these would come from T&A plan module
  // For now, we'll use order dates but clearly distinguish them as T&A loom dates

  // Loom Start Date: When the loom actually starts production (could be after order date)
  const orderDate = new Date(order.startdate);
  const loomStartDate = new Date(orderDate);
  loomStartDate.setDate(loomStartDate.getDate() + 2); // Loom starts 2 days after order for setup

  // Loom Completion Date: When the loom should complete production (before delivery)
  const deliveryDate = new Date(order.enddate);
  const loomCompletionDate = new Date(deliveryDate);
  // console.log(orderId,loomStartDate)
  // console.log(orderId,loomCompletionDate)
  // loomCompletionDate.setDate(loomCompletionDate.getDate() - 2); // Complete 2 days before delivery
loomCompletionDate.setDate(Math.max(loomCompletionDate.getDate() - 2, loomStartDate.getDate()));

  const plannedDays = Math.ceil(
    (loomCompletionDate.getTime() - loomStartDate.getTime()) /
      (24 * 60 * 60 * 1000),
  );
  const plannedDailyProduction = order.quantity / Math.max(plannedDays, 1);


  return {
    loomStartDate: loomStartDate.toISOString().split("T")[0],
    loomCompletionDate: loomCompletionDate.toISOString().split("T")[0],
    plannedDailyProduction,
    totalQuantity: order.quantity,
    plannedDays: Math.max(plannedDays, 1),
  };
};

/**
 * Calculate delay information for a specific order
 */
export const calculateDelayInfo = async (orderId: string): Promise<any> => {
    // console.log(orderId)

  const taInfo = await getTAInfo(orderId);
  console.log(taInfo)
  if (!taInfo) return null;


  // const productionRecords = ProductionStorage.getProductionRecords()
  //   .filter((record) => record.orderId === orderId)
  //   .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // const orders = await fetchOrders();
      const { orders } = await DataStore.fetchAllData();

    const productionRecords = orders
    .filter((record) => record.orderid === orderId)
    .sort((a, b) => new Date(a.startdate).getTime() - new Date(b.startdate).getTime());

// console.log(productionRecords)
  if (productionRecords.length === 0) {
    // No production started yet
    return {
      isDelayed: false,
      delayDays: 0,
      originalRunoutDate: taInfo.loomCompletionDate,
      expectedRunoutDate: taInfo.loomCompletionDate,
      currentProgress: 0,
      expectedProgress: 0,
      dailyProductionRate: 0,
      plannedDailyRate: taInfo.plannedDailyProduction,
      remainingQuantity: taInfo.totalQuantity,
      estimatedDaysToComplete: taInfo.plannedDays,
    };
  }

  // Calculate actual production progress
  const totalProduced = productionRecords.reduce(
    (sum, record) => sum + record.actualproduction,
    0,
  );
//   console.log("Production Records:", productionRecords);
// console.log(
//   "Actual Production Values:",
//   productionRecords.map((r) => r.actualproduction)
// );

  const currentProgress = (totalProduced / taInfo.totalQuantity) * 100;
  const remainingQuantity = taInfo.totalQuantity - totalProduced;

  // Calculate days since production started
  const firstProductionDate = new Date(productionRecords[0].startdate);
  const today = new Date();
  const daysSinceStart = Math.max(
    1,
    Math.ceil(
      (today.getTime() - firstProductionDate.getTime()) / (24 * 60 * 60 * 1000),
    ),
  );

  
  // Calculate actual daily production rate
  const dailyProductionRate = totalProduced / daysSinceStart;

  // Calculate expected progress based on planned timeline
  const loomStartDate = new Date(taInfo.loomStartDate);
  const daysFromLoomStart = Math.max(
    0,
    Math.ceil(
      (today.getTime() - loomStartDate.getTime()) / (24 * 60 * 60 * 1000),
    ),
  );
  const expectedProgress = Math.min(
    100,
    ((daysFromLoomStart * taInfo.plannedDailyProduction) /
      taInfo.totalQuantity) *
      100,
  );

  // Calculate estimated completion date based on current production rate
  let estimatedDaysToComplete = taInfo.plannedDays;
  let expectedRunoutDate = taInfo.loomCompletionDate;

  if (dailyProductionRate > 0) {
    estimatedDaysToComplete = Math.ceil(
      remainingQuantity / dailyProductionRate,
    );
    const estimatedCompletionDate = new Date(
      today.getTime() + estimatedDaysToComplete * 24 * 60 * 60 * 1000,
    );
    expectedRunoutDate = estimatedCompletionDate.toISOString().split("T")[0];
  }

  // Check if delayed - more sensitive check
  const progressGap = expectedProgress - currentProgress;
  const rateGap = taInfo.plannedDailyProduction - dailyProductionRate;

  // Consider delayed if:
  // 1. Progress is more than 10% behind expected, OR
  // 2. Daily rate is consistently below planned (more than 15% gap), OR
  // 3. Expected completion is after original T&A date
  const isDelayed =
    progressGap > 10 ||
    rateGap > taInfo.plannedDailyProduction * 0.15 ||
    new Date(expectedRunoutDate) > new Date(taInfo.loomCompletionDate);

  // Calculate delay days - difference between expected runout and T&A completion date
  const originalRunoutDate = new Date(taInfo.loomCompletionDate);
  const newRunoutDate = new Date(expectedRunoutDate);
  const delayDays = Math.max(
    0,
    Math.ceil(
      (newRunoutDate.getTime() - originalRunoutDate.getTime()) /
        (24 * 60 * 60 * 1000),
    ),
  );

  return {
    isDelayed,
    delayDays,
    originalRunoutDate: taInfo.loomCompletionDate,
    expectedRunoutDate,
    currentProgress: Math.round(currentProgress * 100) / 100,
    expectedProgress: Math.round(expectedProgress * 100) / 100,
    dailyProductionRate: Math.round(dailyProductionRate * 100) / 100,
    plannedDailyRate: Math.round(taInfo.plannedDailyProduction * 100) / 100,
    remainingQuantity: Math.round(remainingQuantity),
    estimatedDaysToComplete,
  };
};

/**
 * Get delay information for all orders
 */
export const getAllDelayInfo = async (): Promise<any> => {
  // const orders = OrderStorage.getOrders();
  //  const orders = await fetchOrders();
    const { orders } = await DataStore.fetchAllData();

  // const delayInfo: Record<string, DelayInfo> = {};
  const result = {};

  // orders.forEach((order) => {
  //   const delay = await calculateDelayInfo(order.id);
  //   if (delay) {
  //     delayInfo[order.id] = delay;
  //   }
  // });

  // return delayInfo;
    for (const order of orders) {
    const info = await calculateDelayInfo(order.orderid);
    if (info) result[order.orderid] = info;
  }

  return result;
};

/**
 * Get orders with delays
 */
export const getDelayedOrders = (): Array<{
  orderId: string;
  delayInfo:any;
}> => {
  const allDelayInfo = getAllDelayInfo();
  return Object.entries(allDelayInfo)
    .filter(([_, delayInfo]) => delayInfo.isDelayed)
    .map(([orderId, delayInfo]) => ({ orderId, delayInfo }));
};

/**
 * Format delay information for display
 */
export const formatDelayInfo = (delayInfo: any): string => {
  if (!delayInfo.isDelayed) {
    return "On Schedule";
  }

  if (delayInfo.delayDays > 0) {
    return `Delayed by ${delayInfo.delayDays} day(s)`;
  }

  return "Behind Schedule";
};

/**
 * Get delay status color
 */
export const getDelayStatusColor = (delayInfo: any): string => {
  if (!delayInfo.isDelayed) {
    return "text-green-600 bg-green-50 border-green-200";
  }

  if (delayInfo.delayDays <= 2) {
    return "text-yellow-600 bg-yellow-50 border-yellow-200";
  }

  return "text-red-600 bg-red-50 border-red-200";
};

/**
 * Calculate loom utilization efficiency based on T&A vs actual
 */
export const calculateLoomEfficiency = async (orderId: string): Promise<any> => {
  const delayInfo = await calculateDelayInfo(orderId);
  if (!delayInfo) return 0;

  if (delayInfo.plannedDailyRate === 0) return 100;

  const efficiency =
    (delayInfo.dailyProductionRate / delayInfo.plannedDailyRate) * 100;
  return Math.min(100, Math.max(0, Math.round(efficiency)));
};

/**
 * Get production health status
 */
export const getProductionHealthStatus = (): {
  onSchedule: number;
  delayed: number;
  critical: number;
  totalOrders: number;
} => {
  const allDelayInfo = getAllDelayInfo();
  const orders = Object.values(allDelayInfo);

  return {
    onSchedule: orders.filter((info) => !info.isDelayed).length,
    delayed: orders.filter((info) => info.isDelayed && info.delayDays <= 3)
      .length,
    critical: orders.filter((info) => info.isDelayed && info.delayDays > 3)
      .length,
    totalOrders: orders.length,
  };
};
