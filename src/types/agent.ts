export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string; // Icon name from iconoir-react
  specialty: string;
}

export interface TokenBalance {
  symbol: "WLD" | "USDC";
  balance: string;
  decimals: number;
}

export interface FlowState {
  selectedAgent: Agent | null;
  selectedToken: "WLD" | "USDC" | null;
  tokenBalance: TokenBalance | null;
  isEligible: boolean | null;
  isLoading: boolean;
}
