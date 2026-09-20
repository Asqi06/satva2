import mongoose, { Document, Model, Schema, Types } from "mongoose";

/**
 * Coupons. `usageCount` is reserved atomically at order creation
 * (conditional $inc) and released on cancel/expiry — see coupon-service.
 * Per-user limits enforced via CouponRedemption rows written at PAID time.
 */

export type CouponType = "PERCENTAGE" | "FIXED";

export interface ICoupon extends Document {
  code: string;
  type: CouponType;
  value: number;
  minimumOrderValue: number;
  maximumDiscount?: number;
  applicableProductIds: Types.ObjectId[];
  applicableCategoryIds: Types.ObjectId[];
  firstOrderOnly: boolean;
  usageLimit?: number;
  usageCount: number;
  perUserLimit?: number;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 32,
    },
    type: { type: String, enum: ["PERCENTAGE", "FIXED"], required: true },
    value: { type: Number, required: true, min: 1 },
    minimumOrderValue: { type: Number, min: 0, default: 0 },
    maximumDiscount: { type: Number, min: 1 },
    applicableProductIds: { type: [Schema.Types.ObjectId], ref: "Product", default: [] },
    applicableCategoryIds: { type: [Schema.Types.ObjectId], ref: "Category", default: [] },
    firstOrderOnly: { type: Boolean, default: false },
    usageLimit: { type: Number, min: 1 },
    usageCount: { type: Number, min: 0, default: 0 },
    perUserLimit: { type: Number, min: 1 },
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "coupons" },
);

export const Coupon: Model<ICoupon> =
  (mongoose.models.Coupon as Model<ICoupon> | undefined) ??
  mongoose.model<ICoupon>("Coupon", couponSchema);
