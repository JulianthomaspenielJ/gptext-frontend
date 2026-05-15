import { LoomStorage, Loom } from "./loomStorage";
import { ProductionStorage } from "./productionStorage";
import { OrderStorage, Order } from "./orderStorage";

export interface LoomRequirement {
  width: number; // Required fabric width
  speed: number; // Minimum RPM required
  type?: string; // Preferred loom type
}

export interface LoomRecommendation {
  loom: Loom;
  score: number;
  reasons: string[];
  availability: "available" | "scheduled" | "busy";
  nextAvailable?: string;
}

export class LoomAssignment {
  // Get suitable looms for an order based on requirements
  static getSuitableLooms(
    orderRequirements: LoomRequirement,
    orderId?: string,
  ): LoomRecommendation[] {
    const allLooms = LoomStorage.getLooms();
    const loomStatus = ProductionStorage.getLoomStatus();
    const orders = OrderStorage.getOrders();

    const recommendations: LoomRecommendation[] = [];

    allLooms.forEach((loom) => {
      const status = loomStatus.find((s) => s.loomId === loom.id);
      const recommendation = this.evaluateLoom(
        loom,
        status,
        orderRequirements,
        orders,
      );

      if (recommendation.score > 0) {
        recommendations.push(recommendation);
      }
    });

    // Sort by score (highest first)
    return recommendations.sort((a, b) => b.score - a.score);
  }

  private static evaluateLoom(
    loom: Loom,
    status: any,
    requirements: LoomRequirement,
    orders: Order[],
  ): LoomRecommendation {
    let score = 0;
    const reasons: string[] = [];
    let availability: "available" | "scheduled" | "busy" = "busy";

    // Check basic requirements
    if (loom.width < requirements.width) {
      return {
        loom,
        score: 0,
        reasons: [
          `Width insufficient: ${loom.width}" < ${requirements.width}"`,
        ],
        availability: "busy",
      };
    }

    if (loom.maxRPM < requirements.speed) {
      return {
        loom,
        score: 0,
        reasons: [
          `Speed insufficient: ${loom.maxRPM} RPM < ${requirements.speed} RPM`,
        ],
        availability: "busy",
      };
    }

    // Base score for meeting requirements
    score += 50;
    reasons.push("Meets basic requirements");

    // Width scoring - prefer slightly larger width for flexibility
    const widthRatio = loom.width / requirements.width;
    if (widthRatio >= 1 && widthRatio <= 1.2) {
      score += 20;
      reasons.push("Optimal width match");
    } else if (widthRatio > 1.2) {
      score += 10;
      reasons.push("Width available but oversized");
    }

    // Speed scoring - prefer higher speeds for efficiency
    const speedRatio = loom.maxRPM / requirements.speed;
    if (speedRatio >= 1.2) {
      score += 15;
      reasons.push("High speed capability");
    } else if (speedRatio >= 1.1) {
      score += 10;
      reasons.push("Good speed capability");
    } else {
      score += 5;
      reasons.push("Adequate speed");
    }

    // Loom type preference
    if (requirements.type && loom.type === requirements.type) {
      score += 15;
      reasons.push(`Preferred loom type: ${loom.type}`);
    }

    // Availability scoring
    if (!loom.currentOrder || loom.status === "Idle") {
      score += 30;
      availability = "available";
      reasons.push("Currently available");
    } else if (loom.status === "Maintenance") {
      score -= 20;
      availability = "scheduled";
      reasons.push("Under maintenance");
    } else if (status?.status === "completed") {
      score += 20;
      availability = "available";
      reasons.push("Current order completing soon");
    } else if (status?.status === "delayed") {
      score -= 10;
      availability = "busy";
      reasons.push("Current order delayed");
    } else {
      availability = "busy";
      const currentOrder = orders.find((o) => o.id === loom.currentOrder);
      if (currentOrder) {
        const daysToComplete = this.calculateDaysToComplete(
          currentOrder,
          status,
        );
        if (daysToComplete <= 3) {
          score += 10;
          reasons.push(`Available in ${daysToComplete} days`);
        } else if (daysToComplete <= 7) {
          score += 5;
          reasons.push(`Available in ${daysToComplete} days`);
        } else {
          score -= 5;
          reasons.push(`Busy for ${daysToComplete} days`);
        }
      }
    }

    // Efficiency bonus
    if (loom.efficiency > 90) {
      score += 10;
      reasons.push("High efficiency loom");
    } else if (loom.efficiency > 80) {
      score += 5;
      reasons.push("Good efficiency");
    }

    // Recent maintenance bonus
    const daysSinceLastMaintenance = this.daysSince(loom.nextMaintenance);
    if (daysSinceLastMaintenance > 20) {
      score += 5;
      reasons.push("Recently maintained");
    } else if (daysSinceLastMaintenance < 5) {
      score -= 5;
      reasons.push("Maintenance due soon");
    }

    return {
      loom,
      score,
      reasons,
      availability,
      nextAvailable: this.calculateNextAvailable(loom, status, orders),
    };
  }

  private static calculateDaysToComplete(order: Order, status: any): number {
    if (!order.deliveryDate || !status) return 30; // Default estimate

    const deliveryDate = new Date(order.deliveryDate);
    const today = new Date();
    const totalDays = Math.ceil(
      (deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (status.progress > 0) {
      const estimatedDays = Math.ceil(
        (totalDays * (100 - status.progress)) / 100,
      );
      return Math.max(1, estimatedDays);
    }

    return Math.max(1, totalDays);
  }

  private static calculateNextAvailable(
    loom: Loom,
    status: any,
    orders: Order[],
  ): string {
    if (!loom.currentOrder || loom.status === "Idle") {
      return "Immediately";
    }

    const currentOrder = orders.find((o) => o.id === loom.currentOrder);
    if (!currentOrder) return "Unknown";

    const daysToComplete = this.calculateDaysToComplete(currentOrder, status);
    const availableDate = new Date();
    availableDate.setDate(availableDate.getDate() + daysToComplete);

    return availableDate.toISOString().split("T")[0];
  }

  private static daysSince(dateString: string): number {
    const date = new Date(dateString);
    const today = new Date();
    return Math.ceil(
      (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  // Assign loom to order
  static assignLoomToOrder(loomId: string, orderId: string): boolean {
    try {
      const loom = LoomStorage.getLoomById(loomId);
      const order = OrderStorage.getOrderById(orderId);

      if (!loom || !order) {
        console.error("Loom or order not found");
        return false;
      }

      // Update loom assignment
      LoomStorage.updateLoom(loomId, {
        currentOrder: orderId,
        status: "Running",
      });

      // Update order with loom assignment
      const updatedOrder = {
        ...order,
        selectedLooms: [...(order.selectedLooms || []), loomId],
        status: "In Progress",
      };
      OrderStorage.updateOrder(orderId, updatedOrder);

      // Update production status
      ProductionStorage.updateLoomOrderAssignment(
        loomId,
        orderId,
        order.deliveryDate,
      );

      return true;
    } catch (error) {
      console.error("Error assigning loom to order:", error);
      return false;
    }
  }

  // Get recommended requirements for common fabric types
  static getRecommendedRequirements(fabricType: string): LoomRequirement {
    const requirements: { [key: string]: LoomRequirement } = {
      cotton: { width: 60, speed: 300, type: "Rapier" },
      polyester: { width: 60, speed: 350, type: "Airjet" },
      silk: { width: 45, speed: 250, type: "Rapier" },
      linen: { width: 60, speed: 280, type: "Rapier" },
      denim: { width: 60, speed: 320, type: "Rapier" },
      chiffon: { width: 45, speed: 300, type: "Airjet" },
      georgette: { width: 45, speed: 280, type: "Airjet" },
      voile: { width: 60, speed: 320, type: "Airjet" },
    };

    return (
      requirements[fabricType.toLowerCase()] || {
        width: 60,
        speed: 300,
        type: "Rapier",
      }
    );
  }
}
