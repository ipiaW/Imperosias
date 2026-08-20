import { NextResponse } from 'next/server';
import { getOrders, getLedgerStats, getFulfillmentJobs, getAggregatorBalance, getWebhookLogs } from '@/lib/db/store';

export async function GET() {
  try {
    const orders = getOrders();
    const ledgerStats = getLedgerStats();
    const jobs = getFulfillmentJobs();
    const aggregatorBalance = getAggregatorBalance();
    const webhookLogs = getWebhookLogs();

    const totalOrders = orders.length;
    const successOrders = orders.filter(o => o.status === 'SUCCESS').length;
    const manualReviewOrders = orders.filter(o => o.status === 'MANUAL_REVIEW').length;
    const pendingOrders = orders.filter(o => o.status === 'PENDING_PAYMENT' || o.status === 'PAID' || o.status === 'PROCESSING').length;
    const failedOrders = orders.filter(o => o.status === 'FAILED').length;

    const dlqJobs = jobs.filter(j => j.status === 'DLQ').length;
    const successRate = totalOrders > 0 ? ((successOrders / totalOrders) * 100).toFixed(1) : '100.0';

    return NextResponse.json({
      success: true,
      data: {
        totalOrders,
        successOrders,
        manualReviewOrders,
        pendingOrders,
        failedOrders,
        dlqJobs,
        successRate: Number(successRate),
        aggregatorBalance,
        totalRevenue: ledgerStats.totalRevenue,
        totalCOGS: ledgerStats.totalCOGS,
        grossProfit: ledgerStats.grossProfit,
        isLedgerBalanced: ledgerStats.isBalanced,
        totalDebits: ledgerStats.totalDebits,
        totalCredits: ledgerStats.totalCredits,
        accounts: ledgerStats.accounts,
        recentWebhooksCount: webhookLogs.length
      }
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch admin stats' },
      { status: 500 }
    );
  }
}
