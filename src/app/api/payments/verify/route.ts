import { errorResponse, successResponse } from "@/lib/errors";
import { limitOrThrow } from "@/lib/rate-limit";
import { requireUserId } from "@/lib/require-user";
import { verifyPaymentSchema } from "@/schemas/checkout";
import { verifyPayment } from "@/services/order-service";

/** Browser callback after Razorpay Checkout. Signature verified server-side. */
export async function POST(req: Request): Promise<Response> {
  try {
    const userId = await requireUserId();
    limitOrThrow(req, "payments", 15, 60_000, userId);
    const input = verifyPaymentSchema.parse(await req.json());
    return successResponse({ order: await verifyPayment(userId, input) });
  } catch (error) {
    return errorResponse(error);
  }
}
