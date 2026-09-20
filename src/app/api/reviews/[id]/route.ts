import { auth } from "@/lib/auth";
import { AppError, errorResponse, successResponse } from "@/lib/errors";
import { reviewInputSchema } from "@/schemas/review";
import { deleteReview, updateReview } from "@/services/review-service";

type Ctx = { params: Promise<{ id: string }> };

async function identity(): Promise<{ userId: string; isAdmin: boolean }> {
  const session = await auth();
  if (!session?.user?.id) throw new AppError("UNAUTHORIZED", "Login required", 401);
  return { userId: session.user.id, isAdmin: session.user.role === "ADMIN" };
}

/** Owner edits content; admins use /api/admin/reviews for moderation. */
export async function PATCH(req: Request, ctx: Ctx): Promise<Response> {
  try {
    const { id } = await ctx.params;
    const { userId, isAdmin } = await identity();
    const input = reviewInputSchema.parse(await req.json());
    return successResponse(await updateReview(userId, id, input, isAdmin));
  } catch (error) {
    return errorResponse(error);
  }
}

/** Owner or admin deletes. */
export async function DELETE(_req: Request, ctx: Ctx): Promise<Response> {
  try {
    const { id } = await ctx.params;
    const { userId, isAdmin } = await identity();
    await deleteReview(userId, id, isAdmin);
    return successResponse({ deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
