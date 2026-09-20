import { Types } from "mongoose";
import { connectDb } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { Cart } from "@/models/Cart";
import { Product, type IProduct } from "@/models/Product";
import type { CartItemInput, CartMergeInput } from "@/schemas/cart";

/**
 * Server carts. Prices/availability always come from products at read
 * time — the cart stores identity + quantity only.
 */

export interface CartViewItem {
  key: string;
  productId: string;
  categoryId: string;
  variantSku?: string;
  qty: number;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  image?: { secureUrl: string; alt: string };
  stock: number;
  available: boolean;
  adjusted: boolean;
}

export interface CartView {
  items: CartViewItem[];
  count: number;
  subtotal: number;
  unavailableCount: number;
}

export interface MergeSummary {
  added: number;
  capped: number;
  dropped: number;
}

export function cartKey(productId: string, variantSku?: string): string {
  return `${productId}:${(variantSku ?? "").trim().toUpperCase()}`;
}

export function parseCartKey(key: string): { productId: string; variantSku?: string } {
  const idx = key.indexOf(":");
  if (idx < 0) throw new AppError("VALIDATION_ERROR", "Invalid cart item", 400);
  const productId = key.slice(0, idx);
  const variantSku = key.slice(idx + 1) || undefined;
  if (!Types.ObjectId.isValid(productId)) {
    throw new AppError("VALIDATION_ERROR", "Invalid cart item", 400);
  }
  return { productId, variantSku };
}

type LeanProduct = Pick<
  IProduct,
  | "name"
  | "slug"
  | "price"
  | "compareAtPrice"
  | "sku"
  | "variants"
  | "images"
  | "stock"
  | "reservedStock"
  | "isPublished"
  | "categoryId"
> & { _id: Types.ObjectId };

function unitPrice(doc: LeanProduct, variantSku?: string): number {
  if (!variantSku) return doc.price;
  const variant = doc.variants.find((v) => v.sku.toUpperCase() === variantSku.toUpperCase());
  return variant?.price ?? doc.price;
}

function availableStock(doc: LeanProduct, variantSku?: string): number {
  if (variantSku) {
    const variant = doc.variants.find((v) => v.sku.toUpperCase() === variantSku.toUpperCase());
    if (!variant) return 0;
    return Math.max(variant.stock, 0);
  }
  return Math.max(doc.stock - doc.reservedStock, 0);
}

function toViewItem(
  productId: Types.ObjectId,
  variantSku: string | undefined,
  qty: number,
  doc: LeanProduct,
): CartViewItem {
  const stock = availableStock(doc, variantSku);
  const effective = Math.min(qty, stock);
  const cover = doc.images.find((i) => i.isThumbnail) ?? doc.images[0];
  return {
    key: cartKey(productId.toString(), variantSku),
    productId: productId.toString(),
    // Cart queries never populate: categoryId is always an ObjectId here.
    categoryId: doc.categoryId.toString(),
    variantSku,
    qty: effective,
    name: doc.name,
    slug: doc.slug,
    price: unitPrice(doc, variantSku),
    compareAtPrice: doc.compareAtPrice,
    image: cover ? { secureUrl: cover.secureUrl, alt: cover.alt } : undefined,
    stock,
    available: doc.isPublished && effective > 0,
    adjusted: effective !== qty,
  };
}

async function buildView(userId: Types.ObjectId): Promise<CartView> {
  const cart = await Cart.findOne({ userId }).lean();
  if (!cart || cart.items.length === 0) {
    return { items: [], count: 0, subtotal: 0, unavailableCount: 0 };
  }
  const ids = [...new Set(cart.items.map((i) => i.productId.toString()))];
  const docs = await Product.find({ _id: { $in: ids } }).lean<LeanProduct[]>();
  const byId = new Map(docs.map((d) => [d._id.toString(), d]));

  const items: CartViewItem[] = [];
  const prune: Types.ObjectId[] = [];
  for (const item of cart.items) {
    const doc = byId.get(item.productId.toString());
    if (!doc) {
      prune.push(item.productId);
      continue;
    }
    if (item.variantSku && availableStock(doc, item.variantSku) === 0 && !doc.variants.some((v) => v.sku.toUpperCase() === item.variantSku!.toUpperCase())) {
      prune.push(item.productId);
      continue;
    }
    const view = toViewItem(item.productId, item.variantSku, item.qty, doc);
    if (!doc.isPublished) view.available = false;
    items.push(view);
  }
  if (prune.length > 0) {
    await Cart.updateOne({ userId }, { $pull: { items: { productId: { $in: prune } } } });
  }
  const available = items.filter((i) => i.available);
  return {
    items,
    count: available.reduce((n, i) => n + i.qty, 0),
    subtotal: available.reduce((n, i) => n + i.qty * i.price, 0),
    unavailableCount: items.length - available.length,
  };
}

async function getOrCreateUserId(rawId: string): Promise<Types.ObjectId> {
  if (!Types.ObjectId.isValid(rawId)) throw new AppError("UNAUTHORIZED", "Login required", 401);
  return new Types.ObjectId(rawId);
}

async function resolveProduct(productId: string, variantSku?: string): Promise<LeanProduct> {
  const doc = await Product.findById(productId).lean<LeanProduct | null>();
  if (!doc || !doc.isPublished) {
    throw new AppError("NOT_FOUND", "Product not found", 404);
  }
  if (variantSku && !doc.variants.some((v) => v.sku.toUpperCase() === variantSku.toUpperCase())) {
    throw new AppError("VALIDATION_ERROR", "Unknown variant", 400);
  }
  return doc;
}

export async function getCartView(rawUserId: string): Promise<CartView> {
  await connectDb();
  return buildView(await getOrCreateUserId(rawUserId));
}

export async function addCartItem(
  rawUserId: string,
  input: CartItemInput,
): Promise<{ view: CartView; adjusted: boolean }> {
  await connectDb();
  const userId = await getOrCreateUserId(rawUserId);
  const doc = await resolveProduct(input.productId, input.variantSku);
  const stock = availableStock(doc, input.variantSku);
  if (stock === 0) {
    throw new AppError("CONFLICT", "Product is out of stock", 409);
  }
  const variantSku = input.variantSku?.trim().toUpperCase() || undefined;
  const key = cartKey(input.productId, variantSku);

  const cart = await Cart.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId, items: [] } },
    { upsert: true, returnDocument: "after" },
  );
  const existing = cart.items.find((i) => cartKey(i.productId.toString(), i.variantSku) === key);
  const wanted = Math.min((existing?.qty ?? 0) + input.qty, 99);
  const effective = Math.min(wanted, stock);
  if (existing) {
    existing.qty = effective;
  } else {
    cart.items.push({
      productId: new Types.ObjectId(input.productId),
      variantSku,
      qty: effective,
      addedAt: new Date(),
    });
  }
  await cart.save();
  return { view: await buildView(userId), adjusted: effective < wanted };
}

export async function setCartQty(
  rawUserId: string,
  key: string,
  qty: number,
): Promise<{ view: CartView; adjusted: boolean }> {
  await connectDb();
  const userId = await getOrCreateUserId(rawUserId);
  const { productId, variantSku } = parseCartKey(key);
  const cart = await Cart.findOne({ userId });
  const empty = { view: await buildView(userId), adjusted: false };
  if (!cart) return empty;
  const line = cart.items.find((i) => cartKey(i.productId.toString(), i.variantSku) === key);
  if (!line) return empty;
  if (qty === 0) {
    cart.items.splice(cart.items.indexOf(line), 1);
    await cart.save();
    return { view: await buildView(userId), adjusted: false };
  }
  const doc = await resolveProduct(productId, variantSku);
  const wanted = Math.min(qty, 99);
  const effective = Math.min(wanted, Math.max(availableStock(doc, variantSku), 0));
  if (effective === 0) {
    cart.items.splice(cart.items.indexOf(line), 1);
  } else {
    line.qty = effective;
  }
  await cart.save();
  return { view: await buildView(userId), adjusted: effective < wanted };
}

export async function removeCartItem(rawUserId: string, key: string): Promise<CartView> {
  await connectDb();
  const userId = await getOrCreateUserId(rawUserId);
  const { productId, variantSku } = parseCartKey(key);
  const normKey = cartKey(productId, variantSku);
  const cart = await Cart.findOne({ userId });
  if (!cart) return buildView(userId);
  const before = cart.items.length;
  // In-memory filter: cart docs are tiny, and this avoids $pull/undefined edge cases.
  const kept = cart.items.filter((i) => cartKey(i.productId.toString(), i.variantSku) !== normKey);
  if (kept.length !== before) {
    cart.items.splice(0, cart.items.length, ...kept);
    await cart.save();
  }
  return buildView(userId);
}

export async function mergeCarts(
  rawUserId: string,
  input: CartMergeInput,
): Promise<{ cart: CartView; summary: MergeSummary }> {
  await connectDb();
  const userId = await getOrCreateUserId(rawUserId);
  const summary: MergeSummary = { added: 0, capped: 0, dropped: 0 };
  const cart = await Cart.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId, items: [] } },
    { upsert: true, returnDocument: "after" },
  );
  for (const item of input.items) {
    let doc: LeanProduct;
    try {
      doc = await resolveProduct(item.productId, item.variantSku);
    } catch {
      summary.dropped += 1;
      continue;
    }
    const stock = availableStock(doc, item.variantSku);
    if (stock === 0) {
      summary.dropped += 1;
      continue;
    }
    const variantSku = item.variantSku?.trim().toUpperCase() || undefined;
    const key = cartKey(item.productId, variantSku);
    const existing = cart.items.find((i) => cartKey(i.productId.toString(), i.variantSku) === key);
    const wanted = Math.min((existing?.qty ?? 0) + item.qty, 99);
    const effective = Math.min(wanted, stock);
    if (effective < wanted) summary.capped += 1;
    else summary.added += 1;
    if (existing) existing.qty = effective;
    else {
      cart.items.push({
        productId: new Types.ObjectId(item.productId),
        variantSku,
        qty: effective,
        addedAt: new Date(),
      });
    }
  }
  await cart.save();
  return { cart: await buildView(userId), summary };
}

export async function clearCart(rawUserId: string): Promise<void> {
  await connectDb();
  const userId = await getOrCreateUserId(rawUserId);
  await Cart.updateOne({ userId }, { $set: { items: [] } });
}
