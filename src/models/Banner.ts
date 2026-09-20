import mongoose, { Document, Model, Schema } from "mongoose";

/**
 * Homepage banners (hero placement). Date windows optional;
 * only active + in-window banners render, newest first.
 */

export interface IBanner extends Document {
  title: string;
  subtitle?: string;
  image: { publicId: string; secureUrl: string; alt: string };
  link: string;
  placement: "hero";
  sortOrder: number;
  isActive: boolean;
  startsAt?: Date;
  endsAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const bannerSchema = new Schema<IBanner>(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    subtitle: { type: String, trim: true, maxlength: 280 },
    image: {
      publicId: { type: String, required: true, maxlength: 512 },
      secureUrl: { type: String, required: true, maxlength: 2048 },
      alt: { type: String, required: true, maxlength: 200 },
    },
    link: { type: String, required: true, trim: true, maxlength: 512 },
    placement: { type: String, enum: ["hero"], default: "hero" },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    startsAt: { type: Date },
    endsAt: { type: Date },
  },
  { timestamps: true, collection: "banners" },
);

bannerSchema.index({ placement: 1, isActive: 1, sortOrder: 1 });

export const Banner: Model<IBanner> =
  (mongoose.models.Banner as Model<IBanner> | undefined) ??
  mongoose.model<IBanner>("Banner", bannerSchema);
