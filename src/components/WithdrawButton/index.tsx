'use client';
import { useState, useEffect, useCallback } from 'react';
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
import { MiniKit } from '@worldcoin/minikit-js';
import { useWaitForTransactionReceipt } from '@worldcoin/minikit-react';
import { createPublicClient, http } from 'viem';
import {
  ArrowDown,
  Wallet,
  GraphUp,
  StatsUpSquare,
  CheckCircle,
  WarningTriangle,
  Refresh,
  Clock
} from 'iconoir-react';
import { useTheme } from '@/providers/Theme';
import {
  CONTRACT_ADDRESSES,
  VAULT_MANAGER_ABI
} from '../constants/contracts';
import { formatBigInt, formatTimestamp, formatCurrency } from '../../utils/format';

// World Chain Mainnet configuration  
const worldChainMainnet = {
  id: 480,
  name: 'World Chain',
  network: 'worldchain',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['https://worldchain-mainnet.g.alchemy.com/public'] },
    default: { http: ['https://worldchain-mainnet.g.alchemy.com/public'] },
  },
  blockExplorers: {
    default: { name: 'World Chain Explorer', url: 'https://worldscan.org/' },
  },
  testnet: false,
};

interface DepositInfo {
  id: number;
  depositedAmount: bigint;
  withdrawableAmount: bigint;
  timestamp: bigint;
  profit: bigint;
  profitPercentage: number;
}

export const WithdrawButton = () => {
  const { data: session } = useSession();
  const { isLoaded } = useTheme();
  const [deposits, setDeposits] = useState<DepositInfo[]>([]);
  const [selectedDeposit, setSelectedDeposit] = useState<DepositInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');

  // Setup viem client for World Chain
  const client = createPublicClient({
    chain: worldChainMainnet,
    transport: http('https://worldchain-mainnet.g.alchemy.com/public'),
  });

  // Monitor transaction status
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    client: client,
    appConfig: {
      app_id: process.env.NEXT_PUBLIC_APP_ID || '',
    },
    transactionId: transactionId,
  });

  // Initialize wallet address
  useEffect(() => {
    if (session?.user?.id) {
      setWalletAddress(session.user.id);
    }
  }, [session?.user?.id]);

  // Fetch deposits when dialog opens
  useEffect(() => {
    if (isWithdrawDialogOpen && walletAddress) {
      fetchUserDeposits();
    }
  }, [isWithdrawDialogOpen, walletAddress]);

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && selectedDeposit) {
      fetchUserDeposits(); // Refresh deposits
      setTransactionId('');
      setSelectedDeposit(null);
      setIsWithdrawDialogOpen(false);
    }
  }, [isConfirmed, selectedDeposit]);

  const fetchUserDeposits = async () => {
    if (!walletAddress) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching user deposits...');

      // Get user's active deposits from contract
      const depositsResult = await client.readContract({
        address: CONTRACT_ADDRESSES.VAULT_MANAGER as `0x${string}`,
        abi: VAULT_MANAGER_ABI,
        functionName: 'getUserActiveDeposits',
        args: [walletAddress as `0x${string}`],
      });

      const [depositIds, depositedAmounts, withdrawableAmounts, timestamps] = depositsResult as [bigint[], bigint[], bigint[], bigint[]];

      const fetchedDeposits: DepositInfo[] = depositIds.map((id, index) => {
        const depositedAmount = depositedAmounts[index];
        const withdrawableAmount = withdrawableAmounts[index];
        const profit = withdrawableAmount - depositedAmount;
        const profitPercentage = depositedAmount > BigInt(0)
          ? Number(profit * BigInt(10000) / depositedAmount) / 100
          : 0;

        return {
          id: Number(id),
          depositedAmount,
          withdrawableAmount,
          timestamp: timestamps[index],
          profit,
          profitPercentage,
        };
      });

      setDeposits(fetchedDeposits);
      console.log('Fetched deposits:', fetchedDeposits);
    } catch (err) {
      console.error('Error fetching user deposits:', err);
      setError('Failed to load deposit information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = useCallback(async (deposit: DepositInfo) => {
    if (!walletAddress || !deposit) return;

    setIsWithdrawing(true);
    setSelectedDeposit(deposit);

    try {
      console.log('Starting withdrawal process for deposit:', deposit.id);

      // Send transaction using MiniKit
      const { commandPayload, finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: CONTRACT_ADDRESSES.VAULT_MANAGER,
            abi: VAULT_MANAGER_ABI,
            functionName: 'withdraw',
            args: [deposit.id.toString()],
          },
        ],
      });

      if (finalPayload.status === 'error') {
        console.error('Error sending withdrawal transaction:', finalPayload);
        setError('Failed to send withdrawal transaction');
        setSelectedDeposit(null);
      } else {
        console.log('Withdrawal transaction sent:', finalPayload.transaction_id);
        setTransactionId(finalPayload.transaction_id);
      }

    } catch (err: any) {
      console.error('Error withdrawing tokens:', err);
      if (err.message?.includes('user_rejected') || err.message?.includes('cancelled')) {
        setError('Transaction was cancelled by user');
      } else {
        setError(`Failed to withdraw tokens: ${err.message}`);
      }
      setSelectedDeposit(null);
    } finally {
      setIsWithdrawing(false);
    }
  }, [walletAddress, session?.user?.id, session?.user?.username]);

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
                <p className="text-gray-600">Loading your deposits...</p>
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
                  onClick={fetchUserDeposits}
                  variant="secondary"
                  size="sm"
                  className="mx-auto"
                >
                  Try Again
                </Button>
              </div>
            ) : transactionId && (isConfirming || isConfirmed) ? (
              <div className="py-8 text-center space-y-4">
                {isConfirming && (
                  <>
                    <div className="inline-block w-8 h-8 border-2 rounded-full border-solid border-gray-300 border-t-red-500 animate-spin mb-4"></div>
                    <div>
                      <p className="font-medium text-red-500">Processing Withdrawal...</p>
                      <p className="text-sm text-gray-600">Please wait while we process your withdrawal</p>
                    </div>
                  </>
                )}
                {isConfirmed && (
                  <>
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-green-500">Withdrawal Successful!</p>
                      <p className="text-sm text-gray-600">Your funds have been withdrawn to your wallet</p>
                    </div>
                  </>
                )}
              </div>
            ) : deposits.length > 0 ? (
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-blue-600" />
                    Your Active Deposits ({deposits.length})
                  </h4>
                  <button
                    onClick={fetchUserDeposits}
                    disabled={isLoading}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Refresh className="w-4 h-4" />
                  </button>
                </div>

                {/* Deposits List */}
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {deposits.map((deposit) => (
                    <div key={deposit.id} className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-200 shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-gray-900">Deposit #{deposit.id}</span>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              {formatTimestamp(Number(deposit.timestamp))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-gray-500">Deposited</p>
                              <p className="font-semibold text-gray-900">{formatCurrency(deposit.depositedAmount)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Withdrawable</p>
                              <p className="font-semibold text-gray-900">{formatCurrency(deposit.withdrawableAmount)}</p>
                            </div>
                          </div>

                          {/* Profit/Loss Display */}
                          <div className="mt-2 flex items-center gap-2">
                            <StatsUpSquare className={`w-4 h-4 ${deposit.profit >= BigInt(0) ? 'text-green-600' : 'text-red-500'}`} />
                            <span className={`text-sm font-medium ${deposit.profit >= BigInt(0) ? 'text-green-600' : 'text-red-500'}`}>
                              {deposit.profit >= BigInt(0) ? '+' : ''}{formatBigInt(deposit.profit)} WLD
                              ({deposit.profitPercentage >= 0 ? '+' : ''}{deposit.profitPercentage.toFixed(2)}%)
                            </span>
                          </div>
                        </div>

                        <Button
                          onClick={() => handleWithdraw(deposit)}
                          disabled={isWithdrawing || deposit.withdrawableAmount === BigInt(0)}
                          variant="primary"
                          size="sm"
                          className="ml-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 text-sm"
                        >
                          {isWithdrawing && selectedDeposit?.id === deposit.id ? (
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                              Withdrawing...
                            </div>
                          ) : (
                            <>
                              <ArrowDown className="w-4 h-4 mr-1" />
                              Withdraw
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary Card */}
                {deposits.length > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-4 border border-blue-200 border-opacity-30 mt-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Total Available to Withdraw</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(deposits.reduce((sum, deposit) => sum + deposit.withdrawableAmount, BigInt(0)))}
                      </p>
                      <p className="text-sm text-gray-600">across {deposits.length} active deposit{deposits.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                )}

                {/* Warning Message */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <WarningTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-1">Important Notice</p>
                      <p>Withdrawing from a deposit will close that specific position permanently. You can withdraw from individual deposits or all at once.</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500 space-y-4">
                <div className="flex justify-center">
                  <Wallet className="w-12 h-12 text-gray-300" />
                </div>
                <div>
                  <p className="font-medium text-gray-600">No Active Deposits</p>
                  <p className="text-sm text-gray-500">You don't have any active deposits to withdraw from.</p>
                </div>
              </div>
            )}
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}; 