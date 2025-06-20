// Contract addresses for World Chain Mainnet
export const CONTRACT_ADDRESSES = {
  // WLD Token contract on World Chain
  STAKING_TOKEN: "0x2cFc85d8E48F8EAB294be644d9E25C3030863003",
  // VaultManager contract (replace with your deployed address)
  VAULT_MANAGER: "0xeA2c7377FD34366878516bD68CCB469016b529d9", 
  // Universal Permit2 contract
  PERMIT2: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
};

// ERC20 Token ABI (minimal)
export const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" }
    ],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ name: "", type: "bool" }]
  },
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ name: "", type: "bool" }]
  },
  {
    name: "transferFrom",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ name: "", type: "bool" }]
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }]
  },
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }]
  },
  {
    name: "name",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }]
  }
] as const;

// Permit2 ABI (minimal)
export const PERMIT2_ABI = [
  {
    name: "nonceBitmap",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "", type: "address" },
      { name: "", type: "uint256" }
    ],
    outputs: [{ name: "", type: "uint256" }]
  }
] as const;

// VaultManager ABI
export const VAULT_MANAGER_ABI = [
  {
    name: "depositWithPermit2",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "amount", type: "uint256" },
      {
        name: "permitData",
        type: "tuple",
        components: [
          {
            name: "permitted",
            type: "tuple",
            components: [
              { name: "token", type: "address" },
              { name: "amount", type: "uint256" }
            ]
          },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" }
        ]
      },
      { name: "signature", type: "bytes" }
    ],
    outputs: []
  },
  {
    name: "deposit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: []
  },
  {
    name: "withdraw",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "depositId", type: "uint256" }],
    outputs: []
  },
  {
    name: "getDepositDetails",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "user", type: "address" },
      { name: "depositId", type: "uint256" }
    ],
    outputs: [
      { name: "depositedAmount", type: "uint256" },
      { name: "withdrawableAmount", type: "uint256" },
      { name: "depositTimestamp", type: "uint256" },
      { name: "active", type: "bool" }
    ]
  },
  {
    name: "getUserDepositCount",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    name: "getUserActiveDeposits",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      { name: "depositIds", type: "uint256[]" },
      { name: "depositedAmounts", type: "uint256[]" },
      { name: "withdrawableAmounts", type: "uint256[]" },
      { name: "timestamps", type: "uint256[]" }
    ]
  },
  {
    name: "getTotalWithdrawableForUser",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    name: "getTotalDepositedForUser",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    name: "getAllowance",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    name: "getTokenBalance",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    name: "getContractBalance",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    name: "getNonceBitmap",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "user", type: "address" },
      { name: "wordPosition", type: "uint256" }
    ],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    name: "getPermit2Address",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }]
  },
  // Events
  {
    name: "Deposited",
    type: "event",
    anonymous: false,
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "depositId", type: "uint256", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false }
    ]
  },
  {
    name: "WithdrawalAmountUpdated",
    type: "event",
    anonymous: false,
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "depositId", type: "uint256", indexed: true },
      { name: "oldAmount", type: "uint256", indexed: false },
      { name: "newAmount", type: "uint256", indexed: false }
    ]
  },
  {
    name: "Withdrawn",
    type: "event",
    anonymous: false,
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "depositId", type: "uint256", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false }
    ]
  }
] as const;

// Permit2 EIP-712 Domain for World Chain
export const PERMIT2_DOMAIN = {
  name: "Permit2",
  chainId: 480, // World Chain mainnet
  verifyingContract: CONTRACT_ADDRESSES.PERMIT2
};

// Permit2 Types for PermitTransferFrom
export const PERMIT_TRANSFER_FROM_TYPES = {
  PermitTransferFrom: [
    { name: "permitted", type: "TokenPermissions" },
    { name: "spender", type: "address" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" }
  ],
  TokenPermissions: [
    { name: "token", type: "address" },
    { name: "amount", type: "uint256" }
  ]
}; 