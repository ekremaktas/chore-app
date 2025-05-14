import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./context/auth-context";

import Dashboard from "@/pages/dashboard";
import Chores from "@/pages/chores";
import Rewards from "@/pages/rewards";
import Family from "@/pages/family";
import Achievements from "@/pages/achievements";
import ApiDocumentation from "@/pages/api-documentation";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/chores" component={Chores} />
      <Route path="/rewards" component={Rewards} />
      <Route path="/family" component={Family} />
      <Route path="/achievements" component={Achievements} />
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
