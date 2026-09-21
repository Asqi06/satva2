import { Types } from "mongoose";
import { connectDb } from "@/lib/db";
import { AppError } from "@/lib/errors";
import {
  notifyCancellation,
  notifyDelivered,
  notifyOutForDelivery,
  notifyRefund,
  notifyShipped,
} from "@/lib/email";
import { refundRazorpayPayment } from "@/lib/razorpay";
import { Coupon } from "@/models/Coupon";
import { Order, type OrderStatus } from "@/models/Order";
import { User } from "@/models/User";
import { releaseCouponUse } from "./coupon-service";
import { releaseHold, restockSold, type ReserveLine } from "./inventory-service";import { toOrderDTO, type LeanOrder, type OrderDTO } from "./order-service";

/**
 * Admin order management. Status progression follows a strict machine;
 * stock/coupon side-effects mirror the customer paths. Refunds go
 * through Razorpay (mocked in tests) before the order is marked.
 */

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: ["RETURNED"],
  CANCELLED: [],
  RETURNED: [],
  REFUNDED: [],
};

export interface AdminOrderRow {
  id: string;
  total: number;
  itemCount: number;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
  customer: { email: string; name?: string };
  legacy: boolean;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function linesOf(order: LeanOrder): ReserveLine[] {
  return order.items.map((i) => ({
    productId: i.productId.toString(),
    variantSku: i.variantSku,
    qty: i.qty,
  }));
}

export async function listAdminOrders(opts: {
  orderStatus?: string;
  paymentStatus?: string;
  page: number;
  limit: number;
}): Promise<{ orders: AdminOrderRow[]; pagination: Pagination }> {
  await connectDb();
  const filter: Record<string, unknown> = {};
  if (opts.orderStatus) filter.orderStatus = opts.orderStatus;
  if (opts.paymentStatus) filter.paymentStatus = opts.paymentStatus;
  const limit = Math.min(Math.max(opts.limit, 1), 50);
  const page = Math.max(opts.page, 1);
  const [total, docs] = await Promise.all([
    Order.countDocuments(filter),
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean<LeanOrder[]>(),
  ]);
  const userIds = [...new Set(docs.map((d) => d.userId?.toString()).filter(Boolean) as string[])];
  const users =
    userIds.length > 0
      ? await User.find({ _id: { $in: userIds.map((id) => new Types.ObjectId(id)) } })
          .select("email name")
          .lean<{ _id: Types.ObjectId; email: string; name?: string }[]>()
      : [];
  const byId = new Map(users.map((u) => [u._id.toString(), u]));
  return {
    orders: docs.map((d) => {
      const legacyDoc = d as unknown as {
        amount?: number;
        customer?: { email?: string; name?: string };
      };
      const isLegacy = d.userId == null || d.orderStatus == null;
      return {
        id: d._id.toString(),
        legacy: isLegacy,
        total: d.total ?? legacyDoc.amount ?? 0,
        itemCount: Array.isArray(d.items) ? d.items.reduce((n, i) => n + (i.qty ?? 0), 0) : 0,
        paymentStatus: d.paymentStatus ?? "PENDING",
        orderStatus: d.orderStatus ?? "PENDING",
        createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : new Date(0).toISOString(),
        customer: {
          email: d.userId
            ? (byId.get(d.userId.toString())?.email ?? "unknown")
            : (legacyDoc.customer?.email ?? "unknown"),
          name: d.userId ? byId.get(d.userId.toString())?.name : legacyDoc.customer?.name,
        },
      };
    }),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getAdminOrder(orderId: string): Promise<OrderDTO> {
  await connectDb();
  if (!Types.ObjectId.isValid(orderId)) throw new AppError("NOT_FOUND", "Order not found", 404);
  const order = await Order.findById(orderId).lean<LeanOrder | null>();
  if (!order) throw new AppError("NOT_FOUND", "Order not found", 404);
  return toOrderDTO(order);
}

const ORDER_STATUSES: OrderStatus[] = [
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
];

/** Advance (or cancel) an order along the state machine. */
export async function updateOrderStatus(
  orderId: string,
  next: string,
  note?: string,
): Promise<OrderDTO> {
  await connectDb();
  if (!Types.ObjectId.isValid(orderId)) throw new AppError("NOT_FOUND", "Order not found", 404);
  if (!ORDER_STATUSES.includes(next as OrderStatus)) {
    throw new AppError("VALIDATION_ERROR", "Unknown order status", 400);
  }
  const target = next as OrderStatus;
  const order = await Order.findById(orderId).lean<LeanOrder | null>();
  if (!order) throw new AppError("NOT_FOUND", "Order not found", 404);
  assertMutable(order);
  if (!(TRANSITIONS[order.orderStatus] ?? []).includes(target)) {
    throw new AppError(
      "CONFLICT",
      `Cannot move order from ${order.orderStatus} to ${target}`,
      409,
    );
  }
  if (target === "CANCELLED") {
    return adminCancelOrder(orderId, note ?? "Cancelled by admin");
  }
  const updated = await Order.findOneAndUpdate(
    { _id: order._id, orderStatus: order.orderStatus },
    {
      $set: { orderStatus: target },
      $push: { timeline: { status: target, at: new Date(), note } },
    },
    { returnDocument: "after" },
  ).lean<LeanOrder | null>();
  if (!updated) throw new AppError("CONFLICT", "Order changed state — please refresh", 409);
  const dto = toOrderDTO(updated);
  const userId = updated.userId.toString();
  if (target === "SHIPPED") await notifyShipped(userId, dto);
  if (target === "OUT_FOR_DELIVERY") await notifyOutForDelivery(userId, dto);
  if (target === "DELIVERED") await notifyDelivered(userId, dto);
  return dto;
}

/**
 * Admin cancel from PENDING/CONFIRMED/PROCESSING/PACKED.
 * Always releases holds (clamped — safe even if nothing is held).
 * PAID orders must go through refund instead (refused here to force
 * the money path); terminal states are refused.
 */
/** Legacy/COD-era imports (no userId, no machine statuses) are read-only. */
function assertMutable(order: LeanOrder): void {
  if (order.userId == null || order.orderStatus == null) {
    throw new AppError("CONFLICT", "Legacy imported order is read-only and cannot be changed", 409);
  }
}

export async function adminCancelOrder(orderId: string, reason: string): Promise<OrderDTO> {
  await connectDb();
  if (!Types.ObjectId.isValid(orderId)) throw new AppError("NOT_FOUND", "Order not found", 404);
  const order = await Order.findById(orderId).lean<LeanOrder | null>();
  if (!order) throw new AppError("NOT_FOUND", "Order not found", 404);
  assertMutable(order);
  if (!["PENDING", "CONFIRMED", "PROCESSING", "PACKED"].includes(order.orderStatus)) {
    throw new AppError("CONFLICT", `Order cannot be cancelled from ${order.orderStatus}`, 409);
  }
  if (order.paymentStatus === "PAID") {
    throw new AppError("CONFLICT", "Paid order — issue a refund instead of cancelling", 409);
  }
  if (order.paymentStatus === "REFUNDED") {
    throw new AppError("CONFLICT", "Order is already refunded", 409);
  }
  await releaseHold(linesOf(order), order._id, reason);
  if (order.couponCode) {
    const coupon = await Coupon.findOne({ code: order.couponCode }).select("_id").lean();
    if (coupon) await releaseCouponUse(coupon._id.toString());
  }
  const updated = await Order.findOneAndUpdate(
    { _id: order._id, orderStatus: order.orderStatus },
    {
      $set: { orderStatus: "CANCELLED" },
      $push: { timeline: { status: "CANCELLED" as OrderStatus, at: new Date(), note: reason } },
    },
    { returnDocument: "after" },
  ).lean<LeanOrder | null>();
  if (!updated) throw new AppError("CONFLICT", "Order changed state — please refresh", 409);
  await notifyCancellation(updated.userId.toString(), toOrderDTO(updated), reason);
  return toOrderDTO(updated);
}

/**
 * Full refund of a PAID order: Razorpay refund first, then mark
 * REFUNDED + restock. Partial refunds are out of scope (Phase 9+).
 */
export async function refundOrder(orderId: string, reason?: string): Promise<OrderDTO> {
  await connectDb();
  if (!Types.ObjectId.isValid(orderId)) throw new AppError("NOT_FOUND", "Order not found", 404);
  const order = await Order.findById(orderId).lean<LeanOrder | null>();
  if (!order) throw new AppError("NOT_FOUND", "Order not found", 404);
  assertMutable(order);
  if (order.paymentStatus !== "PAID") {
    throw new AppError("CONFLICT", "Only paid orders can be refunded", 409);
  }
  if (!order.razorpayPaymentId) {
    throw new AppError("CONFLICT", "No captured payment to refund", 409);
  }
  await refundRazorpayPayment(order.razorpayPaymentId);
  await restockSold(linesOf(order), order._id, reason ?? "Admin refund");
  if (order.couponCode) {
    const coupon = await Coupon.findOne({ code: order.couponCode }).select("_id").lean();
    if (coupon) await releaseCouponUse(coupon._id.toString());
  }
  const updated = await Order.findOneAndUpdate(
    { _id: order._id, paymentStatus: "PAID" },
    {
      $set: { paymentStatus: "REFUNDED", orderStatus: "REFUNDED" },
      $push: {
        timeline: { status: "REFUNDED" as OrderStatus, at: new Date(), note: reason ?? "Refunded by admin" },
      },
    },
    { returnDocument: "after" },
  ).lean<LeanOrder | null>();
  if (!updated) throw new AppError("CONFLICT", "Order changed state — please refresh", 409);
  await notifyRefund(updated.userId.toString(), toOrderDTO(updated), reason);
  return toOrderDTO(updated);
}
