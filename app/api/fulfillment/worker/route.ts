import { NextResponse } from 'next/server';
import { processFulfillmentQueue } from '@/lib/queue/fulfillment-worker';
import { getFulfillmentJobs } from '@/lib/db/store';

export async function POST() {
  try {
    const result = await processFulfillmentQueue();
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Worker execution failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const jobs = getFulfillmentJobs();
    return NextResponse.json({
      success: true,
      data: jobs
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}
