import { requireAdmin } from "@/lib/admin-guard";
import { auditAdmin } from "@/lib/audit";
import { errorResponse, successResponse } from "@/lib/errors";
import { bannerInputSchema } from "@/schemas/content";
import { deleteBanner, updateBanner } from "@/services/banner-service";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx): Promise<Response> {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const input = bannerInputSchema.partial().parse(await req.json());
    const banner = await updateBanner(id, input);
    await auditAdmin({
      actorId: admin.id,
      actorEmail: admin.email ?? "unknown",
      action: "banner.update",
      target: id,
    });
    return successResponse(banner);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_req: Request, ctx: Ctx): Promise<Response> {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    await deleteBanner(id);
    await auditAdmin({
      actorId: admin.id,
      actorEmail: admin.email ?? "unknown",
      action: "banner.delete",
      target: id,
    });
    return successResponse({ deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
