import React from 'react';
import { StatusCardProps } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

const StatusCard: React.FC<StatusCardProps> = ({
  title,
  value,
  icon,
  colorClass,
  changeValue,
  changeLabel,
  changeType = 'neutral'
}) => {
  const { accentColor } = useTheme();
  
  // Determine colors based on change type
  const changeColorClasses = {
    positive: 'text-primary',
    negative: 'text-destructive',
    neutral: 'text-white'
  };

  return (
    <div className={`bg-muted rounded-lg p-5 border border-gray-800 hover:neon-border-${accentColor} transition-all duration-300`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-400 font-medium text-sm mb-1">{title}</p>
          <h3 className="text-3xl font-bold font-rajdhani text-white">{value}</h3>
        </div>
        <div className={cn("p-3 rounded-lg", 
           colorClass === "bg-primary" ? "bg-primary bg-opacity-20" : 
           colorClass === "bg-secondary" ? "bg-secondary bg-opacity-20" :
           colorClass === "bg-accent" ? "bg-accent bg-opacity-20" : 
           `bg-${accentColor} bg-opacity-20`)}>
          {icon}
        </div>
      </div>
      {(changeValue || changeLabel) && (
        <div className="mt-4 flex items-center text-sm">
          {changeValue && (
            <span className={changeColorClasses[changeType]}>{changeValue}</span>
          )}
          {changeLabel && (
            <span className="text-gray-500 ml-2">{changeLabel}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatusCard;
