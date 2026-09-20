import mongoose, { Document, Model, Schema, Types } from "mongoose";

/**
 * Authenticated carts. One per user (`userId` unique). Guest carts live
 * in localStorage and merge on login (see features/cart/guest-cart.ts).
 * Prices are NEVER stored here — the service enriches from products.
 */

export interface ICartItem {
  productId: Types.ObjectId;
  variantSku?: string;
  qty: number;
  addedAt: Date;
}

export interface ICart extends Document {
  userId: Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantSku: { type: String, trim: true, maxlength: 64 },
    qty: { type: Number, required: true, min: 1, max: 99 },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const cartSchema = new Schema<ICart>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true, collection: "carts" },
);

export const Cart: Model<ICart> =
  (mongoose.models.Cart as Model<ICart> | undefined) ??
  mongoose.model<ICart>("Cart", cartSchema);
