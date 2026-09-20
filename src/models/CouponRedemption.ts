import mongoose, { Document, Model, Schema, Types } from "mongoose";

/** Per-user coupon consumption. Written once per PAID order using a coupon. */
export interface ICouponRedemption extends Document {
  couponId: Types.ObjectId;
  userId: Types.ObjectId;
  orderId: Types.ObjectId;
  createdAt: Date;
}

const redemptionSchema = new Schema<ICouponRedemption>(
  {
    couponId: { type: Schema.Types.ObjectId, ref: "Coupon", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, unique: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "couponredemptions" },
);

redemptionSchema.index({ couponId: 1, userId: 1 });

export const CouponRedemption: Model<ICouponRedemption> =
  (mongoose.models.CouponRedemption as Model<ICouponRedemption> | undefined) ??
  mongoose.model<ICouponRedemption>("CouponRedemption", redemptionSchema);
