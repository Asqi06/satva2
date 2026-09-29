import mongoose, { Schema, type Model, type Types } from "mongoose";

export interface IGarbaSpin {
  userId: Types.ObjectId;
  campaign: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  status: "PENDING" | "PAID" | "REFUNDED";
  offerIndex?: number;
  rewardCode?: string;
  rewardExpiresAt?: Date;
  gift?: { name: string; slug: string };
  createdAt: Date;
}

const schema = new Schema<IGarbaSpin>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  campaign: { type: String, required: true },
  razorpayOrderId: { type: String, unique: true, sparse: true },
  razorpayPaymentId: { type: String, unique: true, sparse: true },
  status: { type: String, enum: ["PENDING", "PAID", "REFUNDED"], default: "PENDING" },
  offerIndex: Number,
  rewardCode: String,
  rewardExpiresAt: Date,
  gift: { name: String, slug: String },
}, { timestamps: true, collection: "garba_spins" });
schema.index({ userId: 1, campaign: 1 }, { unique: true });

export const GarbaSpin: Model<IGarbaSpin> = (mongoose.models.GarbaSpin as Model<IGarbaSpin> | undefined)
  ?? mongoose.model<IGarbaSpin>("GarbaSpin", schema);
