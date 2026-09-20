import { requireAdmin } from "@/lib/admin-guard";
import { auditAdmin } from "@/lib/audit";
import { AppError, errorResponse, successResponse } from "@/lib/errors";
import { productInputSchema } from "@/schemas/product";
import { deleteProduct, getAdminProductById, updateProduct } from "@/services/product-service";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx): Promise<Response> {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const product = await getAdminProductById(id);
    if (!product) throw new AppError("NOT_FOUND", "Product not found", 404);
    return successResponse(product);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(req: Request, ctx: Ctx): Promise<Response> {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const input = productInputSchema.parse(await req.json());
    const product = await updateProduct(id, input);
    await auditAdmin({
      actorId: admin.id,
      actorEmail: admin.email ?? "unknown",
      action: "product.update",
      target: id,
    });
    return successResponse(product);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_req: Request, ctx: Ctx): Promise<Response> {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    await deleteProduct(id);
    await auditAdmin({
      actorId: admin.id,
      actorEmail: admin.email ?? "unknown",
      action: "product.delete",
      target: id,
    });
    return successResponse({ deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
