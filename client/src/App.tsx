import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./context/auth-context";
import { useAuthContext } from "./context/auth-context";

import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Chores from "@/pages/chores";
import Rewards from "@/pages/rewards";
import Family from "@/pages/family";
import Achievements from "@/pages/achievements";
import ApiDocumentation from "@/pages/api-documentation";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType, path?: string }) {
  const { user, isLoading } = useAuthContext();
  const [location, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // Redirect to login if not authenticated
    if (location !== "/login" && location !== "/signup") {
      setLocation("/login");
    }
    return null;
  }

  return <Component />;
}

function Router() {
  const { user } = useAuthContext();
  
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/">
        {user ? <Dashboard /> : <Login />}
      </Route>
      <Route path="/chores">
        <ProtectedRoute component={Chores} />
      </Route>
      <Route path="/rewards">
        <ProtectedRoute component={Rewards} />
      </Route>
      <Route path="/family">
        <ProtectedRoute component={Family} />
      </Route>
      <Route path="/achievements">
        <ProtectedRoute component={Achievements} />
      </Route>
      <Route path="/api" component={ApiDocumentation} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
