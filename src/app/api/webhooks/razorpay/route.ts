import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { handleWebhookEvent } from "@/services/order-service";

const entitySchema = z.object({
  id: z.string(),
  order_id: z.string().optional(),
  payment_id: z.string().optional(),
});

const webhookSchema = z.object({
  id: z.string(),
  event: z.string(),
  payload: z
    .object({
      payment: z.object({ entity: entitySchema }).optional(),
      refund: z.object({ entity: entitySchema }).optional(),
    })
    .passthrough(),
});

/**
 * Razorpay webhook. Signature verified on the RAW body; processing is
 * idempotent via processed event ids. Always 200-acks validly signed
 * events (even unknown ones) so Razorpay stops retrying.
 */
export async function POST(req: NextRequest): Promise<Response> {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  let secretOk = false;
  try {
    secretOk = verifyWebhookSignature(raw, signature);
  } catch {
    secretOk = false;
  }
  if (!secretOk) {
    return NextResponse.json(
      { success: false, error: { code: "PAYMENT_ERROR", message: "Invalid signature" } },
      { status: 400 },
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid JSON" } },
      { status: 400 },
    );
  }
  const envelope = webhookSchema.safeParse(parsed);
  if (!envelope.success) {
    return NextResponse.json({ success: true, data: { ack: true, settled: false } });
  }
  const { id: eventId, event, payload } = envelope.data;
  const entity = payload.payment?.entity ?? payload.refund?.entity;
  if (!entity) {
    return NextResponse.json({ success: true, data: { ack: true, settled: false } });
  }
  try {
    const result = await handleWebhookEvent(eventId, event, {
      id: entity.id,
      order_id: entity.order_id,
      payment_id: entity.payment_id,
    });
    return NextResponse.json({ success: true, data: result });
  } catch {
    // Service errors must not trigger Razorpay retries for poison events;
    // the failure is logged server-side with the event id.
    return NextResponse.json({ success: true, data: { ack: true, settled: false } });
  }
}
