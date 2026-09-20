import { z } from "zod";
import { errorResponse, successResponse } from "@/lib/errors";
import { limitOrThrow } from "@/lib/rate-limit";
import { requireUserId } from "@/lib/require-user";
import { objectIdSchema } from "@/schemas/category";
import { createPaymentOrder } from "@/services/order-service";

const bodySchema = z.object({ orderId: objectIdSchema });

/** Create (or reuse) the Razorpay order for a PENDING local order. */
export async function POST(req: Request): Promise<Response> {
  try {
    const userId = await requireUserId();
    limitOrThrow(req, "payments", 15, 60_000, userId);
    const { orderId } = bodySchema.parse(await req.json());
    return successResponse(await createPaymentOrder(userId, orderId), 201);
  } catch (error) {
    return errorResponse(error);
  }
}
