import { requireAdmin } from "@/lib/admin-guard";
import { auditAdmin } from "@/lib/audit";
import { errorResponse, successResponse } from "@/lib/errors";
import { couponAdminPartialSchema } from "@/schemas/coupon";
import { deleteAdminCoupon, updateAdminCoupon } from "@/services/coupon-admin-service";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx): Promise<Response> {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const input = couponAdminPartialSchema.parse(await req.json());
    const coupon = await updateAdminCoupon(id, input);
    await auditAdmin({
      actorId: admin.id,
      actorEmail: admin.email ?? "unknown",
      action: "coupon.update",
      target: id,
    });
    return successResponse(coupon);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_req: Request, ctx: Ctx): Promise<Response> {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    await deleteAdminCoupon(id);
    await auditAdmin({
      actorId: admin.id,
      actorEmail: admin.email ?? "unknown",
      action: "coupon.delete",
      target: id,
    });
    return successResponse({ deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
