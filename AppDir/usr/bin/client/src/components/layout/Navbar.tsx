import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

// Core navigation routes with enhanced icons
const routes = [
  { path: '/', label: 'Dashboard', icon: 'ri-dashboard-3-line' },
  { path: '/network-discovery', label: 'Network Discovery', icon: 'ri-radar-line' },
  { path: '/vulnerability-scanner', label: 'Vulnerability Scanner', icon: 'ri-bug-2-line' },
  { path: '/packet-inspector', label: 'Packet Inspector', icon: 'ri-file-search-line' },
  { path: '/network-mapping', label: 'Network Mapping', icon: 'ri-broadcast-line' },
  { path: '/terminal', label: 'Terminal', icon: 'ri-terminal-box-line' },
  { path: '/sessions', label: 'Sessions', icon: 'ri-folder-line' },
];

// Resource routes with enhanced icons
const resourceRoutes = [
  { path: '/pentools', label: 'PenTools', icon: 'ri-tools-fill' },
];

// API integration routes with enhanced icons
const integrationRoutes = [
  { path: '/shodan', label: 'Shodan API', icon: 'ri-earth-line' },
  { path: '/metasploit-console', label: 'Metasploit Console', icon: 'ri-braces-line' },
];

const Navbar: React.FC = () => {
  const [location] = useLocation();

  return (
    <nav className="bg-background/95 backdrop-blur-sm border-b border-gray-800 py-2 sticky top-0 z-20 w-full">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <div className="text-primary text-2xl font-bold font-rajdhani flex items-center mr-6">
            <i className="ri-shield-keyhole-line mr-2"></i>
            <span>CySploit</span>
          </div>
          
          {/* Removed top icons as per request - using dropdown menu instead */}
        </div>
        
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-primary/50 text-primary hover:text-white hover:bg-primary/20 hover:border-primary neon-border-cyan"
              >
                <i className="ri-menu-3-line mr-1"></i> Menu
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-muted/95 backdrop-blur-md border border-primary/70 text-gray-200 neon-border-cyan rounded-md p-1">
              {/* Core features - linked to pages */}
              <Link href="/">
                <DropdownMenuItem className="cursor-pointer hover:bg-background/50 hover:text-primary rounded-sm mb-1">
                  <i className="ri-dashboard-3-line mr-2 text-cyan-400"></i> Dashboard
                </DropdownMenuItem>
              </Link>
              <Link href="/network-discovery">
                <DropdownMenuItem className="cursor-pointer hover:bg-background/50 hover:text-primary rounded-sm mb-1">
                  <i className="ri-radar-line mr-2 text-yellow-400"></i> Network Discovery
                </DropdownMenuItem>
              </Link>
              <Link href="/vulnerability-scanner">
                <DropdownMenuItem className="cursor-pointer hover:bg-background/50 hover:text-primary rounded-sm mb-1">
                  <i className="ri-bug-2-line mr-2 text-red-400"></i> Vulnerability Scanner
                </DropdownMenuItem>
              </Link>
              <Link href="/packet-inspector">
                <DropdownMenuItem className="cursor-pointer hover:bg-background/50 hover:text-primary rounded-sm mb-1">
                  <i className="ri-file-search-line mr-2 text-green-400"></i> Packet Inspector
                </DropdownMenuItem>
              </Link>
              <Link href="/network-mapping">
                <DropdownMenuItem className="cursor-pointer hover:bg-background/50 hover:text-primary rounded-sm mb-1">
                  <i className="ri-broadcast-line mr-2 text-purple-400"></i> Network Mapping
                </DropdownMenuItem>
              </Link>
              <Link href="/terminal">
                <DropdownMenuItem className="cursor-pointer hover:bg-background/50 hover:text-primary rounded-sm mb-1">
                  <i className="ri-terminal-box-line mr-2 text-blue-400"></i> Terminal
                </DropdownMenuItem>
              </Link>
              <Link href="/sessions">
                <DropdownMenuItem className="cursor-pointer hover:bg-background/50 hover:text-primary rounded-sm mb-1">
                  <i className="ri-folder-line mr-2 text-orange-400"></i> Sessions
                </DropdownMenuItem>
              </Link>
              
              {/* Resources Section */}
              <DropdownMenuItem className="font-bold pt-2 pb-2 border-t border-primary/30 mt-1 mb-1 cursor-default text-primary">
                <i className="ri-folder-shield-2-fill mr-2 text-primary"></i> Resources
              </DropdownMenuItem>
              
              <Link href="/pentools">
                <DropdownMenuItem className="cursor-pointer hover:bg-background/50 hover:text-primary rounded-sm mb-1">
                  <i className="ri-tools-fill mr-2 text-green-400"></i> PenTools
                </DropdownMenuItem>
              </Link>
              <Link href="/resources">
                <DropdownMenuItem className="cursor-pointer hover:bg-background/50 hover:text-primary rounded-sm mb-1">
                  <i className="ri-file-list-3-line mr-2 text-cyan-400"></i> Security Resources
                </DropdownMenuItem>
              </Link>
              
              {/* API Keys Section */}
              <DropdownMenuItem className="font-bold pt-2 pb-2 border-t border-primary/30 mt-1 mb-1 cursor-default text-primary">
                <i className="ri-key-2-fill mr-2 text-secondary"></i> API Integration
              </DropdownMenuItem>
              
              <Link href="/shodan">
                <DropdownMenuItem className="cursor-pointer hover:bg-background/50 hover:text-primary rounded-sm mb-1">
                  <i className="ri-earth-line mr-2 text-red-400"></i> Shodan API
                </DropdownMenuItem>
              </Link>
              <Link href="/metasploit-console">
                <DropdownMenuItem className="cursor-pointer hover:bg-background/50 hover:text-primary rounded-sm mb-1">
                  <i className="ri-braces-line mr-2 text-green-400"></i> Metasploit Console
                </DropdownMenuItem>
              </Link>
              
              {/* Support */}
              <DropdownMenuItem className="cursor-pointer hover:bg-background/50 hover:text-primary rounded-sm border-t border-primary/30 mt-1 pt-2">
                <i className="ri-customer-service-2-line mr-2 text-primary"></i> Contact Support
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link href="/settings">
            <div className={cn(
              "px-3 py-2 rounded-md transition text-sm font-medium flex items-center cursor-pointer border",
              location === "/settings"
                ? "text-white bg-primary/20 border-primary neon-border-cyan"
                : "text-primary border-primary/50 hover:text-white hover:bg-primary/20 hover:border-primary neon-border-cyan"
            )}>
              <i className="ri-settings-3-fill mr-2"></i>
              Settings
            </div>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;