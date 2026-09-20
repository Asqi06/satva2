import { requireAdmin } from "@/lib/admin-guard";
import { auditAdmin } from "@/lib/audit";
import { errorResponse, successResponse } from "@/lib/errors";
import { categoryInputSchema } from "@/schemas/category";
import { createCategory, listAdminCategories } from "@/services/category-service";

export async function GET(): Promise<Response> {
  try {
    await requireAdmin();
    const categories = await listAdminCategories();
    return successResponse({ categories });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const admin = await requireAdmin();
    const input = categoryInputSchema.parse(await req.json());
    const category = await createCategory(input);
    await auditAdmin({
      actorId: admin.id,
      actorEmail: admin.email ?? "unknown",
      action: "category.create",
      target: category.id,
    });
    return successResponse(category, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
