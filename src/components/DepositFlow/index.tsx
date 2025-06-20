// 'use client';
// import { useState, useCallback, ChangeEvent } from 'react';
// import { useSession } from 'next-auth/react';
// import { MiniKit, Tokens, tokenToDecimals } from '@worldcoin/minikit-js';
// import { ArrowRight, CheckCircle, Wallet } from 'iconoir-react';
// import { Agent } from '@/types/agent';
// import { AGENTS } from '@/data/agents';

// export const DepositFlow = () => {
//   const { data: session } = useSession();

//   // Simplified state - only agent selection and deposit amount
//   const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
//   const [depositAmount, setDepositAmount] = useState<string>('0.5');
//   const [isLoading, setIsLoading] = useState(false);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
//   const [statusMessage, setStatusMessage] = useState('');

//   // Skip agent selection if there's only one agent
//   const [step, setStep] = useState<'agent' | 'deposit'>(AGENTS.length === 1 ? 'deposit' : 'agent');

//   // Set the default agent if there's only one
//   useState(() => {
//     if (AGENTS.length === 1) {
//       setSelectedAgent(AGENTS[0]);
//     }
//   });

//   const handleAgentSelect = useCallback((agent: Agent) => {
//     setSelectedAgent(agent);
//     setStep('deposit');
//   }, []);

//   const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
//     // Allow only numbers and decimals
//     const value = e.target.value.replace(/[^0-9.]/g, '');

//     // Prevent multiple decimal points
//     const decimalCount = (value.match(/\./g) || []).length;
//     if (decimalCount > 1) return;

//     // Limit to 6 decimal places
//     const parts = value.split('.');
//     if (parts[1] && parts[1].length > 6) return;

//     setDepositAmount(value);
//   };

//   const handleDeposit = useCallback(async () => {
//     if (!session?.user?.id || !selectedAgent) return;

//     const amount = parseFloat(depositAmount);
//     if (isNaN(amount) || amount <= 0) {
//       setStatus('error');
//       setStatusMessage('Please enter a valid deposit amount');
//       setTimeout(() => setStatus('idle'), 3000);
//       return;
//     }

//     setIsProcessing(true);
//     setStatus('idle');

//     try {
//       // Get payment reference from API
//       const res = await fetch('/api/initiate-payment', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           agent: selectedAgent.id,
//           token: 'WLD',
//           amount: depositAmount
//         })
//       });

//       if (!res.ok) {
//         throw new Error('Failed to initiate payment');
//       }

//       const { id } = await res.json();

//       // Use MiniKit payment functionality
//       const result = await MiniKit.commandsAsync.pay({
//         reference: id,
//         to: '0x742d35Cc6634C0532925a3b8D221A19F1F7B6dDC', // Demo address
//         tokens: [
//           {
//             symbol: Tokens.WLD,
//             token_amount: tokenToDecimals(parseFloat(depositAmount), Tokens.WLD).toString(),
//           }
//         ],
//         description: `Deposit ${depositAmount} WLD to ${selectedAgent.name}`,
//       });

//       if (result.finalPayload.status === 'success') {
//         setStatus('success');
//         setStatusMessage(`Successfully deposited ${depositAmount} WLD!`);
//       } else {
//         setStatus('error');
//         setStatusMessage('Deposit failed. Please try again.');
//       }
//     } catch (error) {
//       console.error('Deposit error:', error);
//       setStatus('error');
//       setStatusMessage('Failed to process deposit. Please try again.');
//     } finally {
//       setIsProcessing(false);
//       setTimeout(() => {
//         if (status === 'success') {
//           // Reset form after successful deposit
//           setDepositAmount('0.5');
//         }
//       }, 3000);
//     }
//   }, [depositAmount, selectedAgent, session?.user?.id, status]);

//   // Show agent selection if there are multiple agents
//   if (step === 'agent') {
//     return (
//       <div className="w-full space-y-6">
//         <AgentSelection
//           selectedAgent={selectedAgent}
//           onAgentSelect={handleAgentSelect}
//         />
//       </div>
//     );
//   }

//   // Show deposit form
//   return (
//     <div className="w-full max-w-md mx-auto">
//       <Card className="p-8 space-y-8">
//         <div className="text-center space-y-4">
//           <div className="flex justify-center">
//             <div className="relative">
//               <div className="p-4 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] shadow-[var(--shadow-md)]">
//                 <Wallet className="w-10 h-10 text-white" />
//               </div>
//               <div className="absolute -inset-1 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] rounded-full blur opacity-20"></div>
//             </div>
//           </div>
//           <div>
//             <h2 className="text-2xl font-bold text-[var(--foreground)]">
//               Deposit WLD
//             </h2>
//             <p className="text-[var(--accent)] mt-2">
//               Deposit Worldcoin tokens to your {selectedAgent?.name}
//             </p>
//           </div>
//         </div>

//         <div className="space-y-6">
//           <div className="space-y-2">
//             <label htmlFor="amount" className="block text-sm font-medium text-[var(--accent)]">
//               Amount (WLD)
//             </label>
//             <div className="relative">
//               <input
//                 type="text"
//                 id="amount"
//                 value={depositAmount}
//                 onChange={handleAmountChange}
//                 className="block w-full px-4 py-3 bg-[var(--card)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] text-[var(--foreground)] text-lg font-semibold"
//                 placeholder="0.5"
//                 disabled={isProcessing}
//               />
//               <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
//                 <span className="text-[var(--accent)] font-medium">WLD</span>
//               </div>
//             </div>
//           </div>

//           {status !== 'idle' && (
//             <div className={`p-4 rounded-lg text-center ${status === 'success'
//               ? 'bg-[var(--success-light)] text-[var(--success)]'
//               : 'bg-[var(--error-light)] text-[var(--error)]'
//               }`}>
//               {statusMessage}
//             </div>
//           )}

//           <button
//             onClick={handleDeposit}
//             disabled={isProcessing}
//             className="w-full py-4 px-6 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] text-white font-bold text-lg rounded-xl shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
//           >
//             {isProcessing ? (
//               <>
//                 <LoadingSpinner size="sm" />
//                 <span>Processing...</span>
//               </>
//             ) : (
//               <>
//                 <span>Deposit WLD</span>
//                 <ArrowRight className="w-5 h-5" />
//               </>
//             )}
//           </button>
//         </div>
//       </Card>
//     </div>
//   );
// }; 