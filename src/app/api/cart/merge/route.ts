import { errorResponse, successResponse } from "@/lib/errors";
import { requireUserId } from "@/lib/require-user";
import { cartMergeSchema } from "@/schemas/cart";
import { mergeCarts } from "@/services/cart-service";

/** Merge a guest (localStorage) cart into the account cart on login. */
export async function POST(req: Request): Promise<Response> {
  try {
    const userId = await requireUserId();
    const input = cartMergeSchema.parse(await req.json());
    const { cart, summary } = await mergeCarts(userId, input);
    return successResponse({ ...summary, cart });
  } catch (error) {
    return errorResponse(error);
  }
}
