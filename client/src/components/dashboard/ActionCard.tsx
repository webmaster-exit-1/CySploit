import React from 'react';
import { cn } from '@/lib/utils';
import { Link } from 'wouter';
// Import SVG icons from Heroicons
import { 
  BeakerIcon, 
  ShieldCheckIcon, 
  DocumentMagnifyingGlassIcon,
  GlobeAltIcon,
  CommandLineIcon,
  WrenchScrewdriverIcon,
  ClockIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';

interface ActionCardProps {
  title: string;
  description: string;
  icon: "radar" | "vulnerability" | "packet" | "network" | "shodan" | "metasploit" | "terminal" | "pentools";
  color: 'cyan' | 'magenta' | 'purple';
  linkTo: string;
}

const ActionCard: React.FC<ActionCardProps> = ({
  title,
  description,
  icon,
  color,
  linkTo
}) => {
  const colorClasses = {
    cyan: {
      bg: 'bg-primary bg-opacity-20',
      text: 'text-primary',
      hover: 'group-hover:glow-cyan',
      border: 'border-primary',
      iconGlow: 'group-hover:icon-glow-cyan'
    },
    magenta: {
      bg: 'bg-secondary bg-opacity-20',
      text: 'text-secondary',
      hover: 'group-hover:glow-magenta',
      border: 'border-secondary',
      iconGlow: 'group-hover:icon-glow-magenta'
    },
    purple: {
      bg: 'bg-accent bg-opacity-20',
      text: 'text-accent',
      hover: 'group-hover:glow-purple',
      border: 'border-accent',
      iconGlow: 'group-hover:icon-glow-purple'
    }
  };

  return (
    <Link href={linkTo}>
      <div className="group bg-muted rounded-lg p-5 border border-gray-800 hover:neon-border-cyan transition duration-300 flex flex-col justify-between h-52 cursor-pointer">
        <div className="flex items-start">
          <div className={cn(
            "w-16 h-16 rounded-lg flex items-center justify-center p-3 mb-4 transition-all duration-300 border shadow-sm group-hover:shadow-md",
            colorClasses[color].bg,
            colorClasses[color].border
          )}>
            {icon === "radar" && <ComputerDesktopIcon className={cn(
              "transition-all duration-300 w-full h-full", 
              colorClasses[color].text,
              "group-hover:scale-110",
              colorClasses[color].iconGlow
            )} />}
            
            {icon === "vulnerability" && <ShieldCheckIcon className={cn(
              "transition-all duration-300 w-full h-full", 
              colorClasses[color].text,
              "group-hover:scale-110",
              colorClasses[color].iconGlow
            )} />}
            
            {icon === "packet" && <DocumentMagnifyingGlassIcon className={cn(
              "transition-all duration-300 w-full h-full", 
              colorClasses[color].text,
              "group-hover:scale-110",
              colorClasses[color].iconGlow
            )} />}
            
            {icon === "network" && <GlobeAltIcon className={cn(
              "transition-all duration-300 w-full h-full", 
              colorClasses[color].text,
              "group-hover:scale-110",
              colorClasses[color].iconGlow
            )} />}
            
            {icon === "shodan" && <GlobeAltIcon className={cn(
              "transition-all duration-300 w-full h-full", 
              colorClasses[color].text,
              "group-hover:scale-110",
              colorClasses[color].iconGlow
            )} />}
            
            {icon === "metasploit" && <BeakerIcon className={cn(
              "transition-all duration-300 w-full h-full", 
              colorClasses[color].text,
              "group-hover:scale-110",
              colorClasses[color].iconGlow
            )} />}
            
            {icon === "terminal" && <CommandLineIcon className={cn(
              "transition-all duration-300 w-full h-full", 
              colorClasses[color].text,
              "group-hover:scale-110",
              colorClasses[color].iconGlow
            )} />}
            
            {icon === "pentools" && <WrenchScrewdriverIcon className={cn(
              "transition-all duration-300 w-full h-full", 
              colorClasses[color].text,
              "group-hover:scale-110",
              colorClasses[color].iconGlow
            )} />}
          </div>
          <div className="flex flex-col ml-4">
            <h3 className="text-xl font-bold font-rajdhani text-white mb-2">{title}</h3>
            <p className="text-gray-400 text-sm">{description}</p>
          </div>
        </div>
        <div className={cn(
          "mt-4 text-sm flex items-center transition",
          colorClasses[color].text,
          "group-hover:text-white"
        )}>
          Launch Tool
          <i className="ri-arrow-right-line ml-1 group-hover:ml-2 transition-all"></i>
        </div>
      </div>
    </Link>
  );
};

export default ActionCard;
