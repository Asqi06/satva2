import { Types } from "mongoose";
import { connectDb } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { Coupon, type ICoupon } from "@/models/Coupon";
import { CouponRedemption } from "@/models/CouponRedemption";
import { Order } from "@/models/Order";

/**
 * Coupon validation + atomic usage reservation. Reserve at order creation
 * (conditional $inc — only one concurrent checkout wins), release on
 * cancel/expiry, record per-user redemption at PAID time.
 */

export interface PricedLine {
  productId: string;
  categoryId?: string;
  qty: number;
  unitPrice: number;
}

export type CouponRejection =
  | "NOT_FOUND"
  | "INACTIVE"
  | "EXPIRED"
  | "MIN_ORDER_VALUE"
  | "SCOPE"
  | "FIRST_ORDER_ONLY"
  | "EXHAUSTED"
  | "USER_LIMIT";

export interface CouponCheck {
  valid: boolean;
  discount: number;
  reason?: CouponRejection;
  couponId?: string;
  code?: string;
}

function discountFor(coupon: ICoupon, eligibleSubtotal: number): number {
  if (eligibleSubtotal <= 0) return 0;
  const raw =
    coupon.type === "PERCENTAGE"
      ? Math.floor((eligibleSubtotal * coupon.value) / 100)
      : coupon.value;
  const capped =
    coupon.type === "PERCENTAGE" && coupon.maximumDiscount !== undefined
      ? Math.min(raw, coupon.maximumDiscount)
      : raw;
  return Math.min(capped, eligibleSubtotal);
}

export async function validateCoupon(
  rawCode: string,
  rawUserId: string,
  lines: PricedLine[],
  subtotal: number,
): Promise<CouponCheck> {
  await connectDb();
  const code = rawCode.trim().toUpperCase();
  const coupon = await Coupon.findOne({ code }).lean();
  if (!coupon) return { valid: false, discount: 0, reason: "NOT_FOUND" };
  if (!coupon.isActive) return { valid: false, discount: 0, reason: "INACTIVE", couponId: coupon._id.toString(), code };
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
    return { valid: false, discount: 0, reason: "EXPIRED", couponId: coupon._id.toString(), code };
  }
  if (subtotal < coupon.minimumOrderValue) {
    return { valid: false, discount: 0, reason: "MIN_ORDER_VALUE", couponId: coupon._id.toString(), code };
  }

  const scoped = lines.filter((line) => {
    const productScoped =
      coupon.applicableProductIds.length === 0 ||
      coupon.applicableProductIds.some((id) => id.toString() === line.productId);
    const categoryScoped =
      coupon.applicableCategoryIds.length === 0 ||
      (line.categoryId !== undefined &&
        coupon.applicableCategoryIds.some((id) => id.toString() === line.categoryId));
    return productScoped && categoryScoped;
  });
  if ((coupon.applicableProductIds.length > 0 || coupon.applicableCategoryIds.length > 0) && scoped.length === 0) {
    return { valid: false, discount: 0, reason: "SCOPE", couponId: coupon._id.toString(), code };
  }
  const eligibleSubtotal = scoped.reduce((n, l) => n + l.qty * l.unitPrice, 0);

  if (coupon.firstOrderOnly && Types.ObjectId.isValid(rawUserId)) {
    const prior = await Order.exists({
      userId: new Types.ObjectId(rawUserId),
      paymentStatus: "PAID",
    });
    if (prior) {
      return { valid: false, discount: 0, reason: "FIRST_ORDER_ONLY", couponId: coupon._id.toString(), code };
    }
  }
  if (coupon.usageLimit !== undefined && coupon.usageCount >= coupon.usageLimit) {
    return { valid: false, discount: 0, reason: "EXHAUSTED", couponId: coupon._id.toString(), code };
  }
  if (coupon.perUserLimit !== undefined && Types.ObjectId.isValid(rawUserId)) {
    const used = await CouponRedemption.countDocuments({
      couponId: coupon._id,
      userId: new Types.ObjectId(rawUserId),
    });
    if (used >= coupon.perUserLimit) {
      return { valid: false, discount: 0, reason: "USER_LIMIT", couponId: coupon._id.toString(), code };
    }
  }
  return {
    valid: true,
    discount: discountFor(coupon, eligibleSubtotal),
    couponId: coupon._id.toString(),
    code,
  };
}

/** Atomically consume one use. Throws 409 when exhausted/raced out. */
export async function reserveCouponUse(couponId: string): Promise<void> {
  await connectDb();
  const now = new Date();
  const reserved = await Coupon.findOneAndUpdate(
    {
      _id: new Types.ObjectId(couponId),
      isActive: true,
      $and: [
        { $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }] },
        {
          $or: [
            { usageLimit: { $exists: false } },
            { $expr: { $lt: ["$usageCount", "$usageLimit"] } },
          ],
        },
      ],
    },
    { $inc: { usageCount: 1 } },
  );
  if (!reserved) throw new AppError("CONFLICT", "Coupon is no longer available", 409);
}

/**
 * Return one reserved use. Releases happen on single-fire transitions
 * (CAS cancel, PENDING-only sweep), so a read-then-decrement guarded at
 * zero is sufficient — no pipeline update needed.
 */
export async function releaseCouponUse(couponId: string): Promise<void> {
  await connectDb();
  const doc = await Coupon.findById(couponId).select("usageCount").lean();
  if (doc && doc.usageCount > 0) {
    await Coupon.updateOne({ _id: doc._id }, { $inc: { usageCount: -1 } });
  }
}

/** Record per-user consumption at PAID time. Idempotent per order. */
export async function recordRedemption(couponId: string, userId: string, orderId: string): Promise<void> {
  await connectDb();
  try {
    await CouponRedemption.create({
      couponId: new Types.ObjectId(couponId),
      userId: new Types.ObjectId(userId),
      orderId: new Types.ObjectId(orderId),
    });
  } catch (error) {
    if (
      error !== null &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: unknown }).code === 11000
    ) {
      return;
    }
    throw error;
  }
}
