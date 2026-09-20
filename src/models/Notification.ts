import mongoose, { Document, Model, Schema, Types } from "mongoose";

/**
 * Notification outbox log. Every lifecycle email writes SENT or FAILED —
 * never throws into the business flow that triggered it.
 */

export type NotificationType =
  | "WELCOME"
  | "ORDER_CONFIRMATION"
  | "PAYMENT_RECEIPT"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLATION"
  | "REFUND";

export interface INotification extends Document {
  userId?: Types.ObjectId;
  type: NotificationType;
  channel: "EMAIL";
  to: string;
  subject: string;
  status: "QUEUED" | "SENT" | "FAILED";
  error?: string;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    type: {
      type: String,
      enum: [
        "WELCOME",
        "ORDER_CONFIRMATION",
        "PAYMENT_RECEIPT",
        "SHIPPED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLATION",
        "REFUND",
      ],
      required: true,
    },
    channel: { type: String, enum: ["EMAIL"], default: "EMAIL" },
    to: { type: String, required: true, maxlength: 320 },
    subject: { type: String, required: true, maxlength: 320 },
    status: { type: String, enum: ["QUEUED", "SENT", "FAILED"], default: "SENT" },
    error: { type: String, maxlength: 1000 },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "notifications" },
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ type: 1, status: 1 });

export const Notification: Model<INotification> =
  (mongoose.models.Notification as Model<INotification> | undefined) ??
  mongoose.model<INotification>("Notification", notificationSchema);
