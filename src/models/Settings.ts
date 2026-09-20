import mongoose, { Document, Model, Schema } from "mongoose";

/** Singleton site settings (`key: "site"`). Avoids string-_id Document friction. */
export interface ISettings extends Document {
  key: string;
  freeShippingThreshold: number;
  shippingFlatFee: number;
  reservationTtlMinutes: number;
  announcement?: string;
}

const settingsSchema = new Schema<ISettings>(
  {
    key: { type: String, default: "site", unique: true },
    freeShippingThreshold: { type: Number, min: 0, default: 399 },
    shippingFlatFee: { type: Number, min: 0, default: 49 },
    reservationTtlMinutes: { type: Number, min: 5, default: 30 },
    announcement: { type: String, maxlength: 200 },
  },
  { collection: "settings" },
);

export const Settings: Model<ISettings> =
  (mongoose.models.Settings as Model<ISettings> | undefined) ??
  mongoose.model<ISettings>("Settings", settingsSchema);
