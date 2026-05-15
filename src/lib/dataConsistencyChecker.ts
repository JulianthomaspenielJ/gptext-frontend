// Data consistency checker to ensure no mismatches across modules
import { OrderStorage } from "./orderStorage";
import { LoomStorage } from "./loomStorage";
import { ProductionStorage } from "./productionStorage";
import { WeaverStorage } from "./weaverStorage";

interface ConsistencyReport {
  isConsistent: boolean;
  issues: string[];
  warnings: string[];
  recommendations: string[];
}

export class DataConsistencyChecker {
  /**
   * Comprehensive data consistency check across all modules
   */
  static checkAllModules(): ConsistencyReport {
    const report: ConsistencyReport = {
      isConsistent: true,
      issues: [],
      warnings: [],
      recommendations: [],
    };

    // Check order-loom consistency
    this.checkOrderLoomConsistency(report);

    // Check weaver-loom assignments
    this.checkWeaverLoomConsistency(report);

    // Check production records consistency
    this.checkProductionRecordsConsistency(report);

    // Check numerical data consistency
    this.checkNumericalConsistency(report);

    // Final consistency status
    report.isConsistent = report.issues.length === 0;

    return report;
  }

  /**
   * Check consistency between orders and loom assignments
   */
  private static checkOrderLoomConsistency(report: ConsistencyReport) {
    const orders = OrderStorage.getOrders();
    const looms = LoomStorage.getLooms();

    orders.forEach((order) => {
      if (order.selectedLooms && order.selectedLooms.length > 0) {
        order.selectedLooms.forEach((loomId) => {
          const loom = looms.find((l) => l.id === loomId);

          if (!loom) {
            report.issues.push(
              `Order ${order.id} references non-existent loom ${loomId}`,
            );
          } else if (loom.currentOrder && loom.currentOrder !== order.id) {
            report.warnings.push(
              `Loom ${loomId} is assigned to order ${loom.currentOrder} but also referenced in order ${order.id}`,
            );
          }

          // Check loom type consistency
          if (loom && order.loomType && loom.type !== order.loomType) {
            report.issues.push(
              `Order ${order.id} requires ${order.loomType} loom but ${loomId} is ${loom.type}`,
            );
          }
        });
      }
    });

    // Check for looms with orders that don't exist
    looms.forEach((loom) => {
      if (loom.currentOrder) {
        const order = orders.find((o) => o.id === loom.currentOrder);
        if (!order) {
          report.issues.push(
            `Loom ${loom.id} references non-existent order ${loom.currentOrder}`,
          );
        }
      }
    });
  }

  /**
   * Check consistency between weavers and loom assignments
   */
  private static checkWeaverLoomConsistency(report: ConsistencyReport) {
    const weavers = WeaverStorage.getWeavers();
    const looms = LoomStorage.getLooms();

    looms.forEach((loom) => {
      if (loom.weaverId) {
        const weaver = weavers.find((w) => w.id === loom.weaverId);
        if (!weaver) {
          report.issues.push(
            `Loom ${loom.id} references non-existent weaver ${loom.weaverId}`,
          );
        } else {
          // Check weaver name consistency
          if (loom.weaver && loom.weaver !== weaver.name) {
            report.warnings.push(
              `Loom ${loom.id} has weaver name "${loom.weaver}" but assigned weaver name is "${weaver.name}"`,
            );
          }

          // Check loom type consistency with weaver specialization
          if (weaver.loomType && loom.type !== weaver.loomType) {
            report.warnings.push(
              `Weaver ${weaver.name} specializes in ${weaver.loomType} but assigned to ${loom.type} loom ${loom.id}`,
            );
          }
        }
      }
    });
  }

  /**
   * Check production records consistency
   */
  private static checkProductionRecordsConsistency(report: ConsistencyReport) {
    const productionRecords = ProductionStorage.getProductionRecords();
    const orders = OrderStorage.getOrders();
    const looms = LoomStorage.getLooms();

    productionRecords.forEach((record) => {
      // Check order existence
      const order = orders.find((o) => o.id === record.orderId);
      if (!order) {
        report.issues.push(
          `Production record references non-existent order ${record.orderId}`,
        );
      }

      // Check loom existence
      const loom = looms.find((l) => l.id === record.loomId);
      if (!loom) {
        report.issues.push(
          `Production record references non-existent loom ${record.loomId}`,
        );
      }

      // Check production vs target consistency
      if (order && record.actualProduction > record.targetProduction * 1.5) {
        report.warnings.push(
          `Production record for ${record.orderId} on ${record.date} shows unusually high production (${record.actualProduction} vs target ${record.targetProduction})`,
        );
      }

      // Check date validity
      const recordDate = new Date(record.date);
      if (order) {
        const orderDate = new Date(order.orderDate);
        const deliveryDate = new Date(order.deliveryDate);

        if (recordDate < orderDate) {
          report.warnings.push(
            `Production record for ${record.orderId} on ${record.date} is before order date ${order.orderDate}`,
          );
        }

        if (recordDate > deliveryDate) {
          report.warnings.push(
            `Production record for ${record.orderId} on ${record.date} is after delivery date ${order.deliveryDate}`,
          );
        }
      }
    });
  }

  /**
   * Check numerical data consistency and format
   */
  private static checkNumericalConsistency(report: ConsistencyReport) {
    const orders = OrderStorage.getOrders();
    const looms = LoomStorage.getLooms();

    orders.forEach((order) => {
      // Check quantity consistency
      if (order.quantity && order.quantity <= 0) {
        report.issues.push(
          `Order ${order.id} has invalid quantity: ${order.quantity}`,
        );
      }

      // Check rate consistency
      if (order.rate && order.rate <= 0) {
        report.issues.push(`Order ${order.id} has invalid rate: ${order.rate}`);
      }

      // Check yarn count format
      if (order.warpYarnCount && !/^\d+[s]?$/.test(order.warpYarnCount)) {
        report.warnings.push(
          `Order ${order.id} has non-standard warp yarn count format: ${order.warpYarnCount}`,
        );
      }

      if (order.weftYarnCount && !/^\d+[s]?$/.test(order.weftYarnCount)) {
        report.warnings.push(
          `Order ${order.id} has non-standard weft yarn count format: ${order.weftYarnCount}`,
        );
      }
    });

    looms.forEach((loom) => {
      // Check loom efficiency
      if (loom.efficiency && (loom.efficiency < 0 || loom.efficiency > 100)) {
        report.issues.push(
          `Loom ${loom.id} has invalid efficiency: ${loom.efficiency}%`,
        );
      }

      // Check loom width
      if (loom.width && (loom.width <= 0 || loom.width > 500)) {
        report.warnings.push(
          `Loom ${loom.id} has unusual width: ${loom.width} inches`,
        );
      }

      // Check max RPM
      if (loom.maxRPM && (loom.maxRPM <= 0 || loom.maxRPM > 1000)) {
        report.warnings.push(
          `Loom ${loom.id} has unusual max RPM: ${loom.maxRPM}`,
        );
      }
    });
  }

  /**
   * Fix common data inconsistencies automatically
   */
  static autoFixConsistencies(): string[] {
    const fixedIssues: string[] = [];
    const orders = OrderStorage.getOrders();
    const looms = LoomStorage.getLooms();
    let hasChanges = false;

    // Fix loom-order assignments
    looms.forEach((loom) => {
      if (loom.currentOrder) {
        const order = orders.find((o) => o.id === loom.currentOrder);
        if (!order) {
          loom.currentOrder = null;
          fixedIssues.push(
            `Cleared invalid order reference from loom ${loom.id}`,
          );
          hasChanges = true;
        }
      }
    });

    // Fix order-loom references
    orders.forEach((order) => {
      if (order.selectedLooms) {
        const validLooms = order.selectedLooms.filter((loomId) =>
          looms.some((l) => l.id === loomId),
        );
        if (validLooms.length !== order.selectedLooms.length) {
          order.selectedLooms = validLooms;
          fixedIssues.push(
            `Cleaned invalid loom references from order ${order.id}`,
          );
          hasChanges = true;
        }
      }
    });

    // Save changes if any
    if (hasChanges) {
      LoomStorage.saveLooms(looms);
      OrderStorage.saveOrders(orders);
    }

    return fixedIssues;
  }

  /**
   * Generate recommendations for improving data consistency
   */
  static generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const orders = OrderStorage.getOrders();
    const looms = LoomStorage.getLooms();

    // Check for unassigned orders
    const unassignedOrders = orders.filter(
      (order) => !order.selectedLooms || order.selectedLooms.length === 0,
    );
    if (unassignedOrders.length > 0) {
      recommendations.push(
        `Assign looms to ${unassignedOrders.length} unassigned orders`,
      );
    }

    // Check for idle looms
    const idleLooms = looms.filter(
      (loom) => !loom.currentOrder && loom.status === "Idle",
    );
    if (idleLooms.length > 0) {
      recommendations.push(
        `Utilize ${idleLooms.length} idle looms for pending orders`,
      );
    }

    // Check for orders without production records
    const ordersWithoutProduction = orders.filter((order) => {
      const records = ProductionStorage.getProductionRecords();
      return !records.some((record) => record.orderId === order.id);
    });
    if (ordersWithoutProduction.length > 0) {
      recommendations.push(
        `Start recording production for ${ordersWithoutProduction.length} orders`,
      );
    }

    return recommendations;
  }
}

/**
 * Export convenience function for quick consistency check
 */
export const checkDataConsistency = () =>
  DataConsistencyChecker.checkAllModules();
export const autoFixData = () => DataConsistencyChecker.autoFixConsistencies();
export const getRecommendations = () =>
  DataConsistencyChecker.generateRecommendations();
