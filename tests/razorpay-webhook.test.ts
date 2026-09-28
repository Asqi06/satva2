import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/webhooks/razorpay/route";
import { handleWebhookEvent } from "@/services/order-service";

vi.mock("@/services/order-service", () => ({ handleWebhookEvent: vi.fn() }));

function request() {
  process.env.RAZORPAY_WEBHOOK_SECRET = "webhook-check-secret";
  const body = JSON.stringify({ entity: "event", event: "payment.captured", payload: { payment: { entity: { id: "pay_1", order_id: "order_1" } } } });
  return new Request("http://localhost/api/webhooks/razorpay", { method: "POST", body, headers: {
    "content-type": "application/json", "x-razorpay-event-id": "evt_header",
    "x-razorpay-signature": crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET).update(body).digest("hex"),
  } }) as NextRequest;
}

describe("real Razorpay webhook envelope", () => {
  it("uses the event header without requiring a body id, and retries processing failures", async () => {
    vi.mocked(handleWebhookEvent).mockResolvedValueOnce({ ack: true, settled: true });
    expect((await POST(request())).status).toBe(200);
    expect(handleWebhookEvent).toHaveBeenCalledWith("evt_header", "payment.captured", { id: "pay_1", order_id: "order_1", payment_id: undefined });
    vi.mocked(handleWebhookEvent).mockRejectedValueOnce(new Error("temporary DB outage"));
    expect((await POST(request())).status).toBe(503);
  });
});
