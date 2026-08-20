import { NextResponse } from 'next/server';
import { depositAggregatorBalance, getAggregatorBalance, getJournalEntries } from '@/lib/db/store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, reference = 'BANK_TRANSFER_BCA' } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Deposit amount must be greater than 0' },
        { status: 400 }
      );
    }

    const newBalance = depositAggregatorBalance(amount, reference);

    return NextResponse.json({
      success: true,
      data: {
        aggregatorBalance: newBalance
      },
      message: `Successfully deposited IDR ${amount.toLocaleString()} into Aggregator Working Capital!`
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to deposit aggregator balance' },
      { status: 500 }
    );
  }
}
