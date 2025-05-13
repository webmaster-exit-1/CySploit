import React, { useEffect } from 'react';
import { useNetworkScanner } from '@/lib/hooks/useNetworkScanner';
import { useVulnerabilityScanner } from '@/lib/hooks/useVulnerabilityScanner';
import { useSessions } from '@/lib/hooks/useSessions';
import StatusCard from '@/components/dashboard/StatusCard';
import NetworkVisualizer from '@/components/dashboard/NetworkVisualizer';
import TerminalConsole from '@/components/dashboard/TerminalConsole';
import VulnerabilitiesTable from '@/components/dashboard/VulnerabilitiesTable';
import TrafficAnalyzer from '@/components/dashboard/TrafficAnalyzer';
import { Helmet } from 'react-helmet';
import { 
  DeviceIcon, 
  VulnerabilityIcon, 
  NetworkTrafficIcon, 
  ActiveSessionIcon 
} from '@/components/icons';

const Dashboard: React.FC = () => {
  const { devices, isLoadingDevices } = useNetworkScanner();
  const { vulnerabilities, getVulnerabilityCounts } = useVulnerabilityScanner();
  const { sessions, getActiveSessions } = useSessions();
  
  // Get counts for cards
  const deviceCount = devices && Array.isArray(devices) ? devices.length : 0;
  const vulnCounts = getVulnerabilityCounts(Array.isArray(vulnerabilities) ? vulnerabilities : []);
  const activeSessions = getActiveSessions() ? getActiveSessions()!.length : 0;
  
  // Set page title
  useEffect(() => {
    document.title = 'Dashboard | CySploit';
  }, []);

  return (
    <>
      <Helmet>
        <title>Dashboard | CySploit</title>
        <meta name="description" content="Network security analysis dashboard showing device status, vulnerabilities, and network traffic" />
      </Helmet>
      
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-rajdhani text-white mb-2">Dashboard <span className="text-primary">Overview</span></h1>
        <p className="text-gray-400">Current network status and security analytics</p>
      </div>
      
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatusCard
          title="Devices Connected"
          value={deviceCount.toString()}
          icon={<DeviceIcon size={32} />}
          colorClass="bg-primary"
          changeValue="+3 new"
          changeLabel="since last scan"
          changeType="positive"
        />
        
        <StatusCard
          title="Vulnerabilities"
          value={vulnCounts.total.toString()}
          icon={<VulnerabilityIcon size={32} />}
          colorClass="bg-secondary"
          changeValue={vulnCounts.critical > 0 ? `${vulnCounts.critical} critical` : "0 critical"}
          changeLabel="need attention"
          changeType="negative"
        />
        
        <StatusCard
          title="Network Traffic"
          value="1.8 GB"
          icon={<NetworkTrafficIcon size={32} />}
          colorClass="bg-accent"
          changeValue="75% increase"
          changeLabel="from baseline"
          changeType="negative"
        />
        
        <StatusCard
          title="Active Sessions"
          value={activeSessions.toString()}
          icon={<ActiveSessionIcon size={32} />}
          colorClass="bg-primary"
          changeValue="24 min"
          changeLabel="avg. duration"
          changeType="neutral"
        />
      </div>
      
      {/* Network Visualization */}
      <NetworkVisualizer />
      
      {/* Two Column Layout for Terminal and Vulnerabilities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <TerminalConsole />
        <VulnerabilitiesTable />
      </div>
      
      {/* Traffic Analysis */}
      <TrafficAnalyzer />
    </>
  );
};

export default Dashboard;
