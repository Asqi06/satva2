import { AppError, errorResponse, successResponse } from "@/lib/errors";
import { getPublicProductBySlug } from "@/services/product-service";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
): Promise<Response> {
  try {
    const { slug } = await ctx.params;
    const product = await getPublicProductBySlug(slug);
    if (!product) throw new AppError("NOT_FOUND", "Product not found", 404);
    return successResponse(product);
  } catch (error) {
    return errorResponse(error);
  }
}
