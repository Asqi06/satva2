import { errorResponse, successResponse } from "@/lib/errors";
import { requireUserId } from "@/lib/require-user";
import { cartItemInputSchema } from "@/schemas/cart";
import { addCartItem } from "@/services/cart-service";

export async function POST(req: Request): Promise<Response> {
  try {
    const userId = await requireUserId();
    const input = cartItemInputSchema.parse(await req.json());
    const { view, adjusted } = await addCartItem(userId, input);
    return successResponse({ ...view, adjusted }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
