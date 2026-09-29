import mongoose, { Types } from "mongoose";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectDb, resetDbCache } from "@/lib/db";
import { Category } from "@/models/Category";
import { Coupon } from "@/models/Coupon";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { User } from "@/models/User";
import { GarbaSpin } from "@/models/GarbaSpin";
import { GARBA_CAMPAIGN, GARBA_OFFERS } from "@/lib/garba-offers";
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
    await GarbaSpin.deleteMany({});
  });

  it("restricts wheel rewards to their paying account and disallows guest use", async () => {
    await Coupon.create({ code: "OWNER", type: "FIXED", value: 29, ownerUserId: userId });
    expect(await validateCoupon("OWNER", new Types.ObjectId().toString(), LINES, 1000)).toMatchObject({ valid: false });
    expect(await validateCoupon("OWNER", userId, LINES, 1000, undefined, false, true)).toMatchObject({ valid: false, reason: "SIGN_IN_REQUIRED" });
    expect(await validateCoupon("OWNER", userId, LINES, 1000)).toMatchObject({ valid: true, discount: 29 });
  });

  it("unlocks Nav29 only after a paid spin and revokes eligibility on refund", async () => {
    await Coupon.create({ code: "NAV29", type: "FIXED", value: 29, minimumOrderValue: 599, perUserLimit: 1, requiresGarbaPass: true });
    expect(await validateCoupon("Nav29", userId, LINES, 1000)).toMatchObject({ valid: false });
    const spin = await GarbaSpin.create({ userId, campaign: GARBA_CAMPAIGN, status: "PAID" });
    expect(await validateCoupon("Nav29", userId, LINES, 1000)).toMatchObject({ valid: true, discount: 29 });
    await GarbaSpin.updateOne({ _id: spin._id }, { $set: { status: "REFUNDED" } });
    expect(await validateCoupon("Nav29", userId, LINES, 1000)).toMatchObject({ valid: false });
  });

  it("uses only approved clearance spend for the 150-off threshold", async () => {
    const product = await Product.create({ name: "Clearance earrings", slug: "clearance-threshold", sku: "GARBA-THRESHOLD", description: "Test", categoryId: new Types.ObjectId(), price: 199, stock: 10, isPublished: true, tags: [GARBA_OFFERS[5].tag] });
    await Coupon.create({ code: "GGSCOPE", type: "FIXED", value: 1, garbaOfferIndex: 5, ownerUserId: userId, applicableProductIds: [product._id] });
    const selected = { productId: product._id.toString(), qty: 3, unitPrice: 199 };
    const unrelated = { productId: new Types.ObjectId().toString(), qty: 1, unitPrice: 999 };
    expect(await validateCoupon("GGSCOPE", userId, [selected, unrelated], 1596)).toMatchObject({ valid: false, reason: "SCOPE" });
    expect(await validateCoupon("GGSCOPE", userId, [{ ...selected, qty: 4 }, unrelated], 1795)).toMatchObject({ valid: true, discount: 150 });
    await Product.updateOne({ _id: product._id }, { $set: { tags: [] } });
    expect(await validateCoupon("GGSCOPE", userId, [{ ...selected, qty: 4 }], 796)).toMatchObject({ valid: false });
  });

  it("requires the approved gift as a normal inventory-tracked cart item", async () => {
    const paid = await Product.create({ name: "Paid piece", slug: "garba-paid", sku: "GARBA-PAID", description: "Test", categoryId: new Types.ObjectId(), price: 499, stock: 10, isPublished: true, tags: [GARBA_OFFERS[4].tag] });
    const gift = await Product.create({ name: "Gift piece", slug: "garba-gift", sku: "GARBA-GIFT", description: "Test", categoryId: new Types.ObjectId(), price: 199, stock: 10, isPublished: true, tags: ["garba-gift"] });
    await Coupon.create({ code: "GGGIFT", type: "FIXED", value: 1, garbaOfferIndex: 4, ownerUserId: userId, applicableProductIds: [paid._id], giftProductIds: [gift._id] });
    const pieces = [{ productId: paid._id.toString(), qty: 1, unitPrice: 499 }];
    expect(await validateCoupon("GGGIFT", userId, pieces, 499)).toMatchObject({ valid: false });
    expect(await validateCoupon("GGGIFT", userId, [...pieces, { productId: gift._id.toString(), qty: 1, unitPrice: 199 }], 698)).toMatchObject({ valid: true, discount: 199 });
    expect(await validateCoupon("GGGIFT", userId, [...pieces, { productId: gift._id.toString(), qty: 2, unitPrice: 199 }], 897)).toMatchObject({ valid: false });
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
