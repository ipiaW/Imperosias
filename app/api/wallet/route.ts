import { NextResponse } from 'next/server';
import { getUserWallet, topupUserWallet } from '@/lib/db/store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'user-demo-01';
    const wallet = getUserWallet(userId);

    return NextResponse.json({
      success: true,
      data: wallet
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch wallet' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId = 'user-demo-01', amount = 100000 } = body;

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    const updatedWallet = topupUserWallet(userId, amount);

    return NextResponse.json({
      success: true,
      data: updatedWallet,
      message: `Successfully topped up IDR ${amount.toLocaleString()} to wallet!`
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to topup wallet' },
      { status: 500 }
    );
  }
}
