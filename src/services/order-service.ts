import { Types } from "mongoose";
import { connectDb } from "@/lib/db";
import { AppError } from "@/lib/errors";
import {
  notifyCancellation,
  notifyOrderConfirmation,
  notifyPaymentReceipt,
  notifyRefund,
} from "@/lib/email";
import { logger } from "@/lib/logger";
import { createRazorpayOrder, getRazorpayKeyId, verifyPaymentSignature } from "@/lib/razorpay";
import { Coupon } from "@/models/Coupon";
import { Order, type IOrder, type OrderStatus } from "@/models/Order";
import { Payment } from "@/models/Payment";
import { User } from "@/models/User";
import type { CreateOrderInput, VerifyPaymentInput } from "@/schemas/checkout";
import { getCartView } from "./cart-service";
import {
  recordRedemption,
  releaseCouponUse,
  reserveCouponUse,
  validateCoupon,
} from "./coupon-service";
import {
  finalizeSale,
  releaseExpiredReservations,
  releaseHold,
  reserveUnits,
  restockSold,
  type ReserveLine,
} from "./inventory-service";
import { clearCart } from "./cart-service";
import { getSettings, shippingFor } from "./settings-service";

/**
 * Orders + payments. Money is server-calculated integer rupees; the
 * frontend amount is never trusted. Webhook + verify share an atomic
 * settle path (compare-and-set on PENDING → PAID) for idempotency.
 */

export interface OrderDTO {
  id: string;
  items: {
    productId: string;
    variantSku?: string;
    name: string;
    image?: string;
    qty: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  address: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
  };
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  couponCode?: string;
  paymentStatus: string;
  orderStatus: string;
  razorpayOrderId?: string;
  reservationExpiresAt?: string;
  timeline: { status: string; at: string; note?: string }[];
  createdAt: string;
  /** True for pre-launch/COD-era imports lacking userId + machine statuses. Read-only everywhere. */
  legacy: boolean;
}

export type LeanOrder = Omit<IOrder, "_id" | "userId" | "createdAt" | "updatedAt"> & {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export function toOrderDTO(doc: LeanOrder): OrderDTO {
  // Legacy/guest orders may miss fields — default defensively so one bad
  // document can never crash order lists (see admin 500 report).
  const items = Array.isArray(doc.items) ? doc.items : [];
  const timeline = Array.isArray(doc.timeline) ? doc.timeline : [];
  return {
    id: doc._id.toString(),
    items: items.map((i) => ({
      productId: i.productId?.toString() ?? "",
      variantSku: i.variantSku,
      name: i.name ?? "Item",
      image: i.image,
      qty: i.qty ?? 0,
      unitPrice: i.unitPrice ?? 0,
      totalPrice: i.totalPrice ?? 0,
    })),
    address: { ...(doc.shippingAddress ?? {}) } as OrderDTO["address"],
    subtotal: doc.subtotal ?? 0,
    discount: doc.discount ?? 0,
    shipping: doc.shipping ?? 0,
    tax: doc.tax ?? 0,
    total: doc.total ?? 0,
    couponCode: doc.couponCode,
    paymentStatus: doc.paymentStatus ?? "PENDING",
    orderStatus: doc.orderStatus ?? "PENDING",
    razorpayOrderId: doc.razorpayOrderId,
    reservationExpiresAt: doc.reservationExpiresAt?.toISOString(),
    timeline: timeline.map((t) => ({
      status: t?.status ?? "PENDING",
      at: t?.at instanceof Date ? t.at.toISOString() : new Date(0).toISOString(),
      note: t?.note,
    })),
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : new Date(0).toISOString(),
    legacy: doc.userId == null || doc.orderStatus == null,
  };
}

async function userIdOrThrow(rawId: string): Promise<Types.ObjectId> {
  if (!Types.ObjectId.isValid(rawId)) throw new AppError("UNAUTHORIZED", "Login required", 401);
  return new Types.ObjectId(rawId);
}

function linesOf(order: LeanOrder): ReserveLine[] {
  return order.items.map((i) => ({
    productId: i.productId.toString(),
    variantSku: i.variantSku,
    qty: i.qty,
  }));
}

export async function createOrder(
  rawUserId: string,
  input: CreateOrderInput,
): Promise<{ order: OrderDTO; excluded: number }> {
  await connectDb();
  await releaseExpiredReservations();
  const userId = await userIdOrThrow(rawUserId);

  const user = await User.findById(userId);
  if (!user) throw new AppError("UNAUTHORIZED", "Login required", 401);
  // Legacy/guest-era users may lack the addresses array — 404, never a TypeError 500.
  const address = (user.addresses ?? []).find((a) => a._id.toString() === input.addressId);
  if (!address) throw new AppError("NOT_FOUND", "Address not found", 404);

  const cart = await getCartView(userId.toString());
  const lines = cart.items.filter((i) => i.available);
  const excluded = cart.items.length - lines.length;
  if (lines.length === 0) {
    throw new AppError("CONFLICT", "Your bag has no available items", 409);
  }

  const subtotal = lines.reduce((n, l) => n + l.qty * l.price, 0);
  const pricedLines = lines.map((l) => ({
    productId: l.productId,
    qty: l.qty,
    unitPrice: l.price,
  }));

  let discount = 0;
  let couponId: string | undefined;
  let couponCode: string | undefined;
  if (input.couponCode) {
    const check = await validateCoupon(input.couponCode, userId.toString(), pricedLines, subtotal);
    if (!check.valid) {
      throw new AppError("CONFLICT", `Coupon ${check.reason}: ${input.couponCode}`, 409);
    }
    discount = check.discount;
    couponId = check.couponId;
    couponCode = check.code;
    await reserveCouponUse(couponId as string);
  }

  const settings = await getSettings();
  const shipping = shippingFor(subtotal - discount, settings);
  const total = subtotal - discount + shipping;

  const order = await Order.create({
    userId,
    items: lines.map((l) => ({
      productId: new Types.ObjectId(l.productId),
      variantSku: l.variantSku,
      name: l.name,
      image: l.image?.secureUrl,
      qty: l.qty,
      unitPrice: l.price,
      totalPrice: l.qty * l.price,
    })),
    shippingAddress: {
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      landmark: address.landmark,
    },
    subtotal,
    discount,
    shipping,
    tax: 0,
    total,
    couponCode,
    paymentStatus: "PENDING",
    orderStatus: "PENDING",
    reservationExpiresAt: new Date(Date.now() + settings.reservationTtlMinutes * 60 * 1000),
    timeline: [{ status: "PENDING" as OrderStatus, at: new Date() }],
  });

  const reserveLines: ReserveLine[] = lines.map((l) => ({
    productId: l.productId,
    variantSku: l.variantSku,
    qty: l.qty,
  }));
  try {
    await reserveUnits(reserveLines, order._id);
  } catch (error) {
    // Roll back the half-built order: release coupon, mark cancelled.
    if (couponId) await releaseCouponUse(couponId);
    await Order.updateOne(
      { _id: order._id },
      {
        $set: { orderStatus: "CANCELLED" },
        $push: { timeline: { status: "CANCELLED", at: new Date(), note: "Stock unavailable" } },
      },
    );
    throw error;
  }

  await clearCart(userId.toString());
  const doc = await Order.findById(order._id).lean<LeanOrder | null>();
  if (!doc) throw new AppError("NOT_FOUND", "Order not found", 404);
  return { order: toOrderDTO(doc), excluded };
}

/** Create (or reuse) the Razorpay order for a PENDING local order. */
export async function createPaymentOrder(
  rawUserId: string,
  orderId: string,
): Promise<{ razorpayOrderId: string; amount: number; currency: string; keyId: string; orderId: string }> {
  await connectDb();
  const userId = await userIdOrThrow(rawUserId);
  if (!Types.ObjectId.isValid(orderId)) throw new AppError("NOT_FOUND", "Order not found", 404);
  const order = await Order.findOne({ _id: orderId, userId }).lean<LeanOrder | null>();
  if (!order) throw new AppError("NOT_FOUND", "Order not found", 404);
  if (order.orderStatus !== "PENDING" || order.paymentStatus !== "PENDING") {
    throw new AppError("CONFLICT", "Order cannot be paid in its current state", 409);
  }
  if (order.reservationExpiresAt && order.reservationExpiresAt.getTime() < Date.now()) {
    throw new AppError("CONFLICT", "Reservation expired — please place a fresh order", 409);
  }
  if (order.razorpayOrderId) {
    await Payment.findOneAndUpdate(
      { orderId: order._id },
      {
        $setOnInsert: {
          orderId: order._id,
          razorpayOrderId: order.razorpayOrderId,
          amount: order.total,
          currency: "INR",
          status: "PENDING",
        },
      },
      { upsert: true },
    );
    return {
      razorpayOrderId: order.razorpayOrderId,
      amount: order.total * 100,
      currency: "INR",
      keyId: getRazorpayKeyId(),
      orderId: order._id.toString(),
    };
  }
  const rzp = await createRazorpayOrder({
    amountPaise: order.total * 100,
    receipt: order._id.toString().slice(-24),
    notes: { orderId: order._id.toString(), userId: userId.toString() },
  });
  try {
    await Order.updateOne({ _id: order._id }, { $set: { razorpayOrderId: rzp.id } });
  } catch (error) {
    if (error !== null && typeof error === "object" && "code" in error && error.code === 11000) {
      const current = await Order.findById(order._id).lean<LeanOrder | null>();
      if (current?.razorpayOrderId) {
        return {
          razorpayOrderId: current.razorpayOrderId,
          amount: current.total * 100,
          currency: "INR",
          keyId: getRazorpayKeyId(),
          orderId: current._id.toString(),
        };
      }
    }
    throw error;
  }
  await Payment.findOneAndUpdate(
    { orderId: order._id },
    {
      $setOnInsert: {
        orderId: order._id,
        razorpayOrderId: rzp.id,
        amount: order.total,
        currency: "INR",
        status: "PENDING",
      },
    },
    { upsert: true },
  );
  return {
    razorpayOrderId: rzp.id,
    amount: rzp.amount,
    currency: rzp.currency,
    keyId: getRazorpayKeyId(),
    orderId: order._id.toString(),
  };
}

/**
 * Atomic settle: exactly one caller (verify or webhook) flips
 * PENDING → PAID. Losers observe PAID and return idempotently.
 */
async function settleOrderPaid(
  orderId: Types.ObjectId,
  razorpayPaymentId: string,
  eventMarker: string,
): Promise<LeanOrder> {
  const won = await Order.findOneAndUpdate(
    { _id: orderId, paymentStatus: "PENDING" },
    {
      $set: {
        paymentStatus: "PAID",
        orderStatus: "CONFIRMED",
        razorpayPaymentId,
      },
      $push: {
        timeline: { status: "CONFIRMED" as OrderStatus, at: new Date(), note: "Payment verified" },
      },
    },
    { returnDocument: "after" },
  ).lean<LeanOrder | null>();

  if (won) {
    await Payment.findOneAndUpdate(
      { orderId },
      {
        $set: { status: "PAID", razorpayPaymentId },
        $addToSet: { processedEvents: eventMarker },
      },
    );
    await finalizeSale(linesOf(won), orderId);
    if (won.couponCode) {
      const coupon = await Coupon.findOne({ code: won.couponCode }).select("_id").lean();
      if (coupon) await recordRedemption(coupon._id.toString(), won.userId.toString(), orderId.toString());
    }
    const fresh = await Order.findById(orderId).lean<LeanOrder | null>();
    if (!fresh) throw new AppError("NOT_FOUND", "Order not found", 404);
    // Lifecycle emails, in order. Awaited: sending is part of completion,
    // and notify* never throws (failures log as FAILED notifications).
    const dto = toOrderDTO(fresh);
    await notifyOrderConfirmation(won.userId.toString(), dto);
    await notifyPaymentReceipt(won.userId.toString(), dto);
    return fresh;
  }

  const current = await Order.findById(orderId).lean<LeanOrder | null>();
  if (!current) throw new AppError("NOT_FOUND", "Order not found", 404);
  if (current.paymentStatus === "PAID") {
    await Payment.updateOne(
      { orderId },
      { $addToSet: { processedEvents: eventMarker } },
    );
    return current;
  }
  throw new AppError("CONFLICT", "Order cannot be paid in its current state", 409);
}

/** Browser callback after Razorpay Checkout. Verifies signature, settles. */
export async function verifyPayment(rawUserId: string, input: VerifyPaymentInput): Promise<OrderDTO> {
  const signatureOk = verifyPaymentSignature(input);
  if (!signatureOk) {
    logger.warn("payment signature mismatch", { razorpayOrderId: input.razorpayOrderId });
    throw new AppError("PAYMENT_ERROR", "Payment verification failed", 402);
  }
  await connectDb();
  const userId = await userIdOrThrow(rawUserId);
  const order = await Order.findOne({ razorpayOrderId: input.razorpayOrderId, userId })
    .select("_id")
    .lean<{ _id: Types.ObjectId } | null>();
  if (!order) throw new AppError("NOT_FOUND", "Order not found", 404);
  const settled = await settleOrderPaid(order._id, input.razorpayPaymentId, `verify:${input.razorpayPaymentId}`);
  return toOrderDTO(settled);
}

interface WebhookPaymentEntity {
  id: string;
  order_id?: string;
  payment_id?: string;
}

/** Async Razorpay webhook settlement. Always ack (200) unless the signature is bad. */
export async function handleWebhookEvent(eventId: string, event: string, entity: WebhookPaymentEntity): Promise<{ ack: boolean; settled: boolean }> {
  await connectDb();
  let razorpayOrderId = entity.order_id;
  if (!razorpayOrderId) {
    // Refund events reference the payment, not the order.
    const paymentId = entity.payment_id ?? entity.id;
    const payment = await Payment.findOne({ razorpayPaymentId: paymentId })
      .select("razorpayOrderId")
      .lean<{ razorpayOrderId: string } | null>();
    razorpayOrderId = payment?.razorpayOrderId;
  }
  if (!razorpayOrderId) {
    logger.warn("webhook without order reference", { eventId, event });
    return { ack: true, settled: false };
  }
  const order = await Order.findOne({ razorpayOrderId }).lean<LeanOrder | null>();
  if (!order) {
    logger.warn("webhook for unknown order", { eventId, event });
    return { ack: true, settled: false };
  }
  const payment = await Payment.findOne({ orderId: order._id });
  if (payment?.processedEvents.includes(eventId)) {
    return { ack: true, settled: false };
  }

  if (event === "payment.captured") {
    try {
      await settleOrderPaid(order._id, entity.id, eventId);
      return { ack: true, settled: true };
    } catch (error) {
      logger.warn("webhook settle skipped", {
        eventId,
        message: error instanceof Error ? error.message : "unknown",
      });
      if (payment) {
        await Payment.updateOne({ _id: payment._id }, { $addToSet: { processedEvents: eventId } });
      }
      return { ack: true, settled: false };
    }
  }
  if (event === "payment.failed") {
    await Order.updateOne(
      { _id: order._id, paymentStatus: "PENDING" },
      {
        $set: { paymentStatus: "FAILED" },
        $push: { timeline: { status: "PENDING" as OrderStatus, at: new Date(), note: "Payment failed" } },
      },
    );
    if (payment) {
      await Payment.updateOne(
        { _id: payment._id },
        { $set: { status: "FAILED" }, $addToSet: { processedEvents: eventId } },
      );
    }
    return { ack: true, settled: false };
  }
  if (event === "refund.processed") {
    if (order.paymentStatus === "PAID") {
      await restockSold(linesOf(order), order._id, "Refund processed");
      await Order.updateOne(
        { _id: order._id },
        {
          $set: { paymentStatus: "REFUNDED", orderStatus: "REFUNDED" },
          $push: { timeline: { status: "REFUNDED" as OrderStatus, at: new Date(), note: "Refund processed" } },
        },
      );
      if (payment) {
        await Payment.updateOne(
          { _id: payment._id },
          { $set: { status: "REFUNDED" }, $addToSet: { processedEvents: eventId } },
        );
      }
      const fresh = await Order.findById(order._id).lean<LeanOrder | null>();
      if (fresh) await notifyRefund(order.userId.toString(), toOrderDTO(fresh));
      return { ack: true, settled: true };
    }
    if (payment) {
      await Payment.updateOne({ _id: payment._id }, { $addToSet: { processedEvents: eventId } });
    }
    return { ack: true, settled: false };
  }
  if (payment) {
    await Payment.updateOne({ _id: payment._id }, { $addToSet: { processedEvents: eventId } });
  }
  return { ack: true, settled: false };
}

/** Customer cancel: PENDING orders only (hold + coupon released). */
export async function cancelOrder(rawUserId: string, orderId: string, reason?: string): Promise<OrderDTO> {
  await connectDb();
  const userId = await userIdOrThrow(rawUserId);
  if (!Types.ObjectId.isValid(orderId)) throw new AppError("NOT_FOUND", "Order not found", 404);
  const order = await Order.findOne({ _id: orderId, userId }).lean<LeanOrder | null>();
  if (!order) throw new AppError("NOT_FOUND", "Order not found", 404);
  if (order.orderStatus !== "PENDING" || order.paymentStatus !== "PENDING") {
    throw new AppError("CONFLICT", "Order can no longer be cancelled — contact support", 409);
  }
  await releaseHold(linesOf(order), order._id, reason ?? "Customer cancelled");
  if (order.couponCode) {
    const coupon = await Coupon.findOne({ code: order.couponCode }).select("_id").lean();
    if (coupon) await releaseCouponUse(coupon._id.toString());
  }
  const updated = await Order.findOneAndUpdate(
    { _id: order._id, orderStatus: "PENDING" },
    {
      $set: { orderStatus: "CANCELLED" },
      $push: { timeline: { status: "CANCELLED" as OrderStatus, at: new Date(), note: reason ?? "Customer cancelled" } },
    },
    { returnDocument: "after" },
  ).lean<LeanOrder | null>();
  if (!updated) throw new AppError("CONFLICT", "Order changed state — please refresh", 409);
  await notifyCancellation(userId.toString(), toOrderDTO(updated), reason);
  return toOrderDTO(updated);
}

export async function getOrderForUser(rawUserId: string, orderId: string): Promise<OrderDTO> {
  await connectDb();
  const userId = await userIdOrThrow(rawUserId);
  if (!Types.ObjectId.isValid(orderId)) throw new AppError("NOT_FOUND", "Order not found", 404);
  const order = await Order.findOne({ _id: orderId, userId }).lean<LeanOrder | null>();
  if (!order) throw new AppError("NOT_FOUND", "Order not found", 404);
  return toOrderDTO(order);
}

export async function listUserOrders(
  rawUserId: string,
  page: number,
  limit: number,
): Promise<{ orders: OrderDTO[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  await connectDb();
  const userId = await userIdOrThrow(rawUserId);
  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const safePage = Math.max(page, 1);
  const [total, docs] = await Promise.all([
    Order.countDocuments({ userId }),
    Order.find({ userId })
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean<LeanOrder[]>(),
  ]);
  return {
    orders: docs.map(toOrderDTO),
    pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) },
  };
}
