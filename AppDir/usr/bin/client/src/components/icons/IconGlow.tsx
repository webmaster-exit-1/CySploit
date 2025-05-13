import React from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

interface IconGlowProps {
  children: React.ReactNode;
  className?: string;
}

const IconGlow: React.FC<IconGlowProps> = ({ children, className }) => {
  const { accentColor } = useTheme();
  const glowClass = `icon-glow-${accentColor}`;

  return (
    <div className={cn(glowClass, className)}>
      {children}
    </div>
  );
};

export default IconGlow;