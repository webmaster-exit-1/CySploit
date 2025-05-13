import React, { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const routes = [
  { path: '/', label: 'Dashboard', icon: 'ri-dashboard-line' },
  { path: '/network-discovery', label: 'Network Discovery', icon: 'ri-radar-line' },
  { path: '/vulnerability-scanner', label: 'Vulnerability Scanner', icon: 'ri-code-box-line' },
  { path: '/packet-inspector', label: 'Packet Inspector', icon: 'ri-file-search-line' },
  { path: '/network-mapping', label: 'Network Mapping', icon: 'ri-router-line' },
  { path: '/terminal', label: 'Terminal', icon: 'ri-terminal-box-line' },
  { path: '/sessions', label: 'Sessions', icon: 'ri-folder-line' },
];

const MobileSidebar: React.FC<MobileSidebarProps> = ({ isOpen, onClose }) => {
  const [location] = useLocation();

  // Close menu when navigating
  const handleNavigation = () => {
    onClose();
  };

  // Close sidebar when clicking outside
  useEffect(() => {
    if (isOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        if (event.target instanceof HTMLElement) {
          if (!event.target.closest('.mobile-sidebar-content')) {
            onClose();
          }
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  // Prevent scrolling when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex">
      <div className="mobile-sidebar-content w-64 bg-popover h-full overflow-y-auto">
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="text-primary text-2xl font-bold font-rajdhani flex items-center">
              <i className="ri-shield-keyhole-line mr-2"></i>
              <span>CySploit</span>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
        </div>
        
        <div className="py-4">
          <div className="px-2 space-y-1">
            {routes.map((route) => (
              <Link key={route.path} href={route.path}>
                <a 
                  onClick={handleNavigation}
                  className={cn(
                    "flex items-center px-4 py-3 rounded-lg transition",
                    location === route.path
                      ? "text-primary bg-muted"
                      : "text-white hover:bg-muted"
                  )}
                >
                  <i className={cn(route.icon, "text-xl mr-3")}></i>
                  <span>{route.label}</span>
                </a>
              </Link>
            ))}
          </div>
        </div>
        
        <div className="border-t border-gray-800 p-4 mt-auto">
          <Link href="/settings">
            <a 
              onClick={handleNavigation}
              className="flex items-center text-gray-400 hover:text-white"
            >
              <i className="ri-settings-4-line text-xl mr-3"></i>
              <span>Settings</span>
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MobileSidebar;
