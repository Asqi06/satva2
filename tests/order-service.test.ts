import crypto from "node:crypto";
import mongoose, { Types } from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { connectDb, resetDbCache } from "@/lib/db";
import { createRazorpayOrder, fetchRazorpayPayment } from "@/lib/razorpay";
import { Cart } from "@/models/Cart";
import { Category } from "@/models/Category";
import { Coupon } from "@/models/Coupon";
import { CouponRedemption } from "@/models/CouponRedemption";
import { InventoryTransaction } from "@/models/InventoryTransaction";
import { Order } from "@/models/Order";
import { Payment } from "@/models/Payment";
import { Product } from "@/models/Product";
import { User } from "@/models/User";
import {
  cancelOrder,
  createOrder,
  createPaymentOrder,
  handleWebhookEvent,
  verifyPayment,
} from "@/services/order-service";
import {
  notifyCancellation,
  notifyOrderConfirmation,
  notifyPaymentReceipt,
  notifyRefund,
} from "@/lib/email";
import { reserveUnits, releaseExpiredReservations } from "@/services/inventory-service";
import { replaceGuestCart } from "@/services/cart-service";

let rzpCounter = 0;
let paymentAmount = 0;

vi.mock("@/lib/razorpay", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/razorpay")>();
  return {
    ...mod,
    createRazorpayOrder: vi.fn(async (opts: { amountPaise: number }) => {
      paymentAmount = opts.amountPaise;
      return { id: `order_mock_${++rzpCounter}`, amount: opts.amountPaise, currency: "INR" };
    }),
    fetchRazorpayPayment: vi.fn(async (id: string) => ({ id, order_id: `order_mock_${rzpCounter}`, amount: paymentAmount, currency: "INR", status: "captured", amount_refunded: paymentAmount })),
  };
});

vi.mock("@/lib/email", () => ({
  notifyWelcome: vi.fn(),
  notifyOrderConfirmation: vi.fn(),
  notifyPaymentReceipt: vi.fn(),
  notifyShipped: vi.fn(),
  notifyOutForDelivery: vi.fn(),
  notifyDelivered: vi.fn(),
  notifyCancellation: vi.fn(),
  notifyRefund: vi.fn(),
}));

process.env.RAZORPAY_KEY_ID = "rzp_test_id";
process.env.RAZORPAY_KEY_SECRET = "order-test-secret";
process.env.RAZORPAY_WEBHOOK_SECRET = "order-webhook-secret";

const IMG = {
  publicId: "t/1",
  secureUrl: "https://res.cloudinary.com/x/image/upload/t/1",
  alt: "Piece",
  isThumbnail: true,
};
const ADDRESS = {
  fullName: "Test User",
  phone: "9876543210",
  addressLine1: "1 Main St",
  city: "Vapi",
  state: "Gujarat",
  pincode: "396191",
  isDefault: true,
};

function paymentSig(orderId: string, paymentId: string): string {
  return crypto
    .createHmac("sha256", "order-test-secret")
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
}

describe("order service", () => {
  let mongod: MongoMemoryReplSet | undefined;
  let userId: string;
  let addressId: string;
  let productId: string;

  beforeAll(async () => {
    mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    process.env.MONGODB_URI = mongod.getUri();
    resetDbCache();
    await connectDb();
    for (const m of [Cart, Category, Coupon, CouponRedemption, InventoryTransaction, Order, Payment, Product, User]) {
      await m.syncIndexes();
    }
  }, 120000);

  afterAll(async () => {
    await mongoose.disconnect();
    resetDbCache();
    if (mongod) await mongod.stop();
  });

  beforeEach(async () => {
    await Cart.deleteMany({});
    await Category.deleteMany({});
    await Coupon.deleteMany({});
    await CouponRedemption.deleteMany({});
    await InventoryTransaction.deleteMany({});
    await Order.deleteMany({});
    await Payment.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});
    vi.mocked(createRazorpayOrder).mockClear();
    vi.mocked(fetchRazorpayPayment).mockClear();
    vi.mocked(notifyOrderConfirmation).mockClear();
    vi.mocked(notifyPaymentReceipt).mockClear();
    vi.mocked(notifyCancellation).mockClear();
    vi.mocked(notifyRefund).mockClear();
    rzpCounter = 0;
    const user = await User.create({ email: "buyer@x.co", name: "Buyer", addresses: [ADDRESS] });
    userId = user._id.toString();
    addressId = user.addresses[0]?._id.toString() ?? "";
    const cat = await Category.create({ name: "Rings", slug: "rings" });
    const product = await Product.create({
      name: "Order Ring",
      slug: "order-ring",
      description: "d",
      categoryId: cat._id,
      images: [IMG],
      price: 500,
      sku: "ORD-001",
      stock: 10,
      isPublished: true,
    });
    productId = product._id.toString();
    await Cart.create({ userId: new Types.ObjectId(userId), items: [{ productId: product._id, qty: 2, addedAt: new Date() }] });
  });

  it("creates orders with server-calculated totals and reserves stock", async () => {
    const { order, excluded } = await createOrder(userId, { addressId });
    expect(excluded).toBe(0);
    expect(order).toMatchObject({ subtotal: 1000, discount: 0, shipping: 0, tax: 0, total: 1000 });
    expect(order.orderStatus).toBe("PENDING");
    expect(order.paymentStatus).toBe("PENDING");
    const product = await Product.findById(productId).lean();
    expect(product?.reservedStock).toBe(2);
    expect(product?.stock).toBe(10);
    const cart = await Cart.findOne({ userId: new Types.ObjectId(userId) }).lean();
    expect(cart?.items).toEqual([]);
  });

  it("creates guest orders without accounts, reprices the cart and protects payment ownership", async () => {
    const guestId = new Types.ObjectId().toString();
    const stranger = new Types.ObjectId().toString();
    const items = [{ productId, qty: 2 }];
    await replaceGuestCart(guestId, { items });
    const cart = await replaceGuestCart(guestId, { items });
    expect(cart.count).toBe(2);
    await Product.updateOne({ _id: productId }, { $set: { price: 550 } });
    const { order } = await createOrder(guestId, { email: "guest@example.com", address: ADDRESS }, true);
    expect(order).toMatchObject({ isGuest: true, customerEmail: "guest@example.com", subtotal: 1100, total: 1100 });
    expect(await User.findById(guestId)).toBeNull();
    expect(await User.countDocuments()).toBe(1);
    await expect(createPaymentOrder(stranger, order.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(cancelOrder(stranger, order.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    const payment = await createPaymentOrder(guestId, order.id);
    expect(payment.amount).toBe(110000);
    const paid = await verifyPayment(guestId, { razorpayOrderId: payment.razorpayOrderId, razorpayPaymentId: "pay_guest", razorpaySignature: paymentSig(payment.razorpayOrderId, "pay_guest") });
    expect(paid.paymentStatus).toBe("PAID");
    expect(vi.mocked(notifyOrderConfirmation)).toHaveBeenCalledWith(guestId, expect.objectContaining({ customerEmail: "guest@example.com" }));
  });

  it("validates guest contact details and prevents resetting anonymous identity to reuse account-only coupons", async () => {
    const guestId = new Types.ObjectId().toString();
    await replaceGuestCart(guestId, { items: [{ productId, qty: 1 }] });
    await expect(createOrder(guestId, { email: "invalid", address: ADDRESS }, true)).rejects.toThrow();
    await Coupon.create({ code: "MEMBER", type: "FIXED", value: 50, firstOrderOnly: true, isActive: true });
    await expect(createOrder(guestId, { email: "guest@example.com", address: ADDRESS, couponCode: "MEMBER" }, true)).rejects.toMatchObject({ code: "CONFLICT", message: expect.stringContaining("SIGN_IN_REQUIRED") });
    expect(await Order.countDocuments()).toBe(0);
  });

  it("charges shipping below the free threshold", async () => {
    await Product.updateOne({ _id: productId }, { $set: { price: 100 } });
    await Cart.updateOne(
      { userId: new Types.ObjectId(userId) },
      { $set: { items: [{ productId: new Types.ObjectId(productId), qty: 1, addedAt: new Date() }] } },
    );
    const { order } = await createOrder(userId, { addressId });
    expect(order).toMatchObject({ subtotal: 100, shipping: 49, total: 149 });
  });

  it("applies coupons and rejects bad ones", async () => {
    await Coupon.create({ code: "FLAT50", type: "FIXED", value: 50, isActive: true });
    const { order } = await createOrder(userId, { addressId, couponCode: "flat50" });
    expect(order).toMatchObject({ discount: 50, total: 950, couponCode: "FLAT50" });
    const coupon = await Coupon.findOne({ code: "FLAT50" }).lean();
    expect(coupon?.usageCount).toBe(1);

    await Cart.updateOne(
      { userId: new Types.ObjectId(userId) },
      {
        $set: {
          items: [{ productId: new Types.ObjectId(productId), qty: 1, addedAt: new Date() }],
        },
      },
    );
    await expect(createOrder(userId, { addressId, couponCode: "NOPE" })).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });

  it("rejects empty bags and unknown addresses", async () => {
    await Cart.updateOne({ userId: new Types.ObjectId(userId) }, { $set: { items: [] } });
    await expect(createOrder(userId, { addressId })).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(
      createOrder(userId, { addressId: new Types.ObjectId().toString() }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("creates Razorpay orders idempotently", async () => {
    const { order } = await createOrder(userId, { addressId });
    const first = await createPaymentOrder(userId, order.id);
    expect(first.razorpayOrderId).toMatch(/^order_mock_/);
    expect(first.amount).toBe(100000);
    const second = await createPaymentOrder(userId, order.id);
    expect(second.razorpayOrderId).toBe(first.razorpayOrderId);
    expect(vi.mocked(createRazorpayOrder)).toHaveBeenCalledTimes(1);
  });

  it("verifies payment once and finalizes the sale", async () => {
    const { order } = await createOrder(userId, { addressId });
    const pay = await createPaymentOrder(userId, order.id);
    const sig = paymentSig(pay.razorpayOrderId, "pay_1");
    const paid = await verifyPayment(userId, {
      razorpayOrderId: pay.razorpayOrderId,
      razorpayPaymentId: "pay_1",
      razorpaySignature: sig,
    });
    expect(paid.paymentStatus).toBe("PAID");
    expect(paid.orderStatus).toBe("CONFIRMED");
    const product = await Product.findById(productId).lean();
    expect(product?.stock).toBe(8);
    expect(product?.reservedStock).toBe(0);
    expect(product?.soldQuantity).toBe(2);

    // Replay: same payment verifies idempotently without double-selling.
    const replay = await verifyPayment(userId, {
      razorpayOrderId: pay.razorpayOrderId,
      razorpayPaymentId: "pay_1",
      razorpaySignature: sig,
    });
    expect(replay.paymentStatus).toBe("PAID");
    const after = await Product.findById(productId).lean();
    expect(after?.soldQuantity).toBe(2);
    // Exactly one confirmation + receipt across verify and replay.
    expect(vi.mocked(notifyOrderConfirmation)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(notifyPaymentReceipt)).toHaveBeenCalledTimes(1);
  });

  it("rejects tampered signatures without touching the order", async () => {
    const { order } = await createOrder(userId, { addressId });
    const pay = await createPaymentOrder(userId, order.id);
    await expect(
      verifyPayment(userId, {
        razorpayOrderId: pay.razorpayOrderId,
        razorpayPaymentId: "pay_1",
        razorpaySignature: "tampered",
      }),
    ).rejects.toMatchObject({ code: "PAYMENT_ERROR" });
    const stored = await Order.findById(order.id).lean();
    expect(stored?.paymentStatus).toBe("PENDING");
  });

  it("does not settle payment for a cancelled order", async () => {
    const { order } = await createOrder(userId, { addressId });
    const pay = await createPaymentOrder(userId, order.id);
    await cancelOrder(userId, order.id, "Changed mind");
    await expect(verifyPayment(userId, {
      razorpayOrderId: pay.razorpayOrderId,
      razorpayPaymentId: "pay_late",
      razorpaySignature: paymentSig(pay.razorpayOrderId, "pay_late"),
    })).rejects.toMatchObject({ code: "CONFLICT" });
    expect((await Order.findById(order.id).lean())?.orderStatus).toBe("CANCELLED");
  });

  it("settles webhooks once and handles failures", async () => {
    const { order } = await createOrder(userId, { addressId });
    const pay = await createPaymentOrder(userId, order.id);

    const captured = await handleWebhookEvent("evt_1", "payment.captured", {
      id: "pay_web",
      order_id: pay.razorpayOrderId,
    });
    expect(captured).toEqual({ ack: true, settled: true });
    const replay = await handleWebhookEvent("evt_1", "payment.captured", {
      id: "pay_web",
      order_id: pay.razorpayOrderId,
    });
    expect(replay).toEqual({ ack: true, settled: false });
    const product = await Product.findById(productId).lean();
    expect(product?.soldQuantity).toBe(2);

    await Cart.updateOne(
      { userId: new Types.ObjectId(userId) },
      {
        $set: {
          items: [{ productId: new Types.ObjectId(productId), qty: 1, addedAt: new Date() }],
        },
      },
    );
    const second = await createOrder(userId, { addressId });
    const pay2 = await createPaymentOrder(userId, second.order.id);
    const failed = await handleWebhookEvent("evt_2", "payment.failed", {
      id: "pay_fail",
      order_id: pay2.razorpayOrderId,
    });
    expect(failed).toEqual({ ack: true, settled: false });
    const stored = await Order.findById(second.order.id).lean();
    expect(stored?.paymentStatus).toBe("PENDING");
  });

  it("refunds restock inventory", async () => {
    const { order } = await createOrder(userId, { addressId });
    const pay = await createPaymentOrder(userId, order.id);
    const sig = paymentSig(pay.razorpayOrderId, "pay_9");
    await verifyPayment(userId, {
      razorpayOrderId: pay.razorpayOrderId,
      razorpayPaymentId: "pay_9",
      razorpaySignature: sig,
    });
    const refunded = await handleWebhookEvent("evt_ref", "refund.processed", {
      id: "rfnd_1",
      payment_id: "pay_9",
    });
    expect(refunded).toEqual({ ack: true, settled: true });
    const stored = await Order.findById(order.id).lean();
    expect(stored?.paymentStatus).toBe("REFUNDED");
    const product = await Product.findById(productId).lean();
    expect(product?.stock).toBe(10);
    expect(product?.soldQuantity).toBe(0);
    // Webhook refund path notifies exactly once.
    expect(vi.mocked(notifyRefund)).toHaveBeenCalledTimes(1);
  });

  it("cancels pending orders and restores stock plus coupon", async () => {
    await Coupon.create({ code: "FLAT50", type: "FIXED", value: 50, isActive: true });
    const { order } = await createOrder(userId, { addressId, couponCode: "FLAT50" });
    const cancelled = await cancelOrder(userId, order.id, "Changed mind");
    expect(cancelled.orderStatus).toBe("CANCELLED");
    const product = await Product.findById(productId).lean();
    expect(product?.reservedStock).toBe(0);
    const coupon = await Coupon.findOne({ code: "FLAT50" }).lean();
    expect(coupon?.usageCount).toBe(0);
    await expect(cancelOrder(userId, order.id)).rejects.toMatchObject({ code: "CONFLICT" });
    expect(vi.mocked(notifyCancellation)).toHaveBeenCalledTimes(1);
  });

  it("refuses customer cancel once the order progresses", async () => {
    const { order } = await createOrder(userId, { addressId });
    await Order.updateOne({ _id: order.id }, { $set: { orderStatus: "CONFIRMED" } });
    await expect(cancelOrder(userId, order.id)).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("expires stale reservations", async () => {
    const { order } = await createOrder(userId, { addressId });
    await Order.updateOne(
      { _id: order.id },
      { $set: { reservationExpiresAt: new Date(Date.now() - 1000) } },
    );
    const count = await releaseExpiredReservations();
    expect(count).toBe(1);
    const stored = await Order.findById(order.id).lean();
    expect(stored?.orderStatus).toBe("CANCELLED");
    const product = await Product.findById(productId).lean();
    expect(product?.reservedStock).toBe(0);
  });

  it("scopes orders to their owner", async () => {
    const { order } = await createOrder(userId, { addressId });
    const stranger = new Types.ObjectId().toString();
    await expect(createPaymentOrder(stranger, order.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(cancelOrder(stranger, order.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
  it("rolls back every line if one reservation fails", async () => {
    const id = new Types.ObjectId();
    await expect(reserveUnits([
      { productId, qty: 1 }, { productId: new Types.ObjectId().toString(), qty: 1 },
    ], id)).rejects.toMatchObject({ code: "CONFLICT" });
    expect((await Product.findById(productId).lean())?.reservedStock).toBe(0);
    expect(await InventoryTransaction.countDocuments({ orderId: id })).toBe(0);
  });

  it("reserves the final variant unit for only one concurrent buyer", async () => {
    await Product.updateOne({ _id: productId }, { $set: { variants: [{ sku: "LAST", stock: 1 }] } });
    const results = await Promise.allSettled([1, 2].map(() => reserveUnits([{ productId, qty: 1, variantSku: "LAST" }], new Types.ObjectId())));
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const product = await Product.findById(productId).lean();
    expect(product?.reservedStock).toBe(1);
    expect(product?.variants[0]?.reservedStock).toBe(1);
  });

  it("rejects authorized, wrong-currency and wrong-amount payments even with a valid signature", async () => {
    const { order } = await createOrder(userId, { addressId });
    const pay = await createPaymentOrder(userId, order.id);
    for (const mismatch of [{ status: "authorized" }, { currency: "USD" }, { amount: 1 }]) {
      vi.mocked(fetchRazorpayPayment).mockResolvedValueOnce({ id: "pay_1", order_id: pay.razorpayOrderId, amount: pay.amount, currency: "INR", status: "captured", ...mismatch } as Awaited<ReturnType<typeof fetchRazorpayPayment>>);
      await expect(verifyPayment(userId, { razorpayOrderId: pay.razorpayOrderId, razorpayPaymentId: "pay_1", razorpaySignature: paymentSig(pay.razorpayOrderId, "pay_1") })).rejects.toMatchObject({ code: "PAYMENT_ERROR" });
    }
    expect((await Order.findById(order.id).lean())?.paymentStatus).toBe("PENDING");
  });

  it("rolls back a failed sale and settles successfully on webhook retry", async () => {
    const { order } = await createOrder(userId, { addressId });
    const pay = await createPaymentOrder(userId, order.id);
    const log = vi.spyOn(InventoryTransaction, "create").mockRejectedValueOnce(new Error("write failed"));
    await expect(handleWebhookEvent("evt_retry", "payment.captured", { id: "pay_retry", order_id: pay.razorpayOrderId })).rejects.toThrow("write failed");
    log.mockRestore();
    expect((await Order.findById(order.id).lean())?.paymentStatus).toBe("PENDING");
    expect((await Product.findById(productId).lean())?.stock).toBe(10);
    expect((await Payment.findOne({ orderId: order.id }).lean())?.processedEvents).not.toContain("evt_retry");
    await handleWebhookEvent("evt_retry", "payment.captured", { id: "pay_retry", order_id: pay.razorpayOrderId });
    expect((await Product.findById(productId).lean())?.stock).toBe(8);
  });

  it("keeps failed attempts retryable and ignores failures arriving after capture", async () => {
    const { order } = await createOrder(userId, { addressId });
    const pay = await createPaymentOrder(userId, order.id);
    await handleWebhookEvent("evt_failed", "payment.failed", { id: "pay_fail", order_id: pay.razorpayOrderId });
    await handleWebhookEvent("evt_paid", "payment.captured", { id: "pay_ok", order_id: pay.razorpayOrderId });
    await handleWebhookEvent("evt_late_fail", "payment.failed", { id: "pay_fail", order_id: pay.razorpayOrderId });
    expect((await Payment.findOne({ orderId: order.id }).lean())?.status).toBe("PAID");
  });

  it("does not restore stock or mark a partial refund as a full refund", async () => {
    const { order } = await createOrder(userId, { addressId });
    const pay = await createPaymentOrder(userId, order.id);
    await handleWebhookEvent("evt_capture", "payment.captured", { id: "pay_ref", order_id: pay.razorpayOrderId });
    vi.mocked(fetchRazorpayPayment).mockResolvedValueOnce({ id: "pay_ref", order_id: pay.razorpayOrderId, amount: pay.amount, currency: "INR", amount_refunded: 100 } as Awaited<ReturnType<typeof fetchRazorpayPayment>>);
    await handleWebhookEvent("evt_partial", "refund.processed", { id: "rfnd_partial", payment_id: "pay_ref" });
    expect((await Order.findById(order.id).lean())?.paymentStatus).toBe("PAID");
    expect((await Product.findById(productId).lean())?.stock).toBe(8);
  });

  it("enforces category-scoped coupons and reserves the per-user limit", async () => {
    const product = await Product.findById(productId).lean();
    await Coupon.create({ code: "CATEGORY", type: "FIXED", value: 50, applicableCategoryIds: [product!.categoryId], perUserLimit: 1, usageLimit: 1, isActive: true });
    const first = await createOrder(userId, { addressId, couponCode: "CATEGORY" });
    expect(first.order.discount).toBe(50);
    await Cart.updateOne({ userId }, { $set: { items: [{ productId: new Types.ObjectId(productId), qty: 1, addedAt: new Date() }] } });
    await expect(createOrder(userId, { addressId, couponCode: "CATEGORY" })).rejects.toMatchObject({ code: "CONFLICT" });
    await cancelOrder(userId, first.order.id);
    expect((await createOrder(userId, { addressId, couponCode: "CATEGORY" })).order.discount).toBe(50);
  });

  it("creates only one order when checkout is submitted twice concurrently", async () => {
    const results = await Promise.allSettled([createOrder(userId, { addressId }), createOrder(userId, { addressId })]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(await Order.countDocuments({ userId, orderStatus: "PENDING" })).toBe(1);
    expect((await Product.findById(productId).lean())?.reservedStock).toBe(2);
  });

  it("retries expiry without losing stock holds after an inventory write fails", async () => {
    const { order } = await createOrder(userId, { addressId });
    await Order.updateOne({ _id: order.id }, { $set: { reservationExpiresAt: new Date(0), paymentStatus: "FAILED" } });
    const log = vi.spyOn(InventoryTransaction, "create").mockRejectedValueOnce(new Error("release failed"));
    await expect(releaseExpiredReservations()).rejects.toThrow("release failed");
    log.mockRestore();
    expect((await Order.findById(order.id).lean())?.orderStatus).toBe("PENDING");
    expect((await Product.findById(productId).lean())?.reservedStock).toBe(2);
    expect(await releaseExpiredReservations()).toBe(1);
    expect((await Product.findById(productId).lean())?.reservedStock).toBe(0);
  });

});
