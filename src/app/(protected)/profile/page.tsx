'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Page } from '@/components/PageLayout';
import { CustomTopBar } from '@/components/CustomTopBar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { truncateAddress, formatCurrency, formatTimestamp } from '@/utils/format';
import {
  User,
  Copy,
  CheckCircle,
  ArrowDown,
  ArrowUp,
  Clock,
  Wallet,
  GraphUp,
  Calendar
} from 'iconoir-react';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  timestamp: Date;
  status: 'completed' | 'pending' | 'failed';
  txHash?: string;
}

// Mock transaction data - in a real app, this would come from your API
const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'deposit',
    amount: 1.5,
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: 'completed',
    txHash: '0x1234...5678'
  },
  {
    id: '2',
    type: 'withdrawal',
    amount: 0.5,
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    status: 'completed',
    txHash: '0x9876...5432'
  },
  {
    id: '3',
    type: 'deposit',
    amount: 2.0,
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    status: 'completed',
    txHash: '0xabcd...efgh'
  },
  {
    id: '4',
    type: 'withdrawal',
    amount: 1.2,
    timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    status: 'pending'
  }
];

function UserProfile() {
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
    <div className="bg-gradient-to-br from-[var(--agent-bg)] to-[var(--agent-selected)] rounded-2xl p-6 border border-[var(--border)] shadow-[var(--shadow-lg)]">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 bg-gradient-to-br from-[var(--primary)] to-[var(--success)] rounded-full flex items-center justify-center">
          <User className="w-8 h-8 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">
            {session.user.username || 'Anonymous User'}
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--text-secondary)] font-mono">
              {truncatedValue}
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

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[var(--background)]/50 rounded-lg p-3 border border-[var(--border)]">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 text-[var(--primary)]" />
            <span className="text-xs text-[var(--text-secondary)]">Total Deposited</span>
          </div>
          <span className="text-lg font-bold text-[var(--text-primary)]">
            {formatCurrency(3.5)} ETH
          </span>
        </div>

        <div className="bg-[var(--background)]/50 rounded-lg p-3 border border-[var(--border)]">
          <div className="flex items-center gap-2 mb-1">
            <GraphUp className="w-4 h-4 text-[var(--success)]" />
            <span className="text-xs text-[var(--text-secondary)]">Total Profit</span>
          </div>
          <span className="text-lg font-bold text-[var(--success)]">
            +{formatCurrency(0.35)} ETH
          </span>
        </div>
      </div>
    </div>
  );
}

function TransactionHistory() {
  const [transactions] = useState<Transaction[]>(mockTransactions);

  const getTransactionIcon = (type: Transaction['type']) => {
    return type === 'deposit' ? (
      <ArrowDown className="w-5 h-5 text-[var(--success)]" />
    ) : (
      <ArrowUp className="w-5 h-5 text-[var(--warning)]" />
    );
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'completed': return 'text-[var(--success)]';
      case 'pending': return 'text-[var(--warning)]';
      case 'failed': return 'text-[var(--error)]';
      default: return 'text-[var(--text-secondary)]';
    }
  };

  return (
    <div className="bg-[var(--agent-bg)] rounded-2xl border border-[var(--border)] shadow-[var(--shadow-lg)] overflow-hidden">
      <div className="p-6 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-[var(--primary)]" />
          <h3 className="text-lg font-bold text-[var(--text-primary)]">Transaction History</h3>
        </div>
      </div>

      <div className="divide-y divide-[var(--border)]">
        {transactions.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-3" />
            <p className="text-[var(--text-secondary)]">No transactions yet</p>
          </div>
        ) : (
          transactions.map((transaction) => (
            <div key={transaction.id} className="p-4 hover:bg-[var(--agent-selected)] transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[var(--background)] rounded-full flex items-center justify-center border border-[var(--border)]">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[var(--text-primary)] capitalize">
                        {transaction.type}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {formatTimestamp(transaction.timestamp)}
                    </p>
                    {transaction.txHash && (
                      <p className="text-xs text-[var(--text-secondary)] font-mono">
                        {truncateAddress(transaction.txHash)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className={`font-bold ${transaction.type === 'deposit' ? 'text-[var(--success)]' : 'text-[var(--warning)]'
                    }`}>
                    {transaction.type === 'deposit' ? '+' : '-'}{formatCurrency(transaction.amount)} ETH
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <>
      <Page.Header className="p-0 bg-[var(--topbar-bg)]">
        <CustomTopBar
          endAdornment={
            <div className="flex items-center justify-between w-full">
              <h1 className="text-lg font-bold text-[var(--text-primary)]">Profile</h1>
              <ThemeToggle />
            </div>
          }
        />
      </Page.Header>

      <Page.Main className="bg-gradient-to-br from-[var(--background)] via-[var(--accent-light)] to-[var(--background)] relative">
        {/* Background decoration */}
        <div className="fixed inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-20 right-10 w-64 h-64 bg-[var(--primary)] rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
          <div className="absolute bottom-20 left-10 w-64 h-64 bg-[var(--success)] rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000"></div>
        </div>

        <div className="relative z-10 flex flex-col gap-6 pb-24 pt-4">
          <UserProfile />
          <TransactionHistory />
        </div>
      </Page.Main>
    </>
  );
} 