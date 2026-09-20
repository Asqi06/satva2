import type { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/errors";
import { productQuerySchema } from "@/schemas/product";
import { listPublicProducts } from "@/services/product-service";

export async function GET(req: NextRequest): Promise<Response> {
  try {
    const query = productQuerySchema.parse(
      Object.fromEntries(req.nextUrl.searchParams),
    );
    const result = await listPublicProducts(query);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
