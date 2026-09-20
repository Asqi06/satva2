import { requireAdmin } from "@/lib/admin-guard";
import { auditAdmin } from "@/lib/audit";
import { errorResponse, successResponse } from "@/lib/errors";
import { bulkActionSchema } from "@/schemas/product";
import { bulkProductAction } from "@/services/product-service";

export async function POST(req: Request): Promise<Response> {
  try {
    const admin = await requireAdmin();
    const action = bulkActionSchema.parse(await req.json());
    const result = await bulkProductAction(action);
    await auditAdmin({
      actorId: admin.id,
      actorEmail: admin.email ?? "unknown",
      action: `product.bulk.${action.action}`,
      metadata: { count: action.ids.length, modified: result.modified },
    });
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
