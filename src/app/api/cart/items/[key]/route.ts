import { errorResponse, successResponse } from "@/lib/errors";
import { requireUserId } from "@/lib/require-user";
import { cartQtySchema } from "@/schemas/cart";
import { removeCartItem, setCartQty } from "@/services/cart-service";

type Ctx = { params: Promise<{ key: string }> };

function decodeKey(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function PATCH(req: Request, ctx: Ctx): Promise<Response> {
  try {
    const userId = await requireUserId();
    const { key } = await ctx.params;
    const { qty } = cartQtySchema.parse(await req.json());
    const { view, adjusted } = await setCartQty(userId, decodeKey(key), qty);
    return successResponse({ ...view, adjusted });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_req: Request, ctx: Ctx): Promise<Response> {
  try {
    const userId = await requireUserId();
    const { key } = await ctx.params;
    return successResponse(await removeCartItem(userId, decodeKey(key)));
  } catch (error) {
    return errorResponse(error);
  }
}
