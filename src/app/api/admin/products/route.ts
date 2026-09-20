import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { auditAdmin } from "@/lib/audit";
import { errorResponse, successResponse } from "@/lib/errors";
import { productInputSchema } from "@/schemas/product";
import { createProduct, listAdminProducts } from "@/services/product-service";

const adminListQuery = z.object({
  q: z.string().trim().max(100).optional(),
  published: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export async function GET(req: Request): Promise<Response> {
  try {
    await requireAdmin();
    const params = new URL(req.url).searchParams;
    const query = adminListQuery.parse(Object.fromEntries(params));
    const result = await listAdminProducts({
      q: query.q,
      published: query.published === undefined ? undefined : query.published === "true",
      page: query.page,
      limit: query.limit,
    });
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const admin = await requireAdmin();
    const input = productInputSchema.parse(await req.json());
    const product = await createProduct(input);
    await auditAdmin({
      actorId: admin.id,
      actorEmail: admin.email ?? "unknown",
      action: "product.create",
      target: product.id,
      metadata: { slug: product.slug },
    });
    return successResponse(product, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
