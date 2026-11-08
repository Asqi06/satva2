import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 32,
    },
    type: { type: String, enum: ['PERCENTAGE', 'FIXED', 'percentage', 'fixed'], default: 'PERCENTAGE' },
    value: { type: Number, required: true, min: 1 },
    minimumOrderValue: { type: Number, min: 0, default: 0 },
    minPurchase: { type: Number, min: 0 },
    maximumDiscount: { type: Number, min: 1 },
    applicableProductIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    applicableCategoryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    firstOrderOnly: { type: Boolean, default: false },
    usageLimit: { type: Number, min: 1 },
    usageCount: { type: Number, min: 0, default: 0 },
    perUserLimit: { type: Number, min: 1 },
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
    description: { type: String, default: '' },
  },
  {
    timestamps: true,
    collection: 'coupons',
  }
);

export const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);
