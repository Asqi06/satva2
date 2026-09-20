import { errorResponse, successResponse } from "@/lib/errors";
import { requireUserId } from "@/lib/require-user";
import { cancelOrderSchema } from "@/schemas/checkout";
import { cancelOrder } from "@/services/order-service";

type Ctx = { params: Promise<{ id: string }> };

/** Customer cancel: PENDING orders only (hold + coupon released). */
export async function POST(req: Request, ctx: Ctx): Promise<Response> {
  try {
    const userId = await requireUserId();
    const { id } = await ctx.params;
    const { reason } = cancelOrderSchema.parse(await req.json().catch(() => ({})));
    return successResponse({ order: await cancelOrder(userId, id, reason) });
  } catch (error) {
    return errorResponse(error);
  }
}
