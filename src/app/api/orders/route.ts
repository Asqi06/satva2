import { z } from "zod";
import { errorResponse, successResponse } from "@/lib/errors";
import { limitOrThrow } from "@/lib/rate-limit";
import { requireUserId } from "@/lib/require-user";
import { createOrderSchema } from "@/schemas/checkout";
import { createOrder, listUserOrders } from "@/services/order-service";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  try {
    const userId = await requireUserId();
    const query = querySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
    return successResponse(await listUserOrders(userId, query.page, query.limit));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const userId = await requireUserId();
    limitOrThrow(req, "orders-create", 10, 60_000, userId);
    const input = createOrderSchema.parse(await req.json());
    const { order, excluded } = await createOrder(userId, input);
    return successResponse({ order, excluded }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
