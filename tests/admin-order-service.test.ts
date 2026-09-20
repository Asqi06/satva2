import mongoose, { Types } from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectDb, resetDbCache } from "@/lib/db";
import { refundRazorpayPayment } from "@/lib/razorpay";
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
  adminCancelOrder,
  getAdminOrder,
  listAdminOrders,
  refundOrder,
  updateOrderStatus,
} from "@/services/admin-order-service";
import { createOrder, getOrderForUser, listUserOrders } from "@/services/order-service";
import {
  notifyCancellation,
  notifyRefund,
  notifyShipped,
} from "@/lib/email";

vi.mock("@/lib/razorpay", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/razorpay")>();
  return {
    ...mod,
    refundRazorpayPayment: vi.fn(async () => "rfnd_test123"),
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
process.env.RAZORPAY_KEY_SECRET = "admin-order-secret";
process.env.RAZORPAY_WEBHOOK_SECRET = "admin-webhook-secret";

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

async function fixtures() {
  const customer = await User.create({ email: "cust@x.co", name: "Cust", addresses: [ADDRESS] });
  const stranger = await User.create({ email: "stranger@x.co", name: "Stranger" });
  const cat = await Category.create({ name: "Rings", slug: "rings" });
  const product = await Product.create({
    name: "Admin Ring",
    slug: "admin-ring",
    description: "d",
    categoryId: cat._id,
    images: [IMG],
    price: 500,
    sku: "ADM-001",
    stock: 10,
    isPublished: true,
  });
  await Cart.create({
    userId: customer._id,
    items: [{ productId: product._id, qty: 2, addedAt: new Date() }],
  });
  return { customer, stranger, product };
}

describe("admin orders", () => {
  let mongod: MongoMemoryServer | undefined;

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
    vi.mocked(refundRazorpayPayment).mockClear();
    vi.mocked(notifyShipped).mockClear();
    vi.mocked(notifyCancellation).mockClear();
    vi.mocked(notifyRefund).mockClear();
  });

  it("walks the state machine and rejects jumps", async () => {
    const { customer } = await fixtures();
    const addressId = (await User.findById(customer._id).select("addresses").lean())?.addresses[0]?._id.toString() ?? "";
    const { order } = await createOrder(customer._id.toString(), { addressId });
    await expect(updateOrderStatus(order.id, "SHIPPED")).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(updateOrderStatus(order.id, "BOGUS")).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    for (const next of ["CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"] as const) {
      const updated = await updateOrderStatus(order.id, next);
      expect(updated.orderStatus).toBe(next);
    }
    const delivered = await getAdminOrder(order.id);
    expect(delivered.timeline.length).toBeGreaterThanOrEqual(7);
    await expect(updateOrderStatus(order.id, "PROCESSING")).rejects.toMatchObject({ code: "CONFLICT" });
    const returned = await updateOrderStatus(order.id, "RETURNED");
    expect(returned.orderStatus).toBe("RETURNED");
    // One shipped email for the single SHIPPED transition.
    expect(vi.mocked(notifyShipped)).toHaveBeenCalledTimes(1);
  });

  it("admin-cancels unpaid orders and restores holds", async () => {
    const { customer, product } = await fixtures();
    const addressId = (await User.findById(customer._id).select("addresses").lean())?.addresses[0]?._id.toString() ?? "";
    const { order } = await createOrder(customer._id.toString(), { addressId });
    const cancelled = await adminCancelOrder(order.id, "No stock run");
    expect(cancelled.orderStatus).toBe("CANCELLED");
    const stored = await Product.findById(product._id).lean();
    expect(stored?.reservedStock).toBe(0);
    expect(stored?.stock).toBe(10);
    expect(vi.mocked(notifyCancellation)).toHaveBeenCalledTimes(1);
  });

  it("refuses paid cancels and refunds through Razorpay", async () => {
    const { customer, product } = await fixtures();
    const addressId = (await User.findById(customer._id).select("addresses").lean())?.addresses[0]?._id.toString() ?? "";
    const created = await createOrder(customer._id.toString(), { addressId });
    await Order.updateOne(
      { _id: created.order.id },
      { $set: { paymentStatus: "PAID", razorpayPaymentId: "pay_x" } },
    );
    await Product.updateOne(
      { _id: product._id },
      { $set: { stock: 8, reservedStock: 0, soldQuantity: 2 } },
    );
    await expect(adminCancelOrder(created.order.id, "x")).rejects.toMatchObject({ code: "CONFLICT" });
    const refunded = await refundOrder(created.order.id, "Defective");
    expect(refunded.paymentStatus).toBe("REFUNDED");
    expect(refunded.orderStatus).toBe("REFUNDED");
    expect(vi.mocked(refundRazorpayPayment)).toHaveBeenCalledWith("pay_x");
    const stored = await Product.findById(product._id).lean();
    expect(stored?.stock).toBe(10);
    expect(stored?.soldQuantity).toBe(0);
    await expect(refundOrder(created.order.id)).rejects.toMatchObject({ code: "CONFLICT" });
    expect(vi.mocked(notifyRefund)).toHaveBeenCalledTimes(1);
  });

  it("lists with filters and customer emails", async () => {
    const { customer } = await fixtures();
    const addressId = (await User.findById(customer._id).select("addresses").lean())?.addresses[0]?._id.toString() ?? "";
    await createOrder(customer._id.toString(), { addressId });
    const all = await listAdminOrders({ page: 1, limit: 20 });
    expect(all.pagination.total).toBe(1);
    expect(all.orders[0]?.customer.email).toBe("cust@x.co");
    const pending = await listAdminOrders({ orderStatus: "PENDING", page: 1, limit: 20 });
    expect(pending.pagination.total).toBe(1);
    const shipped = await listAdminOrders({ orderStatus: "SHIPPED", page: 1, limit: 20 });
    expect(shipped.pagination.total).toBe(0);
  });

  it("scopes customer reads to the owner", async () => {
    const { customer, stranger } = await fixtures();
    const addressId = (await User.findById(customer._id).select("addresses").lean())?.addresses[0]?._id.toString() ?? "";
    const { order } = await createOrder(customer._id.toString(), { addressId });
    await expect(getOrderForUser(stranger._id.toString(), order.id)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    const mine = await listUserOrders(customer._id.toString(), 1, 10);
    expect(mine.pagination.total).toBe(1);
    const theirs = await listUserOrders(stranger._id.toString(), 1, 10);
    expect(theirs.pagination.total).toBe(0);
    await expect(getAdminOrder(new Types.ObjectId().toString())).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
