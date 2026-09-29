import { Types, type ClientSession } from "mongoose";
import { connectDb } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { Coupon, type ICoupon } from "@/models/Coupon";
import { CouponRedemption } from "@/models/CouponRedemption";
import { Order } from "@/models/Order";
import { GarbaSpin } from "@/models/GarbaSpin";
import { GARBA_CAMPAIGN, GARBA_OFFERS } from "@/lib/garba-offers";
import { garbaApprovedPrice, garbaDiscount, garbaMarginSafe } from "@/lib/garba-pricing";
import { Product } from "@/models/Product";

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
  | "USER_LIMIT"
  | "SIGN_IN_REQUIRED";

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
  session?: ClientSession,
  reservedUse = false,
  guest = false,
): Promise<CouponCheck> {
  await connectDb();
  const code = rawCode.trim().toUpperCase();
  const coupon = await Coupon.findOne({ code }).session(session ?? null).lean();
  if (!coupon) return { valid: false, discount: 0, reason: "NOT_FOUND" };
  if (coupon.ownerUserId || coupon.requiresGarbaPass) {
    if (guest || !Types.ObjectId.isValid(rawUserId)) {
      return { valid: false, discount: 0, reason: "SIGN_IN_REQUIRED" };
    }
    if (coupon.ownerUserId && coupon.ownerUserId.toString() !== rawUserId) {
      return { valid: false, discount: 0, reason: "NOT_FOUND" };
    }
    if (coupon.requiresGarbaPass && !await GarbaSpin.exists({
      userId: new Types.ObjectId(rawUserId), campaign: GARBA_CAMPAIGN, status: "PAID",
    }).session(session ?? null)) {
      return { valid: false, discount: 0, reason: "NOT_FOUND" };
    }
  }
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
  let garbaSaving: number | undefined;
  if (coupon.garbaOfferIndex !== undefined) {
    const offerIndex = coupon.garbaOfferIndex;
    const offer = GARBA_OFFERS[offerIndex];
    if (!offer || coupon.applicableProductIds.length === 0) return { valid: false, discount: 0, reason: "SCOPE" };
    const approved = await Product.find({ _id: { $in: coupon.applicableProductIds }, isPublished: true, tags: offer.tag }).select("_id").session(session ?? null).lean();
    const eligibleIds = new Set(approved.map(p => p._id.toString()));
    const approvedGifts = await Product.find({ _id: { $in: coupon.giftProductIds ?? [] }, isPublished: true, tags: "garba-gift" }).select("_id").session(session ?? null).lean();
    const giftIds = new Set(approvedGifts.map(p => p._id.toString()));
    const eligibleLines = lines.filter(l => eligibleIds.has(l.productId) && !giftIds.has(l.productId));
    const giftLines = lines.filter(l => giftIds.has(l.productId));
    if (eligibleLines.some(l => l.unitPrice < garbaApprovedPrice(offerIndex))) return { valid: false, discount: 0, reason: "SCOPE" };
    const saving = garbaDiscount(offerIndex, eligibleLines, giftLines);
    if (saving === null || saving <= 0) return { valid: false, discount: 0, reason: "SCOPE" };
    const receipts = [...eligibleLines, ...giftLines].reduce((n, l) => n + l.qty * l.unitPrice, 0) - saving;
    const pieces = [...eligibleLines, ...giftLines].reduce((n, l) => n + l.qty, 0);
    if (!garbaMarginSafe(receipts, pieces)) return { valid: false, discount: 0, reason: "SCOPE" };
    garbaSaving = saving;
  }
  if (coupon.requiresGarbaPass && !garbaMarginSafe(eligibleSubtotal - discountFor(coupon, eligibleSubtotal), scoped.reduce((n, l) => n + l.qty, 0))) {
    return { valid: false, discount: 0, reason: "SCOPE" };
  }

  if (guest && (coupon.firstOrderOnly || coupon.perUserLimit !== undefined)) {
    return { valid: false, discount: 0, reason: "SIGN_IN_REQUIRED", couponId: coupon._id.toString(), code };
  }
  if (coupon.firstOrderOnly && Types.ObjectId.isValid(rawUserId)) {
    const prior = await Order.exists({
      userId: new Types.ObjectId(rawUserId),
      $or: [{ paymentStatus: "PAID" }, { paymentStatus: "PENDING", orderStatus: "PENDING", couponCode: code }],
    }).session(session ?? null);
    if (prior) {
      return { valid: false, discount: 0, reason: "FIRST_ORDER_ONLY", couponId: coupon._id.toString(), code };
    }
  }
  if (coupon.usageLimit !== undefined && coupon.usageCount - (reservedUse ? 1 : 0) >= coupon.usageLimit) {
    return { valid: false, discount: 0, reason: "EXHAUSTED", couponId: coupon._id.toString(), code };
  }
  if (coupon.perUserLimit !== undefined && Types.ObjectId.isValid(rawUserId)) {
    const [used, pending] = await Promise.all([CouponRedemption.countDocuments({
      couponId: coupon._id,
      userId: new Types.ObjectId(rawUserId),
    }).session(session ?? null), Order.countDocuments({
      userId: new Types.ObjectId(rawUserId), couponCode: code,
      paymentStatus: "PENDING", orderStatus: "PENDING",
    }).session(session ?? null)]);
    if (used + pending >= coupon.perUserLimit) {
      return { valid: false, discount: 0, reason: "USER_LIMIT", couponId: coupon._id.toString(), code };
    }
  }
  return {
    valid: true,
    discount: garbaSaving ?? discountFor(coupon, eligibleSubtotal),
    couponId: coupon._id.toString(),
    code,
  };
}

/** Atomically consume one use. Throws 409 when exhausted/raced out. */
export async function reserveCouponUse(couponId: string, session?: ClientSession): Promise<void> {
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
    { session },
  );
  if (!reserved) throw new AppError("CONFLICT", "Coupon is no longer available", 409);
}

/**
 * Return one reserved use. Releases happen on single-fire transitions
 * (CAS cancel, PENDING-only sweep), with a conditional decrement at zero.
 */
export async function releaseCouponUse(couponId: string, session?: ClientSession): Promise<void> {
  await connectDb();
  await Coupon.updateOne({ _id: couponId, usageCount: { $gt: 0 } }, { $inc: { usageCount: -1 } }, { session });
}

/** Record per-user consumption at PAID time. Idempotent per order. */
export async function recordRedemption(couponId: string, userId: string, orderId: string, session?: ClientSession): Promise<void> {
  await connectDb();
  try {
    await CouponRedemption.create([{
      couponId: new Types.ObjectId(couponId),
      userId: new Types.ObjectId(userId),
      orderId: new Types.ObjectId(orderId),
    }], { session });
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
