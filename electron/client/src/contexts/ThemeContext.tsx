import React, { createContext, useContext, useState, useEffect } from 'react';

type AccentColor = 'cyan' | 'magenta' | 'purple' | 'green';

interface ThemeContextType {
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
}

const defaultContext: ThemeContextType = {
  accentColor: 'cyan',
  setAccentColor: () => {},
};

const ThemeContext = createContext<ThemeContextType>(defaultContext);

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accentColor, setAccentColor] = useState<AccentColor>('cyan');

  // Apply the theme class to the document body
  useEffect(() => {
    // Remove all theme classes first
    document.documentElement.classList.remove('theme-cyan', 'theme-magenta', 'theme-purple', 'theme-green');
    
    // Add the new theme class
    document.documentElement.classList.add(`theme-${accentColor}`);
    
    // Store the accent color preference in localStorage
    localStorage.setItem('accentColor', accentColor);
  }, [accentColor]);

  // Read the accent color from localStorage on initial load
  useEffect(() => {
    const savedAccentColor = localStorage.getItem('accentColor') as AccentColor;
    if (savedAccentColor && ['cyan', 'magenta', 'purple', 'green'].includes(savedAccentColor)) {
      setAccentColor(savedAccentColor);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ accentColor, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
};