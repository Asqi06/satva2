import { errorResponse, successResponse } from "@/lib/errors";
import { requireUserId } from "@/lib/require-user";
import { moveToCart } from "@/services/wishlist-service";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ productId: string }> },
): Promise<Response> {
  try {
    const userId = await requireUserId();
    const { productId } = await ctx.params;
    return successResponse(await moveToCart(userId, productId));
  } catch (error) {
    return errorResponse(error);
  }
}
