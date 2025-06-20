'use client';
import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface CustomTopBarProps {
  endAdornment?: ReactNode;
  className?: string;
}

export const CustomTopBar = ({ endAdornment, className }: CustomTopBarProps) => {
  return (
    <div className={clsx(
      'w-full bg-[var(--topbar-bg)]/95 border-b border-[var(--topbar-border)]',
      'px-4 py-4 shadow-[var(--shadow-lg)]',
      'backdrop-blur-xl bg-opacity-90',
      'relative overflow-hidden',
      className
    )}>
      {/* Enhanced gradient accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--primary)] via-[var(--success)] to-[var(--primary)] opacity-80"></div>

      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-2 left-8 w-32 h-32 bg-[var(--primary)] rounded-full mix-blend-multiply filter blur-xl"></div>
        <div className="absolute top-0 right-8 w-24 h-24 bg-[var(--success)] rounded-full mix-blend-multiply filter blur-xl"></div>
      </div>

      <div className="flex items-center max-w-7xl mx-auto relative z-10">
        {endAdornment && (
          <div className="flex items-center w-full">
            {endAdornment}
          </div>
        )}
      </div>
    </div>
  );
}; 