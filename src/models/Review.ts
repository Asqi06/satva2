import mongoose, { Document, Model, Schema, Types } from "mongoose";

/**
 * Product reviews. One per (product, user). `isVerifiedPurchase` is
 * computed server-side from PAID orders — never client-supplied.
 * Hidden reviews (moderation) are excluded from public lists and aggregates.
 */

export interface IReviewImage {
  publicId: string;
  secureUrl: string;
}

export interface IReview extends Document {
  productId: Types.ObjectId;
  userId: Types.ObjectId;
  authorName: string;
  rating: number;
  title?: string;
  comment?: string;
  images: IReviewImage[];
  isVerifiedPurchase: boolean;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reviewImageSchema = new Schema<IReviewImage>(
  {
    publicId: { type: String, required: true, maxlength: 512 },
    secureUrl: { type: String, required: true, maxlength: 2048 },
  },
  { _id: false },
);

const reviewSchema = new Schema<IReview>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    authorName: { type: String, required: true, trim: true, maxlength: 120 },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 160 },
    comment: { type: String, trim: true, maxlength: 2000 },
    images: { type: [reviewImageSchema], default: [] },
    isVerifiedPurchase: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "reviews" },
);

reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });
reviewSchema.index({ productId: 1, isPublished: 1, createdAt: -1 });

export const Review: Model<IReview> =
  (mongoose.models.Review as Model<IReview> | undefined) ??
  mongoose.model<IReview>("Review", reviewSchema);
