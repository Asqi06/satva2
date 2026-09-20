import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  verifyPaymentSignature,
  verifyWebhookSignature,
} from "@/lib/razorpay";

process.env.RAZORPAY_KEY_ID = "rzp_test_id";
process.env.RAZORPAY_KEY_SECRET = "test-key-secret";
process.env.RAZORPAY_WEBHOOK_SECRET = "test-webhook-secret";

function paymentSig(orderId: string, paymentId: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
}

describe("payment signatures", () => {
  it("accepts a correctly computed payment signature", () => {
    const sig = paymentSig("order_1", "pay_1", "test-key-secret");
    expect(
      verifyPaymentSignature({ razorpayOrderId: "order_1", razorpayPaymentId: "pay_1", razorpaySignature: sig }),
    ).toBe(true);
  });

  it("rejects tampered or wrong-length signatures", () => {
    const sig = paymentSig("order_1", "pay_1", "test-key-secret");
    expect(
      verifyPaymentSignature({ razorpayOrderId: "order_1", razorpayPaymentId: "pay_2", razorpaySignature: sig }),
    ).toBe(false);
    expect(
      verifyPaymentSignature({ razorpayOrderId: "order_1", razorpayPaymentId: "pay_1", razorpaySignature: "short" }),
    ).toBe(false);
    expect(
      verifyPaymentSignature({
        razorpayOrderId: "order_1",
        razorpayPaymentId: "pay_1",
        razorpaySignature: paymentSig("order_1", "pay_1", "other-secret"),
      }),
    ).toBe(false);
  });

  it("verifies webhook signatures on the raw body", () => {
    const raw = JSON.stringify({ event: "payment.captured", id: "evt_1" });
    const sig = crypto.createHmac("sha256", "test-webhook-secret").update(raw).digest("hex");
    expect(verifyWebhookSignature(raw, sig)).toBe(true);
    expect(verifyWebhookSignature(`${raw} `, sig)).toBe(false);
    expect(verifyWebhookSignature(raw, "nope")).toBe(false);
  });
});
