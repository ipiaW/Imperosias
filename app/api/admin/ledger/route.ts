import { NextResponse } from 'next/server';
import { getJournalEntries, getLedgerStats } from '@/lib/db/store';

export async function GET() {
  try {
    const entries = getJournalEntries();
    const stats = getLedgerStats();

    return NextResponse.json({
      success: true,
      data: {
        stats,
        entries: entries.slice().reverse()
      }
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch ledger entries' },
      { status: 500 }
    );
  }
}
