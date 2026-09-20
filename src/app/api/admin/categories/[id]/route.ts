import { requireAdmin } from "@/lib/admin-guard";
import { auditAdmin } from "@/lib/audit";
import { errorResponse, successResponse } from "@/lib/errors";
import { categoryInputSchema } from "@/schemas/category";
import { deleteCategory, updateCategory } from "@/services/category-service";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx): Promise<Response> {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const input = categoryInputSchema.partial().parse(await req.json());
    const category = await updateCategory(id, input);
    await auditAdmin({
      actorId: admin.id,
      actorEmail: admin.email ?? "unknown",
      action: "category.update",
      target: id,
    });
    return successResponse(category);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_req: Request, ctx: Ctx): Promise<Response> {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    await deleteCategory(id);
    await auditAdmin({
      actorId: admin.id,
      actorEmail: admin.email ?? "unknown",
      action: "category.delete",
      target: id,
    });
    return successResponse({ deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
