// Data synchronization service for real-time updates across all modules
export class DataSync {
  private static listeners: { [key: string]: (() => void)[] } = {};

  // Subscribe to data changes
  static subscribe(dataType: string, callback: () => void) {
    if (!this.listeners[dataType]) {
      this.listeners[dataType] = [];
    }
    this.listeners[dataType].push(callback);

    // Return unsubscribe function
    return () => {
      this.listeners[dataType] = this.listeners[dataType].filter(
        (cb) => cb !== callback,
      );
    };
  }

  // Notify all listeners of data change
  static notifyChange(dataType: string) {
    if (this.listeners[dataType]) {
      this.listeners[dataType].forEach((callback) => callback());
    }
  }

  // Data types
  static DATA_TYPES = {
    ORDERS: "orders",
    LOOMS: "looms",
    WEAVERS: "weavers",
    TASKS: "tasks",
    PRODUCTION: "production",
    DASHBOARD: "dashboard",
    GANTT: "gantt",
  };
}
