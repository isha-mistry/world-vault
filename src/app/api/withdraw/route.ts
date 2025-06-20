import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { amount } = body;

    if (!amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create a unique reference ID for this withdrawal
    const uuid = crypto.randomUUID().replace(/-/g, "");

    // In a real application, you would:
    // 1. Verify the user has sufficient funds
    // 2. Initiate the withdrawal transaction
    // 3. Update the user's balance in your database

    return NextResponse.json({
      id: uuid,
      status: "pending",
      amount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error processing withdrawal:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // In a real application, you would:
    // 1. Query your database for the user's deposit information
    // 2. Calculate current value based on investment performance

    // Mock data for demo purposes
    const mockData = {
      depositedAmount: 1.5,
      currentValue: 1.65,
      profit: 0.15,
      profitPercentage: 10,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(mockData);
  } catch (error) {
    console.error("Error fetching withdrawal info:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
