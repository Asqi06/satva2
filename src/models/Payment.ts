import mongoose, { Document, Model, Schema, Types } from "mongoose";

/**
 * Payment attempts + webhook idempotency log. One row per local order;
 * `processedEvents` dedupes retried Razorpay webhooks. Never stores
 * card data, secrets, or full signatures.
 */

export interface IPayment extends Document {
  orderId: Types.ObjectId;
  provider: "RAZORPAY";
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  amount: number;
  currency: string;
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  processedEvents: string[];
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, unique: true },
    provider: { type: String, enum: ["RAZORPAY"], default: "RAZORPAY" },
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String, sparse: true, unique: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING",
    },
    processedEvents: { type: [String], default: [] },
  },
  { timestamps: true, collection: "payments" },
);

export const Payment: Model<IPayment> =
  (mongoose.models.Payment as Model<IPayment> | undefined) ??
  mongoose.model<IPayment>("Payment", paymentSchema);
