import { connectDb } from "@/lib/db";
import { Settings } from "@/models/Settings";

export interface ShippingSettings {
  freeShippingThreshold: number;
  shippingFlatFee: number;
  reservationTtlMinutes: number;
  announcement?: string;
}

/** Site settings with safe defaults when no row exists yet. */
export async function getSettings(): Promise<ShippingSettings> {
  await connectDb();
  const doc = await Settings.findOne({ key: "site" }).lean();
  return {
    freeShippingThreshold: doc?.freeShippingThreshold ?? 399,
    shippingFlatFee: doc?.shippingFlatFee ?? 49,
    reservationTtlMinutes: doc?.reservationTtlMinutes ?? 30,
    announcement: doc?.announcement,
  };
}

/** Whole-rupee shipping for a discounted subtotal. */
export function shippingFor(subtotalAfterDiscount: number, settings: ShippingSettings): number {
  if (subtotalAfterDiscount <= 0) return 0;
  return subtotalAfterDiscount >= settings.freeShippingThreshold ? 0 : settings.shippingFlatFee;
}

export interface SettingsInput {
  freeShippingThreshold: number;
  shippingFlatFee: number;
  reservationTtlMinutes: number;
  announcement?: string;
}

/** Upsert the singleton site row; returns the fresh view. */
export async function updateSettings(input: SettingsInput): Promise<ShippingSettings> {
  await connectDb();
  const announcement = input.announcement?.trim() ? input.announcement.trim() : undefined;
  await Settings.findOneAndUpdate(
    { key: "site" },
    {
      $set: {
        freeShippingThreshold: input.freeShippingThreshold,
        shippingFlatFee: input.shippingFlatFee,
        reservationTtlMinutes: input.reservationTtlMinutes,
        announcement,
      },
    },
    { upsert: true, new: true },
  );
  return getSettings();
}
