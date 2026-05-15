import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { checkAndInitializeDemoData } from "./lib/initializeDemoData";

// Initialize demo data early to ensure consistency across all contexts
checkAndInitializeDemoData();

createRoot(document.getElementById("root")!).render(<App />);
