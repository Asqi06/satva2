import { requireAdmin } from "@/lib/admin-guard";
import { auditAdmin } from "@/lib/audit";
import { errorResponse, successResponse } from "@/lib/errors";
import { duplicateProduct } from "@/services/product-service";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const product = await duplicateProduct(id);
    await auditAdmin({
      actorId: admin.id,
      actorEmail: admin.email ?? "unknown",
      action: "product.duplicate",
      target: product.id,
      metadata: { sourceId: id },
    });
    return successResponse(product, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
