import { Types } from "mongoose";
import { connectDb } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { Product } from "@/models/Product";
import { Wishlist } from "@/models/Wishlist";
import { addCartItem, type CartView } from "./cart-service";

/** Wishlist entries with live product snapshots (unpublished flagged). */

export interface WishlistItem {
  productId: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  image?: { secureUrl: string; alt: string };
  available: boolean;
}

export interface WishlistView {
  items: WishlistItem[];
  count: number;
}

async function userObjectId(rawId: string): Promise<Types.ObjectId> {
  if (!Types.ObjectId.isValid(rawId)) throw new AppError("UNAUTHORIZED", "Login required", 401);
  return new Types.ObjectId(rawId);
}

export async function getWishlistView(rawUserId: string): Promise<WishlistView> {
  await connectDb();
  const userId = await userObjectId(rawUserId);
  const list = await Wishlist.findOne({ userId }).lean();
  if (!list || list.productIds.length === 0) return { items: [], count: 0 };
  const docs = await Product.find({ _id: { $in: list.productIds } }).lean();
  const byId = new Map(docs.map((d) => [d._id.toString(), d]));
  const items: WishlistItem[] = [];
  for (const id of list.productIds) {
    const doc = byId.get(id.toString());
    if (!doc) continue;
    const cover = doc.images.find((i) => i.isThumbnail) ?? doc.images[0];
    items.push({
      productId: id.toString(),
      name: doc.name,
      slug: doc.slug,
      price: doc.price,
      compareAtPrice: doc.compareAtPrice,
      image: cover ? { secureUrl: cover.secureUrl, alt: cover.alt } : undefined,
      available: doc.isPublished && doc.stock - doc.reservedStock > 0,
    });
  }
  return { items, count: items.length };
}

export async function addToWishlist(rawUserId: string, productId: string): Promise<WishlistView> {
  await connectDb();
  const userId = await userObjectId(rawUserId);
  if (!Types.ObjectId.isValid(productId)) {
    throw new AppError("VALIDATION_ERROR", "Invalid product", 400);
  }
  const product = await Product.findById(productId).select("_id").lean();
  if (!product) throw new AppError("NOT_FOUND", "Product not found", 404);
  await Wishlist.findOneAndUpdate(
    { userId },
    { $addToSet: { productIds: new Types.ObjectId(productId) } },
    { upsert: true, returnDocument: "after" },
  );
  return getWishlistView(rawUserId);
}

export async function removeFromWishlist(rawUserId: string, productId: string): Promise<WishlistView> {
  await connectDb();
  const userId = await userObjectId(rawUserId);
  if (!Types.ObjectId.isValid(productId)) {
    throw new AppError("VALIDATION_ERROR", "Invalid product", 400);
  }
  await Wishlist.updateOne({ userId }, { $pull: { productIds: new Types.ObjectId(productId) } });
  return getWishlistView(rawUserId);
}

/** Move to bag: add one unit to the cart (capped by stock) and unwish. */
export async function moveToCart(
  rawUserId: string,
  productId: string,
): Promise<{ cart: CartView; wishlist: WishlistView }> {
  await connectDb();
  const userId = await userObjectId(rawUserId);
  if (!Types.ObjectId.isValid(productId)) {
    throw new AppError("VALIDATION_ERROR", "Invalid product", 400);
  }
  const { view: cart } = await addCartItem(userId.toString(), { productId, qty: 1 });
  const wishlist = await removeFromWishlist(userId.toString(), productId);
  return { cart, wishlist };
}
