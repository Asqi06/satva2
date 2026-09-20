import { errorResponse, successResponse } from "@/lib/errors";
import { getSettings } from "@/services/settings-service";

/** Public shipping/announcement settings (safe fields only). */
export async function GET(): Promise<Response> {
  try {
    const settings = await getSettings();
    return successResponse({
      freeShippingThreshold: settings.freeShippingThreshold,
      shippingFlatFee: settings.shippingFlatFee,
      announcement: settings.announcement,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
