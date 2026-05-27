import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Book from "./pages/Book";
import Trip from "./pages/Trip";
import DriverRegister from "./pages/DriverRegister";
import DriverDashboard from "./pages/DriverDashboard";
import DriverProfile from "./pages/DriverProfile";
import DriverFeedback from "./pages/DriverFeedback";
import Admin from "./pages/Admin";
import Support from "./pages/Support";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/book" component={Book} />
      <Route path="/trip/:id" component={Trip} />
      <Route path="/driver/register" component={DriverRegister} />
      <Route path="/driver/profile" component={DriverProfile} />
      <Route path="/driver/feedback" component={DriverFeedback} />
      <Route path="/driver" component={DriverDashboard} />
      <Route path="/admin" component={Admin} />
      <Route path="/support" component={Support} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-center" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
