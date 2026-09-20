import { requireAdmin } from "@/lib/admin-guard";
import { auditAdmin } from "@/lib/audit";
import { errorResponse, successResponse } from "@/lib/errors";
import { couponAdminInputSchema } from "@/schemas/coupon";
import { createAdminCoupon, listAdminCoupons } from "@/services/coupon-admin-service";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    await requireAdmin();
    return successResponse({ coupons: await listAdminCoupons() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const admin = await requireAdmin();
    const input = couponAdminInputSchema.parse(await req.json());
    const coupon = await createAdminCoupon(input);
    await auditAdmin({
      actorId: admin.id,
      actorEmail: admin.email ?? "unknown",
      action: "coupon.create",
      target: coupon.id,
      metadata: { code: coupon.code },
    });
    return successResponse(coupon, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
