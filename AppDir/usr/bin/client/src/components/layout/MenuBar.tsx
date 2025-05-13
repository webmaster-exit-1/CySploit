import React from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';

// Menu items with improved icons
const menuItems = [
  { 
    path: '/', 
    icon: 'ri-dashboard-3-line', 
    label: 'Dashboard',
    color: 'text-cyan-400'
  },
  { 
    path: '/network-discovery', 
    icon: 'ri-radar-line', 
    label: 'Network',
    color: 'text-yellow-400'
  },
  { 
    path: '/vulnerability-scanner', 
    icon: 'ri-bug-2-line', 
    label: 'Vulns',
    color: 'text-red-400'
  },
  { 
    path: '/packet-inspector', 
    icon: 'ri-file-search-line', 
    label: 'Packets',
    color: 'text-green-400'
  },
  { 
    path: '/network-mapping', 
    icon: 'ri-broadcast-line', 
    label: 'Mapping',
    color: 'text-purple-400'
  },
  { 
    path: '/shodan', 
    icon: 'ri-earth-line', 
    label: 'Shodan',
    color: 'text-blue-400'
  },
  { 
    path: '/metasploit-console', 
    icon: 'ri-braces-line', 
    label: 'Metasploit',
    color: 'text-orange-400'
  },
  { 
    path: '/pentools', 
    icon: 'ri-tools-fill', 
    label: 'Tools',
    color: 'text-green-400'
  },
  { 
    path: '/terminal', 
    icon: 'ri-terminal-box-line', 
    label: 'Terminal',
    color: 'text-pink-400'
  },
  { 
    path: '/sessions', 
    icon: 'ri-timer-flash-line', 
    label: 'Sessions',
    color: 'text-purple-400'
  },
  { 
    path: '/settings', 
    icon: 'ri-settings-3-fill', 
    label: 'Settings',
    color: 'text-gray-400'
  }
];

const MenuBar: React.FC = () => {
  const [location] = useLocation();

  return (
    <div className="bg-muted/90 backdrop-blur-sm border-b border-gray-800 py-2 px-4 sticky top-[57px] z-10 w-full overflow-x-auto">
      <div className="flex items-center space-x-1 min-w-max">
        {menuItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <div className={cn(
              "flex flex-col items-center px-3 py-2 rounded-md cursor-pointer transition-all",
              location === item.path
                ? "bg-primary/20 text-white"
                : "hover:bg-muted/70 text-gray-400 hover:text-white"
            )}>
              <i className={cn(item.icon, "text-xl mb-1", item.color)}></i>
              <span className="text-xs font-medium">{item.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MenuBar;