import { errorResponse, successResponse } from "@/lib/errors";
import { getCheckoutIdentity } from "@/lib/checkout-identity";
import { cartItemInputSchema } from "@/schemas/cart";
import { addCartItem } from "@/services/cart-service";

export async function POST(req: Request): Promise<Response> {
  try {
    const { id: userId } = await getCheckoutIdentity();
    const input = cartItemInputSchema.parse(await req.json());
    const { view, adjusted } = await addCartItem(userId, input);
    return successResponse({ ...view, adjusted }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
