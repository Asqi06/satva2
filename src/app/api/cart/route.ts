import { errorResponse, successResponse } from "@/lib/errors";
import { getCheckoutIdentity } from "@/lib/checkout-identity";
import { getCartView } from "@/services/cart-service";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    const { id: userId } = await getCheckoutIdentity();
    return successResponse(await getCartView(userId));
  } catch (error) {
    return errorResponse(error);
  }
}
