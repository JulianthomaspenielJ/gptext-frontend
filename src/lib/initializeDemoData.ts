// Initialize all demo data consistently across modules
import { OrderStorage } from "./orderStorage";
import { LoomStorage } from "./loomStorage";
import { WeaverStorage } from "./weaverStorage";
import { ProductionStorage } from "./productionStorage";
import {
  getDemoOrders,
  getDemoLooms,
  getDemoWeavers,
  getDemoProductionRecords,
  getDemoLoomStatus,
} from "./demoData";

export const initializeDemoData = () => {
  console.log("Initializing comprehensive demo data...");

  try {
    // Initialize Orders
    const orders = getDemoOrders();
    localStorage.setItem("gp_textiles_orders", JSON.stringify(orders));
    console.log(`Initialized ${orders.length} demo orders`);

    // Initialize Weavers
    const weavers = getDemoWeavers();
    localStorage.setItem("gp_textiles_weavers", JSON.stringify(weavers));
    console.log(`Initialized ${weavers.length} demo weavers`);

    // Initialize Looms
    const looms = getDemoLooms();
    // localStorage.setItem("gp_textiles_looms", JSON.stringify(looms));
    // console.log(`Initialized ${looms.length} demo looms`);

    // Initialize Production Records
    const productionRecords = getDemoProductionRecords();
    localStorage.setItem(
      "gp_textiles_production_records",
      JSON.stringify(productionRecords),
    );
    console.log(`Initialized ${productionRecords.length} production records`);

    // Initialize Loom Status
    const loomStatus = getDemoLoomStatus();
    localStorage.setItem("gp_textiles_loom_status", JSON.stringify(loomStatus));
    console.log(`Initialized ${loomStatus.length} loom status records`);

    // Initialize Delivery Schedules (placeholder - will be created by the module)
    if (!localStorage.getItem("gp_textiles_delivery_schedules")) {
      localStorage.setItem(
        "gp_textiles_delivery_schedules",
        JSON.stringify([]),
      );
      console.log("Initialized delivery schedules storage");
    }

    // Initialize Beam Reconciliation (placeholder - will be created by the module)
    if (!localStorage.getItem("gp_textiles_beam_reconciliation")) {
      localStorage.setItem(
        "gp_textiles_beam_reconciliation",
        JSON.stringify([]),
      );
      console.log("Initialized beam reconciliation storage");
    }

    console.log("Demo data initialization completed successfully!");

    return {
      orders: orders.length,
      weavers: weavers.length,
      looms: looms.length,
      productionRecords: productionRecords.length,
      loomStatus: loomStatus.length,
    };
  } catch (error) {
    console.error("Error initializing demo data:", error);
    throw error;
  }
};

// Function to check if demo data needs to be initialized
export const checkAndInitializeDemoData = () => {
  const ordersExist = localStorage.getItem("gp_textiles_orders");
  const weaversExist = localStorage.getItem("gp_textiles_weavers");
  const loomsExist = localStorage.getItem("gp_textiles_looms");
  const productionExist = localStorage.getItem(
    "gp_textiles_production_records",
  );
  const loomStatusExist = localStorage.getItem("gp_textiles_loom_status");

  // If any core data is missing or empty, reinitialize everything
  if (
    !ordersExist ||
    !weaversExist ||
    !loomsExist ||
    !productionExist ||
    !loomStatusExist
  ) {
    console.log("Demo data missing or incomplete, initializing...");
    return initializeDemoData();
  }

  // Check if data is valid JSON and has content
  try {
    const orders = JSON.parse(ordersExist);
    const weavers = JSON.parse(weaversExist);
    const looms = JSON.parse(loomsExist);

    if (orders.length === 0 || weavers.length === 0 || looms.length === 0) {
      console.log("Demo data arrays are empty, reinitializing...");
      return initializeDemoData();
    }

    console.log("Demo data already exists and is valid");
    return null;
  } catch (error) {
    console.log("Demo data is corrupted, reinitializing...");
    return initializeDemoData();
  }
};

// Force refresh all demo data
export const refreshDemoData = () => {
  console.log("Force refreshing all demo data...");
  return initializeDemoData();
};
