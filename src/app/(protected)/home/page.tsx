'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Page } from '@/components/PageLayout';
import { VaultDetails } from '@/components/VaultDetails';
import { DepositComponent } from '@/components/DepositComponent';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CustomTopBar } from '@/components/CustomTopBar';
import { WithdrawButton } from '@/components/WithdrawButton';
import { truncateAddress } from '@/utils/format';

// User display component with copy functionality
function UserDisplay() {
  const { data: session } = useSession();
  const [copied, setCopied] = useState(false);

  const displayValue = session?.user.username || session?.user.id;
  const isWalletAddress = !session?.user.username && session?.user.id;
  const truncatedValue = isWalletAddress ? truncateAddress(session?.user.id || '') : displayValue;

  const handleCopy = async () => {
    if (!displayValue) return;

    try {
      await navigator.clipboard.writeText(displayValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!session?.user) return null;

  return (
    <div className="flex items-center gap-3 px-3 py-1 bg-[var(--agent-bg)] rounded-full border border-[var(--border)]">
      <span className="text-sm font-semibold text-[var(--foreground)] capitalize">
        {truncatedValue}
      </span>
      <button
        onClick={handleCopy}
        className="p-1 hover:bg-[var(--accent)] rounded transition-colors duration-200 flex items-center justify-center"
        title={copied ? 'Copied!' : 'Copy to clipboard'}
      >
        {copied ? (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <Page.Header className="p-0 bg-[var(--topbar-bg)]">
        <CustomTopBar
          endAdornment={
            <div className="flex items-center justify-between w-full">
              <UserDisplay />

              <div className="flex items-center">
                <ThemeToggle />
              </div>
            </div>
          }
        />
      </Page.Header>
      <Page.Main className="bg-gradient-to-br from-[var(--background)] via-[var(--accent-light)] to-[var(--background)] relative">
        <div className="fixed inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-10 left-10 w-72 h-72 bg-[var(--primary)] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-0 right-4 w-72 h-72 bg-[var(--success)] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-[var(--warning)] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-start gap-6 sm:gap-8 mb-20 sm:mb-16 w-full pb-24 pt-4 sm:pt-8">
          <VaultDetails />
          <WithdrawButton />
          <DepositComponent />
        </div>
      </Page.Main>
    </>
  );
}
