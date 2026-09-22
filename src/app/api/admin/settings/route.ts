import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { auditAdmin } from "@/lib/audit";
import { errorResponse, successResponse } from "@/lib/errors";
import { getSettings, updateSettings } from "@/services/settings-service";

export const dynamic = "force-dynamic";

const settingsInputSchema = z.object({
  freeShippingThreshold: z.number().min(0).max(100000),
  shippingFlatFee: z.number().min(0).max(10000),
  reservationTtlMinutes: z.number().min(5).max(1440),
  announcement: z.string().trim().max(200).optional(),
});

export async function GET(): Promise<Response> {
  try {
    await requireAdmin();
    return successResponse({ settings: await getSettings() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(req: Request): Promise<Response> {
  try {
    const admin = await requireAdmin();
    const input = settingsInputSchema.parse(await req.json());
    const settings = await updateSettings(input);
    await auditAdmin({
      actorId: admin.id,
      actorEmail: admin.email ?? "unknown",
      action: "settings.update",
      target: "site",
    });
    return successResponse({ settings });
  } catch (error) {
    return errorResponse(error);
  }
}
