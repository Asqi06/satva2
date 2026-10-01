import mongoose, { Document, Model, Schema } from "mongoose";

/** Singleton site settings (`key: "site"`). Avoids string-_id Document friction. */
export interface ISettings extends Document {
  key: string;
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
  addressStreet?: string;
  addressLocality?: string;
  addressRegion?: string;
  addressPostalCode?: string;
  physicalStore?: boolean;
  googleMapsUrl?: string;
  sameAs?: string[];

  homeSeoTitle?: string;
  homeSeoDescription?: string;
  shopSeoTitle?: string;
  shopSeoDescription?: string;
}

const settingsSchema = new Schema<ISettings>(
  {
    key: { type: String, default: "site", unique: true },
    freeShippingThreshold: { type: Number, min: 0, default: 399 },
    shippingFlatFee: { type: Number, min: 0, default: 49 },
    reservationTtlMinutes: { type: Number, min: 5, default: 30 },
    announcement: { type: String, maxlength: 200 },
    legalName: { type: String, trim: true, maxlength: 5000 },
    businessAddress: { type: String, trim: true, maxlength: 5000 },
    supportEmail: { type: String, trim: true, maxlength: 5000 },
    supportPhone: { type: String, trim: true, maxlength: 5000 },
    grievanceContact: { type: String, trim: true, maxlength: 5000 },
    gstin: { type: String, trim: true, maxlength: 5000 },
    dispatchInformation: { type: String, trim: true, maxlength: 5000 },
    deliveryInformation: { type: String, trim: true, maxlength: 5000 },
    returnPolicy: { type: String, trim: true, maxlength: 5000 },
    cancellationPolicy: { type: String, trim: true, maxlength: 5000 },
    privacyPolicy: { type: String, trim: true, maxlength: 5000 },
    termsPolicy: { type: String, trim: true, maxlength: 5000 },
    aboutInformation: { type: String, trim: true, maxlength: 5000 },
    addressStreet: { type: String, trim: true, maxlength: 500 },
    addressLocality: { type: String, trim: true, maxlength: 200, default: "Vapi" },
    addressRegion: { type: String, trim: true, maxlength: 200, default: "Gujarat" },
    addressPostalCode: { type: String, trim: true, maxlength: 6 },
    physicalStore: { type: Boolean, default: false },
    googleMapsUrl: { type: String, trim: true, maxlength: 2048 },
    sameAs: { type: [String], default: ["https://www.instagram.com/satvastonesjewelry/"] },

    homeSeoTitle: { type: String, trim: true, maxlength: 160 },
    homeSeoDescription: { type: String, trim: true, maxlength: 320 },
    shopSeoTitle: { type: String, trim: true, maxlength: 160 },
    shopSeoDescription: { type: String, trim: true, maxlength: 320 },
  },
  { collection: "settings" },
);

export const Settings: Model<ISettings> =
  (mongoose.models.Settings as Model<ISettings> | undefined) ??
  mongoose.model<ISettings>("Settings", settingsSchema);
