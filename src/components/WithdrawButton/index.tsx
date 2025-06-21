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
  Clock,
  InfoCircleSolid,
  ArrowLeft
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
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

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
      setStatus('success');
      setStatusMessage(`Withdrawal of ${formatCurrency(selectedDeposit.withdrawableAmount)} completed successfully!`);
      fetchUserDeposits(); // Refresh deposits
      setTransactionId('');
      setSelectedDeposit(null);

      // Reset status after 3 seconds
      setTimeout(() => {
        setStatus('idle');
        setStatusMessage('');
      }, 3000);
    }
  }, [isConfirmed, selectedDeposit]);

  const fetchUserDeposits = async () => {
    if (!walletAddress) return;

    setIsLoading(true);
    setError(null);
    setStatus('idle');

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
      setStatus('error');
      setStatusMessage('Failed to load vault information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = useCallback(async (deposit: DepositInfo) => {
    if (!walletAddress || !deposit) return;

    setIsWithdrawing(true);
    setSelectedDeposit(deposit);
    setStatus('idle');

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
        setStatus('error');
        setStatusMessage('Failed to process withdrawal. Please try again.');
        setSelectedDeposit(null);
      } else {
        console.log('Withdrawal transaction sent:', finalPayload.transaction_id);
        setTransactionId(finalPayload.transaction_id);
      }

    } catch (err: any) {
      console.error('Error withdrawing tokens:', err);
      if (err.message?.includes('user_rejected') || err.message?.includes('cancelled')) {
        setError('Transaction was cancelled by user');
        setStatus('error');
        setStatusMessage('Transaction was cancelled by user');
      } else {
        setError(`Failed to withdraw tokens: ${err.message}`);
        setStatus('error');
        setStatusMessage('Failed to process withdrawal. Please try again.');
      }
      setSelectedDeposit(null);
    } finally {
      setIsWithdrawing(false);
    }
  }, [walletAddress, session?.user?.id, session?.user?.username]);

  // Calculate total values for summary
  const totalDeposited = deposits.reduce((sum, deposit) => sum + deposit.depositedAmount, BigInt(0));
  const totalWithdrawable = deposits.reduce((sum, deposit) => sum + deposit.withdrawableAmount, BigInt(0));
  const totalProfit = totalWithdrawable - totalDeposited;
  const totalProfitPercentage = totalDeposited > BigInt(0)
    ? Number(totalProfit * BigInt(10000) / totalDeposited) / 100
    : 0;

  // Prevent rendering until theme is loaded to avoid blinking
  if (!isLoaded) {
    return (
      <div className="w-full max-w-md mx-auto px-2 sm:px-0">
        <div className="w-full py-4 px-6 bg-gray-200 animate-pulse rounded-xl h-16"></div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto px-2 sm:px-0 transition-none">
      <AlertDialog  open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
        <AlertDialogTrigger asChild>
          <button className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] text-white font-semibold shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transform hover:scale-105 transition-all duration-200 w-full">
            <ArrowLeft className="w-5 h-5" />
            Withdraw
          </button>
        </AlertDialogTrigger>

        <AlertDialogContent className="p-6 bg-[var(--card)] border-[var(--border)] rounded-t-4xl border-t-2 border-t-[var(--primary)] w-full mx-auto ">
          <article className="text-[var(--foreground)]">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center justify-center gap-3 text-xl font-bold">
                <Wallet className="w-6 h-6 text-[var(--primary)]" />
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
              ) : error && !deposits.length ? (
                <section className="p-4 bg-[var(--agent-bg)] rounded-lg text-center">
                  <WarningTriangle className="w-8 h-8 text-[var(--warning)] mx-auto mb-2" />
                  <p className="text-[var(--accent)] mb-3">{error}</p>
                  <Button
                    onClick={fetchUserDeposits}
                    variant="secondary"
                    size="sm"
                    className="mx-auto"
                  >
                    Try Again
                  </Button>
                </section>
              ) : deposits.length > 0 ? (
                <>
                  {/* Vault Summary */}
                  <section className="p-4 bg-[var(--agent-bg)] rounded-lg">
                    <h4 className="font-semibold text-[var(--foreground)] mb-3">Vault Summary</h4>
                    <section className="grid grid-cols-2 gap-3 text-sm">
                      <article className="text-center p-3 bg-[var(--card)] rounded-lg">
                        <p className="text-lg font-bold text-[var(--foreground)]">{formatCurrency(totalDeposited)}</p>
                        <p className="text-[var(--accent)]">Total Deposited</p>
                      </article>
                      <article className="text-center p-3 bg-[var(--card)] rounded-lg">
                        <p className="text-lg font-bold text-[var(--foreground)]">{formatCurrency(totalWithdrawable)}</p>
                        <p className="text-[var(--accent)]">Available to Withdraw</p>
                      </article>
                      <article className="text-center p-3 bg-[var(--card)] rounded-lg">
                        <p className={`text-lg font-bold ${totalProfit >= BigInt(0) ? 'text-[var(--success)]' : 'text-[var(--warning)]'}`}>
                          {formatBigInt(totalProfit)}
                        </p>
                        <p className="text-[var(--accent)]">Total Profit/Loss</p>
                      </article>
                      <article className="text-center p-3 bg-[var(--card)] rounded-lg">
                        <p className={`text-lg font-bold ${totalProfit >= BigInt(0) ? 'text-[var(--success)]' : 'text-[var(--warning)]'}`}>
                          {totalProfitPercentage >= 0 ? '+' : ''}{totalProfitPercentage.toFixed(1)}%
                        </p>
                        <p className="text-[var(--accent)]">Total ROI</p>
                      </article>
                    </section>
                  </section>

                  {/* Individual Deposits */}
                  <section className="p-4 bg-[var(--agent-bg)] rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-[var(--primary)]" />
                        Active Deposits ({deposits.length})
                      </h4>
                      <button
                        onClick={fetchUserDeposits}
                        disabled={isLoading}
                        className="p-2 text-[var(--accent)] hover:text-[var(--foreground)] transition-colors"
                      >
                        <Refresh className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {deposits.map((deposit) => (
                        <div key={deposit.id} className="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
                          <div className="flex flex-col items-start justify-between mb-3">
                            <div className="flex-1 w-full pb-2">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-medium text-[var(--foreground)]">Deposit #{deposit.id}</span>
                                <div className="flex items-center gap-1 text-xs text-[var(--accent)]">
                                  <Clock className="w-3 h-3" />
                                  {formatTimestamp(Number(deposit.timestamp))}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                                <div>
                                  <p className="text-[var(--accent)]">Deposited</p>
                                  <p className="font-semibold text-[var(--foreground)]">{formatCurrency(deposit.depositedAmount)}</p>
                                </div>
                                <div>
                                  <p className="text-[var(--accent)]">Withdrawable</p>
                                  <p className="font-semibold text-[var(--foreground)]">{formatCurrency(deposit.withdrawableAmount)}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <StatsUpSquare className={`w-4 h-4 ${deposit.profit >= BigInt(0) ? 'text-[var(--success)]' : 'text-[var(--warning)]'}`} />
                                <span className={`text-sm font-medium ${deposit.profit >= BigInt(0) ? 'text-[var(--success)]' : 'text-[var(--warning)]'}`}>
                                  {deposit.profit >= BigInt(0) ? '+' : ''}{formatBigInt(deposit.profit)} WLD
                                  ({deposit.profitPercentage >= 0 ? '+' : ''}{deposit.profitPercentage.toFixed(2)}%)
                                </span>
                              </div>
                            </div>

                            <Button
                              onClick={() => handleWithdraw(deposit)}
                              disabled={isWithdrawing || deposit.withdrawableAmount === BigInt(0) || transactionId !== ''}
                              variant="primary"
                              size="sm"
                              className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] hover:from-[var(--primary-hover)] hover:to-[var(--primary)] text-white w-full px-4 py-2 text-sm"
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
                  </section>
                </>
              ) : (
                <section className="p-4 bg-[var(--agent-bg)] rounded-lg text-center">
                  <WarningTriangle className="w-8 h-8 text-[var(--warning)] mx-auto mb-2" />
                  <p className="text-[var(--accent)]">No deposit information found</p>
                </section>
              )}

              {/* Transaction Status */}
              {transactionId && (isConfirming || isConfirmed) && (
                <section className="p-4 bg-[var(--agent-bg)] rounded-lg text-center">
                  {isConfirming && (
                    <>
                      <div className="inline-block w-6 h-6 border-2 rounded-full border-solid border-[var(--border)] border-t-[var(--primary)] animate-spin mb-3"></div>
                      <div>
                        <p className="font-medium text-[var(--primary)]">Processing Withdrawal...</p>
                        <p className="text-sm text-[var(--accent)]">Please wait while we process your withdrawal</p>
                      </div>
                    </>
                  )}
                  {isConfirmed && (
                    <>
                      <div className="w-8 h-8 bg-[var(--success)] rounded-full flex items-center justify-center mx-auto mb-3">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-[var(--success)]">Withdrawal Successful!</p>
                        <p className="text-sm text-[var(--accent)]">Your funds have been withdrawn to your wallet</p>
                      </div>
                    </>
                  )}
                </section>
              )}

              {/* Status Messages */}
              {status !== 'idle' && !transactionId && (
                <section className={`p-4 rounded-lg text-center ${status === 'success'
                  ? 'bg-[var(--success-light)] text-[var(--success)]'
                  : 'bg-[var(--error-light)] text-[var(--error)]'
                  }`}>
                  <p>{statusMessage}</p>
                </section>
              )}

              {/* Withdrawal Warning */}
              {deposits.length > 0 && status === 'idle' && !transactionId && (
                <section className="p-4 bg-[var(--warning-light)] border border-[var(--warning)] rounded-lg">
                  <article className="flex items-start gap-3">
                    <WarningTriangle className="w-5 h-5 text-[var(--warning)] mt-0.5 flex-shrink-0" />
                    <aside className="text-sm">
                      <p className="font-semibold text-[var(--warning)] mb-1">Important Notice</p>
                      <p className="text-[var(--accent)]">
                        Withdrawing from a deposit will close that specific position permanently.
                        You can withdraw from individual deposits or all at once.
                      </p>
                    </aside>
                  </article>
                </section>
              )}
            </main>
          </article>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}; 