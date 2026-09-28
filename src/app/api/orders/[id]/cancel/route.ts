import { errorResponse, successResponse } from "@/lib/errors";
import { getCheckoutOrderOwner } from "@/lib/checkout-identity";
import { cancelOrderSchema } from "@/schemas/checkout";
import { cancelOrder } from "@/services/order-service";

type Ctx = { params: Promise<{ id: string }> };

/** Customer cancel: PENDING orders only (hold + coupon released). */
export async function POST(req: Request, ctx: Ctx): Promise<Response> {
  try {
    const { id } = await ctx.params;
    const userId = await getCheckoutOrderOwner(id);
    const { reason } = cancelOrderSchema.parse(await req.json().catch(() => ({})));
    return successResponse({ order: await cancelOrder(userId, id, reason) });
  } catch (error) {
    return errorResponse(error);
  }
}
