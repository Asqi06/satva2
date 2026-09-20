import { errorResponse, successResponse } from "@/lib/errors";
import { requireUserId } from "@/lib/require-user";
import { removeFromWishlist } from "@/services/wishlist-service";

type Ctx = { params: Promise<{ productId: string }> };

export async function DELETE(_req: Request, ctx: Ctx): Promise<Response> {
  try {
    const userId = await requireUserId();
    const { productId } = await ctx.params;
    return successResponse(await removeFromWishlist(userId, productId));
  } catch (error) {
    return errorResponse(error);
  }
}
