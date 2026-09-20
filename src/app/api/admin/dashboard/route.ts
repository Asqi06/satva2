import { requireAdmin } from "@/lib/admin-guard";
import { errorResponse, successResponse } from "@/lib/errors";
import { getDashboardStats } from "@/services/admin-dashboard-service";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    await requireAdmin();
    return successResponse(await getDashboardStats());
  } catch (error) {
    return errorResponse(error);
  }
}
