import { NextResponse } from 'next/server';
import { getOrder, getFulfillmentJobs } from '@/lib/db/store';

export async function GET(
  request: Request,
  { params }: { params: { orderNumber: string } }
) {
  try {
    const { orderNumber } = params;
    const order = getOrder(orderNumber);

    if (!order) {
      return NextResponse.json(
        { success: false, error: `Order #${orderNumber} not found` },
        { status: 404 }
      );
    }

    const jobs = getFulfillmentJobs().filter(j => j.orderNumber === orderNumber);

    return NextResponse.json({
      success: true,
      data: {
        order,
        fulfillmentJob: jobs[0] || null
      }
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch order' },
      { status: 500 }
    );
  }
}
