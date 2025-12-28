import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { Header } from "@/components/layout/Header";
import NotFound from "@/pages/not-found";

// Pages
import Home from "@/pages/home";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import DashboardOverview from "@/pages/dashboard/overview";
import AdminDashboard from "@/pages/admin/dashboard";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Home} />
      
      {/* Auth Routes */}
      <Route path="/auth/login" component={Login} />
      <Route path="/auth/register" component={Register} />
      
      {/* Dashboard Routes */}
      <Route path="/dashboard" component={DashboardOverview} />
      <Route path="/dashboard/analytics" component={DashboardOverview} />
      <Route path="/dashboard/settings" component={DashboardOverview} />
      
      {/* Admin Routes */}
      <Route path="/admin" component={AdminDashboard} />
      
      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // TODO: Replace with actual user from auth context/state
  const user = null;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <TooltipProvider>
          <Header user={user} />
          <Router />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
