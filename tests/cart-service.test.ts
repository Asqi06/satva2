import mongoose, { Types } from "mongoose";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectDb, resetDbCache } from "@/lib/db";
import { Cart } from "@/models/Cart";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";
import {
  addCartItem,
  cartKey,
  mergeCarts,
  removeCartItem,
  setCartQty,
} from "@/services/cart-service";

const IMG = {
  publicId: "t/1",
  secureUrl: "https://res.cloudinary.com/x/image/upload/t/1",
  alt: "Piece",
  isThumbnail: true,
};
const USER = new Types.ObjectId().toString();

async function seed() {
  const cat = await Category.create({ name: "Rings", slug: "rings" });
  const live = await Product.create({
    name: "Live Ring",
    slug: "live-ring",
    description: "d",
    categoryId: cat._id,
    images: [IMG],
    price: 500,
    compareAtPrice: 1000,
    sku: "LIVE-001",
    variants: [{ sku: "LIVE-001-S6", size: "6", price: 600, stock: 2 }],
    stock: 5,
    isPublished: true,
  });
  const hidden = await Product.create({
    name: "Hidden",
    slug: "hidden",
    description: "d",
    categoryId: cat._id,
    images: [IMG],
    price: 100,
    sku: "HIDDEN-001",
    stock: 5,
    isPublished: false,
  });
  return { live, hidden };
}

describe("cart service", () => {
  let mongod: MongoMemoryServer | undefined;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();
    resetDbCache();
    await connectDb();
    await Cart.syncIndexes();
    await Category.syncIndexes();
    await Product.syncIndexes();
  }, 120000);

  afterAll(async () => {
    await mongoose.disconnect();
    resetDbCache();
    if (mongod) await mongod.stop();
  });

  afterEach(async () => {
    await Cart.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
  });

  it("adds with live pricing and validates products", async () => {
    const { live, hidden } = await seed();
    await expect(
      addCartItem(USER, { productId: hidden._id.toString(), qty: 1 }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      addCartItem(USER, { productId: live._id.toString(), variantSku: "nope", qty: 1 }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    const { view } = await addCartItem(USER, { productId: live._id.toString(), qty: 2 });
    expect(view.count).toBe(2);
    expect(view.subtotal).toBe(1000);
    expect(view.items[0]?.price).toBe(500);
  });

  it("caps quantities at available stock and flags adjustments", async () => {
    const { live } = await seed();
    const { view, adjusted } = await addCartItem(USER, { productId: live._id.toString(), qty: 50 });
    expect(view.items[0]?.qty).toBe(5);
    expect(adjusted).toBe(true);
    expect(view.count).toBe(5);
  });

  it("rejects out-of-stock adds", async () => {
    const { live } = await seed();
    await Product.updateOne({ _id: live._id }, { $set: { stock: 0 } });
    await expect(
      addCartItem(USER, { productId: live._id.toString(), qty: 1 }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("prices variants independently", async () => {
    const { live } = await seed();
    const { view } = await addCartItem(USER, {
      productId: live._id.toString(),
      variantSku: "live-001-s6",
      qty: 1,
    });
    expect(view.items[0]?.price).toBe(600);
    expect(view.items[0]?.qty).toBe(1);
  });

  it("sets and removes quantities", async () => {
    const { live } = await seed();
    await addCartItem(USER, { productId: live._id.toString(), qty: 2 });
    const key = cartKey(live._id.toString());
    const { view: capped, adjusted } = await setCartQty(USER, key, 99);
    expect(capped.items[0]?.qty).toBe(5);
    expect(adjusted).toBe(true);
    const emptied = await setCartQty(USER, key, 0);
    expect(emptied.view.items).toEqual([]);
    await addCartItem(USER, { productId: live._id.toString(), qty: 1 });
    const removed = await removeCartItem(USER, key);
    expect(removed.count).toBe(0);
  });

  it("merges guest carts with caps and drops", async () => {
    const { live, hidden } = await seed();
    await addCartItem(USER, { productId: live._id.toString(), qty: 4 });
    const { cart, summary } = await mergeCarts(USER, {
      items: [
        { productId: live._id.toString(), qty: 3 },
        { productId: hidden._id.toString(), qty: 1 },
        { productId: new Types.ObjectId().toString(), qty: 1 },
      ],
    });
    expect(summary).toMatchObject({ added: 0, capped: 1, dropped: 2 });
    expect(cart.count).toBe(5);
  });
});
