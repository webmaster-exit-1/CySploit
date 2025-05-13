import React from 'react';
import { cn } from '@/lib/utils';

interface IconProps {
  className?: string;
  size?: number;
}

const NetworkTrafficIcon: React.FC<IconProps> = ({ className, size = 24 }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={cn("text-accent", className)}
    >
      {/* Network/Graph Icon */}
      <polygon points="22 12 18 8 14 12 10 8 6 12 2 8 2 16 22 16 22 12" />
      <line x1="6" y1="12" x2="6" y2="16" />
      <line x1="10" y1="12" x2="10" y2="16" />
      <line x1="14" y1="12" x2="14" y2="16" />
      <line x1="18" y1="12" x2="18" y2="16" />
    </svg>
  );
};

export default NetworkTrafficIcon;