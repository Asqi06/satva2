import { Types } from "mongoose";
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
 * Variants: reservation is tracked on the product row; variant rows are
 * checked at reserve time and decremented at sale time (documented
 * residual race — see ADR-014).
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
): Promise<void> {
  await InventoryTransaction.create({ productId, variantSku, type, quantity, orderId, reason });
}

/** Hold units for a PENDING order. Throws 409 when stock raced away. */
export async function reserveUnits(lines: ReserveLine[], orderId: Types.ObjectId): Promise<void> {
  await connectDb();
  for (const line of lines) {
    const variantMatch = line.variantSku
      ? { variants: { $elemMatch: { sku: skuEquals(line.variantSku), stock: { $gte: line.qty } } } }
      : {};
    const updated = await Product.findOneAndUpdate(
      {
        _id: new Types.ObjectId(line.productId),
        isPublished: true,
        $expr: { $gte: [{ $subtract: ["$stock", "$reservedStock"] }, line.qty] },
        ...variantMatch,
      },
      { $inc: { reservedStock: line.qty } },
    );
    if (!updated) {
      throw new AppError("CONFLICT", "Some items just sold out — please review your bag", 409);
    }
    await logTx(updated._id, line.variantSku, "RESERVE", line.qty, orderId);
  }
}

/** Convert holds into a sale (PAID). */
export async function finalizeSale(lines: ReserveLine[], orderId: Types.ObjectId): Promise<void> {
  await connectDb();
  for (const line of lines) {
    const doc = await Product.findById(line.productId).select("variants").lean();
    if (!doc) continue;
    if (line.variantSku) {
      await Product.updateOne(
        { _id: doc._id, "variants.sku": skuEquals(line.variantSku) },
        {
          $inc: {
            stock: -line.qty,
            reservedStock: -line.qty,
            soldQuantity: line.qty,
            "variants.$.stock": -line.qty,
          },
        },
      );
    } else {
      await Product.updateOne(
        { _id: doc._id },
        { $inc: { stock: -line.qty, reservedStock: -line.qty, soldQuantity: line.qty } },
      );
    }
    await logTx(doc._id, line.variantSku, "SALE", line.qty, orderId);
  }
}

/** Return held units (cancel / expiry). Never drives reserved below zero. */
export async function releaseHold(lines: ReserveLine[], orderId: Types.ObjectId, reason: string): Promise<void> {
  await connectDb();
  for (const line of lines) {
    const doc = await Product.findById(line.productId).select("reservedStock").lean();
    if (!doc) continue;
    const releasable = Math.min(line.qty, doc.reservedStock);
    if (releasable <= 0) continue;
    await Product.updateOne({ _id: doc._id }, { $inc: { reservedStock: -releasable } });
    await logTx(doc._id, line.variantSku, "RELEASE", releasable, orderId, reason);
  }
}

/** Restock sold units (post-sale cancel/refund). */
export async function restockSold(lines: ReserveLine[], orderId: Types.ObjectId, reason: string): Promise<void> {
  await connectDb();
  for (const line of lines) {
    const doc = await Product.findById(line.productId).select("_id").lean();
    if (!doc) continue;
    if (line.variantSku) {
      await Product.updateOne(
        { _id: doc._id, "variants.sku": skuEquals(line.variantSku) },
        { $inc: { stock: line.qty, soldQuantity: -line.qty, "variants.$.stock": line.qty } },
      );
    } else {
      await Product.updateOne(
        { _id: doc._id },
        { $inc: { stock: line.qty, soldQuantity: -line.qty } },
      );
    }
    await logTx(doc._id, line.variantSku, "RESTOCK", line.qty, orderId, reason);
  }
}

/**
 * Sweep expired PENDING reservations. Called lazily at order creation
 * (a dedicated cron wires to this in Phase 10). Returns expired count.
 */
/**
 * Bounded batch: each checkout drains the oldest expired holds without
 * risking serverless timeouts on a large backlog. Projection keeps the
 * scan lean; poison docs are cancelled defensively (see below).
 */
const SWEEP_BATCH = 25;

export async function releaseExpiredReservations(): Promise<number> {
  await connectDb();
  const expired = await Order.find({
    orderStatus: "PENDING",
    paymentStatus: "PENDING",
    reservationExpiresAt: { $lt: new Date() },
  })
    .sort({ reservationExpiresAt: 1 })
    .limit(SWEEP_BATCH)
    .select("_id items couponCode")
    .lean();
  let count = 0;
  for (const order of expired) {
    const cancelled = await Order.findOneAndUpdate(
      { _id: order._id, orderStatus: "PENDING", paymentStatus: "PENDING", reservationExpiresAt: { $lt: new Date() } },
      {
        $set: { orderStatus: "CANCELLED" },
        $push: { timeline: { status: "CANCELLED", at: new Date(), note: "Reservation expired" } },
      },
      { returnDocument: "after" },
    ).lean();
    if (!cancelled) continue;
    // ponytail: Claim before releasing the hold; a DB failure afterward needs inventory reconciliation.
    // One malformed legacy document must never 500 every new checkout.
    try {
      const items = Array.isArray(order.items) ? order.items : [];
      const lines: ReserveLine[] = [];
      for (const i of items) {
        const productId =
          typeof i?.productId === "string"
            ? i.productId
            : (i?.productId?.toString() ?? "");
        if (!productId || typeof i?.qty !== "number") continue;
        lines.push({ productId, variantSku: i.variantSku, qty: i.qty });
      }
      await releaseHold(lines, order._id, "Reservation expired");
      if (order.couponCode) {
        const doc = await Coupon.findOne({ code: order.couponCode }).select("_id").lean();
        if (doc) await releaseCouponUse(doc._id.toString());
      }
    } catch {
      // The order stays cancelled so this document cannot poison the sweep again.
    }
    count += 1;
  }
  return count;
}
