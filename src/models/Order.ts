import mongoose, { Document, Model, Schema, Types } from "mongoose";

/**
 * Orders. Totals are server-calculated snapshots; the address is a
 * snapshot copy. Reservations expire (see inventory-service) and
 * CANCELLED covers expiry (timeline note explains why).
 */

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "PACKED"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED"
  | "REFUNDED";

export type PaymentStatus = "PENDING" | "AUTHORIZED" | "PAID" | "FAILED" | "REFUNDED";

export interface IOrderItem {
  productId: Types.ObjectId;
  variantSku?: string;
  name: string;
  image?: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
}

export interface IOrderAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export interface ITimelineEntry {
  status: OrderStatus;
  at: Date;
  note?: string;
}

export interface IOrder extends Document {
  userId: Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: IOrderAddress;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  couponCode?: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  reservationExpiresAt?: Date;
  timeline: ITimelineEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantSku: { type: String, trim: true, maxlength: 64 },
    name: { type: String, required: true, maxlength: 160 },
    image: { type: String, maxlength: 2048 },
    qty: { type: Number, required: true, min: 1, max: 99 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const addressSnapshotSchema = new Schema<IOrderAddress>(
  {
    fullName: { type: String, required: true, maxlength: 120 },
    phone: { type: String, required: true, maxlength: 15 },
    addressLine1: { type: String, required: true, maxlength: 256 },
    addressLine2: { type: String, maxlength: 256 },
    city: { type: String, required: true, maxlength: 120 },
    state: { type: String, required: true, maxlength: 120 },
    pincode: { type: String, required: true, maxlength: 10 },
    landmark: { type: String, maxlength: 256 },
  },
  { _id: false },
);

const timelineSchema = new Schema<ITimelineEntry>(
  {
    status: { type: String, required: true },
    at: { type: Date, default: Date.now },
    note: { type: String, maxlength: 500 },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [orderItemSchema], required: true },
    shippingAddress: { type: addressSnapshotSchema, required: true },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    shipping: { type: Number, required: true, min: 0, default: 0 },
    tax: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
    couponCode: { type: String, uppercase: true, trim: true, maxlength: 32 },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "AUTHORIZED", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING",
    },
    orderStatus: {
      type: String,
      enum: [
        "PENDING",
        "CONFIRMED",
        "PROCESSING",
        "PACKED",
        "SHIPPED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
        "RETURNED",
        "REFUNDED",
      ],
      default: "PENDING",
    },
    razorpayOrderId: { type: String, sparse: true, unique: true },
    razorpayPaymentId: { type: String, sparse: true, unique: true },
    reservationExpiresAt: { type: Date },
    timeline: { type: [timelineSchema], default: [] },
  },
  { timestamps: true, collection: "orders" },
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ reservationExpiresAt: 1 });

export const Order: Model<IOrder> =
  (mongoose.models.Order as Model<IOrder> | undefined) ??
  mongoose.model<IOrder>("Order", orderSchema);
