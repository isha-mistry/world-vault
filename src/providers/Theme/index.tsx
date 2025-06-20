'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isLoaded: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // Get initial theme before any rendering
    const getInitialTheme = (): Theme => {
      if (typeof window === 'undefined') return 'light';

      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        return savedTheme;
      }

      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    const initialTheme = getInitialTheme();

    // Apply theme immediately to document
    document.documentElement.setAttribute('data-theme', initialTheme);
    document.body.style.transition = 'none';

    // No additional styles needed - handled in global CSS

    // Prevent any transitions during initial load
    document.body.classList.add('theme-loading');
    setTheme(initialTheme);

    // Allow rendering after theme is set
    requestAnimationFrame(() => {
      document.body.classList.remove('theme-loading');
      document.body.classList.add('theme-loaded');
      document.body.style.transition = '';
      setIsLoaded(true);
    });

    return () => {
      // Cleanup if needed
    };
  }, []);

  const applyTheme = (newTheme: Theme) => {
    if (isTransitioning) return;

    setIsTransitioning(true);

    // Temporarily disable theme-loaded class to prevent flashing
    document.body.classList.remove('theme-loaded');
    document.body.classList.add('theme-switching');

    // Apply new theme immediately
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    // Re-enable transitions after a brief delay
    requestAnimationFrame(() => {
      document.body.classList.remove('theme-switching');
      document.body.classList.add('theme-loaded');

      // Clean up after transition
      setTimeout(() => {
        setIsTransitioning(false);
      }, 350);
    });
  };

  const toggleTheme = () => {
    if (isTransitioning) return;

    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  // Render loading state with correct theme colors
  if (!isLoaded) {
    const bgColor = theme === 'dark' ? '#0a0a0a' : '#ffffff';
    const textColor = theme === 'dark' ? '#ffffff' : '#000000';

    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: bgColor,
          color: textColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'none'
        }}
      >
        <div
          style={{
            width: '24px',
            height: '24px',
            border: '2px solid transparent',
            borderTop: '2px solid currentColor',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        />
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `
        }} />
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isLoaded }}>
      {children}
    </ThemeContext.Provider>
  );
}; 