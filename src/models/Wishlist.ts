import mongoose, { Document, Model, Schema, Types } from "mongoose";

/**
 * Wishlists. One per user (`userId` unique). Requires authentication —
 * guests are directed to login (no local wishlist).
 */

export interface IWishlist extends Document {
  userId: Types.ObjectId;
  productIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const wishlistSchema = new Schema<IWishlist>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    productIds: { type: [Schema.Types.ObjectId], ref: "Product", default: [] },
  },
  { timestamps: true, collection: "wishlists" },
);

export const Wishlist: Model<IWishlist> =
  (mongoose.models.Wishlist as Model<IWishlist> | undefined) ??
  mongoose.model<IWishlist>("Wishlist", wishlistSchema);
