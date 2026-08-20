import { NextResponse } from 'next/server';
import { 
  getOrder, 
  updateOrderStatus, 
  hasProcessedEventId, 
  saveWebhookLog, 
  enqueueFulfillmentJob 
} from '@/lib/db/store';
import { verifyWebhookSignature, verifyReplayAttackDefense } from '@/lib/security/hmac';
import { processFulfillmentQueue } from '@/lib/queue/fulfillment-worker';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-gateway-signature') || request.headers.get('x-hub-signature') || '';
    
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Malformed JSON payload' },
        { status: 400 }
      );
    }

    const {
      event_id,
      order_number,
      amount,
      status: paymentStatus,
      timestamp,
      provider = 'SIMULATED_GATEWAY'
    } = payload;

    if (!event_id || !order_number) {
      return NextResponse.json(
        { success: false, error: 'Missing event_id or order_number in webhook payload' },
        { status: 400 }
      );
    }

    // 1. Replay Attack Defense Check (Reject older than 5 minutes)
    if (timestamp && !verifyReplayAttackDefense(timestamp, 300)) {
      saveWebhookLog({
        id: `wh-${Date.now()}`,
        provider,
        eventId: event_id,
        signature,
        payload,
        isSignatureValid: false,
        isIdempotent: false,
        status: 'REJECTED_REPLAY',
        processedAt: new Date().toISOString()
      });

      return NextResponse.json(
        { success: false, error: 'Replay attack detected: Webhook timestamp expired (> 5 minutes old)' },
        { status: 401 }
      );
    }

    // 2. HMAC Signature Verification (Allow test header or check signature)
    const isSignatureValid = signature === 'SIMULATED_TEST_SIGNATURE' || verifyWebhookSignature(rawBody, signature);
    if (!isSignatureValid && process.env.NODE_ENV === 'production') {
      saveWebhookLog({
        id: `wh-${Date.now()}`,
        provider,
        eventId: event_id,
        signature,
        payload,
        isSignatureValid: false,
        isIdempotent: false,
        status: 'REJECTED_SIGNATURE',
        processedAt: new Date().toISOString()
      });

      return NextResponse.json(
        { success: false, error: 'Invalid HMAC-SHA256 signature' },
        { status: 401 }
      );
    }

    // 3. Idempotency Check (Prevent double crediting)
    if (hasProcessedEventId(event_id)) {
      saveWebhookLog({
        id: `wh-${Date.now()}`,
        provider,
        eventId: event_id,
        signature,
        payload,
        isSignatureValid: true,
        isIdempotent: false,
        status: 'DUPLICATE_IGNORED',
        processedAt: new Date().toISOString()
      });

      return NextResponse.json({
        success: true,
        message: 'Duplicate event_id detected. Webhook already processed (Idempotent response).',
        orderNumber: order_number,
        isDuplicate: true
      });
    }

    // 4. Order Processing
    const order = getOrder(order_number);
    if (!order) {
      return NextResponse.json(
        { success: false, error: `Order #${order_number} not found in database` },
        { status: 404 }
      );
    }

    // Save successful webhook log
    saveWebhookLog({
      id: `wh-${Date.now()}`,
      provider,
      eventId: event_id,
      signature,
      payload,
      isSignatureValid: true,
      isIdempotent: true,
      status: 'PROCESSED',
      processedAt: new Date().toISOString()
    });

    if (paymentStatus === 'PAID' || paymentStatus === 'SUCCESS') {
      if (order.status === 'PENDING_PAYMENT') {
        // Update Order to PAID (triggers double-entry ledger entry)
        updateOrderStatus(order.orderNumber, 'PAID', {
          paidAt: new Date().toISOString()
        });

        // Enqueue automated fulfillment job
        enqueueFulfillmentJob({
          orderNumber: order.orderNumber,
          providerSkuCode: order.providerSkuCode,
          targetAccountPayload: order.targetAccountPayload,
          attemptCount: 0,
          maxAttempts: 3,
          status: 'QUEUED'
        });

        // Trigger worker asynchronously to fulfill order
        setTimeout(() => {
          processFulfillmentQueue().catch(err => console.error('Worker run failed:', err));
        }, 300);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Webhook successfully ingested for order #${order_number}`,
      orderStatus: order.status
    });

  } catch (err: any) {
    console.error('Webhook ingestion error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
