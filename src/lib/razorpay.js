import crypto from 'node:crypto';
import Razorpay from 'razorpay';

let razorpayInstance = null;

export function getRazorpayClient() {
  if (!razorpayInstance) {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      throw new Error('Razorpay credentials missing in environment variables.');
    }

    razorpayInstance = new Razorpay({
      key_id,
      key_secret,
    });
  }
  return razorpayInstance;
}

/**
 * Create a new Razorpay Order for Checkout.js
 * @param {Object} opts
 * @param {number} opts.amountInRupees
 * @param {string} opts.receipt
 * @param {Object} [opts.notes]
 */
export async function createRazorpayOrder({ amountInRupees, receipt, notes = {} }) {
  const client = getRazorpayClient();
  const amountInPaise = Math.round(amountInRupees * 100);

  const order = await client.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: receipt || `rcpt_${Date.now()}`,
    notes,
  });

  return {
    id: order.id,
    amount: order.amount,
    currency: order.currency,
  };
}

/**
 * Verify HMAC-SHA256 signature returned by Razorpay Checkout.js
 */
export function verifyRazorpaySignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
  const receivedBuffer = Buffer.from(razorpay_signature, 'utf8');

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}
