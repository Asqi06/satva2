import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { auditAdmin } from "@/lib/audit";
import { errorResponse, successResponse } from "@/lib/errors";
import { getAdminOrder, updateOrderStatus } from "@/services/admin-order-service";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  orderStatus: z.string().trim().min(1).max(32),
  note: z.string().trim().max(500).optional(),
});

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: Ctx): Promise<Response> {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    return successResponse({ order: await getAdminOrder(id) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(req: Request, ctx: Ctx): Promise<Response> {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const { orderStatus, note } = patchSchema.parse(await req.json());
    const order = await updateOrderStatus(id, orderStatus, note);
    await auditAdmin({
      actorId: admin.id,
      actorEmail: admin.email ?? "unknown",
      action: "order.status",
      target: id,
      metadata: { to: orderStatus },
    });
    return successResponse({ order });
  } catch (error) {
    return errorResponse(error);
  }
}
