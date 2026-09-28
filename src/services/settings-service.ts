import { cache } from "react";
import { connectDb } from "@/lib/db";
import { Settings } from "@/models/Settings";

export interface ShippingSettings {
  freeShippingThreshold: number;
  shippingFlatFee: number;
  reservationTtlMinutes: number;
  announcement?: string;
  legalName?: string;
  businessAddress?: string;
  supportEmail?: string;
  supportPhone?: string;
  grievanceContact?: string;
  gstin?: string;
  dispatchInformation?: string;
  deliveryInformation?: string;
  returnPolicy?: string;
  cancellationPolicy?: string;
  privacyPolicy?: string;
  termsPolicy?: string;
  aboutInformation?: string;

  homeSeoTitle?: string;
  homeSeoDescription?: string;
  shopSeoTitle?: string;
  shopSeoDescription?: string;
}

/** Site settings with safe defaults when no row exists yet. */
export const getSettings = cache(async (): Promise<ShippingSettings> => {
  await connectDb();
  const doc = await Settings.findOne({ key: "site" }).lean();
  return {
    freeShippingThreshold: doc?.freeShippingThreshold ?? 399,
    shippingFlatFee: doc?.shippingFlatFee ?? 49,
    reservationTtlMinutes: doc?.reservationTtlMinutes ?? 30,
    announcement: doc?.announcement,
    legalName: doc?.legalName,
    businessAddress: doc?.businessAddress,
    supportEmail: doc?.supportEmail,
    supportPhone: doc?.supportPhone,
    grievanceContact: doc?.grievanceContact,
    gstin: doc?.gstin,
    dispatchInformation: doc?.dispatchInformation,
    deliveryInformation: doc?.deliveryInformation,
    returnPolicy: doc?.returnPolicy,
    cancellationPolicy: doc?.cancellationPolicy,
    privacyPolicy: doc?.privacyPolicy,
    termsPolicy: doc?.termsPolicy,
    aboutInformation: doc?.aboutInformation,

    homeSeoTitle: doc?.homeSeoTitle,
    homeSeoDescription: doc?.homeSeoDescription,
    shopSeoTitle: doc?.shopSeoTitle,
    shopSeoDescription: doc?.shopSeoDescription,
  };
});

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
  legalName?: string;
  businessAddress?: string;
  supportEmail?: string;
  supportPhone?: string;
  grievanceContact?: string;
  gstin?: string;
  dispatchInformation?: string;
  deliveryInformation?: string;
  returnPolicy?: string;
  cancellationPolicy?: string;
  privacyPolicy?: string;
  termsPolicy?: string;
  aboutInformation?: string;

  homeSeoTitle?: string;
  homeSeoDescription?: string;
  shopSeoTitle?: string;
  shopSeoDescription?: string;
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
        announcement: announcement ?? "",
        legalName: input.legalName?.trim() ?? "",
        businessAddress: input.businessAddress?.trim() ?? "",
        supportEmail: input.supportEmail?.trim() ?? "",
        supportPhone: input.supportPhone?.trim() ?? "",
        grievanceContact: input.grievanceContact?.trim() ?? "",
        gstin: input.gstin?.trim() ?? "",
        dispatchInformation: input.dispatchInformation?.trim() ?? "",
        deliveryInformation: input.deliveryInformation?.trim() ?? "",
        returnPolicy: input.returnPolicy?.trim() ?? "",
        cancellationPolicy: input.cancellationPolicy?.trim() ?? "",
        privacyPolicy: input.privacyPolicy?.trim() ?? "",
        termsPolicy: input.termsPolicy?.trim() ?? "",
        aboutInformation: input.aboutInformation?.trim() ?? "",

        homeSeoTitle: input.homeSeoTitle?.trim() ?? "",
        homeSeoDescription: input.homeSeoDescription?.trim() ?? "",
        shopSeoTitle: input.shopSeoTitle?.trim() ?? "",
        shopSeoDescription: input.shopSeoDescription?.trim() ?? "",
      },
    },
    { upsert: true, new: true },
  );
  return getSettings();
}
