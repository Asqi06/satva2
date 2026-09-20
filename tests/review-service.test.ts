import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectDb, resetDbCache } from "@/lib/db";
import { Category } from "@/models/Category";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { Review } from "@/models/Review";
import { User } from "@/models/User";
import {
  createReview,
  deleteReview,
  listProductReviews,
  maskName,
  setReviewVisibility,
  updateReview,
} from "@/services/review-service";

const IMG = {
  publicId: "t/1",
  secureUrl: "https://res.cloudinary.com/x/image/upload/t/1",
  alt: "Piece",
  isThumbnail: true,
};
const ADDRESS = {
  fullName: "Test User",
  phone: "9876543210",
  addressLine1: "1 Main St",
  city: "Vapi",
  state: "Gujarat",
  pincode: "396191",
  isDefault: true,
};

describe("maskName", () => {
  it("shows first name plus last initial", () => {
    expect(maskName("Priya Sharma")).toBe("Priya S.");
    expect(maskName("Madonna")).toBe("Madonna");
    expect(maskName("  ")).toBe("Collector");
  });
});

describe("review service", () => {
  let mongod: MongoMemoryServer | undefined;
  let buyerId: string;
  let strangerId: string;
  let slug: string;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();
    resetDbCache();
    await connectDb();
    for (const m of [Category, Order, Product, Review, User]) await m.syncIndexes();
  }, 120000);

  afterAll(async () => {
    await mongoose.disconnect();
    resetDbCache();
    if (mongod) await mongod.stop();
  });

  beforeEach(async () => {
    await Category.deleteMany({});
    await Order.deleteMany({});
    await Product.deleteMany({});
    await Review.deleteMany({});
    await User.deleteMany({});
    const buyer = await User.create({ email: "buyer@x.co", name: "Test Buyer" });
    const stranger = await User.create({ email: "stranger@x.co", name: "Stranger Danger" });
    buyerId = buyer._id.toString();
    strangerId = stranger._id.toString();
    const cat = await Category.create({ name: "Rings", slug: "rings" });
    const product = await Product.create({
      name: "Review Ring",
      slug: "review-ring",
      description: "d",
      categoryId: cat._id,
      images: [IMG],
      price: 500,
      sku: "REV-001",
      stock: 5,
      isPublished: true,
    });
    slug = product.slug;
  });

  it("marks unverified reviews and masks authors", async () => {
    const review = await createReview(buyerId, slug, { rating: 5, comment: "Lovely", images: [] });
    expect(review.isVerifiedPurchase).toBe(false);
    expect(review.authorName).toBe("Test B.");
    expect(review.mine).toBe(true);
  });

  it("rejects duplicates and out-of-range ratings", async () => {
    await createReview(buyerId, slug, { rating: 4, images: [] });
    await expect(createReview(buyerId, slug, { rating: 5, images: [] })).rejects.toMatchObject({
      code: "CONFLICT",
    });
    await expect(
      createReview(strangerId, slug, { rating: 6, images: [] }),
    ).rejects.toThrow();
  });

  it("verifies against paid orders containing the product", async () => {
    const product = await Product.findOne({ slug }).select("_id").lean();
    await Order.create({
      userId: buyerId,
      items: [
        {
          productId: product?._id,
          name: "Review Ring",
          qty: 1,
          unitPrice: 500,
          totalPrice: 500,
        },
      ],
      shippingAddress: ADDRESS,
      subtotal: 500,
      discount: 0,
      shipping: 0,
      tax: 0,
      total: 500,
      paymentStatus: "PAID",
      orderStatus: "CONFIRMED",
    });
    const review = await createReview(buyerId, slug, { rating: 5, images: [] });
    expect(review.isVerifiedPurchase).toBe(true);
  });

  it("lets owners edit but strangers only read", async () => {
    const review = await createReview(buyerId, slug, { rating: 3, images: [] });
    await expect(
      updateReview(strangerId, review.id, { rating: 1, images: [] }, false),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    const updated = await updateReview(buyerId, review.id, { rating: 5, title: "Edited", images: [] }, false);
    expect(updated.rating).toBe(5);
    const list = await listProductReviews(slug, strangerId);
    expect(list.reviews[0]?.mine).toBe(false);
  });

  it("recalculates aggregates on hide and delete", async () => {
    const first = await createReview(buyerId, slug, { rating: 5, images: [] });
    await createReview(strangerId, slug, { rating: 3, images: [] });
    let list = await listProductReviews(slug);
    expect(list).toMatchObject({ average: 4, count: 2 });

    await setReviewVisibility(first.id, false);
    list = await listProductReviews(slug);
    expect(list).toMatchObject({ average: 3, count: 1 });

    const hidden = await Review.findById(first.id).lean();
    expect(hidden?.isPublished).toBe(false);
    await deleteReview(buyerId, first.id, false);
    list = await listProductReviews(slug);
    expect(list).toMatchObject({ average: 3, count: 1 });

    const remaining = list.reviews[0];
    if (!remaining) throw new Error("expected a review");
    await deleteReview(strangerId, remaining.id, false);
    list = await listProductReviews(slug);
    expect(list).toMatchObject({ average: 0, count: 0 });
    const product = await Product.findOne({ slug }).select("ratingAverage ratingCount").lean();
    expect(product).toMatchObject({ ratingAverage: 0, ratingCount: 0 });
  });
});
