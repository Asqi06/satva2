import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { auditAdmin } from "@/lib/audit";
import { errorResponse, successResponse } from "@/lib/errors";
import { setReviewVisibility } from "@/services/review-service";

const bodySchema = z.object({ isPublished: z.boolean() });

/** Moderation: publish/hide. Content edits stay with the owner. */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const { isPublished } = bodySchema.parse(await req.json());
    const review = await setReviewVisibility(id, isPublished);
    await auditAdmin({
      actorId: admin.id,
      actorEmail: admin.email ?? "unknown",
      action: isPublished ? "review.publish" : "review.hide",
      target: id,
    });
    return successResponse(review);
  } catch (error) {
    return errorResponse(error);
  }
}
