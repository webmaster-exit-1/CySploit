import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

// Using the same routes as the main navbar for consistency
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

const PenTools: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [location] = useLocation();
  
  useEffect(() => {
    // Create a style element for the matrix animation background
    const style = document.createElement('style');
    style.textContent = `
      body {
        margin: 0;
        padding: 0;
        background-color: #000;
        overflow: hidden;
      }
      
      .pentools-container {
        position: fixed;
        top: 50px; /* Make room for the navbar */
        left: 0;
        width: 100vw;
        height: calc(100vh - 50px); /* Adjust height to account for navbar */
        z-index: 10;
      }

      .matrix-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 5;
      }
    `;
    document.head.appendChild(style);

    // Create and initialize Matrix animation
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const matrixContainer = document.createElement('div');
    matrixContainer.className = 'matrix-container';
    matrixContainer.appendChild(canvas);
    document.body.appendChild(matrixContainer);
    
    // Matrix animation code
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const chars = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      const fontSize = 14;
      const columns = Math.floor(canvas.width / fontSize);
      const drops = Array(columns).fill(1);
      
      const drawMatrix = () => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#0F0';
        ctx.font = `${fontSize}px monospace`;
        
        for (let i = 0; i < drops.length; i++) {
          const text = chars[Math.floor(Math.random() * chars.length)];
          ctx.fillText(text, i * fontSize, drops[i] * fontSize);
          
          if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
          }
          
          drops[i]++;
        }
      };
      
      const matrixInterval = setInterval(drawMatrix, 33);
      
      // Handle window resize
      const handleResize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const newColumns = Math.floor(canvas.width / fontSize);
        drops.length = 0;
        for (let i = 0; i < newColumns; i++) {
          drops.push(1);
        }
      };
      
      window.addEventListener('resize', handleResize);
      
      // Cleanup function
      return () => {
        clearInterval(matrixInterval);
        window.removeEventListener('resize', handleResize);
        document.body.removeChild(matrixContainer);
        document.head.removeChild(style);
      };
    }
  }, []);

  // Custom navbar specifically for PenTools
  const CustomNavbar = () => {
    return (
      <nav className="bg-background/95 backdrop-blur-sm border-b border-gray-800 py-2 sticky top-0 z-40 w-full">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <div className="text-primary text-2xl font-bold font-rajdhani flex items-center mr-6">
              <i className="ri-shield-keyhole-line mr-2"></i>
              <span>CySploit</span>
            </div>
            
            <div className="hidden lg:flex space-x-1">
              {routes.map((route) => (
                <Link key={route.path} href={route.path}>
                  <div
                    className={cn(
                      "flex items-center px-3 py-2 rounded-md transition text-sm font-medium cursor-pointer",
                      location === route.path
                        ? "text-primary bg-muted"
                        : "text-gray-300 hover:bg-muted/50"
                    )}
                  >
                    <i className={cn(route.icon, "mr-2")}></i>
                    {route.label}
                  </div>
                </Link>
              ))}
            </div>
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
                    <i className="ri-dashboard-line mr-2 text-cyan-400"></i> Dashboard
                  </DropdownMenuItem>
                </Link>
                <Link href="/network-discovery">
                  <DropdownMenuItem className="cursor-pointer hover:bg-background/50 hover:text-primary rounded-sm mb-1">
                    <i className="ri-radar-line mr-2 text-yellow-400"></i> Network Discovery
                  </DropdownMenuItem>
                </Link>
                <Link href="/vulnerability-scanner">
                  <DropdownMenuItem className="cursor-pointer hover:bg-background/50 hover:text-primary rounded-sm mb-1">
                    <i className="ri-code-box-line mr-2 text-red-400"></i> Vulnerability Scanner
                  </DropdownMenuItem>
                </Link>
                <Link href="/packet-inspector">
                  <DropdownMenuItem className="cursor-pointer hover:bg-background/50 hover:text-primary rounded-sm mb-1">
                    <i className="ri-file-search-line mr-2 text-green-400"></i> Packet Inspector
                  </DropdownMenuItem>
                </Link>
                <Link href="/network-mapping">
                  <DropdownMenuItem className="cursor-pointer hover:bg-background/50 hover:text-primary rounded-sm mb-1">
                    <i className="ri-router-line mr-2 text-purple-400"></i> Network Mapping
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
                    <i className="ri-code-s-slash-line mr-2 text-green-400"></i> PenTools
                  </DropdownMenuItem>
                </Link>
                
                {/* API Keys Section */}
                <DropdownMenuItem className="font-bold pt-2 pb-2 border-t border-primary/30 mt-1 mb-1 cursor-default text-primary">
                  <i className="ri-key-2-fill mr-2 text-secondary"></i> API Integration
                </DropdownMenuItem>
                
                <Link href="/settings">
                  <DropdownMenuItem className="cursor-pointer hover:bg-background/50 hover:text-primary rounded-sm mb-1">
                    <i className="ri-spy-line mr-2 text-red-400"></i> Shodan API
                  </DropdownMenuItem>
                </Link>
                <Link href="/settings">
                  <DropdownMenuItem className="cursor-pointer hover:bg-background/50 hover:text-primary rounded-sm mb-1">
                    <i className="ri-terminal-box-line mr-2 text-green-400"></i> Metasploit Integration
                  </DropdownMenuItem>
                </Link>
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

  // Return the PenTools page with navbar and iframe
  return (
    <>
      <CustomNavbar />
      <div className="pentools-container">
        {/* PenTools HTML iframe */}
        <iframe
          ref={iframeRef}
          src="/pentools-styled-apis.html"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 20,
            backgroundColor: 'transparent'
          }}
          title="PenTools Matrix"
        />
      </div>
    </>
  );
};

export default PenTools;