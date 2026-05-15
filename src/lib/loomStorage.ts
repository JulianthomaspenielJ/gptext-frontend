import { DataSync } from "./dataSync";

export interface Loom {
  name: string;
  id: string;
  type: string; // Rapier, Airjet, Sulzer
  status: string; // Running, Idle, Maintenance
  efficiency: number;
  currentOrder: string | null;
  nextMaintenance: string;
  location: string;
  manufacturer: string;
  model: string;
  weaver: string; // Weaver name
  weaverId: string; // Weaver ID
  width: number; // Loom width in inches
  reedSpace: number; // Reed space
  maxRPM: number;
  createdDate: string;
  updatedDate: string;
}

export class LoomStorage {
  private static readonly STORAGE_KEY = "gp_textiles_looms";

  static getLooms(): Loom[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }

      // Return default looms if none exist
      const defaultLooms = this.getDefaultLooms();
      this.saveLooms(defaultLooms);
      return defaultLooms;
    } catch (error) {
      console.error("Error loading looms:", error);
      return [];
    }
  }

  static saveLooms(looms: Loom[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(looms));
      DataSync.notifyChange(DataSync.DATA_TYPES.LOOMS);
      DataSync.notifyChange(DataSync.DATA_TYPES.DASHBOARD);
    } catch (error) {
      console.error("Error saving looms:", error);
    }
  }

  static addLoom(loom: Loom): void {
    const looms = this.getLooms();
    const newLoom = {
      ...loom,
      id: loom.id || `LM-${Date.now().toString().slice(-3)}`,
      createdDate: new Date().toISOString().split("T")[0],
      updatedDate: new Date().toISOString().split("T")[0],
    };
    looms.push(newLoom);
    this.saveLooms(looms);
  }

  static updateLoom(id: string, updatedLoom: Partial<Loom>): void {
    const looms = this.getLooms();
    const index = looms.findIndex((l) => l.id === id);
    if (index !== -1) {
      looms[index] = {
        ...looms[index],
        ...updatedLoom,
        updatedDate: new Date().toISOString().split("T")[0],
      };
      this.saveLooms(looms);
    }
  }

  static deleteLoom(id: string): void {
    const looms = this.getLooms();
    const filteredLooms = looms.filter((l) => l.id !== id);
    this.saveLooms(filteredLooms);
  }

  static getLoomById(id: string): Loom | null {
    const looms = this.getLooms();
    return looms.find((l) => l.id === id) || null;
  }

  static getLoomsByWeaver(weaverId: string): Loom[] {
    const looms = this.getLooms();
    return looms.filter((l) => l.weaverId === weaverId);
  }

  static assignLoomToWeaver(
    loomId: string,
    weaverId: string,
    weaverName: string,
  ): void {
    const looms = this.getLooms();
    const loom = looms.find((l) => l.id === loomId);
    if (loom) {
      loom.weaverId = weaverId;
      loom.weaver = weaverName;
      loom.updatedDate = new Date().toISOString().split("T")[0];
      this.saveLooms(looms);
    }
  }

  static createLoomsForWeaver(
    weaverId: string,
    weaverName: string,
    numberOfLooms: number,
    loomDetails: Partial<Loom>,
  ): Loom[] {
    const createdLooms: Loom[] = [];

    for (let i = 1; i <= numberOfLooms; i++) {
      const loomId = `${weaverId.replace("WVR-", "LM-")}-${i}`;
      const newLoom: Loom = {
        id: loomId,
        type: loomDetails.type || "Rapier",
        status: "Idle",
        efficiency: 0,
        currentOrder: null,
        nextMaintenance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0], // 30 days from now
        location: "Section A",
        manufacturer: "Toyota",
        model: loomDetails.model || "JAT610",
        weaver: weaverName,
        weaverId: weaverId,
        width: loomDetails.width || 180,
        reedSpace: loomDetails.reedSpace || 72,
        maxRPM: loomDetails.maxRPM || 300,
        createdDate: new Date().toISOString().split("T")[0],
        updatedDate: new Date().toISOString().split("T")[0],
      };

      this.addLoom(newLoom);
      createdLooms.push(newLoom);
    }

    return createdLooms;
  }

  private static getDefaultLooms(): Loom[] {
    return [
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
        width: 180,
        reedSpace: 72,
        maxRPM: 300,
        createdDate: "2024-01-15",
        updatedDate: "2024-01-15",
      },
      {
        id: "MK-2",
        type: "Rapier",
        status: "Running",
        efficiency: 88,
        currentOrder: "BTC-101",
        nextMaintenance: "2024-06-28",
        location: "Section A",
        manufacturer: "Toyota",
        model: "JAT610",
        weaver: "Rajesh Kumar",
        weaverId: "WVR-001",
        width: 180,
        reedSpace: 72,
        maxRPM: 300,
        createdDate: "2024-01-15",
        updatedDate: "2024-01-15",
      },
      {
        id: "AJ-1",
        type: "Airjet",
        status: "Maintenance",
        efficiency: 0,
        currentOrder: null,
        nextMaintenance: "2024-06-30",
        location: "Section B",
        manufacturer: "Tsudakoma",
        model: "ZAX9100",
        weaver: "Priya Sharma",
        weaverId: "WVR-002",
        width: 200,
        reedSpace: 80,
        maxRPM: 350,
        createdDate: "2024-01-20",
        updatedDate: "2024-01-20",
      },
      {
        id: "AJ-2",
        type: "Airjet",
        status: "Running",
        efficiency: 85,
        currentOrder: "VTS-205",
        nextMaintenance: "2024-07-02",
        location: "Section B",
        manufacturer: "Tsudakoma",
        model: "ZAX9100",
        weaver: "Suresh Patel",
        weaverId: "WVR-003",
        width: 200,
        reedSpace: 80,
        maxRPM: 350,
        createdDate: "2024-02-01",
        updatedDate: "2024-02-01",
      },
      {
        id: "SZ-1",
        type: "Sulzer",
        status: "Running",
        efficiency: 95,
        currentOrder: "FTC-309",
        nextMaintenance: "2024-07-05",
        location: "Section C",
        manufacturer: "Sulzer",
        model: "P7300",
        weaver: "Suresh Patel",
        weaverId: "WVR-003",
        width: 160,
        reedSpace: 68,
        maxRPM: 280,
        createdDate: "2024-02-01",
        updatedDate: "2024-02-01",
      },
    ];
  }
}
