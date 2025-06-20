'use client';
import { InfoCircleSolid, Wallet, ArrowLeft, WarningTriangle } from 'iconoir-react'
import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button
} from '@worldcoin/mini-apps-ui-kit-react'

interface VaultInfo {
  depositedAmount: number;
  currentValue: number;
  profit: number;
  profitPercentage: number;
  lastUpdated: string;
}

function WithdrawButton() {
  const { data: session } = useSession();
  const [vaultInfo, setVaultInfo] = useState<VaultInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const fetchVaultInfo = async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/withdraw');
      if (res.ok) {
        const data = await res.json();
        console.log(data);
        setVaultInfo(data);
      } else {
        throw new Error('Failed to fetch vault info');
      }
    } catch (error) {
      console.error('Error fetching vault info:', error);
      setStatus('error');
      setStatusMessage('Failed to load vault information');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchVaultInfo();
    }
  }, [isOpen, session?.user?.id]);

  const handleWithdraw = async () => {
    if (!vaultInfo || !session?.user?.id) return;

    setIsWithdrawing(true);
    setStatus('idle');

    try {
      const res = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: vaultInfo.currentValue
        })
      });

      if (res.ok) {
        const result = await res.json();
        setStatus('success');
        setStatusMessage(`Withdrawal of ${vaultInfo.currentValue} WLD initiated successfully! Transaction ID: ${result.id}`);

        // Reset vault info after successful withdrawal
        setTimeout(() => {
          setVaultInfo(null);
          setStatus('idle');
        }, 3000);
      } else {
        throw new Error('Withdrawal failed');
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      setStatus('error');
      setStatusMessage('Failed to process withdrawal. Please try again.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <button className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] text-white font-semibold shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transform hover:scale-105 transition-all duration-200">
          <ArrowLeft className="w-5 h-5" />
          Withdraw
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-[var(--card)] border-[var(--border)] rounded-2xl w-full">
        <article className="text-[var(--foreground)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center justify-center gap-3 text-xl font-bold">
              {/* <span className="p-2 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)]"> */}
              <Wallet className="w-6 h-6 text-[var(--primary)]" />
              {/* </span> */}
              Withdraw Funds
            </AlertDialogTitle>
          </AlertDialogHeader>

          <main className="space-y-4 mt-4">
            {/* User Profile Section */}
            <section className="p-4 bg-[var(--agent-bg)] rounded-lg">
              <h4 className="font-semibold text-[var(--foreground)] mb-2 flex items-center gap-2">
                <InfoCircleSolid className="w-4 h-4" />
                Account Information
              </h4>
              <ul className="space-y-1 text-sm list-none">
                <li><span className="font-medium">Username:</span> {session?.user?.username || 'Not available'}</li>
                <li><span className="font-medium">User ID:</span> {session?.user?.id ? `${session.user.id.slice(0, 4)}...${session.user.id.slice(-4)}` : 'Not available'}</li>
              </ul>
            </section>

            {/* Vault Information Section */}
            {isLoading ? (
              <section className="p-4 bg-[var(--agent-bg)] rounded-lg">
                <article className="animate-pulse space-y-3">
                  <span className="block h-4 bg-[var(--border)] rounded w-1/2"></span>
                  <span className="block h-4 bg-[var(--border)] rounded w-3/4"></span>
                  <span className="block h-4 bg-[var(--border)] rounded w-1/3"></span>
                </article>
              </section>
            ) : vaultInfo ? (
              <section className="p-4 bg-[var(--agent-bg)] rounded-lg">
                <h4 className="font-semibold text-[var(--foreground)] mb-3">Vault Details</h4>
                <section className="grid grid-cols-2 gap-3 text-sm">
                  <article className="text-center p-3 bg-[var(--card)] rounded-lg">
                    <p className="text-lg font-bold text-[var(--foreground)]">{vaultInfo.depositedAmount}</p>
                    <p className="text-[var(--accent)]">Deposited WLD</p>
                  </article>
                  <article className="text-center p-3 bg-[var(--card)] rounded-lg">
                    <p className="text-lg font-bold text-[var(--foreground)]">{vaultInfo.currentValue}</p>
                    <p className="text-[var(--accent)]">Current Value</p>
                  </article>
                  <article className="text-center p-3 bg-[var(--card)] rounded-lg">
                    <p className={`text-lg font-bold ${vaultInfo.profit >= 0 ? 'text-[var(--success)]' : 'text-[var(--warning)]'}`}>
                      {vaultInfo.profit.toFixed(2)}
                    </p>
                    <p className="text-[var(--accent)]">Profit/Loss</p>
                  </article>
                  <article className="text-center p-3 bg-[var(--card)] rounded-lg">
                    <p className={`text-lg font-bold ${vaultInfo.profit >= 0 ? 'text-[var(--success)]' : 'text-[var(--warning)]'}`}>
                      {vaultInfo.profitPercentage.toFixed(1)}%
                    </p>
                    <p className="text-[var(--accent)]">ROI</p>
                  </article>
                </section>
                <p className="mt-3 text-xs text-[var(--accent)]">
                  Last updated: {new Date(vaultInfo.lastUpdated).toLocaleString()}
                </p>
              </section>
            ) : (
              <section className="p-4 bg-[var(--agent-bg)] rounded-lg text-center">
                <WarningTriangle className="w-8 h-8 text-[var(--warning)] mx-auto mb-2" />
                <p className="text-[var(--accent)]">No deposit information found</p>
              </section>
            )}

            {/* Status Messages */}
            {status !== 'idle' && (
              <section className={`p-4 rounded-lg text-center ${status === 'success'
                ? 'bg-[var(--success-light)] text-[var(--success)]'
                : 'bg-[var(--error-light)] text-[var(--error)]'
                }`}>
                <p>{statusMessage}</p>
              </section>
            )}

            {/* Withdrawal Warning */}
            {vaultInfo && status === 'idle' && (
              <section className="p-4 bg-[var(--warning-light)] border border-[var(--warning)] rounded-lg">
                <article className="flex items-start gap-3">
                  <WarningTriangle className="w-5 h-5 text-[var(--warning)] mt-0.5 flex-shrink-0" />
                  <aside className="text-sm">
                    <p className="font-semibold text-[var(--warning)] mb-1">Important Notice</p>
                    <p className="text-[var(--accent)]">
                      You are about to withdraw <strong>{vaultInfo.currentValue} WLD</strong> from your vault.
                      This action cannot be undone and will close your current position.
                    </p>
                  </aside>
                </article>
              </section>
            )}
          </main>

          <footer className="mt-6 flex gap-3">
            {vaultInfo && status !== 'success' && (
              <Button
                onClick={handleWithdraw}
                disabled={isWithdrawing || !vaultInfo}
                className="flex-1 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] hover:from-[var(--primary-hover)] hover:to-[var(--primary)]"
              >
                {isWithdrawing ? (
                  <>
                    <div className="inline-block w-4 h-4 border-2 rounded-full border-solid border-gray-200 border-t-white animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  `Withdraw ${vaultInfo.currentValue} WLD`
                )}
              </Button>
            )}
          </footer>
        </article>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default WithdrawButton