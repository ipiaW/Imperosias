import { NextResponse } from 'next/server';
import { getOrders, updateOrderStatus, getOrder, enqueueFulfillmentJob } from '@/lib/db/store';
import { processFulfillmentQueue } from '@/lib/queue/fulfillment-worker';
import { OrderStatus } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as OrderStatus | null;
    const search = searchParams.get('search') || undefined;

    const orders = getOrders({ status: status || undefined, search });

    return NextResponse.json({
      success: true,
      data: orders
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, orderNumber, newStatus, notes } = body;

    if (!orderNumber) {
      return NextResponse.json(
        { success: false, error: 'orderNumber is required' },
        { status: 400 }
      );
    }

    const order = getOrder(orderNumber);
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    if (action === 'RETRY_FULFILLMENT') {
      // Re-enqueue fulfillment job
      enqueueFulfillmentJob({
        orderNumber: order.orderNumber,
        providerSkuCode: order.providerSkuCode,
        targetAccountPayload: order.targetAccountPayload,
        attemptCount: 0,
        maxAttempts: 3,
        status: 'QUEUED'
      });

      // Run worker
      const workerResult = await processFulfillmentQueue();
      const updatedOrder = getOrder(orderNumber);

      return NextResponse.json({
        success: true,
        message: `Fulfillment re-triggered for order #${orderNumber}`,
        data: {
          order: updatedOrder,
          workerResult
        }
      });
    }

    if (action === 'OVERRIDE_STATUS') {
      if (!newStatus) {
        return NextResponse.json(
          { success: false, error: 'newStatus is required for status override' },
          { status: 400 }
        );
      }

      const updated = updateOrderStatus(orderNumber, newStatus, {
        manualReviewNotes: notes || `Manually overridden to ${newStatus} by Admin`,
        fulfilledAt: newStatus === 'SUCCESS' ? new Date().toISOString() : undefined
      });

      return NextResponse.json({
        success: true,
        message: `Order #${orderNumber} status updated to ${newStatus}`,
        data: updated
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action specified' },
      { status: 400 }
    );

  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Admin order action failed' },
      { status: 500 }
    );
  }
}
