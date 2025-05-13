import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useState } from "react";

// Layout components
import PageLayout from "@/components/layout/PageLayout";

// Page components
import Dashboard from "@/pages/Dashboard";
import NetworkDiscovery from "@/pages/NetworkDiscovery";
import VulnerabilityScanner from "@/pages/VulnerabilityScanner";
import PacketInspector from "@/pages/PacketInspector";
import NetworkMapping from "@/pages/NetworkMapping";
import Terminal from "@/pages/Terminal";
import Sessions from "@/pages/Sessions";
import Settings from "@/pages/Settings";
import PenTools from "@/pages/PenTools";
import ShodanSearch from "@/pages/ShodanSearch";
import MetasploitConsole from "@/pages/MetasploitConsole";
import Resources from "@/pages/Resources";

function Router() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <Switch>
      <Route path="/">
        <PageLayout
          toggleMobileSidebar={toggleMobileSidebar}
          isMobileSidebarOpen={isMobileSidebarOpen}
        >
          <Dashboard />
        </PageLayout>
      </Route>
      
      <Route path="/network-discovery">
        <PageLayout
          toggleMobileSidebar={toggleMobileSidebar}
          isMobileSidebarOpen={isMobileSidebarOpen}
        >
          <NetworkDiscovery />
        </PageLayout>
      </Route>
      
      <Route path="/vulnerability-scanner">
        <PageLayout
          toggleMobileSidebar={toggleMobileSidebar}
          isMobileSidebarOpen={isMobileSidebarOpen}
        >
          <VulnerabilityScanner />
        </PageLayout>
      </Route>
      
      <Route path="/packet-inspector">
        <PageLayout
          toggleMobileSidebar={toggleMobileSidebar}
          isMobileSidebarOpen={isMobileSidebarOpen}
        >
          <PacketInspector />
        </PageLayout>
      </Route>
      
      <Route path="/network-mapping">
        <PageLayout
          toggleMobileSidebar={toggleMobileSidebar}
          isMobileSidebarOpen={isMobileSidebarOpen}
        >
          <NetworkMapping />
        </PageLayout>
      </Route>
      
      <Route path="/terminal">
        <PageLayout
          toggleMobileSidebar={toggleMobileSidebar}
          isMobileSidebarOpen={isMobileSidebarOpen}
        >
          <Terminal />
        </PageLayout>
      </Route>
      
      <Route path="/sessions">
        <PageLayout
          toggleMobileSidebar={toggleMobileSidebar}
          isMobileSidebarOpen={isMobileSidebarOpen}
        >
          <Sessions />
        </PageLayout>
      </Route>
      
      <Route path="/settings">
        <PageLayout
          toggleMobileSidebar={toggleMobileSidebar}
          isMobileSidebarOpen={isMobileSidebarOpen}
        >
          <Settings />
        </PageLayout>
      </Route>

      <Route path="/pentools">
        <PenTools />
      </Route>

      <Route path="/shodan">
        <ShodanSearch />
      </Route>

      <Route path="/metasploit-console">
        <MetasploitConsole />
      </Route>

      <Route path="/resources">
        <Resources />
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
