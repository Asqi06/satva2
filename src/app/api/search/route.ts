import type { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/errors";
import { productQuerySchema } from "@/schemas/product";
import { listPublicProducts } from "@/services/product-service";

/** Lightweight search alias over the product listing. */
export async function GET(req: NextRequest): Promise<Response> {
  try {
    const query = productQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
    return successResponse(await listPublicProducts(query));
  } catch (error) {
    return errorResponse(error);
  }
}
