import React from 'react';
import { cn } from '@/lib/utils';

type NeonColor = 'cyan' | 'magenta' | 'purple' | 'green';

interface NeonBorderProps {
  color: NeonColor;
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  pulseEffect?: boolean;
}

export const NeonBorder: React.FC<NeonBorderProps> = ({
  color,
  children,
  className,
  hoverEffect = false,
  pulseEffect = false
}) => {
  const colorClasses = {
    cyan: 'neon-border-cyan',
    magenta: 'neon-border-magenta',
    purple: 'neon-border-purple',
    green: 'neon-border-green'
  };

  const hoverClasses = {
    cyan: 'hover:glow-cyan',
    magenta: 'hover:glow-magenta',
    purple: 'hover:glow-purple',
    green: 'hover:glow-green'
  };

  return (
    <div
      className={cn(
        'rounded-lg border border-gray-800 transition-all duration-300',
        colorClasses[color],
        hoverEffect && hoverClasses[color],
        pulseEffect && 'animate-pulse-slow',
        className
      )}
    >
      {children}
    </div>
  );
};

export default NeonBorder;
