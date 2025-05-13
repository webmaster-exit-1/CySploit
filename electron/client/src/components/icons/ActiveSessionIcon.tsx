import React from 'react';
import { cn } from '@/lib/utils';

interface IconProps {
  className?: string;
  size?: number;
}

const ActiveSessionIcon: React.FC<IconProps> = ({ className, size = 24 }) => {
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
      className={cn("text-primary", className)}
    >
      {/* Clock with Lightning (Active Session) */}
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
      <path d="M8.5 4.2l7 3.5" />
      <path d="M8.5 19.8l7-3.5" />
    </svg>
  );
};

export default ActiveSessionIcon;