import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectDb, resetDbCache } from "@/lib/db";
import { Coupon } from "@/models/Coupon";
import { CouponRedemption } from "@/models/CouponRedemption";
import {
  createAdminCoupon,
  deleteAdminCoupon,
  listAdminCoupons,
  updateAdminCoupon,
} from "@/services/coupon-admin-service";

describe("coupon admin service", () => {
  let mongod: MongoMemoryServer | undefined;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();
    resetDbCache();
    await connectDb();
    await Coupon.syncIndexes();
    await CouponRedemption.syncIndexes();
  }, 120000);

  afterAll(async () => {
    await mongoose.disconnect();
    resetDbCache();
    if (mongod) await mongod.stop();
  });

  beforeEach(async () => {
    await Coupon.deleteMany({});
    await CouponRedemption.deleteMany({});
  });

  it("creates and lists coupons", async () => {
    const created = await createAdminCoupon({
      code: "welcome10",
      type: "PERCENTAGE",
      value: 10,
      minimumOrderValue: 0,
      applicableProductIds: [],
      applicableCategoryIds: [],
      firstOrderOnly: true,
      isActive: true,
    });
    expect(created.code).toBe("WELCOME10");
    const rows = await listAdminCoupons();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.usageCount).toBe(0);
  });

  it("rejects duplicate codes", async () => {
    await createAdminCoupon({
      code: "DUP",
      type: "FIXED",
      value: 50,
      minimumOrderValue: 0,
      applicableProductIds: [],
      applicableCategoryIds: [],
      firstOrderOnly: false,
      isActive: true,
    });
    await expect(
      createAdminCoupon({
        code: "dup",
        type: "FIXED",
        value: 60,
        minimumOrderValue: 0,
        applicableProductIds: [],
        applicableCategoryIds: [],
        firstOrderOnly: false,
        isActive: true,
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("keeps codes immutable and guards limits", async () => {
    const created = await createAdminCoupon({
      code: "LOCKED",
      type: "PERCENTAGE",
      value: 20,
      minimumOrderValue: 0,
      applicableProductIds: [],
      applicableCategoryIds: [],
      firstOrderOnly: false,
      isActive: true,
    });
    await expect(updateAdminCoupon(created.id, { code: "OTHER" })).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
    await expect(updateAdminCoupon(created.id, { value: 150 })).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
    const disabled = await updateAdminCoupon(created.id, { isActive: false });
    expect(disabled.isActive).toBe(false);
    await Coupon.updateOne({ _id: created.id }, { $set: { usageCount: 5 } });
    await expect(updateAdminCoupon(created.id, { usageLimit: 3 })).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it("clears optional limits and expiry when removed in the editor", async () => {
    const created = await createAdminCoupon({
      code: "LIMITED",
      type: "PERCENTAGE",
      value: 20,
      minimumOrderValue: 0,
      maximumDiscount: 100,
      applicableProductIds: [],
      applicableCategoryIds: [],
      firstOrderOnly: false,
      usageLimit: 10,
      perUserLimit: 2,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      isActive: true,
    });
    const updated = await updateAdminCoupon(created.id, {
      maximumDiscount: null,
      usageLimit: null,
      perUserLimit: null,
      expiresAt: null,
    });
    expect(updated).toMatchObject({ maximumDiscount: undefined, usageLimit: undefined, perUserLimit: undefined, expiresAt: undefined });
  });

  it("deletes only unused coupons", async () => {
    const fresh = await createAdminCoupon({
      code: "FRESH",
      type: "FIXED",
      value: 25,
      minimumOrderValue: 0,
      applicableProductIds: [],
      applicableCategoryIds: [],
      firstOrderOnly: false,
      isActive: true,
    });
    await deleteAdminCoupon(fresh.id);
    expect(await listAdminCoupons()).toHaveLength(0);

    const used = await createAdminCoupon({
      code: "USED",
      type: "FIXED",
      value: 25,
      minimumOrderValue: 0,
      applicableProductIds: [],
      applicableCategoryIds: [],
      firstOrderOnly: false,
      isActive: true,
    });
    await Coupon.updateOne({ _id: used.id }, { $set: { usageCount: 2 } });
    await expect(deleteAdminCoupon(used.id)).rejects.toMatchObject({ code: "CONFLICT" });
  });
});
