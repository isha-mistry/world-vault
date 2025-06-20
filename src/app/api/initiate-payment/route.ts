import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { agent, amount } = body;

    if (!agent || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create a unique reference ID for this transaction
    const uuid = crypto.randomUUID().replace(/-/g, "");

    // In a real application, you would:
    // 1. Store the transaction details in your database
    // 2. Associate it with the user's account
    // 3. Set up any necessary on-chain verification

    return NextResponse.json({
      id: uuid,
      status: "pending",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error initiating payment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
