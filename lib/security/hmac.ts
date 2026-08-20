import crypto from 'crypto';

const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || 'imperosias_live_secret_key_9f82a1c0d4e3b7';

/**
 * Computes HMAC-SHA256 signature of the payload using the gateway secret key
 */
export function generateWebhookSignature(payload: string | object, secret = WEBHOOK_SECRET): string {
  const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * Verifies HMAC-SHA256 signature of an incoming webhook
 */
export function verifyWebhookSignature(
  payload: string | object, 
  incomingSignature: string, 
  secret = WEBHOOK_SECRET
): boolean {
  if (!incomingSignature) return false;
  try {
    const expectedSignature = generateWebhookSignature(payload, secret);
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const incomingBuffer = Buffer.from(incomingSignature, 'hex');
    
    if (expectedBuffer.length !== incomingBuffer.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(expectedBuffer, incomingBuffer);
  } catch (err) {
    console.error('Signature verification error:', err);
    return false;
  }
}

/**
 * Replay attack defense: Rejects webhooks with timestamps older than 5 minutes (300 seconds)
 */
export function verifyReplayAttackDefense(timestamp: number | string, maxAgeSeconds = 300): boolean {
  const ts = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;
  if (isNaN(ts)) return false;
  
  const now = Date.now();
  const diffInSeconds = Math.abs(now - ts) / 1000;
  
  return diffInSeconds <= maxAgeSeconds;
}
