import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { errorResponse, successResponse } from "@/lib/errors";
import { listAdminOrders } from "@/services/admin-order-service";

const querySchema = z.object({
  orderStatus: z.string().trim().max(32).optional(),
  paymentStatus: z.string().trim().max(32).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  try {
    await requireAdmin();
    const query = querySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
    return successResponse(
      await listAdminOrders({
        orderStatus: query.orderStatus,
        paymentStatus: query.paymentStatus,
        page: query.page,
        limit: query.limit,
      }),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
