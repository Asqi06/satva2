import { errorResponse, successResponse } from "@/lib/errors";
import { listPublicCategories } from "@/services/category-service";

export async function GET(): Promise<Response> {
  try {
    const categories = await listPublicCategories();
    return successResponse({ categories });
  } catch (error) {
    return errorResponse(error);
  }
}
