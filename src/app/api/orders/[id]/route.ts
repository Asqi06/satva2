import { errorResponse, successResponse } from "@/lib/errors";
import { getCheckoutOrderOwner } from "@/lib/checkout-identity";
import { getOrderForUser } from "@/services/order-service";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await ctx.params;
    const userId = await getCheckoutOrderOwner(id);
    return successResponse({ order: await getOrderForUser(userId, id) });
  } catch (error) {
    return errorResponse(error);
  }
}
