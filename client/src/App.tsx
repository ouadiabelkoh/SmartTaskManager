import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import POSPage from "@/pages/pos-page";
import ProductsPage from "@/pages/products-page";
import CategoriesPage from "@/pages/categories-page";
import InventoryPage from "@/pages/inventory-page";
import OrdersPage from "@/pages/orders-page";
import CustomersPage from "@/pages/customers-page";
import ReportsPage from "@/pages/reports-page";
import UsersPage from "@/pages/users-page";
import SettingsPage from "@/pages/settings-page";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/pos" component={POSPage} />
      <ProtectedRoute path="/products" component={ProductsPage} />
      <ProtectedRoute path="/categories" component={CategoriesPage} />
      <ProtectedRoute path="/inventory" component={InventoryPage} />
      <ProtectedRoute path="/orders" component={OrdersPage} />
      <ProtectedRoute path="/customers" component={CustomersPage} />
      <ProtectedRoute path="/reports" component={ReportsPage} />
      <ProtectedRoute path="/users" component={UsersPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
