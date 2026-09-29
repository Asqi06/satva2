import { connectDb } from "@/lib/db";
import { GARBA_CAMPAIGN, GARBA_OFFERS } from "@/lib/garba-offers";
import { garbaApprovedPrice } from "@/lib/garba-pricing";
import { garbaProgress, type GarbaBenefit } from "@/lib/garba-benefit";
import { GarbaSpin } from "@/models/GarbaSpin";
import { Coupon } from "@/models/Coupon";
import { Product } from "@/models/Product";
import { getCartView } from "./cart-service";
import { validateCoupon } from "./coupon-service";

/** Account-owned rewards only; prices and eligibility always come from the server. */
export async function getGarbaBenefit(userId: string): Promise<GarbaBenefit | null> {
  await connectDb();
  const spin = await GarbaSpin.findOne({ userId, campaign: GARBA_CAMPAIGN, status: "PAID" }).lean();
  if (!spin?.rewardCode || spin.offerIndex === undefined) return null;
  const coupon = await Coupon.findOne({ code: spin.rewardCode, ownerUserId: userId }).lean();
  if (!coupon?.isActive || coupon.expiresAt && coupon.expiresAt.getTime() < Date.now() || coupon.usageLimit !== undefined && coupon.usageCount >= coupon.usageLimit) return null;
  const index = spin.offerIndex;
  const offer = GARBA_OFFERS[index];
  if (!offer) return null;
  const [cart, products, gifts] = await Promise.all([
    getCartView(userId),
    Product.find({ _id: { $in: coupon.applicableProductIds }, isPublished: true, tags: offer.tag, variants: { $size: 0 }, price: { $gte: garbaApprovedPrice(index) } }).select("_id").lean(),
    Product.find({ _id: { $in: coupon.giftProductIds ?? [] }, isPublished: true, tags: "garba-gift", variants: { $size: 0 }, $expr: { $gt: ["$stock", "$reservedStock"] } }).select("_id name slug price images").lean(),
  ]);
  const eligibleIds = new Set(products.map(p => p._id.toString()));
  const giftIds = new Set((coupon.giftProductIds ?? []).map(id => id.toString()));
  const lines = cart.items.filter(l => l.available);
  const selected = lines.filter(l => eligibleIds.has(l.productId) && !giftIds.has(l.productId));
  const giftCount = lines.filter(l => giftIds.has(l.productId)).reduce((n, l) => n + l.qty, 0);
  const count = selected.reduce((n, l) => n + l.qty, 0);
  const subtotal = selected.reduce((n, l) => n + l.qty * l.price, 0);
  const check = await validateCoupon(coupon.code, userId, lines.map(l => ({ productId: l.productId, categoryId: l.categoryId, qty: l.qty, unitPrice: l.price })), cart.subtotal);
  if (["EXHAUSTED", "USER_LIMIT", "EXPIRED", "INACTIVE", "NOT_FOUND"].includes(check.reason ?? "")) return null;
  const guidance = garbaProgress(index, count, subtotal, giftCount);
  return {
    offerIndex: index, code: coupon.code, valid: check.valid, discount: check.discount,
    message: check.valid ? `Your reward qualifies — ₹${check.discount} off automatically at checkout.` : guidance.progress === 95 ? "This selection doesn’t qualify yet. Check the selected collection or contact us for help." : guidance.message,
    progress: check.valid ? 100 : guidance.progress,
    eligibleProductIds: [...eligibleIds], giftCount,
    gifts: gifts.map(p => ({ productId: p._id.toString(), name: p.name, slug: p.slug, price: p.price, image: p.images[0] ? { secureUrl: p.images[0].secureUrl, alt: p.images[0].alt } : undefined })),
  };
}
