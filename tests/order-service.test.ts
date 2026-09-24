import crypto from "node:crypto";
import mongoose, { Types } from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectDb, resetDbCache } from "@/lib/db";
import { createRazorpayOrder } from "@/lib/razorpay";
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
import { releaseExpiredReservations } from "@/services/inventory-service";

let rzpCounter = 0;

vi.mock("@/lib/razorpay", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/razorpay")>();
  return {
    ...mod,
    createRazorpayOrder: vi.fn(async (opts: { amountPaise: number }) => ({
      id: `order_mock_${++rzpCounter}`,
      amount: opts.amountPaise,
      currency: "INR",
    })),
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
  let mongod: MongoMemoryServer | undefined;
  let userId: string;
  let addressId: string;
  let productId: string;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
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
    expect(stored?.paymentStatus).toBe("FAILED");
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
});
