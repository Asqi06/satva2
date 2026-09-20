import { errorResponse, successResponse } from "@/lib/errors";
import { requireUserId } from "@/lib/require-user";
import { wishlistInputSchema } from "@/schemas/cart";
import { addToWishlist, getWishlistView } from "@/services/wishlist-service";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    const userId = await requireUserId();
    return successResponse(await getWishlistView(userId));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const userId = await requireUserId();
    const { productId } = wishlistInputSchema.parse(await req.json());
    return successResponse(await addToWishlist(userId, productId), 201);
  } catch (error) {
    return errorResponse(error);
  }
}
