import mongoose, { Types } from "mongoose";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectDb, resetDbCache } from "@/lib/db";
import { Cart } from "@/models/Cart";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";
import { Wishlist } from "@/models/Wishlist";
import { getCartView } from "@/services/cart-service";
import {
  addToWishlist,
  moveToCart,
  removeFromWishlist,
} from "@/services/wishlist-service";

const IMG = {
  publicId: "t/1",
  secureUrl: "https://res.cloudinary.com/x/image/upload/t/1",
  alt: "Piece",
  isThumbnail: true,
};
const USER = new Types.ObjectId().toString();

describe("wishlist service", () => {
  let mongod: MongoMemoryServer | undefined;
  let productId: string;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();
    resetDbCache();
    await connectDb();
    await Cart.syncIndexes();
    await Category.syncIndexes();
    await Product.syncIndexes();
    await Wishlist.syncIndexes();
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
    await Wishlist.deleteMany({});
  });

  beforeEach(async () => {
    const cat = await Category.create({ name: "Rings", slug: "rings" });
    const p = await Product.create({
      name: "Wish Ring",
      slug: "wish-ring",
      description: "d",
      categoryId: cat._id,
      images: [IMG],
      price: 799,
      sku: "WISH-001",
      stock: 4,
      isPublished: true,
    });
    productId = p._id.toString();
  });

  it("adds idempotently and flags availability", async () => {
    await addToWishlist(USER, productId);
    const view = await addToWishlist(USER, productId);
    expect(view.count).toBe(1);
    expect(view.items[0]?.available).toBe(true);
    expect(view.items[0]?.price).toBe(799);
  });

  it("rejects unknown products", async () => {
    await expect(addToWishlist(USER, new Types.ObjectId().toString())).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("removes entries", async () => {
    await addToWishlist(USER, productId);
    const view = await removeFromWishlist(USER, productId);
    expect(view.count).toBe(0);
  });

  it("moves to bag and unwishes", async () => {
    await addToWishlist(USER, productId);
    const { cart, wishlist } = await moveToCart(USER, productId);
    expect(wishlist.count).toBe(0);
    expect(cart.count).toBe(1);
    expect(cart.subtotal).toBe(799);
    expect((await getCartView(USER)).count).toBe(1);
  });
});
