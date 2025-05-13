import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';

const routes = [
  { path: '/', label: 'Dashboard', icon: 'ri-dashboard-line' },
  { path: '/network-discovery', label: 'Network Discovery', icon: 'ri-radar-line' },
  { path: '/vulnerability-scanner', label: 'Vulnerability Scanner', icon: 'ri-code-box-line' },
  { path: '/packet-inspector', label: 'Packet Inspector', icon: 'ri-file-search-line' },
  { path: '/network-mapping', label: 'Network Mapping', icon: 'ri-router-line' },
  { path: '/terminal', label: 'Terminal', icon: 'ri-terminal-box-line' },
  { path: '/sessions', label: 'Sessions', icon: 'ri-folder-line' },
];

const resourceRoutes = [
  { path: '/pentools', label: 'PenTools', icon: 'ri-code-s-slash-line' },
];

const integrationRoutes = [
  { path: '/shodan', label: 'Shodan API', icon: 'ri-spy-line' },
  { path: '/metasploit-console', label: 'Metasploit Console', icon: 'ri-terminal-box-line' },
];

const Sidebar: React.FC = () => {
  const [location] = useLocation();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        "hidden md:flex flex-col w-16 bg-popover border-r border-gray-800 fixed h-full z-10 transition-all duration-300 group",
        isHovered && "w-64"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-center md:justify-start">
            <div className="text-primary text-3xl font-bold font-rajdhani flex items-center">
              <i className="ri-shield-keyhole-line mr-2"></i>
              <span className={cn("hidden", isHovered && "inline")} data-text="CySploit">CySploit</span>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-2">
          {/* Main Navigation */}
          <div className="px-2 space-y-1">
            {routes.map((route) => (
              <Link key={route.path} href={route.path}>
                <div 
                  className={cn(
                    "flex items-center px-2 py-3 rounded-lg transition cursor-pointer",
                    location === route.path
                      ? "text-primary bg-muted"
                      : "text-white hover:bg-muted"
                  )}
                >
                  <i className={cn(route.icon, "text-xl")}></i>
                  <span className={cn("ml-4", !isHovered && "hidden")}>{route.label}</span>
                </div>
              </Link>
            ))}
          </div>
          
          {/* Resources Section */}
          <div className="mt-4 px-2">
            <div className={cn("px-2 py-2", !isHovered && "text-center")}>
              <span className={cn("text-xs font-bold uppercase text-gray-400", !isHovered && "hidden")}>Resources</span>
              <span className={cn("text-xs font-bold uppercase text-gray-400", isHovered && "hidden")}>•••</span>
            </div>
            <div className="space-y-1">
              {resourceRoutes.map((route) => (
                <Link key={route.path} href={route.path}>
                  <div 
                    className={cn(
                      "flex items-center px-2 py-3 rounded-lg transition cursor-pointer",
                      location === route.path
                        ? "text-green-400 bg-muted"
                        : "text-white hover:bg-muted hover:text-green-400"
                    )}
                  >
                    <i className={cn(route.icon, "text-xl")}></i>
                    <span className={cn("ml-4", !isHovered && "hidden")}>{route.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          
          {/* API Integrations Section */}
          <div className="mt-4 px-2">
            <div className={cn("px-2 py-2", !isHovered && "text-center")}>
              <span className={cn("text-xs font-bold uppercase text-gray-400", !isHovered && "hidden")}>API Integrations</span>
              <span className={cn("text-xs font-bold uppercase text-gray-400", isHovered && "hidden")}>•••</span>
            </div>
            <div className="space-y-1">
              {integrationRoutes.map((route) => (
                <Link key={route.path} href={route.path}>
                  <div 
                    className={cn(
                      "flex items-center px-2 py-3 rounded-lg transition cursor-pointer",
                      location === route.path
                        ? "text-blue-400 bg-muted"
                        : "text-white hover:bg-muted hover:text-blue-400"
                    )}
                  >
                    <i className={cn(route.icon, "text-xl")}></i>
                    <span className={cn("ml-4", !isHovered && "hidden")}>{route.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 p-4">
          <Link href="/settings">
            <div className="flex items-center text-gray-400 hover:text-white cursor-pointer">
              <i className="ri-settings-4-line text-xl"></i>
              <span className={cn("ml-4", !isHovered && "hidden")}>Settings</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
