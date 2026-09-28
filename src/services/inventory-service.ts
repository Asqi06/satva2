import { connection, Types, type ClientSession } from "mongoose";
import { connectDb } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { Coupon } from "@/models/Coupon";
import { InventoryTransaction } from "@/models/InventoryTransaction";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { releaseCouponUse } from "./coupon-service";
import { escapeRegExp } from "./product-service";

/**
 * Case-insensitive exact SKU match. Variant SKUs are uppercased at write
 * time now, but legacy rows may hold any case while carts always carry
 * uppercased SKUs — an exact match would silently miss those rows
 * (reserve 409s on available stock; finalize/restock no-ops leak holds).
 */
function skuEquals(sku: string): { $regex: string; $options: string } {
  return { $regex: `^${escapeRegExp(sku.trim())}$`, $options: "i" };
}

/**
 * Inventory movements. `stock` is truth, `reservedStock` is transient
 * holds from PENDING orders. available = stock − reserved.
 *
 * Product and variant reservations are checked and updated atomically.
 * Multi-line reservations and payment settlement require a MongoDB replica set.
 */

export interface ReserveLine {
  productId: string;
  variantSku?: string;
  qty: number;
}

async function logTx(
  productId: Types.ObjectId,
  variantSku: string | undefined,
  type: "RESERVE" | "RELEASE" | "SALE" | "RESTOCK",
  quantity: number,
  orderId?: Types.ObjectId,
  reason?: string,
  session?: ClientSession,
): Promise<void> {
  await InventoryTransaction.create([{ productId, variantSku, type, quantity, orderId, reason }], { session });
}

/** Hold units for a PENDING order. Throws 409 when stock raced away. */
export async function reserveUnits(lines: ReserveLine[], orderId: Types.ObjectId, session?: ClientSession): Promise<void> {
  await connectDb();
  if (!session) return connection.transaction((session) => reserveUnits(lines, orderId, session));
  for (const line of lines) {
    const variantMatch = line.variantSku
      ? { variants: { $elemMatch: { sku: skuEquals(line.variantSku), stock: { $gte: line.qty } } } }
      : {};
    const updated = await Product.findOneAndUpdate(
      {
        _id: new Types.ObjectId(line.productId),
        isPublished: true,
        $expr: { $and: [
          { $gte: [{ $subtract: ["$stock", { $ifNull: ["$reservedStock", 0] }] }, line.qty] },
          ...(line.variantSku ? [{ $gte: [{ $sum: { $map: {
            input: { $filter: { input: "$variants", as: "variant", cond: { $eq: [{ $toUpper: "$$variant.sku" }, line.variantSku.trim().toUpperCase()] } } },
            as: "variant", in: { $subtract: ["$$variant.stock", { $ifNull: ["$$variant.reservedStock", 0] }] },
          } } }, line.qty] }] : []),
        ] },
        ...variantMatch,
      },
      { $inc: { reservedStock: line.qty, ...(line.variantSku ? { "variants.$.reservedStock": line.qty } : {}) } },
      { session },
    );
    if (!updated) {
      throw new AppError("CONFLICT", "Some items just sold out — please review your bag", 409);
    }
    await logTx(updated._id, line.variantSku, "RESERVE", line.qty, orderId, undefined, session);
  }
}

/** Convert holds into a sale (PAID). */
export async function finalizeSale(lines: ReserveLine[], orderId: Types.ObjectId, session?: ClientSession): Promise<void> {
  await connectDb();
  for (const line of lines) {
    const doc = await Product.findById(line.productId).session(session ?? null).select("stock reservedStock variants").lean();
    if (!doc) throw new AppError("CONFLICT", "Reserved product no longer exists; payment needs reconciliation", 409);
    const variant = line.variantSku ? doc.variants.find((variant) => variant.sku.toUpperCase() === line.variantSku!.toUpperCase()) : undefined;
    if (doc.stock < line.qty || (doc.reservedStock ?? 0) < line.qty || (line.variantSku && (!variant || variant.stock < line.qty))) {
      throw new AppError("CONFLICT", "Reserved stock changed; payment needs reconciliation", 409);
    }
    if (line.variantSku) {
      await Product.updateOne(
        { _id: doc._id, "variants.sku": skuEquals(line.variantSku) },
        {
          $inc: {
            stock: -line.qty,
            reservedStock: -line.qty,
            soldQuantity: line.qty,
            "variants.$.stock": -line.qty,
            "variants.$.reservedStock": -Math.min(line.qty, doc.variants.find((variant) => variant.sku.toUpperCase() === line.variantSku!.toUpperCase())?.reservedStock ?? 0),
          },
        },
        { session },
      );
    } else {
      await Product.updateOne(
        { _id: doc._id },
        { $inc: { stock: -line.qty, reservedStock: -line.qty, soldQuantity: line.qty } },
        { session },
      );
    }
    await logTx(doc._id, line.variantSku, "SALE", line.qty, orderId, undefined, session);
  }
}

/** Return held units (cancel / expiry). Never drives reserved below zero. */
export async function releaseHold(lines: ReserveLine[], orderId: Types.ObjectId, reason: string, session?: ClientSession): Promise<void> {
  await connectDb();
  for (const line of lines) {
    const doc = await Product.findById(line.productId).session(session ?? null).select("reservedStock variants").lean();
    if (!doc) continue;
    const releasable = Math.min(line.qty, doc.reservedStock);
    if (releasable <= 0) continue;
    const variant = line.variantSku ? doc.variants.find((variant) => variant.sku.toUpperCase() === line.variantSku!.toUpperCase()) : undefined;
    await Product.updateOne(
      { _id: doc._id, ...(variant ? { "variants.sku": skuEquals(variant.sku) } : {}) },
      { $inc: { reservedStock: -releasable, ...(variant ? { "variants.$.reservedStock": -Math.min(releasable, variant.reservedStock ?? 0) } : {}) } },
      { session },
    );
    await logTx(doc._id, line.variantSku, "RELEASE", releasable, orderId, reason, session);
  }
}

/** Restock sold units (post-sale cancel/refund). */
export async function restockSold(lines: ReserveLine[], orderId: Types.ObjectId, reason: string, session?: ClientSession): Promise<void> {
  await connectDb();
  for (const line of lines) {
    const doc = await Product.findById(line.productId).session(session ?? null).select("_id").lean();
    if (!doc) throw new AppError("CONFLICT", "Reserved product no longer exists; payment needs reconciliation", 409);
    if (line.variantSku) {
      await Product.updateOne(
        { _id: doc._id, "variants.sku": skuEquals(line.variantSku) },
        { $inc: { stock: line.qty, soldQuantity: -line.qty, "variants.$.stock": line.qty } },
        { session },
      );
    } else {
      await Product.updateOne(
        { _id: doc._id },
        { $inc: { stock: line.qty, soldQuantity: -line.qty } },
        { session },
      );
    }
    await logTx(doc._id, line.variantSku, "RESTOCK", line.qty, orderId, reason, session);
  }
}

/**
 * Sweep expired PENDING reservations. Called lazily at order creation
 * (a dedicated cron wires to this in Phase 10). Returns expired count.
 */
/**
 * Bounded batch: each checkout drains the oldest expired holds without
 * risking serverless timeouts on a large backlog. Projection keeps the
 * scan lean; each order releases stock and coupon usage in one transaction.
 */
const SWEEP_BATCH = 25;

export async function releaseExpiredReservations(): Promise<number> {
  await connectDb();
  const expired = await Order.find({
    orderStatus: "PENDING",
    paymentStatus: { $in: ["PENDING", "FAILED"] },
    reservationExpiresAt: { $lt: new Date() },
  })
    .sort({ reservationExpiresAt: 1 })
    .limit(SWEEP_BATCH)
    .select("_id items couponCode")
    .lean();
  let count = 0;
  for (const order of expired) {
    const released = await connection.transaction(async (session) => {
      const cancelled = await Order.findOneAndUpdate(
        { _id: order._id, orderStatus: "PENDING", paymentStatus: { $in: ["PENDING", "FAILED"] }, reservationExpiresAt: { $lt: new Date() } },
        {
          $set: { orderStatus: "CANCELLED" },
          $push: { timeline: { status: "CANCELLED", at: new Date(), note: "Reservation expired" } },
        },
        { returnDocument: "after", session },
      ).lean();
      if (!cancelled) return false;
      const lines = (cancelled.items ?? []).filter((item) => Types.ObjectId.isValid(item.productId) && Number.isInteger(item.qty) && item.qty > 0)
        .map((item) => ({ productId: item.productId.toString(), variantSku: item.variantSku, qty: item.qty }));
      await releaseHold(lines, order._id, "Reservation expired", session);
      if (cancelled.couponCode) {
        const coupon = await Coupon.findOne({ code: cancelled.couponCode }).session(session).select("_id").lean();
        if (coupon) await releaseCouponUse(coupon._id.toString(), session);
      }
      return true;
    });
    if (released) count += 1;
  }
  return count;
}
