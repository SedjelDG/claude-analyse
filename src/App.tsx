import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserStoreProvider } from "@/hooks/useUserStore";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";

const Settings = lazy(() => import("./pages/Settings.tsx"));
const Register = lazy(() => import("./pages/Register.tsx"));
const ManagementLayout = lazy(() => import("./components/management/ManagementLayout.tsx"));
const Dashboard = lazy(() => import("./pages/management/Dashboard.tsx"));
const ProductManagement = lazy(() => import("./pages/management/ProductManagement.tsx"));
const ScaleIntegration = lazy(() => import("./pages/management/ScaleIntegration.tsx"));
const Users = lazy(() => import("./pages/management/Users.tsx"));
const CashHistory = lazy(() => import("./pages/management/CashHistory.tsx"));
const Reports = lazy(() => import("./pages/management/Reports.tsx"));
const Purchases = lazy(() => import("./pages/management/Purchases.tsx"));
const StoreInfo = lazy(() => import("./pages/management/StoreInfo.tsx"));
const Contacts = lazy(() => import("./pages/management/Contacts.tsx"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background text-sm font-medium text-muted-foreground">
    Chargement...
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <UserStoreProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/register" element={<Register />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/management" element={<ManagementLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="products" element={<ProductManagement />} />
                <Route path="scale" element={<ScaleIntegration />} />
                <Route path="users" element={<Users />} />
                <Route path="cash" element={<CashHistory />} />
                <Route path="reports" element={<Reports />} />
                <Route path="purchases" element={<Purchases />} />
                <Route path="store" element={<StoreInfo />} />
                <Route path="contacts" element={<Contacts />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </UserStoreProvider>
  </QueryClientProvider>
);

export default App;
