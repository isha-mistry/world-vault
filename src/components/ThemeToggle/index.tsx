'use client';
import { Button } from '@worldcoin/mini-apps-ui-kit-react';
import { HalfMoon, SunLight } from 'iconoir-react';
import { useTheme } from '@/providers/Theme';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-3 rounded-full bg-[var(--agent-bg)] border border-[var(--border)] hover:bg-[var(--agent-selected)] transition-all duration-200 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <HalfMoon className="w-5 h-5 text-[var(--primary)]" />
      ) : (
        <SunLight className="w-5 h-5 text-[var(--warning)]" />
      )}
    </button>
  );
}; 