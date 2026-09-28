import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { auditAdmin } from "@/lib/audit";
import { errorResponse, successResponse } from "@/lib/errors";
import { getSettings, updateSettings } from "@/services/settings-service";

export const dynamic = "force-dynamic";

const settingsInputSchema = z.object({
  freeShippingThreshold: z.number().int().min(0).max(100000),
  shippingFlatFee: z.number().int().min(0).max(10000),
  reservationTtlMinutes: z.number().int().min(5).max(1440),
  announcement: z.string().trim().max(200).optional(),
  legalName: z.string().trim().max(5000).optional(),
  businessAddress: z.string().trim().max(5000).optional(),
  supportEmail: z.string().trim().max(5000).refine((value) => !value || z.email().safeParse(value).success, "Enter a valid email").optional(),
  supportPhone: z.string().trim().max(5000).optional(),
  grievanceContact: z.string().trim().max(5000).optional(),
  gstin: z.string().trim().max(5000).optional(),
  dispatchInformation: z.string().trim().max(5000).optional(),
  deliveryInformation: z.string().trim().max(5000).optional(),
  returnPolicy: z.string().trim().max(5000).optional(),
  cancellationPolicy: z.string().trim().max(5000).optional(),
  privacyPolicy: z.string().trim().max(5000).optional(),
  termsPolicy: z.string().trim().max(5000).optional(),
  aboutInformation: z.string().trim().max(5000).optional(),

  homeSeoTitle: z.string().trim().max(160).optional(),
  homeSeoDescription: z.string().trim().max(320).optional(),
  shopSeoTitle: z.string().trim().max(160).optional(),
  shopSeoDescription: z.string().trim().max(320).optional(),
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
