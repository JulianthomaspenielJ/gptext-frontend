import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./components/AuthProvider";
import { Layout } from "./components/Layout";
import { useAuth } from "./lib/auth";
// import { requestPermission, onMessageListener } from "./notification";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import LoomManagement from "./pages/LoomManagement";
import OrderManagement from "./pages/OrderManagement";
import ProductionPlanning from "./pages/ProductionPlanning";
import TaskManagement from "./pages/TaskManagement";
import DailyProduction from "./pages/DailyProduction";
import ProductionReview from "./pages/ProductionReview";
import WeaverManagement from "./pages/WeaverManagement";
import UserManagement from "./pages/UserManagement";
import DeliverySchedule from "./pages/DeliverySchedule";
import BeamReconciliation from "./pages/BeamReconciliation";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import NotificationListener from "./NotificationListener";
import CommonManagement from "./components/CommonManagement";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // if (!user) {
  //   return <Navigate to="/login" replace />;
  // }
  // 👇 FIX IS HERE
  console.log(user);
  if (!user || Object.keys(user).length === 0) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// App Routes
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Navigate to="/dashboard" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/:type"
        element={
          <ProtectedRoute>
            <Layout>
              <CommonManagement />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/looms"
        element={
          <ProtectedRoute>
            <Layout>
              <LoomManagement />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <Layout>
              <OrderManagement />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/production-planning"
        element={
          <ProtectedRoute>
            <Layout>
              <ProductionPlanning />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks"
        element={
          <ProtectedRoute>
            <Layout>
              <TaskManagement />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/daily-production"
        element={
          <ProtectedRoute>
            <Layout>
              <DailyProduction />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/production-review"
        element={
          <ProtectedRoute>
            <Layout>
              <ProductionReview />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/delivery-schedule"
        element={
          <ProtectedRoute>
            <Layout>
              <DeliverySchedule />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/beam-reconciliation"
        element={
          <ProtectedRoute>
            <Layout>
              <BeamReconciliation />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/weavers"
        element={
          <ProtectedRoute>
            <Layout>
              <WeaverManagement />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <Layout>
              <UserManagement />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <NotificationListener />

          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
