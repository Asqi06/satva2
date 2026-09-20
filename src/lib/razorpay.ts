import crypto from "node:crypto";
import Razorpay from "razorpay";
import { requireServerVar } from "./env";

/**
 * Razorpay access (server-only). Order creation needs network + keys;
 * signature verification is pure crypto and fully unit-testable.
 * Amounts cross this boundary in paise (integers); the app uses rupees.
 */

let client: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (!client) {
    client = new Razorpay({
      key_id: requireServerVar("RAZORPAY_KEY_ID"),
      key_secret: requireServerVar("RAZORPAY_KEY_SECRET"),
    });
  }
  return client;
}

/** Publishable key id for Checkout.js (safe for the browser). */
export function getRazorpayKeyId(): string {
  return requireServerVar("RAZORPAY_KEY_ID");
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
}

export async function createRazorpayOrder(opts: {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  const order = await getRazorpay().orders.create({
    amount: opts.amountPaise,
    currency: "INR",
    receipt: opts.receipt,
    notes: opts.notes,
  });
  return { id: order.id, amount: Number(order.amount), currency: String(order.currency) };
}

/** HMAC-SHA256("orderId|paymentId", key_secret) — constant-time compare. */
export function verifyPaymentSignature(opts: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): boolean {
  const secret = requireServerVar("RAZORPAY_KEY_SECRET");
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${opts.razorpayOrderId}|${opts.razorpayPaymentId}`)
    .digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(opts.razorpaySignature, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Webhook HMAC-SHA256(rawBody, webhook_secret) — constant-time compare. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = requireServerVar("RAZORPAY_WEBHOOK_SECRET");
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Full refund of a captured payment. Returns the Razorpay refund id. */
export async function refundRazorpayPayment(razorpayPaymentId: string): Promise<string> {
  const refund = await getRazorpay().payments.refund(razorpayPaymentId, {});
  if (typeof refund.id !== "string" || !refund.id) throw new Error("Refund failed");
  return refund.id;
}

/** Test-only: drop the cached client (env rotation between tests). */
export function resetRazorpayClient(): void {
  client = null;
}
