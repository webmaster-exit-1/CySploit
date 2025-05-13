import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface HeaderProps {
  toggleMobileSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleMobileSidebar }) => {
  const [location] = useLocation();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(true);

  // Get page title based on route
  const getPageTitle = () => {
    switch (location) {
      case '/':
        return 'Dashboard';
      case '/network-discovery':
        return 'Network Discovery';
      case '/vulnerability-scanner':
        return 'Vulnerability Scanner';
      case '/packet-inspector':
        return 'Packet Inspector';
      case '/network-mapping':
        return 'Network Mapping';
      case '/terminal':
        return 'Terminal';
      case '/sessions':
        return 'Sessions';
      case '/settings':
        return 'Settings';
      case '/pentools':
        return 'PenTools';
      case '/shodan':
        return 'Shodan API';
      case '/metasploit-console':
        return 'Metasploit Console';
      default:
        return 'CySploit';
    }
  };

  const handleHelp = () => {
    toast({
      title: "Help & Documentation",
      description: "Documentation for this feature is coming soon.",
    });
  };

  return (
    <div className="bg-popover border-b border-gray-800 py-4 px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center space-x-4">
        <div className="text-primary font-rajdhani font-bold text-xl">CySploit</div>
        <div className="font-rajdhani font-semibold text-gray-300">{getPageTitle()}</div>
      </div>
      
      <div className="flex items-center space-x-4">
        <span className={`text-${isConnected ? 'primary' : 'destructive'} flex items-center text-sm`}>
          <span className="relative flex h-3 w-3 mr-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-${isConnected ? 'primary' : 'destructive'} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 bg-${isConnected ? 'primary' : 'destructive'}`}></span>
          </span>
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
        <div className="h-6 w-px bg-gray-700"></div>
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
          <i className="ri-notification-3-line text-xl"></i>
        </Button>
        <Button onClick={handleHelp} variant="ghost" size="icon" className="text-gray-400 hover:text-white">
          <i className="ri-question-line text-xl"></i>
        </Button>
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-white font-medium border border-gray-700">
          <i className="ri-user-line"></i>
        </div>
      </div>
    </div>
  );
};

export default Header;
