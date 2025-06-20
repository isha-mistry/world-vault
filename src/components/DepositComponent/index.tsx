'use client';
import { useState, useCallback, ChangeEvent, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { MiniKit } from '@worldcoin/minikit-js';
import { useWaitForTransactionReceipt } from '@worldcoin/minikit-react';
import { createPublicClient, http } from 'viem';
import { ArrowRight, Wallet, Refresh } from 'iconoir-react';
import { useTheme } from '@/providers/Theme';
import { 
  CONTRACT_ADDRESSES, 
  ERC20_ABI, 
  VAULT_MANAGER_ABI,
} from '../constants/contracts';
import { formatBigInt, parseUnits, isValidPositiveNumber } from '../../utils/format';

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

export const DepositComponent = () => {
  const { data: session } = useSession();
  const { isLoaded } = useTheme();
  const [depositAmount, setDepositAmount] = useState<string>('0.0');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  
  // Smart contract integration state
  const [balance, setBalance] = useState<bigint>(BigInt(0));
  const [permit2Allowance, setPermit2Allowance] = useState<bigint>(BigInt(0));
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [userDeposits, setUserDeposits] = useState<any[]>([]);
  
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

  // Initialize wallet and fetch data
  useEffect(() => {
    const initializeWallet = async () => {
      if (session?.user?.id) {
        try {
          console.log("session", session);
          console.log("session?.user?.id", session?.user?.id);
          
          // Use session.user.id directly as wallet address
          const walletAddr = session.user.id;
          setWalletAddress(walletAddr);
          
          // Fetch balance and allowance with the wallet address
          await fetchBalanceAndAllowanceWithAddress(walletAddr);
          
          // Also fetch user deposits
          await fetchUserDepositsWithAddress(walletAddr);
        } catch (error) {
          console.error('Error setting wallet address:', error);
          setStatus('error');
          setStatusMessage('Failed to initialize wallet');
        }
      }
    };
    initializeWallet();
  }, [session?.user?.id]);

  // Refresh data when transaction is confirmed
  useEffect(() => {
    if (isConfirmed) {
      fetchBalanceAndAllowance();
      fetchUserDeposits();
      setTransactionId(''); // Reset transaction tracking
      setStatus('success');
      setStatusMessage(`Successfully deposited ${depositAmount} WLD!`);
      setTimeout(() => {
        setStatus('idle');
        setDepositAmount('0.0');
      }, 3000);
    }
  }, [isConfirmed, depositAmount]);

  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers and decimals
    const value = e.target.value.replace(/[^0-9.]/g, '');

    // Prevent multiple decimal points
    const decimalCount = (value.match(/\./g) || []).length;
    if (decimalCount > 1) return;

    // Limit to 6 decimal places
    const parts = value.split('.');
    if (parts[1] && parts[1].length > 6) return;

    setDepositAmount(value);
  };

  // Fetch user's token balance and allowance with specific wallet address
  const fetchBalanceAndAllowanceWithAddress = async (walletAddr: string) => {
    if (!walletAddr) return;
    try {
      // Get token balance
      const balanceResult = await client.readContract({
        address: CONTRACT_ADDRESSES.STAKING_TOKEN as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [walletAddr as `0x${string}`],
      });
      setBalance(balanceResult as bigint);

      // Get current Permit2 allowance
      const permit2AllowanceResult = await client.readContract({
        address: CONTRACT_ADDRESSES.STAKING_TOKEN as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [walletAddr as `0x${string}`, CONTRACT_ADDRESSES.PERMIT2 as `0x${string}`],
      });
      setPermit2Allowance(permit2AllowanceResult as bigint);
    } catch (err) {
      console.error('Error fetching balance/allowance:', err);
      setStatus('error');
      setStatusMessage('Failed to fetch wallet data');
    }
  };

  // Fetch user's token balance and allowance (using state wallet address)
  const fetchBalanceAndAllowance = async () => {
    await fetchBalanceAndAllowanceWithAddress(walletAddress);
  };

  // Fetch user deposits with specific wallet address
  const fetchUserDepositsWithAddress = async (walletAddr: string) => {
    if (!walletAddr) return;
    
    try {
      // Get user's active deposits from contract
      const depositsResult = await client.readContract({
        address: CONTRACT_ADDRESSES.VAULT_MANAGER as `0x${string}`,
        abi: VAULT_MANAGER_ABI,
        functionName: 'getUserActiveDeposits',
        args: [walletAddr as `0x${string}`],
      });
      
      const [depositIds, depositedAmounts, withdrawableAmounts, timestamps] = depositsResult as [bigint[], bigint[], bigint[], bigint[]];
      
      const deposits = depositIds.map((id, index) => ({
        id: Number(id),
        depositedAmount: depositedAmounts[index],
        withdrawableAmount: withdrawableAmounts[index],
        timestamp: timestamps[index],
      }));
      
      setUserDeposits(deposits);
    } catch (err) {
      console.error('Error fetching user deposits:', err);
    }
  };

  // Fetch user deposits (using state wallet address)
  const fetchUserDeposits = async () => {
    await fetchUserDepositsWithAddress(walletAddress);
  };

  // Generate nonce for Permit2
  const generateNonceFromBitmap = async (): Promise<bigint> => {
    const wordPos = 0;
    const bitmap = await client.readContract({
      address: CONTRACT_ADDRESSES.VAULT_MANAGER as `0x${string}`,
      abi: VAULT_MANAGER_ABI,
      functionName: 'getNonceBitmap',
      args: [walletAddress as `0x${string}`, BigInt(wordPos)],
    });
    
    let bitmapBigInt = BigInt(bitmap as unknown as string);
    let bit = 0;
    while (bit < 256) {
      if ((bitmapBigInt & (BigInt(1) << BigInt(bit))) === BigInt(0)) break;
      bit++;
    }
    if (bit === 256) throw new Error('No available nonce found');
    
    const nonce = BigInt(wordPos * 256 + bit);
    return nonce;
  };

  const handleDeposit = useCallback(async () => {
    if (!walletAddress) {
      setStatus('error');
      setStatusMessage('Wallet not connected');
      return;
    }

    if (!isValidPositiveNumber(depositAmount)) {
      setStatus('error');
      setStatusMessage('Please enter a valid deposit amount');
      setTimeout(() => setStatus('idle'), 3000);
      return;
    }

    const amountToDeposit = parseUnits(depositAmount);

    // Check if user has enough balance
    if (amountToDeposit > balance) {
      setStatus('error');
      setStatusMessage(`Insufficient balance. You have ${formatBigInt(balance)} WLD, but trying to deposit ${depositAmount} WLD`);
      setTimeout(() => setStatus('idle'), 3000);
      return;
    }

    setIsProcessing(true);
    setStatus('idle');

    try {
      console.log('Starting Permit2 deposit process...');
      console.log('Amount to deposit:', depositAmount, 'Wei:', amountToDeposit.toString());

      // Get nonce for permit2
      const nonce = await generateNonceFromBitmap();

      // Create permit transfer data with 30-minute deadline
      const deadline = Math.floor((Date.now() + 30 * 60 * 1000) / 1000).toString();

      const permitTransfer = {
        permitted: {
          token: CONTRACT_ADDRESSES.STAKING_TOKEN,
          amount: amountToDeposit.toString(),
        },
        nonce: nonce.toString(),
        deadline,
      };

      console.log('Permit transfer data:', permitTransfer);

      // Send transaction using World Mini App with Permit2
      const { commandPayload, finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: CONTRACT_ADDRESSES.VAULT_MANAGER,
            abi: VAULT_MANAGER_ABI,
            functionName: 'depositWithPermit2',
            args: [
              amountToDeposit.toString(),
              [
                [
                  permitTransfer.permitted.token,
                  permitTransfer.permitted.amount,
                ],
                permitTransfer.nonce,
                permitTransfer.deadline,
              ],
              'PERMIT2_SIGNATURE_PLACEHOLDER_0',
            ],
          },
        ],
        permit2: [
          {
            ...permitTransfer,
            spender: CONTRACT_ADDRESSES.VAULT_MANAGER,
          },
        ],
      });

      if (finalPayload.status === 'error') {
        console.error('Error sending deposit transaction:', finalPayload);
        setStatus('error');
        setStatusMessage('Failed to send deposit transaction');
      } else {
        console.log('Deposit transaction sent:', finalPayload.transaction_id);
        setTransactionId(finalPayload.transaction_id);

        // Store deposit information in database (optional)
        try {
          const response = await fetch('/api/deposits', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              depositAmount: depositAmount,
              walletAddress: walletAddress,
              username: session?.user?.username || session?.user?.id,
              transactionId: finalPayload.transaction_id,
            }),
          });

          const result = await response.json();
          if (response.ok) {
            console.log('Deposit record created successfully:', result);
          } else {
            console.error('Failed to create deposit record:', result.error);
          }
        } catch (dbError) {
          console.error('Error storing deposit record:', dbError);
          // Don't show error to user as the transaction was successful
        }
      }

    } catch (err: any) {
      console.error('Error depositing tokens:', err);
      if (err.message?.includes('user_rejected') || err.message?.includes('cancelled')) {
        setStatus('error');
        setStatusMessage('Transaction was cancelled by user');
      } else {
        setStatus('error');
        setStatusMessage(`Failed to deposit tokens: ${err.message}`);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [depositAmount, walletAddress, balance, session?.user?.id, session?.user?.username]);

  // Handle max amount button
  const handleMaxAmount = () => {
    if (balance > BigInt(0)) {
      setDepositAmount(formatBigInt(balance));
    }
  };

  // Validation
  const isValidAmount = isValidPositiveNumber(depositAmount);
  const hasEnoughBalance = isValidAmount && parseUnits(depositAmount) <= balance;
  const formattedBalance = formatBigInt(balance);
  const showTransactionStatus = transactionId && (isConfirming || isConfirmed);

  // Prevent rendering until theme is loaded to avoid blinking
  if (!isLoaded) {
    return (
      <div className="w-full max-w-md mx-auto px-2 sm:px-0">
        <div className="rounded-xl border bg-gray-200 animate-pulse h-96"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-2 sm:px-0 transition-none">
      {/* Inline Card Component */}
      <div className="rounded-xl border bg-[var(--card)] border-[var(--border)] shadow-[var(--shadow-sm)] p-6 sm:p-8 space-y-6 sm:space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="p-3 sm:p-4 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] shadow-[var(--shadow-md)]">
                <Wallet className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] rounded-full blur opacity-20"></div>
            </div>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">
              Deposit WLD
            </h2>
            <p className="text-[var(--accent)] mt-2 text-sm sm:text-base">
              Deposit Worldcoin tokens to your AI-managed vault
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Balance Display */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-80">Your Balance</p>
                <p className="text-2xl font-bold">{formattedBalance} WLD</p>
              </div>
              <button
                onClick={fetchBalanceAndAllowance}
                disabled={isProcessing || isConfirming}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50"
              >
                <Refresh className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Transaction Status */}
          {showTransactionStatus && (
            <div className="p-4 bg-blue-900/30 border border-blue-700 rounded-xl">
              <div className="flex items-center gap-3">
                {isConfirming && (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-400 border-t-transparent"></div>
                    <div>
                      <p className="font-medium text-blue-400">Transaction Confirming...</p>
                      <p className="text-sm text-blue-300">Please wait while we process your deposit</p>
                    </div>
                  </>
                )}
                {isConfirmed && (
                  <>
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <div>
                      <p className="font-medium text-green-400">Transaction Confirmed!</p>
                      <p className="text-sm text-green-300">Your deposit was successful</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="amount" className="block text-sm font-medium text-[var(--accent)]">
              Amount (WLD)
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                id="amount"
                value={depositAmount}
                onChange={handleAmountChange}
                className="block w-full px-4 py-3 pr-20 bg-[var(--card)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] text-[var(--foreground)] text-lg font-semibold input-focus-fix"
                placeholder="0.5"
                disabled={isProcessing || isConfirming}
                style={{ fontSize: '16px' }}
              />
              <div className="absolute inset-y-0 right-1 flex items-center gap-2">
                <button
                  onClick={handleMaxAmount}
                  disabled={balance === BigInt(0) || isProcessing || isConfirming}
                  className="px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  MAX
                </button>
                <span className="text-[var(--accent)] font-medium text-sm pr-2">WLD</span>
              </div>
            </div>
            {isValidAmount && !hasEnoughBalance && (
              <p className="text-sm text-red-400">Insufficient balance</p>
            )}
          </div>

          {status !== 'idle' && (
            <div className={`p-4 rounded-lg text-center ${status === 'success'
              ? 'bg-[var(--success-light)] text-[var(--success)]'
              : 'bg-[var(--error-light)] text-[var(--error)]'
              }`}>
              {statusMessage}
            </div>
          )}

          <button
            onClick={handleDeposit}
            disabled={!isValidAmount || !hasEnoughBalance || isProcessing || !walletAddress || isConfirming}
            className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 flex items-center justify-center gap-3 ${
              isProcessing || !isValidAmount || !hasEnoughBalance || isConfirming
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] text-white shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transform hover:scale-105'
            }`}
          >
            {isProcessing ? (
              <>
                <div className="inline-block w-4 h-4 border-2 rounded-full border-solid border-gray-200 border-t-white animate-spin" />
                <span>Depositing...</span>
              </>
            ) : isConfirming ? (
              <>
                <div className="inline-block w-4 h-4 border-2 rounded-full border-solid border-gray-200 border-t-white animate-spin" />
                <span>Confirming...</span>
              </>
            ) : (
              <>
                <span>🚀 Deposit with Permit2</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}; 