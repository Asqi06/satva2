import { errorResponse, successResponse } from "@/lib/errors";
import { requireUserId } from "@/lib/require-user";
import { getOrderForUser } from "@/services/order-service";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const userId = await requireUserId();
    const { id } = await ctx.params;
    return successResponse({ order: await getOrderForUser(userId, id) });
  } catch (error) {
    return errorResponse(error);
  }
}
