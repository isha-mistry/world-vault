'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogDescription,
  AlertDialogFooter,
  Button
} from '@worldcoin/mini-apps-ui-kit-react';
import { MiniKit, Tokens, tokenToDecimals } from '@worldcoin/minikit-js';
import {
  ArrowDown,
  Wallet,
  GraphUp,
  StatsUpSquare,
  CheckCircle,
  WarningTriangle
} from 'iconoir-react';
import { useTheme } from '@/providers/Theme';

interface VaultInfo {
  depositedAmount: number;
  currentValue: number;
  profit: number;
  profitPercentage: number;
  lastUpdated: string;
}

export const WithdrawButton = () => {
  const { data: session } = useSession();
  const { isLoaded } = useTheme();
  const [vaultInfo, setVaultInfo] = useState<VaultInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isWithdrawDialogOpen) {
      fetchVaultInfo();
    }
  }, [isWithdrawDialogOpen]);

  const fetchVaultInfo = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Fetching vault info...');
      const res = await fetch('/api/withdraw', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', res.status);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      console.log('Vault data received:', data);
      setVaultInfo(data);
    } catch (error) {
      console.error('Error fetching vault info:', error);
      setError(error instanceof Error ? error.message : 'Failed to load vault information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!session?.user?.id || !vaultInfo) return;

    setIsWithdrawing(true);

    try {
      const res = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: vaultInfo.currentValue
        })
      });

      if (!res.ok) {
        throw new Error('Failed to initiate withdrawal');
      }

      const { id } = await res.json();

      const result = await MiniKit.commandsAsync.pay({
        reference: id,
        to: session.user.id,
        tokens: [
          {
            symbol: Tokens.WLD,
            token_amount: tokenToDecimals(vaultInfo.currentValue, Tokens.WLD).toString(),
          }
        ],
        description: `Withdraw ${vaultInfo.currentValue} WLD`,
      });

      if (result.finalPayload.status === 'success') {
        setIsWithdrawDialogOpen(false);
        // You can add a success callback here if needed
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Prevent rendering until theme is loaded to avoid blinking
  if (!isLoaded) {
    return (
      <div className="w-full max-w-md mx-auto px-2 sm:px-0">
        <div className="w-full py-4 px-6 bg-gray-200 animate-pulse rounded-xl h-16"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-2 sm:px-0 transition-none">
      <AlertDialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
        <AlertDialogTrigger asChild>
          <Button
            variant="secondary"
            size="lg"
            className="w-full py-4 px-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3 border-0"
          >
            <ArrowDown className="w-5 h-5" />
            <span>Withdraw Funds</span>
          </Button>
        </AlertDialogTrigger>

        <AlertDialogContent className="max-w-md mx-auto bg-white border border-gray-200 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col">
          <AlertDialogHeader>
            <div className="text-center space-y-4 pb-4 flex-shrink-0">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="p-4 rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
                    <ArrowDown className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-br from-red-500 to-red-600 rounded-full blur opacity-20"></div>
                </div>
              </div>

              <AlertDialogTitle className="text-2xl font-bold text-gray-900">
                Withdraw Funds
              </AlertDialogTitle>

              <AlertDialogDescription className="text-gray-600 leading-relaxed">
                You're about to withdraw all your funds from the Worldcoin Vault. This action will close your investment position.
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>

          <div className="flex-1 overflow-y-auto px-1">
            {isLoading ? (
              <div className="py-8 text-center">
                <div className="inline-block w-6 h-6 border-2 rounded-full border-solid border-gray-300 border-t-red-500 animate-spin mb-4"></div>
                <p className="text-gray-600">Loading vault information...</p>
              </div>
            ) : error ? (
              <div className="py-6 text-center space-y-4">
                <div className="flex justify-center">
                  <WarningTriangle className="w-12 h-12 text-red-500" />
                </div>
                <div className="text-red-600 font-medium">
                  {error}
                </div>
                <Button
                  onClick={fetchVaultInfo}
                  variant="secondary"
                  size="sm"
                  className="mx-auto"
                >
                  Try Again
                </Button>
              </div>
            ) : vaultInfo ? (
              <div className="space-y-6 py-4">
                {/* Vault Summary Card */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-200 shadow-sm">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-blue-600" />
                    Withdrawal Summary
                  </h4>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
                      <div className="flex justify-center mb-2">
                        <Wallet className="w-5 h-5 text-blue-600" />
                      </div>
                      <p className="text-xl font-bold text-gray-900">{vaultInfo.depositedAmount}</p>
                      <p className="text-xs text-gray-500">Deposited</p>
                    </div>

                    <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
                      <div className="flex justify-center mb-2">
                        <GraphUp className="w-5 h-5 text-green-600" />
                      </div>
                      <p className="text-xl font-bold text-gray-900">{vaultInfo.currentValue}</p>
                      <p className="text-xs text-gray-500">Current Value</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StatsUpSquare className={`w-5 h-5 ${vaultInfo.profit >= 0 ? 'text-green-600' : 'text-red-500'}`} />
                        <span className="text-gray-600">Total Profit/Loss:</span>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${vaultInfo.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {vaultInfo.profit >= 0 ? '+' : ''}{vaultInfo.profit.toFixed(2)} WLD
                        </p>
                        <p className={`text-sm ${vaultInfo.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          ({vaultInfo.profitPercentage >= 0 ? '+' : ''}{vaultInfo.profitPercentage.toFixed(2)}%)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Withdrawal Amount Highlight */}
                <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-4 border border-blue-200 border-opacity-30">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">You will receive</p>
                    <p className="text-3xl font-bold text-gray-900">{vaultInfo.currentValue} WLD</p>
                    <p className="text-sm text-gray-600">in your wallet</p>
                  </div>
                </div>

                {/* Warning Message */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <WarningTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-1">Important Notice</p>
                      <p>This withdrawal will close your investment position. You won't be able to earn additional returns after completing this action.</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-gray-500">
                No vault information available. Please try again.
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <div className="flex gap-3 pt-4 flex-shrink-0">
              <Button
                variant="tertiary"
                onClick={() => setIsWithdrawDialogOpen(false)}
                disabled={isWithdrawing}
                className="flex-1"
              >
                Cancel
              </Button>

              <Button
                onClick={handleWithdraw}
                disabled={isWithdrawing || !vaultInfo}
                variant="primary"
                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
              >
                {isWithdrawing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 rounded-full border-solid border-white border-t-transparent animate-spin"></div>
                    Processing...
                  </div>
                ) : vaultInfo ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Confirm Withdrawal
                  </div>
                ) : (
                  'Loading...'
                )}
              </Button>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}; 