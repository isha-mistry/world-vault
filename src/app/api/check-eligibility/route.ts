import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, token } = await req.json();

    if (!walletAddress || !token) {
      return NextResponse.json(
        { error: "Wallet address and token are required" },
        { status: 400 }
      );
    }

    // Simulate balance checking (replace with actual wallet balance API call)
    // In a real implementation, you would use Web3 libraries or blockchain APIs
    const mockBalances = {
      WLD: Math.random() * 100, // Random balance between 0-100
      USDC: Math.random() * 1000, // Random balance between 0-1000
    };

    const balance = mockBalances[token as keyof typeof mockBalances];
    const minRequiredBalance = token === "WLD" ? 1 : 10; // Minimum 1 WLD or 10 USDC
    const isEligible = balance >= minRequiredBalance;

    return NextResponse.json({
      balance: balance.toFixed(4),
      isEligible,
      minRequired: minRequiredBalance,
      token,
    });
  } catch (error) {
    console.error("Error checking eligibility:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
