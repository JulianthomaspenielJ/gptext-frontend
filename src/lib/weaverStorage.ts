import { DataSync } from "./dataSync";

export interface Weaver {
  id: string;
  name: string;
  // loomWidth: number;
  // loomTypeModel: string; // Airjet/Rapier/Sulzer
  // loomType: string; // Cam/Dobby, Cam, Dobby
  // reedAvailability: string;
  address: string;
  city: string;
  state: string;
  gstNumber: string;
  panNumber: string;
  numberOfLooms: number;
  // loomRPM: number;
  phoneNumber: string;
  email: string;
  status: "Active" | "Inactive";
  // assignedLooms: string[]; // Array of loom IDs assigned to this weaver
  createdDate: string;
  updatedDate: string;
  createdBy: string;
  updatedBy: string;
}

export class WeaverStorage {
  private static readonly STORAGE_KEY = "gp_textiles_weavers";

  static getWeavers(): Weaver[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }

      // Return default weavers if none exist
      const defaultWeavers = this.getDefaultWeavers();
      this.saveWeavers(defaultWeavers);
      return defaultWeavers;
    } catch (error) {
      console.error("Error loading weavers:", error);
      return [];
    }
  }

  static saveWeavers(weavers: Weaver[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(weavers));
      DataSync.notifyChange(DataSync.DATA_TYPES.WEAVERS);
      DataSync.notifyChange(DataSync.DATA_TYPES.DASHBOARD);
    } catch (error) {
      console.error("Error saving weavers:", error);
    }
  }

  static addWeaver(weaver: Weaver): void {
    const weavers = this.getWeavers();
    const newWeaver = {
      ...weaver,
      id: `WVR-${Date.now().toString().slice(-3)}`,
      createdDate: new Date().toISOString().split("T")[0],
      updatedDate: new Date().toISOString().split("T")[0],
    };
    weavers.push(newWeaver);
    this.saveWeavers(weavers);
  }

  static updateWeaver(id: string, updatedWeaver: Partial<Weaver>): void {
    const weavers = this.getWeavers();
    const index = weavers.findIndex((w) => w.id === id);
    if (index !== -1) {
      weavers[index] = {
        ...weavers[index],
        ...updatedWeaver,
        updatedDate: new Date().toISOString().split("T")[0],
      };
      this.saveWeavers(weavers);
    }
  }

  static deleteWeaver(id: string): void {
    const weavers = this.getWeavers();
    const filteredWeavers = weavers.filter((w) => w.id !== id);
    this.saveWeavers(filteredWeavers);
  }

  static getWeaverById(id: string): Weaver | null {
    const weavers = this.getWeavers();
    return weavers.find((w) => w.id === id) || null;
  }

  static getWeaverByLoomId(loomId: string): Weaver | null {
    const weavers = this.getWeavers();
    return weavers.find((w) => w.assignedLooms.includes(loomId)) || null;
  }

  static assignLoomToWeaver(weaverId: string, loomId: string): void {
    const weavers = this.getWeavers();
    const weaver = weavers.find((w) => w.id === weaverId);
    if (weaver && !weaver.assignedLooms.includes(loomId)) {
      weaver.assignedLooms.push(loomId);
      weaver.updatedDate = new Date().toISOString().split("T")[0];
      this.saveWeavers(weavers);
    }
  }

  static removeLoomFromWeaver(weaverId: string, loomId: string): void {
    const weavers = this.getWeavers();
    const weaver = weavers.find((w) => w.id === weaverId);
    if (weaver) {
      weaver.assignedLooms = weaver.assignedLooms.filter((id) => id !== loomId);
      weaver.updatedDate = new Date().toISOString().split("T")[0];
      this.saveWeavers(weavers);
    }
  }

  private static getDefaultWeavers(): Weaver[] {
    return [
      {
        id: "WVR-001",
        name: "Rajesh Kumar",
        loomWidth: 180,
        loomTypeModel: "Rapier",
        loomType: "Cam",
        reedAvailability: "20/2, 40/2, 44/2, 50/2 Available",
        address: "15, Textile Street, Weaver Colony",
        city: "Coimbatore",
        state: "Tamil Nadu",
        gstNumber: "33ABCDE1234F1Z5",
        panNumber: "ABCDE1234F",
        numberOfLooms: 2,
        loomRPM: 300,
        phoneNumber: "+91 9876543210",
        email: "rajesh.kumar@email.com",
        status: "Active",
        assignedLooms: ["MK-1", "MK-2"],
        createdDate: "2024-01-15",
        updatedDate: "2024-01-15",
      },
      {
        id: "WVR-002",
        name: "Priya Sharma",
        loomWidth: 200,
        loomTypeModel: "Airjet",
        loomType: "Dobby",
        reedAvailability: "30/2, 36/2, 44/2 Available",
        address: "22, Industrial Area, Phase 2",
        city: "Tirupur",
        state: "Tamil Nadu",
        gstNumber: "33FGHIJ5678K1L2",
        panNumber: "FGHIJ5678K",
        numberOfLooms: 1,
        loomRPM: 350,
        phoneNumber: "+91 9876543211",
        email: "priya.sharma@email.com",
        status: "Active",
        assignedLooms: ["AJ-1"],
        createdDate: "2024-01-20",
        updatedDate: "2024-01-20",
      },
      {
        id: "WVR-003",
        name: "Suresh Patel",
        loomWidth: 160,
        loomTypeModel: "Sulzer",
        loomType: "Cam",
        reedAvailability: "40/2, 44/2, 48/2 Available",
        address: "8, Loom Street, Textile Park",
        city: "Erode",
        state: "Tamil Nadu",
        gstNumber: "33MNOPQ9012R3S4",
        panNumber: "MNOPQ9012R",
        numberOfLooms: 3,
        loomRPM: 280,
        phoneNumber: "+91 9876543212",
        email: "suresh.patel@email.com",
        status: "Active",
        assignedLooms: ["SZ-1", "AJ-2"],
        createdDate: "2024-02-01",
        updatedDate: "2024-02-01",
      },
    ];
  }
}
