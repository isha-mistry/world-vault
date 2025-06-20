'use client';

import { TabItem, Tabs } from '@worldcoin/mini-apps-ui-kit-react';
import { HomeSimple, Wallet } from 'iconoir-react';
import { useState, useEffect } from 'react';

/**
 * Simplified navigation with just Home and Wallet tabs
 */
export const Navigation = () => {
  const [value, setValue] = useState('home');
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  return (
    <div className={`
      bg-[var(--topbar-bg)]/95 border-t border-[var(--topbar-border)] 
      shadow-[var(--shadow-lg)] backdrop-blur-xl 
      transition-all duration-300 ease-in-out
    `}>
      {/* Gradient accent line */}
      <div className="h-0.5 bg-gradient-to-r from-[var(--primary)] via-[var(--success)] to-[var(--primary)] opacity-60"></div>

      <div className="px-4 py-3">
        <Tabs value={value} onValueChange={setValue} className="w-full">
          <div className="flex justify-center items-center gap-8">
            <TabItem
              value="home"
              icon={<HomeSimple className="w-6 h-6" />}
              label="Home"
              className="flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all duration-200 hover:bg-[var(--agent-bg)] min-w-0"
            />
            <TabItem
              value="wallet"
              icon={<Wallet className="w-6 h-6" />}
              label="Wallet"
              className="flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all duration-200 hover:bg-[var(--agent-bg)] min-w-0"
            />
          </div>
        </Tabs>
      </div>

      {/* Safe area for iOS devices */}
      <div className="h-safe-area-inset-bottom bg-[var(--topbar-bg)]"></div>
    </div>
  );
};
