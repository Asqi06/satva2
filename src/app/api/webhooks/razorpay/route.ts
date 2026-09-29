import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { handleWebhookEvent } from "@/services/order-service";
import { handleGarbaWebhook } from "@/services/garba-service";

const entitySchema = z.object({
  id: z.string(),
  order_id: z.string().optional(),
  payment_id: z.string().optional(),
});

const webhookSchema = z.object({
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
 * idempotent via processed event ids. Successful and unknown events receive 200;
 * transient processing failures receive 503 so Razorpay retries.
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
  const { event, payload } = envelope.data;
  const eventId = req.headers.get("x-razorpay-event-id") || createHash("sha256").update(raw).digest("hex");
  const entity = payload.payment?.entity ?? payload.refund?.entity;
  if (!entity) {
    return NextResponse.json({ success: true, data: { ack: true, settled: false } });
  }
  try {
    const garba = await handleGarbaWebhook(event, entity);
    if (garba) return NextResponse.json({ success: true, data: garba });
    const result = await handleWebhookEvent(eventId, event, {
      id: entity.id,
      order_id: entity.order_id,
      payment_id: entity.payment_id,
    });
    return NextResponse.json({ success: true, data: result });
  } catch {
    logger.error("webhook processing failed", { eventId, event });
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Webhook processing failed" } }, { status: 503 });
  }
}
