import { Types } from "mongoose";
import { connectDb } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { Coupon, type ICoupon } from "@/models/Coupon";
import { CouponRedemption } from "@/models/CouponRedemption";
import type { CouponAdminInput } from "@/schemas/coupon";

/** Admin coupon management. Validation math lives in coupon-service. */

export interface AdminCouponRow {
  id: string;
  code: string;
  type: string;
  value: number;
  minimumOrderValue: number;
  maximumDiscount?: number;
  firstOrderOnly: boolean;
  usageLimit?: number;
  usageCount: number;
  perUserLimit?: number;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

type LeanCoupon = Omit<ICoupon, "_id" | "createdAt" | "updatedAt"> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

function toRow(doc: LeanCoupon): AdminCouponRow {
  return {
    id: doc._id.toString(),
    code: doc.code,
    type: doc.type,
    value: doc.value,
    minimumOrderValue: doc.minimumOrderValue,
    maximumDiscount: doc.maximumDiscount,
    firstOrderOnly: doc.firstOrderOnly,
    usageLimit: doc.usageLimit,
    usageCount: doc.usageCount,
    perUserLimit: doc.perUserLimit,
    expiresAt: doc.expiresAt?.toISOString(),
    isActive: doc.isActive,
    createdAt: doc.createdAt.toISOString(),
  };
}

function notFound(): AppError {
  return new AppError("NOT_FOUND", "Coupon not found", 404);
}

export async function listAdminCoupons(): Promise<AdminCouponRow[]> {
  await connectDb();
  const docs = await Coupon.find({}).sort({ createdAt: -1 }).lean<LeanCoupon[]>();
  return docs.map(toRow);
}

export async function createAdminCoupon(input: CouponAdminInput): Promise<AdminCouponRow> {
  await connectDb();
  const code = input.code.trim().toUpperCase();
  const taken = await Coupon.exists({ code });
  if (taken) throw new AppError("CONFLICT", "Coupon code already in use", 409);
  const created = await Coupon.create({
    code,
    type: input.type,
    value: input.value,
    minimumOrderValue: input.minimumOrderValue,
    maximumDiscount: input.maximumDiscount,
    applicableProductIds: input.applicableProductIds.map((id) => new Types.ObjectId(id)),
    applicableCategoryIds: input.applicableCategoryIds.map((id) => new Types.ObjectId(id)),
    firstOrderOnly: input.firstOrderOnly,
    usageLimit: input.usageLimit,
    perUserLimit: input.perUserLimit,
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
    isActive: input.isActive,
  });
  const doc = await Coupon.findById(created._id).lean<LeanCoupon | null>();
  if (!doc) throw notFound();
  return toRow(doc);
}

export async function updateAdminCoupon(
  id: string,
  input: Partial<CouponAdminInput>,
): Promise<AdminCouponRow> {
  await connectDb();
  if (!Types.ObjectId.isValid(id)) throw notFound();
  const doc = await Coupon.findById(id);
  if (!doc) throw notFound();
  if (input.code !== undefined && input.code.trim().toUpperCase() !== doc.code) {
    throw new AppError("VALIDATION_ERROR", "Coupon code is immutable — disable and recreate instead", 400);
  }
  if (input.type !== undefined) doc.type = input.type;
  if (input.value !== undefined) {
    if (doc.type === "PERCENTAGE" && input.value > 100) {
      throw new AppError("VALIDATION_ERROR", "Percentage value must be 1–100", 400);
    }
    doc.value = input.value;
  }
  if (input.minimumOrderValue !== undefined) doc.minimumOrderValue = input.minimumOrderValue;
  if (input.maximumDiscount !== undefined) doc.maximumDiscount = input.maximumDiscount;
  if (input.applicableProductIds !== undefined) {
    doc.applicableProductIds = input.applicableProductIds.map((pid) => new Types.ObjectId(pid));
  }
  if (input.applicableCategoryIds !== undefined) {
    doc.applicableCategoryIds = input.applicableCategoryIds.map((cid) => new Types.ObjectId(cid));
  }
  if (input.firstOrderOnly !== undefined) doc.firstOrderOnly = input.firstOrderOnly;
  if (input.usageLimit !== undefined) {
    if (input.usageLimit < doc.usageCount) {
      throw new AppError("VALIDATION_ERROR", "Usage limit cannot go below current usage", 400);
    }
    doc.usageLimit = input.usageLimit;
  }
  if (input.perUserLimit !== undefined) doc.perUserLimit = input.perUserLimit;
  if (input.expiresAt !== undefined) doc.expiresAt = new Date(input.expiresAt);
  if (input.isActive !== undefined) doc.isActive = input.isActive;
  await doc.save();
  const fresh = await Coupon.findById(id).lean<LeanCoupon | null>();
  if (!fresh) throw notFound();
  return toRow(fresh);
}

/** Delete only unused coupons; disable the rest (history must survive). */
export async function deleteAdminCoupon(id: string): Promise<void> {
  await connectDb();
  if (!Types.ObjectId.isValid(id)) throw notFound();
  const doc = await Coupon.findById(id).select("usageCount").lean();
  if (!doc) throw notFound();
  const redemptions = await CouponRedemption.countDocuments({ couponId: doc._id });
  if (doc.usageCount > 0 || redemptions > 0) {
    throw new AppError("CONFLICT", "Coupon has usage history — disable it instead of deleting", 409);
  }
  await Coupon.deleteOne({ _id: doc._id });
}
