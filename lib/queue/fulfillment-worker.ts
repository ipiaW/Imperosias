import { getFulfillmentJobs, updateFulfillmentJob, updateOrderStatus, getOrder, getAggregatorBalance } from '../db/store';
import { FulfillmentJob, Order } from '../types';

/**
 * Simulates calling external Product Fulfillment Provider APIs
 * (UniPin, Codashop, SmileOne, Moonton Direct, HoYoverse, Riot Partner API)
 */
async function callAggregatorFulfillmentApi(
  order: Order,
  job: FulfillmentJob
): Promise<{ success: boolean; transactionHash?: string; errorCode?: string; errorMessage?: string }> {
  // Simulate network latency for external top-up execution (500ms)
  await new Promise(resolve => setTimeout(resolve, 500));

  // Check if aggregator working capital is sufficient
  const currentBalance = getAggregatorBalance();
  if (currentBalance < order.baseCost) {
    return {
      success: false,
      errorCode: 'INSUFFICIENT_AGGREGATOR_BALANCE',
      errorMessage: `Aggregator working capital exhausted: required IDR ${order.baseCost}, available IDR ${currentBalance}`
    };
  }

  // Simulated intentional failure test hook for debugging
  if (order.targetAccountPayload?.userId === '99999999' || order.targetAccountPayload?.uid === '999999999') {
    return {
      success: false,
      errorCode: 'INVALID_USER_ID',
      errorMessage: 'Aggregator rejected target ID: In-game account does not exist or is banned.'
    };
  }

  // Normal success fulfillment
  const txHash = 'TX-AGG-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
  return {
    success: true,
    transactionHash: txHash
  };
}

/**
 * Worker execution policy:
 * - Exponential backoff on transient errors
 * - Instant fail and route to MANUAL_REVIEW on critical errors
 * - Dead Letter Queue (DLQ) capture
 */
export async function processFulfillmentQueue(): Promise<{ processed: number; success: number; failed: number }> {
  const jobs = getFulfillmentJobs();
  const now = new Date();
  
  const pendingJobs = jobs.filter(j => 
    j.status === 'QUEUED' || 
    (j.status === 'RETRY_PENDING' && (!j.nextRetryAt || new Date(j.nextRetryAt) <= now))
  );

  let successCount = 0;
  let failCount = 0;

  for (const job of pendingJobs) {
    const order = getOrder(job.orderNumber);
    if (!order) {
      updateFulfillmentJob(job.id, { status: 'DLQ', lastError: 'Order not found in DB' });
      continue;
    }

    updateFulfillmentJob(job.id, { status: 'PROCESSING', attemptCount: job.attemptCount + 1 });
    updateOrderStatus(order.orderNumber, 'PROCESSING');

    try {
      const result = await callAggregatorFulfillmentApi(order, job);

      if (result.success) {
        updateFulfillmentJob(job.id, { status: 'COMPLETED' });
        updateOrderStatus(order.orderNumber, 'SUCCESS', {
          fulfilledAt: new Date().toISOString()
        });
        successCount++;
      } else {
        const isCriticalError = result.errorCode === 'INVALID_USER_ID' || result.errorCode === 'INSUFFICIENT_AGGREGATOR_BALANCE';
        
        if (isCriticalError || job.attemptCount + 1 >= job.maxAttempts) {
          // Route to MANUAL_REVIEW and move to DLQ
          updateFulfillmentJob(job.id, { 
            status: 'DLQ', 
            lastError: result.errorMessage || result.errorCode 
          });
          updateOrderStatus(order.orderNumber, 'MANUAL_REVIEW', {
            failureReason: result.errorMessage || result.errorCode,
            manualReviewNotes: `Routed to Manual Review: ${result.errorCode} - ${result.errorMessage}. Requires admin intervention.`
          });
          failCount++;
        } else {
          // Retry with exponential backoff: (2 ^ attemptCount) * 5 seconds
          const delaySeconds = Math.pow(2, job.attemptCount) * 5;
          const nextRetry = new Date(Date.now() + delaySeconds * 1000).toISOString();
          
          updateFulfillmentJob(job.id, {
            status: 'RETRY_PENDING',
            lastError: result.errorMessage || 'Transient supplier gateway timeout',
            nextRetryAt: nextRetry
          });
        }
      }
    } catch (err: any) {
      console.error(`Fulfillment worker exception for job ${job.id}:`, err);
      updateFulfillmentJob(job.id, {
        status: 'DLQ',
        lastError: err?.message || 'Unknown worker runtime error'
      });
      updateOrderStatus(order.orderNumber, 'MANUAL_REVIEW', {
        failureReason: err?.message || 'Unknown worker runtime error'
      });
      failCount++;
    }
  }

  return {
    processed: pendingJobs.length,
    success: successCount,
    failed: failCount
  };
}
