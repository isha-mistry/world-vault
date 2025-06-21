'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Page } from '@/components/PageLayout';
import { CustomTopBar } from '@/components/CustomTopBar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { formatCurrency, truncateAddress } from '@/utils/format';
import {
  Wallet,
  Copy,
  CheckCircle,
  Eye,
  EyeClosed,
  GraphUp,
  ArrowUp,
  ArrowDown,
  Refresh
} from 'iconoir-react';

function WalletBalance() {
  const { data: session } = useSession();
  const [showBalance, setShowBalance] = useState(true);
  const [copied, setCopied] = useState(false);

  const balance = 5.25; // Mock balance
  const displayValue = session?.user?.id || '';

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

  return (
    <div className="bg-gradient-to-br from-[var(--agent-bg)] to-[var(--agent-selected)] rounded-2xl p-6 border border-[var(--border)] shadow-[var(--shadow-lg)]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[var(--primary)] to-[var(--success)] rounded-full flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Wallet Balance</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--text-secondary)] font-mono">
                {truncateAddress(displayValue)}
              </span>
              <button
                onClick={handleCopy}
                className="p-1 rounded-lg hover:bg-[var(--agent-bg)] transition-colors duration-200"
                title="Copy address"
              >
                {copied ? (
                  <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                ) : (
                  <Copy className="w-4 h-4 text-[var(--text-secondary)]" />
                )}
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowBalance(!showBalance)}
          className="p-2 rounded-lg hover:bg-[var(--agent-bg)] transition-colors duration-200"
          title={showBalance ? "Hide balance" : "Show balance"}
        >
          {showBalance ? (
            <EyeClosed className="w-5 h-5 text-[var(--text-secondary)]" />
          ) : (
            <Eye className="w-5 h-5 text-[var(--text-secondary)]" />
          )}
        </button>
      </div>

      <div className="text-center mb-6">
        <div className="text-3xl font-bold text-[var(--text-primary)] mb-2">
          {showBalance ? `${formatCurrency(balance)} ETH` : '••••••••'}
        </div>
        <div className="flex items-center justify-center gap-2 text-[var(--success)]">
          <GraphUp className="w-4 h-4" />
          <span className="text-sm">+2.5% this week</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button className="flex flex-col items-center gap-2 p-4 bg-[var(--background)]/50 rounded-xl border border-[var(--border)] hover:bg-[var(--agent-bg)] transition-colors duration-200">
          <ArrowUp className="w-6 h-6 text-[var(--success)]" />
          <span className="text-sm font-medium text-[var(--text-primary)]">Send</span>
        </button>

        <button className="flex flex-col items-center gap-2 p-4 bg-[var(--background)]/50 rounded-xl border border-[var(--border)] hover:bg-[var(--agent-bg)] transition-colors duration-200">
          <ArrowDown className="w-6 h-6 text-[var(--primary)]" />
          <span className="text-sm font-medium text-[var(--text-primary)]">Receive</span>
        </button>

        <button className="flex flex-col items-center gap-2 p-4 bg-[var(--background)]/50 rounded-xl border border-[var(--border)] hover:bg-[var(--agent-bg)] transition-colors duration-200">
          <Refresh className="w-6 h-6 text-[var(--warning)]" />
          <span className="text-sm font-medium text-[var(--text-primary)]">Refresh</span>
        </button>
      </div>
    </div>
  );
}

function TokenList() {
  const tokens = [
    { symbol: 'ETH', name: 'Ethereum', balance: 5.25, value: 13125.50, icon: '⟠' },
    { symbol: 'WLD', name: 'Worldcoin', balance: 1250.0, value: 2875.00, icon: '🌍' },
    { symbol: 'USDC', name: 'USD Coin', balance: 1000.0, value: 1000.00, icon: '💵' },
  ];

  return (
    <div className="bg-[var(--agent-bg)] rounded-2xl border border-[var(--border)] shadow-[var(--shadow-lg)] overflow-hidden">
      <div className="p-6 border-b border-[var(--border)]">
        <h3 className="text-lg font-bold text-[var(--text-primary)]">Your Tokens</h3>
      </div>

      <div className="divide-y divide-[var(--border)]">
        {tokens.map((token, index) => (
          <div key={index} className="p-4 hover:bg-[var(--agent-selected)] transition-colors duration-200 cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--background)] rounded-full flex items-center justify-center border border-[var(--border)] text-lg">
                  {token.icon}
                </div>
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">
                    {token.symbol}
                  </div>
                  <div className="text-sm text-[var(--text-secondary)]">
                    {token.name}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-bold text-[var(--text-primary)]">
                  {formatCurrency(token.balance)} {token.symbol}
                </div>
                <div className="text-sm text-[var(--text-secondary)]">
                  ${formatCurrency(token.value)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WalletPage() {
  return (
    <>
      <Page.Header className="p-0 bg-[var(--topbar-bg)]">
        <CustomTopBar
          endAdornment={
            <div className="flex items-center justify-between w-full">
              <h1 className="text-lg font-bold text-[var(--text-primary)]">Wallet</h1>
              <ThemeToggle />
            </div>
          }
        />
      </Page.Header>

      <Page.Main className="bg-gradient-to-br from-[var(--background)] via-[var(--accent-light)] to-[var(--background)] relative">
        {/* Background decoration */}
        <div className="fixed inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-[var(--primary)] rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-64 h-64 bg-[var(--warning)] rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000"></div>
        </div>

        <div className="relative z-10 flex flex-col gap-6 pb-24 pt-4">
          <WalletBalance />
          <TokenList />
        </div>
      </Page.Main>
    </>
  );
} 