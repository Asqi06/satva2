import { randomInt } from "node:crypto";
import mongoose from "mongoose";
import { connectDb } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { GARBA_CAMPAIGN, GARBA_OFFERS, GARBA_PRICE, garbaOfferIndex, type GarbaReward } from "@/lib/garba-offers";
import { createRazorpayOrder, fetchRazorpayPayment, getRazorpay, getRazorpayKeyId, verifyPaymentSignature } from "@/lib/razorpay";
import { Coupon } from "@/models/Coupon";
import { GarbaSpin, type IGarbaSpin } from "@/models/GarbaSpin";
import { Product } from "@/models/Product";
import { garbaApprovedPrice } from "@/lib/garba-pricing";

export function garbaPaymentsEnabled() {
  return process.env.GARBA_PAID_SPINS_ENABLED === "true";
}

function rewardDTO(spin: IGarbaSpin | null): GarbaReward | null {
  if (!spin || spin.status !== "PAID" || spin.offerIndex === undefined || !spin.rewardCode || !spin.rewardExpiresAt) return null;
  return { offerIndex: spin.offerIndex, code: spin.rewardCode, expiresAt: spin.rewardExpiresAt.toISOString(), gift: spin.gift };
}

/** Capture verification and coupon issuance are retryable, including after closing checkout. */
async function settleSpin(orderId: string, paymentId: string): Promise<GarbaReward> {
  const payment = await fetchRazorpayPayment(paymentId);
  if (payment.order_id !== orderId || Number(payment.amount) !== GARBA_PRICE * 100 || payment.currency !== "INR" || payment.status !== "captured" || Number(payment.amount_refunded ?? 0) > 0) {
    throw new AppError("PAYMENT_ERROR", "Payment is not yet captured. Refresh to check again; do not pay again.", 402);
  }
  const session = await mongoose.startSession();
  let result: GarbaReward | null = null;
  try {
    await session.withTransaction(async () => {
      const spin = await GarbaSpin.findOne({ razorpayOrderId: orderId }).session(session);
      if (!spin) throw new AppError("NOT_FOUND", "Spin not found", 404);
      if (spin.status === "REFUNDED") throw new AppError("PAYMENT_ERROR", "This spin was refunded", 409);
      if (spin.status === "PAID") { result = rewardDTO(spin); return; }
      const offerIndex = garbaOfferIndex(randomInt(100));
      const offer = GARBA_OFFERS[offerIndex];
      const eligible = await Product.find({ isPublished: true, tags: offer.tag, price: { $gte: garbaApprovedPrice(offerIndex) }, variants: { $size: 0 } }).select("_id").session(session).lean();
      const gifts = offerIndex === 4 || offerIndex === 6
        ? await Product.find({ isPublished: true, tags: "garba-gift", variants: { $size: 0 }, $expr: { $gt: ["$stock", "$reservedStock"] } }).select("_id name slug").session(session).lean() : [];
      if (!eligible.length || ((offerIndex === 4 || offerIndex === 6) && !gifts.length)) {
        throw new AppError("CONFLICT", "Your payment is saved. We are replenishing the reward collection; contact support or check back for your reward.", 409);
      }
      const selectedGifts = offerIndex === 6 ? [gifts[randomInt(gifts.length)]] : gifts;
      const code = `GG${spin._id.toString().toUpperCase()}`;
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await Coupon.create([{
        code, type: "FIXED", value: 1, minimumOrderValue: 0, garbaOfferIndex: offerIndex,
        applicableProductIds: eligible.map(p => p._id), giftProductIds: selectedGifts.map(p => p._id),
        ownerUserId: spin.userId, usageLimit: 1, perUserLimit: 1, expiresAt, isActive: true,
      }], { session });
      // Shared code, earned entitlement per account. No expiry for the guaranteed coupon.
      await Coupon.updateOne({ code: "NAV29" }, { $setOnInsert: {
        code: "NAV29", type: "FIXED", value: 29, minimumOrderValue: 599,
        perUserLimit: 1, requiresGarbaPass: true, isActive: true,
      } }, { upsert: true, session });
      spin.status = "PAID";
      spin.razorpayPaymentId = paymentId;
      spin.offerIndex = offerIndex;
      spin.rewardCode = code;
      spin.rewardExpiresAt = expiresAt;
      if (offerIndex === 6) spin.gift = { name: selectedGifts[0].name, slug: selectedGifts[0].slug };
      await spin.save({ session });
      result = rewardDTO(spin);
    });
  } finally { await session.endSession(); }
  if (!result) throw new AppError("INTERNAL_ERROR", "Reward could not be issued", 500);
  return result;
}

export async function getGarbaStatus(userId: string) {
  await connectDb();
  const spin = await GarbaSpin.findOne({ userId, campaign: GARBA_CAMPAIGN }).lean();
  if (spin?.status === "PENDING" && spin.razorpayOrderId) {
    const payments = await getRazorpay().orders.fetchPayments(spin.razorpayOrderId);
    const captured = payments.items.find(p => p.status === "captured" && Number(p.amount_refunded ?? 0) === 0);
    if (captured) return { reward: await settleSpin(spin.razorpayOrderId, captured.id), refunded: false };
  }
  return { reward: rewardDTO(spin), refunded: spin?.status === "REFUNDED" };
}

export async function createGarbaPayment(userId: string) {
  if (!garbaPaymentsEnabled()) throw new AppError("FORBIDDEN", "Paid spins are not open yet. You can try the free preview.", 403);
  await connectDb();
  const keyId = getRazorpayKeyId();
  await GarbaSpin.deleteOne({ userId, campaign: GARBA_CAMPAIGN, status: "PENDING", razorpayOrderId: { $exists: false }, createdAt: { $lt: new Date(Date.now() - 5 * 60_000) } });
  // Don't collect money for an uncurated campaign. Product tags are managed in the existing admin editor.
  const pools = await Promise.all(GARBA_OFFERS.map((offer, index) => Product.exists({ isPublished: true, tags: offer.tag,
    price: { $gte: garbaApprovedPrice(index) }, variants: { $size: 0 }, $expr: { $gt: ["$stock", "$reservedStock"] },
  })));
  const giftReady = await Product.exists({ isPublished: true, tags: "garba-gift", variants: { $size: 0 }, $expr: { $gt: ["$stock", "$reservedStock"] } });
  if (pools.some(pool => !pool) || !giftReady) throw new AppError("CONFLICT", "We are preparing the festive collections. Paid spins will be available soon.", 409);
  let spin = await GarbaSpin.findOne({ userId, campaign: GARBA_CAMPAIGN });
  if (spin && spin.status !== "PENDING") throw new AppError("CONFLICT", "One paid spin per account for this festival", 409);
  if (spin?.razorpayOrderId) return { keyId, orderId: spin.razorpayOrderId, amount: GARBA_PRICE * 100, currency: "INR" };
  if (spin) throw new AppError("CONFLICT", "Your payment is being prepared. Please retry shortly.", 409);
  spin = await GarbaSpin.create({ userId, campaign: GARBA_CAMPAIGN });
  try {
    const order = await createRazorpayOrder({ amountPaise: GARBA_PRICE * 100, receipt: spin._id.toString(), notes: { campaign: GARBA_CAMPAIGN, purpose: "garba-ghumar" } });
    spin.razorpayOrderId = order.id;
    await spin.save();
    return { keyId, orderId: order.id, amount: order.amount, currency: order.currency };
  } catch (error) {
    // The checkout order was never exposed to the browser, so no charge can be initiated.
    await GarbaSpin.deleteOne({ _id: spin._id, status: "PENDING", razorpayOrderId: { $exists: false } });
    throw error;
  }
}

export async function verifyGarbaPayment(userId: string, input: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) {
  await connectDb();
  const spin = await GarbaSpin.findOne({ userId, campaign: GARBA_CAMPAIGN, razorpayOrderId: input.razorpayOrderId });
  if (!spin) throw new AppError("NOT_FOUND", "Spin not found", 404);
  if (!verifyPaymentSignature(input)) throw new AppError("PAYMENT_ERROR", "Invalid payment signature", 402);
  return settleSpin(input.razorpayOrderId, input.razorpayPaymentId);
}

/** Returns null for regular store orders so the existing webhook flow handles them. */
export async function handleGarbaWebhook(event: string, entity: { id: string; order_id?: string; payment_id?: string }) {
  await connectDb();
  const paymentId = entity.payment_id ?? entity.id;
  let spin = await GarbaSpin.findOne(entity.order_id ? { razorpayOrderId: entity.order_id } : { razorpayPaymentId: paymentId });
  if (!spin && event === "refund.processed" && entity.payment_id) {
    const payment = await fetchRazorpayPayment(entity.payment_id);
    if (payment.order_id) spin = await GarbaSpin.findOne({ razorpayOrderId: payment.order_id });
  }
  if (!spin) return null;
  if (event === "payment.captured" && spin.status !== "REFUNDED" && spin.razorpayOrderId) {
    await settleSpin(spin.razorpayOrderId, entity.id);
  } else if (event === "refund.processed") {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await GarbaSpin.updateOne({ _id: spin._id }, { $set: { status: "REFUNDED" } }, { session });
        if (spin.rewardCode) await Coupon.updateOne({ code: spin.rewardCode }, { $set: { isActive: false } }, { session });
      });
    } finally { await session.endSession(); }
  }
  return { ack: true, settled: true };
}
