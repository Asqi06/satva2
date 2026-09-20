import { auth } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/errors";
import { limitOrThrow } from "@/lib/rate-limit";
import { requireUserId } from "@/lib/require-user";
import { reviewInputSchema } from "@/schemas/review";
import { createReview, listProductReviews } from "@/services/review-service";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, ctx: Ctx): Promise<Response> {
  try {
    const { slug } = await ctx.params;
    const session = await auth().catch(() => null);
    return successResponse(await listProductReviews(slug, session?.user?.id));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: Request, ctx: Ctx): Promise<Response> {
  try {
    const { slug } = await ctx.params;
    const userId = await requireUserId();
    limitOrThrow(req, "reviews-write", 5, 60_000, userId);
    const input = reviewInputSchema.parse(await req.json());
    return successResponse(await createReview(userId, slug, input), 201);
  } catch (error) {
    return errorResponse(error);
  }
}
