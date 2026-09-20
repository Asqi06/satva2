import mongoose, { Document, Model, Schema, Types } from "mongoose";

/** Append-only inventory ledger. Stock math lives in inventory-service. */
export type InventoryTxType = "RESERVE" | "RELEASE" | "SALE" | "RESTOCK" | "ADJUSTMENT";

export interface IInventoryTransaction extends Document {
  productId: Types.ObjectId;
  variantSku?: string;
  type: InventoryTxType;
  quantity: number;
  orderId?: Types.ObjectId;
  reason?: string;
  createdAt: Date;
}

const txSchema = new Schema<IInventoryTransaction>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantSku: { type: String, trim: true, maxlength: 64 },
    type: {
      type: String,
      enum: ["RESERVE", "RELEASE", "SALE", "RESTOCK", "ADJUSTMENT"],
      required: true,
    },
    quantity: { type: Number, required: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    reason: { type: String, maxlength: 500 },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "inventorytransactions" },
);

txSchema.index({ productId: 1, createdAt: -1 });
txSchema.index({ orderId: 1 });

export const InventoryTransaction: Model<IInventoryTransaction> =
  (mongoose.models.InventoryTransaction as Model<IInventoryTransaction> | undefined) ??
  mongoose.model<IInventoryTransaction>("InventoryTransaction", txSchema);
