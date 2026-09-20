import { errorResponse, successResponse } from "@/lib/errors";
import { requireUserId } from "@/lib/require-user";
import { getCartView } from "@/services/cart-service";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    const userId = await requireUserId();
    return successResponse(await getCartView(userId));
  } catch (error) {
    return errorResponse(error);
  }
}
