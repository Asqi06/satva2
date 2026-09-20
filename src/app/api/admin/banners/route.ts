import { requireAdmin } from "@/lib/admin-guard";
import { auditAdmin } from "@/lib/audit";
import { errorResponse, successResponse } from "@/lib/errors";
import { bannerInputSchema } from "@/schemas/content";
import { createBanner, listAdminBanners } from "@/services/banner-service";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    await requireAdmin();
    return successResponse({ banners: await listAdminBanners() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const admin = await requireAdmin();
    const input = bannerInputSchema.parse(await req.json());
    const banner = await createBanner(input);
    await auditAdmin({
      actorId: admin.id,
      actorEmail: admin.email ?? "unknown",
      action: "banner.create",
      target: banner.id,
    });
    return successResponse(banner, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
