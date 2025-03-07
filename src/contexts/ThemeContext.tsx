import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

// Enhanced theme types with additional themes
type BaseTheme = 'light' | 'dark';
type ThemeColor = 'blue' | 'green' | 'purple' | 'orange' | 'default';
type ThemeMode = BaseTheme | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  themeColor: ThemeColor;
  setThemeColor: (color: ThemeColor) => void;
  resolvedTheme: BaseTheme; // The actual theme being applied (resolves 'system')
  isSystemPreferenceDark: boolean; // Exposed for components that need to know
  toggleTheme: () => void; // Convenience method to toggle between light/dark
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeMode;
  defaultColor?: ThemeColor;
  storageKey?: string;
  colorStorageKey?: string;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'system',
  defaultColor = 'default',
  storageKey = 'theme',
  colorStorageKey = 'theme-color',
}) => {
  // Get the initial theme from localStorage or default
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const savedTheme = localStorage.getItem(storageKey) as ThemeMode;
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      return savedTheme;
    }
    return defaultTheme;
  });

  // Get the initial theme color from localStorage or default
  const [themeColor, setThemeColor] = useState<ThemeColor>(() => {
    const savedColor = localStorage.getItem(colorStorageKey) as ThemeColor;
    if (savedColor && ['blue', 'green', 'purple', 'orange', 'default'].includes(savedColor)) {
      return savedColor;
    }
    return defaultColor;
  });
  
  // Track system preference separately
  const [isSystemPreferenceDark, setIsSystemPreferenceDark] = useState<boolean>(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Determine the resolved theme based on system preference
  const resolvedTheme = useMemo<BaseTheme>(() => {
    if (theme === 'system') {
      return isSystemPreferenceDark ? 'dark' : 'light';
    }
    return theme as BaseTheme;
  }, [theme, isSystemPreferenceDark]);

  // Function to set the theme and save to localStorage
  const handleSetTheme = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    localStorage.setItem(storageKey, newTheme);
  };

  // Function to set the theme color and save to localStorage
  const handleSetThemeColor = (newColor: ThemeColor) => {
    setThemeColor(newColor);
    localStorage.setItem(colorStorageKey, newColor);
  };

  // Convenience method to toggle between light/dark
  const toggleTheme = () => {
    if (theme === 'system') {
      handleSetTheme(isSystemPreferenceDark ? 'light' : 'dark');
    } else {
      handleSetTheme(theme === 'dark' ? 'light' : 'dark');
    }
  };

  // Set up a listener for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsSystemPreferenceDark(e.matches);
    };
    
    // Initial setup
    setIsSystemPreferenceDark(mediaQuery.matches);
    
    // Modern API with addEventListener
    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, []);

  // Apply theme classes to document
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove existing themes
    root.classList.remove('light', 'dark');
    
    // Add the resolved theme
    root.classList.add(resolvedTheme);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        resolvedTheme === 'dark' ? '#020817' : '#ffffff'
      );
    }
  }, [resolvedTheme]);

  // Apply color theme attributes
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove existing color themes
    root.classList.remove('theme-blue', 'theme-green', 'theme-purple', 'theme-orange');
    
    // Only add class if not default
    if (themeColor !== 'default') {
      root.classList.add(`theme-${themeColor}`);
    }
    
    // Set data attribute for CSS selectors
    root.setAttribute('data-theme-color', themeColor);
  }, [themeColor]);

  // Provide prefetch for smooth transitions
  useEffect(() => {
    const oppositeTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    
    // Prefetch and cache the other theme to make transitions instant
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'style';
    link.href = `/themes/${oppositeTheme}.css`; // Adjust path as needed
    document.head.appendChild(link);
    
    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, [resolvedTheme]);

  const contextValue = useMemo(() => ({
    theme,
    setTheme: handleSetTheme,
    themeColor,
    setThemeColor: handleSetThemeColor,
    resolvedTheme,
    isSystemPreferenceDark,
    toggleTheme,
  }), [theme, themeColor, resolvedTheme, isSystemPreferenceDark]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to get the current theme color
export const useThemeColor = () => {
  const { themeColor, setThemeColor } = useTheme();
  return { themeColor, setThemeColor };
};

// Custom hook to automatically toggle themes based on preferred color scheme
export const useAutoTheme = (enabled = true) => {
  const { setTheme, isSystemPreferenceDark } = useTheme();
  
  useEffect(() => {
    if (!enabled) return;
    setTheme('system');
  }, [enabled, setTheme]);
  
  return isSystemPreferenceDark ? 'dark' : 'light';
};

// Utility hook for adjusting components based on dark/light mode
export const useIsDarkMode = () => {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === 'dark';
};