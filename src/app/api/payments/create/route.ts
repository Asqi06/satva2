import { z } from "zod";
import { errorResponse, successResponse } from "@/lib/errors";
import { limitOrThrow } from "@/lib/rate-limit";
import { getCheckoutIdentity, getCheckoutOrderOwner } from "@/lib/checkout-identity";
import { objectIdSchema } from "@/schemas/category";
import { createPaymentOrder } from "@/services/order-service";

const bodySchema = z.object({ orderId: objectIdSchema });

/** Create (or reuse) the Razorpay order for a PENDING local order. */
export async function POST(req: Request): Promise<Response> {
  try {
    await getCheckoutIdentity();
    const { orderId } = bodySchema.parse(await req.json());
    const userId = await getCheckoutOrderOwner(orderId);
    limitOrThrow(req, "payments", 15, 60_000, userId);
    return successResponse(await createPaymentOrder(userId, orderId), 201);
  } catch (error) {
    return errorResponse(error);
  }
}
