import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { auditAdmin } from "@/lib/audit";
import { errorResponse, successResponse } from "@/lib/errors";
import { refundOrder } from "@/services/admin-order-service";

const bodySchema = z.object({ reason: z.string().trim().max(500).optional() });

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const { reason } = bodySchema.parse(await req.json().catch(() => ({})));
    const order = await refundOrder(id, reason);
    await auditAdmin({
      actorId: admin.id,
      actorEmail: admin.email ?? "unknown",
      action: "order.refund",
      target: id,
      metadata: { total: order.total },
    });
    return successResponse({ order });
  } catch (error) {
    return errorResponse(error);
  }
}
