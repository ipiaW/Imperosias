import { NextResponse } from 'next/server';
import { getOrder, updateOrderStatus, enqueueFulfillmentJob } from '@/lib/db/store';
import { processFulfillmentQueue } from '@/lib/queue/fulfillment-worker';

export async function POST(
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

    if (order.status !== 'PENDING_PAYMENT') {
      return NextResponse.json({
        success: true,
        message: `Order is already in ${order.status} state`,
        order
      });
    }

    // Mark as PAID
    const updated = updateOrderStatus(orderNumber, 'PAID', {
      paidAt: new Date().toISOString()
    });

    // Enqueue fulfillment
    enqueueFulfillmentJob({
      orderNumber,
      providerSkuCode: order.providerSkuCode,
      targetAccountPayload: order.targetAccountPayload,
      attemptCount: 0,
      maxAttempts: 3,
      status: 'QUEUED'
    });

    // Run fulfillment worker immediately
    const workerResult = await processFulfillmentQueue();

    const finalOrder = getOrder(orderNumber);

    return NextResponse.json({
      success: true,
      message: 'Payment simulated and processed successfully',
      data: {
        order: finalOrder,
        workerResult
      }
    });

  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Payment simulation failed' },
      { status: 500 }
    );
  }
}
