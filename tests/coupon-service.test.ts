import mongoose, { Types } from "mongoose";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectDb, resetDbCache } from "@/lib/db";
import { Category } from "@/models/Category";
import { Coupon } from "@/models/Coupon";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { User } from "@/models/User";
import {
  releaseCouponUse,
  reserveCouponUse,
  validateCoupon,
} from "@/services/coupon-service";

const USER = "Meera";
const LINES = [{ productId: "p1", qty: 2, unitPrice: 500 }];

interface CouponOverrides {
  code?: string;
  type?: "PERCENTAGE" | "FIXED";
  value?: number;
  minimumOrderValue?: number;
  maximumDiscount?: number;
  applicableCategoryIds?: Types.ObjectId[];
  firstOrderOnly?: boolean;
  usageLimit?: number;
  isActive?: boolean;
  expiresAt?: Date;
}

async function makeCoupon(overrides: CouponOverrides = {}) {
  return Coupon.create({
    code: "TEST10",
    type: "PERCENTAGE",
    value: 10,
    minimumOrderValue: 0,
    isActive: true,
    ...overrides,
  });
}

describe("coupon service", () => {
  let mongod: MongoMemoryServer | undefined;
  let userId: string;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();
    resetDbCache();
    await connectDb();
    await Category.syncIndexes();
    await Coupon.syncIndexes();
    await Order.syncIndexes();
    await Product.syncIndexes();
    await User.syncIndexes();
    const user = await User.create({ email: "coupon@x.co", name: USER });
    userId = user._id.toString();
  }, 120000);

  afterAll(async () => {
    await mongoose.disconnect();
    resetDbCache();
    if (mongod) await mongod.stop();
  });

  afterEach(async () => {
    await Coupon.deleteMany({});
    await Order.deleteMany({});
  });

  it("computes percentage discounts with caps", async () => {
    await makeCoupon({ maximumDiscount: 50 });
    const check = await validateCoupon("test10", userId, LINES, 1000);
    expect(check).toMatchObject({ valid: true, discount: 50 });
  });

  it("computes fixed discounts bounded by the subtotal", async () => {
    await makeCoupon({ type: "FIXED", value: 200 });
    const check = await validateCoupon("TEST10", userId, LINES, 1000);
    expect(check.discount).toBe(200);
    const small = await validateCoupon("TEST10", userId, [{ productId: "p1", qty: 1, unitPrice: 100 }], 100);
    expect(small.discount).toBe(100);
  });

  it("rejects inactive, expired, and min-order violations", async () => {
    await makeCoupon({ isActive: false, code: "OFF" });
    await expect(validateCoupon("OFF", userId, LINES, 1000)).resolves.toMatchObject({
      valid: false,
      reason: "INACTIVE",
    });
    await makeCoupon({ code: "OLD", expiresAt: new Date(Date.now() - 1000) });
    await expect(validateCoupon("OLD", userId, LINES, 1000)).resolves.toMatchObject({
      valid: false,
      reason: "EXPIRED",
    });
    await makeCoupon({ code: "BIG", minimumOrderValue: 5000 });
    await expect(validateCoupon("BIG", userId, LINES, 1000)).resolves.toMatchObject({
      valid: false,
      reason: "MIN_ORDER_VALUE",
    });
    await expect(validateCoupon("NOPE", userId, LINES, 1000)).resolves.toMatchObject({
      valid: false,
      reason: "NOT_FOUND",
    });
  });

  it("enforces scope to products and categories", async () => {
    const cat = await Category.create({ name: "Rings", slug: "rings" });
    await makeCoupon({ code: "SCOPED", applicableCategoryIds: [cat._id] });
    const scopedLines = [{ productId: "p1", categoryId: cat._id.toString(), qty: 1, unitPrice: 400 }];
    const ok = await validateCoupon("SCOPED", userId, scopedLines, 400);
    expect(ok).toMatchObject({ valid: true, discount: 40 });
    const miss = await validateCoupon("SCOPED", userId, LINES, 1000);
    expect(miss).toMatchObject({ valid: false, reason: "SCOPE" });
  });

  it("reserves atomically under a usage limit", async () => {
    const coupon = await makeCoupon({ code: "ONCE", usageLimit: 1 });
    await reserveCouponUse(coupon._id.toString());
    await expect(reserveCouponUse(coupon._id.toString())).rejects.toMatchObject({ code: "CONFLICT" });
    const check = await validateCoupon("ONCE", userId, LINES, 1000);
    expect(check).toMatchObject({ valid: false, reason: "EXHAUSTED" });
    await releaseCouponUse(coupon._id.toString());
    const revived = await validateCoupon("ONCE", userId, LINES, 1000);
    expect(revived.valid).toBe(true);
  });

  it("restricts first-order-only coupons to new customers", async () => {
    await makeCoupon({ code: "FIRST", firstOrderOnly: true });
    const fresh = await validateCoupon("FIRST", userId, LINES, 1000);
    expect(fresh.valid).toBe(true);
    await Order.create({
      userId,
      items: [],
      shippingAddress: {
        fullName: "X",
        phone: "9876543210",
        addressLine1: "1",
        city: "C",
        state: "S",
        pincode: "396191",
      },
      subtotal: 100,
      discount: 0,
      shipping: 0,
      tax: 0,
      total: 100,
      paymentStatus: "PAID",
      orderStatus: "CONFIRMED",
    });
    const repeat = await validateCoupon("FIRST", userId, LINES, 1000);
    expect(repeat).toMatchObject({ valid: false, reason: "FIRST_ORDER_ONLY" });
  });
});
