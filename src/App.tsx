import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserStoreProvider } from "@/hooks/useUserStore";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Settings from "./pages/Settings.tsx";
import Register from "./pages/Register.tsx";
import ManagementLayout from "./components/management/ManagementLayout.tsx";
import Dashboard from "./pages/management/Dashboard.tsx";
import ProductManagement from "./pages/management/ProductManagement.tsx";
import ScaleIntegration from "./pages/management/ScaleIntegration.tsx";
import Users from "./pages/management/Users.tsx";
import CashHistory from "./pages/management/CashHistory.tsx";
import Reports from "./pages/management/Reports.tsx";
import Purchases from "./pages/management/Purchases.tsx";

const queryClient = new QueryClient();

const App = () => {
  console.log("App component: Rendering...");
  return (
  <QueryClientProvider client={queryClient}>
    <UserStoreProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </UserStoreProvider>
  </QueryClientProvider>
  );
};

export default App;
