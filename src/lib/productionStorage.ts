import { DataSync } from "./dataSync";

export interface ProductionRecord {
  id: string;
  loomId: string;
  orderId: string;
  date: string;
  shift: string;
  actualProduction: number;
  targetProduction: number;
  downtime: number;
  downtimeReason: string;
  qualityIssues: string;
  operatorNotes: string;
  shiftHours: number;
  efficiency: number;
  timestamp: string;
  weaverId: string;
  weaverName: string;
}

export interface LoomProductionStatus {
  loomId: string;
  status: "running" | "completed" | "delayed" | "maintenance" | "idle";
  currentOrder: string | null;
  progress: number;
  targetCompletion: string;
  actualProduction: number;
  targetProduction: number;
  lastUpdate: string;
  delayReason?: string;
}

export class ProductionStorage {
  private static readonly RECORDS_KEY = "gp_textiles_production_records";
  private static readonly STATUS_KEY = "gp_textiles_loom_status";

  // Production Records Management
  static getProductionRecords(): ProductionRecord[] {
    try {
      const stored = localStorage.getItem(this.RECORDS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }

      // Return default records if none exist
      const defaultRecords = this.getDefaultRecords();
      this.saveProductionRecords(defaultRecords);
      return defaultRecords;
    } catch (error) {
      console.error("Error loading production records:", error);
      return [];
    }
  }

  static saveProductionRecords(records: ProductionRecord[]): void {
    try {
      localStorage.setItem(this.RECORDS_KEY, JSON.stringify(records));
      DataSync.notifyChange(DataSync.DATA_TYPES.PRODUCTION);
      DataSync.notifyChange(DataSync.DATA_TYPES.DASHBOARD);
      // Update loom status after saving records
      this.updateLoomStatus();
    } catch (error) {
      console.error("Error saving production records:", error);
    }
  }

  static addProductionRecord(record: ProductionRecord): void {
    const records = this.getProductionRecords();
    const newRecord = {
      ...record,
      id: record.id || `PR-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    records.push(newRecord);
    this.saveProductionRecords(records);
  }

  static getRecordsByLoom(loomId: string, date?: string): ProductionRecord[] {
    const records = this.getProductionRecords();
    return records.filter((record) => {
      const matchesLoom = record.loomId === loomId;
      const matchesDate = date ? record.date === date : true;
      return matchesLoom && matchesDate;
    });
  }

  static getRecordsByOrder(orderId: string): ProductionRecord[] {
    const records = this.getProductionRecords();
    return records.filter((record) => record.orderId === orderId);
  }

  static getRecordsByWeaver(
    weaverId: string,
    date?: string,
  ): ProductionRecord[] {
    const records = this.getProductionRecords();
    return records.filter((record) => {
      const matchesWeaver = record.weaverId === weaverId;
      const matchesDate = date ? record.date === date : true;
      return matchesWeaver && matchesDate;
    });
  }

  // Loom Status Management
  static getLoomStatus(): LoomProductionStatus[] {
    try {
      const stored = localStorage.getItem(this.STATUS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }

      // Return default status if none exist
      const defaultStatus = this.getDefaultLoomStatus();
      this.saveLoomStatus(defaultStatus);
      return defaultStatus;
    } catch (error) {
      console.error("Error loading loom status:", error);
      return [];
    }
  }

  static saveLoomStatus(status: LoomProductionStatus[]): void {
    try {
      localStorage.setItem(this.STATUS_KEY, JSON.stringify(status));
      DataSync.notifyChange(DataSync.DATA_TYPES.PRODUCTION);
      DataSync.notifyChange(DataSync.DATA_TYPES.GANTT);
      DataSync.notifyChange(DataSync.DATA_TYPES.LOOMS);
    } catch (error) {
      console.error("Error saving loom status:", error);
    }
  }

  static updateLoomStatus(): void {
    const records = this.getProductionRecords();
    const currentStatus = this.getLoomStatus();
    const today = new Date().toISOString().split("T")[0];

    const updatedStatus = currentStatus.map((status) => {
      const todayRecords = records.filter(
        (r) => r.loomId === status.loomId && r.date === today,
      );

      if (todayRecords.length > 0) {
        const latestRecord = todayRecords[todayRecords.length - 1];
        const totalActual = todayRecords.reduce(
          (sum, r) => sum + r.actualProduction,
          0,
        );
        const totalTarget = todayRecords.reduce(
          (sum, r) => sum + r.targetProduction,
          0,
        );

        const progress =
          totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;

        // Determine status based on progress and target completion
        let newStatus: LoomProductionStatus["status"] = "running";

        if (progress >= 100) {
          newStatus = "completed";
        } else if (progress < 70 && latestRecord.efficiency < 70) {
          newStatus = "delayed";
        } else if (latestRecord.downtime > 2) {
          newStatus = "delayed";
        }

        return {
          ...status,
          actualProduction: totalActual,
          progress: Math.min(progress, 100),
          status: newStatus,
          lastUpdate: latestRecord.timestamp,
          delayReason: latestRecord.downtimeReason || undefined,
        };
      }

      return status;
    });

    this.saveLoomStatus(updatedStatus);
  }

  static updateLoomOrderAssignment(
    loomId: string,
    orderId: string | null,
    targetCompletion?: string,
  ): void {
    const status = this.getLoomStatus();
    const loomStatus = status.find((s) => s.loomId === loomId);

    if (loomStatus) {
      loomStatus.currentOrder = orderId;
      loomStatus.progress = 0;
      loomStatus.actualProduction = 0;
      loomStatus.status = orderId ? "running" : "idle";
      loomStatus.lastUpdate = new Date().toISOString();
      if (targetCompletion) {
        loomStatus.targetCompletion = targetCompletion;
      }

      this.saveLoomStatus(status);
    }
  }

  // Default data
  private static getDefaultRecords(): ProductionRecord[] {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    return [
      {
        id: "PR-001",
        loomId: "MK-1",
        orderId: "BTC-101",
        date: today,
        shift: "Day",
        actualProduction: 750,
        targetProduction: 800,
        downtime: 0.5,
        downtimeReason: "Yarn change",
        qualityIssues: "",
        operatorNotes: "Normal operation",
        shiftHours: 8,
        efficiency: 93.75,
        timestamp: new Date().toISOString(),
        weaverId: "WVR-001",
        weaverName: "Rajesh Kumar",
      },
      {
        id: "PR-002",
        loomId: "MK-2",
        orderId: "BTC-101",
        date: today,
        shift: "Day",
        actualProduction: 820,
        targetProduction: 800,
        downtime: 0,
        downtimeReason: "",
        qualityIssues: "",
        operatorNotes: "Excellent performance",
        shiftHours: 8,
        efficiency: 102.5,
        timestamp: new Date().toISOString(),
        weaverId: "WVR-001",
        weaverName: "Rajesh Kumar",
      },
      {
        id: "PR-003",
        loomId: "AJ-2",
        orderId: "VTS-205",
        date: today,
        shift: "Day",
        actualProduction: 880,
        targetProduction: 900,
        downtime: 0.25,
        downtimeReason: "Minor adjustment",
        qualityIssues: "",
        operatorNotes: "Good progress",
        shiftHours: 8,
        efficiency: 97.78,
        timestamp: new Date().toISOString(),
        weaverId: "WVR-003",
        weaverName: "Suresh Patel",
      },
      {
        id: "PR-004",
        loomId: "SZ-1",
        orderId: "FTC-309",
        date: yesterday,
        shift: "Day",
        actualProduction: 950,
        targetProduction: 950,
        downtime: 0,
        downtimeReason: "",
        qualityIssues: "",
        operatorNotes: "Target achieved",
        shiftHours: 8,
        efficiency: 100,
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        weaverId: "WVR-003",
        weaverName: "Suresh Patel",
      },
    ];
  }

  private static getDefaultLoomStatus(): LoomProductionStatus[] {
    return [
      {
        loomId: "MK-1",
        status: "running",
        currentOrder: "BTC-101",
        progress: 65,
        targetCompletion: "2024-06-26",
        actualProduction: 750,
        targetProduction: 800,
        lastUpdate: new Date().toISOString(),
      },
      {
        loomId: "MK-2",
        status: "running",
        currentOrder: "BTC-101",
        progress: 70,
        targetCompletion: "2024-06-26",
        actualProduction: 820,
        targetProduction: 800,
        lastUpdate: new Date().toISOString(),
      },
      {
        loomId: "AJ-1",
        status: "maintenance",
        currentOrder: null,
        progress: 0,
        targetCompletion: "",
        actualProduction: 0,
        targetProduction: 0,
        lastUpdate: new Date().toISOString(),
      },
      {
        loomId: "AJ-2",
        status: "running",
        currentOrder: "VTS-205",
        progress: 25,
        targetCompletion: "2024-07-05",
        actualProduction: 880,
        targetProduction: 900,
        lastUpdate: new Date().toISOString(),
      },
      {
        loomId: "SZ-1",
        status: "completed",
        currentOrder: "FTC-309",
        progress: 100,
        targetCompletion: "2024-06-30",
        actualProduction: 950,
        targetProduction: 950,
        lastUpdate: new Date().toISOString(),
      },
    ];
  }
}
