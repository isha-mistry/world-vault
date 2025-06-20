'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  StatsUpSquare,
  GraphUp,
  Shield,
  Wallet
} from 'iconoir-react';
import { useTheme } from '@/providers/Theme';

interface VaultInfo {
  depositedAmount: number;
  currentValue: number;
  profit: number;
  profitPercentage: number;
  lastUpdated: string;
}

export const VaultDetails = () => {
  const { data: session } = useSession();
  const { isLoaded } = useTheme();
  const [vaultInfo, setVaultInfo] = useState<VaultInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchVaultInfo();
  }, []);

  const fetchVaultInfo = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/withdraw');
      if (res.ok) {
        const data = await res.json();
        setVaultInfo(data);
      }
    } catch (error) {
      console.error('Error fetching vault info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Prevent rendering until theme is loaded to avoid blinking
  if (!isLoaded) {
    return (
      <div className="w-full max-w-2xl mx-auto px-2 sm:px-0">
        <div className="rounded-xl border bg-gray-200 animate-pulse h-48"></div>
      </div>
    );
  }

  if (isLoading || !vaultInfo) {
    return (
      <div className="w-full max-w-2xl mx-auto px-2 sm:px-0">
        <div className="rounded-xl border bg-[var(--card)] border-[var(--border)] shadow-[var(--shadow-sm)] p-4 sm:p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-[var(--agent-bg)] rounded w-1/3"></div>
            <div className="space-y-3">
              <div className="h-4 bg-[var(--agent-bg)] rounded w-1/2"></div>
              <div className="h-4 bg-[var(--agent-bg)] rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 px-2 sm:px-0 transition-none">
      {/* Vault Overview */}
      <div className="rounded-xl border bg-[var(--card)] border-[var(--border)] shadow-[var(--shadow-sm)] p-4 sm:p-6">
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] shadow-[var(--shadow-md)]">
              <StatsUpSquare className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-[var(--foreground)]">
                Worldcoin Vault
              </h3>
              <p className="text-xs sm:text-sm text-[var(--accent)]">
                AI-Managed Investment
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="text-center p-3 sm:p-4 bg-[var(--agent-bg)] rounded-lg">
            <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--primary)] mx-auto mb-2" />
            <p className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">
              {vaultInfo.depositedAmount}
            </p>
            <p className="text-xs sm:text-sm text-[var(--accent)]">Deposited WLD</p>
          </div>

          <div className="text-center p-3 sm:p-4 bg-[var(--agent-bg)] rounded-lg">
            <GraphUp className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--success)] mx-auto mb-2" />
            <p className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">
              {vaultInfo.currentValue}
            </p>
            <p className="text-xs sm:text-sm text-[var(--accent)]">Current Value</p>
          </div>

          <div className="text-center p-3 sm:p-4 bg-[var(--agent-bg)] rounded-lg">
            <StatsUpSquare className={`w-5 h-5 sm:w-6 sm:h-6 ${vaultInfo.profit >= 0 ? 'text-[var(--success)]' : 'text-[var(--warning)]'} mx-auto mb-2`} />
            <p className={`text-xl sm:text-2xl font-bold ${vaultInfo.profit >= 0 ? 'text-[var(--success)]' : 'text-[var(--warning)]'}`}>
              {vaultInfo.profit.toFixed(2)}
            </p>
            <p className="text-xs sm:text-sm text-[var(--accent)]">Profit/Loss</p>
          </div>

          <div className="text-center p-3 sm:p-4 bg-[var(--agent-bg)] rounded-lg">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--warning)] mx-auto mb-2" />
            <p className={`text-xl sm:text-2xl font-bold ${vaultInfo.profit >= 0 ? 'text-[var(--success)]' : 'text-[var(--warning)]'}`}>
              {vaultInfo.profitPercentage.toFixed(1)}%
            </p>
            <p className="text-xs sm:text-sm text-[var(--accent)]">ROI</p>
          </div>
        </div>

        {/* Vault Description */}
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-[var(--primary-light)] to-[var(--success-light)] rounded-lg">
          <h4 className="font-semibold text-[var(--foreground)] mb-2 text-sm sm:text-base">About This Vault</h4>
          <p className="text-xs sm:text-sm text-[var(--accent)] leading-relaxed">
            This AI-managed vault uses advanced algorithms to optimize your Worldcoin investments.
            Our Worldcoin Advisor agent continuously monitors market conditions and makes strategic
            decisions to maximize your returns while minimizing risk.
          </p>
        </div>
      </div>
    </div>
  );
}; 