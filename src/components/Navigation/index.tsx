'use client';

import { TabItem, Tabs } from '@worldcoin/mini-apps-ui-kit-react';
import { HomeSimple, Wallet, User } from 'iconoir-react';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * Navigation with Home, Wallet, and Profile tabs using Next.js routing
 */
export const Navigation = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState('home');

  // Update active tab based on current route
  useEffect(() => {
    if (pathname.includes('/home')) {
      setValue('home');
    } else if (pathname.includes('/wallet')) {
      setValue('wallet');
    } else if (pathname.includes('/profile')) {
      setValue('profile');
    }
  }, [pathname]);

  // Handle tab navigation
  const handleTabChange = (newValue: string) => {
    setValue(newValue);

    // Navigate to the appropriate route
    switch (newValue) {
      case 'home':
        router.push('/home');
        break;
      case 'wallet':
        router.push('/wallet');
        break;
      case 'profile':
        router.push('/profile');
        break;
      default:
        router.push('/home');
    }
  };

  return (
    <div className={`
      bg-[var(--topbar-bg)]/95 border-t border-[var(--topbar-border)] 
      shadow-[var(--shadow-lg)] backdrop-blur-xl 
      transition-all duration-300 ease-in-out
    `}>
      {/* Gradient accent line */}
      <div className="h-0.5 bg-gradient-to-r from-[var(--primary)] via-[var(--success)] to-[var(--primary)] opacity-60"></div>

      <div className="px-4 py-3">
        <Tabs value={value} onValueChange={handleTabChange} className="w-full">
          <div className="flex justify-center items-center gap-4">
            <TabItem
              value="home"
              icon={<HomeSimple className="w-6 h-6" />}
              label="Home"
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 hover:bg-[var(--agent-bg)] min-w-0"
            />
            <TabItem
              value="wallet"
              icon={<Wallet className="w-6 h-6" />}
              label="Wallet"
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 hover:bg-[var(--agent-bg)] min-w-0"
            />
            <TabItem
              value="profile"
              icon={<User className="w-6 h-6" />}
              label="Profile"
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 hover:bg-[var(--agent-bg)] min-w-0"
            />
          </div>
        </Tabs>
      </div>

      {/* Safe area for iOS devices */}
      <div className="h-safe-area-inset-bottom bg-[var(--topbar-bg)]"></div>
    </div>
  );
};
