import { Types } from "mongoose";
import { connectDb } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { Review, type IReview } from "@/models/Review";
import { User } from "@/models/User";
import type { ReviewInput } from "@/schemas/review";

/** "Priya Sharma" → "Priya S." — public display names stay semi-private. */
export function maskName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Collector";
  const first = parts[0] ?? "Collector";
  const last = parts.length > 1 ? ` ${(parts[parts.length - 1] ?? "").charAt(0).toUpperCase()}.` : "";
  return `${first}${last}`;
}

export interface ReviewDTO {
  id: string;
  rating: number;
  title?: string;
  comment?: string;
  images: { publicId: string; secureUrl: string }[];
  isVerifiedPurchase: boolean;
  authorName: string;
  mine: boolean;
  createdAt: string;
}

export interface ReviewList {
  reviews: ReviewDTO[];
  average: number;
  count: number;
}

type LeanReview = Omit<IReview, "_id" | "productId" | "userId" | "createdAt" | "updatedAt"> & {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

function toDTO(doc: LeanReview, viewerId?: string): ReviewDTO {
  return {
    id: doc._id.toString(),
    rating: doc.rating,
    title: doc.title,
    comment: doc.comment,
    images: doc.images.map((i) => ({ publicId: i.publicId, secureUrl: i.secureUrl })),
    isVerifiedPurchase: doc.isVerifiedPurchase,
    authorName: maskName(doc.authorName),
    mine: viewerId !== undefined && doc.userId.toString() === viewerId,
    createdAt: doc.createdAt.toISOString(),
  };
}

async function recalcProductRating(productId: Types.ObjectId): Promise<void> {
  const agg = await Review.aggregate<{ average: number; count: number }>([
    { $match: { productId, isPublished: true } },
    { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  const row = agg[0];
  await Product.updateOne(
    { _id: productId },
    {
      $set: {
        ratingAverage: row ? Math.round(row.average * 10) / 10 : 0,
        ratingCount: row ? row.count : 0,
      },
    },
  );
}

async function verifiedPurchase(userId: Types.ObjectId, productId: Types.ObjectId): Promise<boolean> {
  const order = await Order.exists({
    userId,
    paymentStatus: "PAID",
    "items.productId": productId,
  });
  return Boolean(order);
}

export async function listProductReviews(
  slug: string,
  viewerId?: string,
): Promise<ReviewList> {
  await connectDb();
  const product = await Product.findOne({ slug: slug.toLowerCase(), isPublished: true })
    .select("_id ratingAverage ratingCount")
    .lean<{ _id: Types.ObjectId; ratingAverage: number; ratingCount: number } | null>();
  if (!product) throw new AppError("NOT_FOUND", "Product not found", 404);
  const docs = await Review.find({ productId: product._id, isPublished: true })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean<LeanReview[]>();
  // Denormalized aggregates are authoritative for the header; recompute
  // defensively when they drift (e.g. direct DB edits).
  const fresh = await Review.aggregate<{ average: number; count: number }>([
    { $match: { productId: product._id, isPublished: true } },
    { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  const row = fresh[0];
  return {
    reviews: docs.map((d) => toDTO(d, viewerId)),
    average: row ? Math.round(row.average * 10) / 10 : 0,
    count: row ? row.count : 0,
  };
}

export async function createReview(
  rawUserId: string,
  slug: string,
  input: ReviewInput,
): Promise<ReviewDTO> {
  await connectDb();
  if (!Types.ObjectId.isValid(rawUserId)) throw new AppError("UNAUTHORIZED", "Login required", 401);
  const userId = new Types.ObjectId(rawUserId);
  const product = await Product.findOne({ slug: slug.toLowerCase(), isPublished: true })
    .select("_id")
    .lean<{ _id: Types.ObjectId } | null>();
  if (!product) throw new AppError("NOT_FOUND", "Product not found", 404);
  const user = await User.findById(userId).select("name email").lean();
  if (!user) throw new AppError("UNAUTHORIZED", "Login required", 401);
  const existing = await Review.exists({ productId: product._id, userId });
  if (existing) {
    throw new AppError("CONFLICT", "You have already reviewed this product", 409);
  }
  const verified = await verifiedPurchase(userId, product._id);
  try {
    const created = await Review.create({
      productId: product._id,
      userId,
      authorName: user.name ?? user.email,
      rating: input.rating,
      title: input.title,
      comment: input.comment,
      images: input.images,
      isVerifiedPurchase: verified,
      isPublished: true,
    });
    await recalcProductRating(product._id);
    const doc = await Review.findById(created._id).lean<LeanReview | null>();
    if (!doc) throw new AppError("NOT_FOUND", "Review not found", 404);
    return toDTO(doc, userId.toString());
  } catch (error) {
    if (error !== null && typeof error === "object" && "code" in error && error.code === 11000) {
      throw new AppError("CONFLICT", "You have already reviewed this product", 409);
    }
    throw error;
  }
}

export async function updateReview(
  rawUserId: string,
  reviewId: string,
  input: ReviewInput,
  isAdmin: boolean,
): Promise<ReviewDTO> {
  await connectDb();
  if (!Types.ObjectId.isValid(reviewId)) throw new AppError("NOT_FOUND", "Review not found", 404);
  const doc = await Review.findById(reviewId);
  if (!doc) throw new AppError("NOT_FOUND", "Review not found", 404);
  if (!isAdmin && doc.userId.toString() !== rawUserId) {
    throw new AppError("NOT_FOUND", "Review not found", 404);
  }
  if (!isAdmin) {
    doc.rating = input.rating;
    doc.title = input.title;
    doc.comment = input.comment;
    doc.images = input.images;
    await doc.save();
  }
  await recalcProductRating(doc.productId);
  const fresh = await Review.findById(doc._id).lean<LeanReview | null>();
  if (!fresh) throw new AppError("NOT_FOUND", "Review not found", 404);
  return toDTO(fresh, rawUserId);
}

export async function deleteReview(rawUserId: string, reviewId: string, isAdmin: boolean): Promise<void> {
  await connectDb();
  if (!Types.ObjectId.isValid(reviewId)) throw new AppError("NOT_FOUND", "Review not found", 404);
  const doc = await Review.findById(reviewId).select("productId userId").lean();
  if (!doc) throw new AppError("NOT_FOUND", "Review not found", 404);
  if (!isAdmin && doc.userId.toString() !== rawUserId) {
    throw new AppError("NOT_FOUND", "Review not found", 404);
  }
  await Review.deleteOne({ _id: doc._id });
  await recalcProductRating(doc.productId);
}

export async function setReviewVisibility(reviewId: string, isPublished: boolean): Promise<ReviewDTO> {
  await connectDb();
  if (!Types.ObjectId.isValid(reviewId)) throw new AppError("NOT_FOUND", "Review not found", 404);
  const doc = await Review.findByIdAndUpdate(
    reviewId,
    { $set: { isPublished } },
    { returnDocument: "after" },
  ).lean<LeanReview | null>();
  if (!doc) throw new AppError("NOT_FOUND", "Review not found", 404);
  await recalcProductRating(doc.productId);
  return toDTO(doc);
}

export interface FeaturedReview {
  id: string;
  rating: number;
  comment?: string;
  authorName: string;
  productSlug: string;
  productName: string;
}

/** Latest verified reviews with product links, for the homepage wall. */
export async function listFeaturedReviews(limit = 4): Promise<FeaturedReview[]> {
  await connectDb();
  const docs = await Review.find({ isPublished: true, isVerifiedPurchase: true })
    .sort({ createdAt: -1 })
    .limit(Math.min(Math.max(limit, 1), 8))
    .lean<LeanReview[]>();
  const productIds = [...new Set(docs.map((d) => d.productId.toString()))];
  const products = await Product.find({ _id: { $in: productIds }, isPublished: true })
    .select("name slug")
    .lean<{ _id: Types.ObjectId; name: string; slug: string }[]>();
  const byId = new Map(products.map((p) => [p._id.toString(), p]));
  return docs.flatMap((d) => {
    const product = byId.get(d.productId.toString());
    if (!product || !d.comment) return [];
    return [
      {
        id: d._id.toString(),
        rating: d.rating,
        comment: d.comment,
        authorName: maskName(d.authorName),
        productSlug: product.slug,
        productName: product.name,
      },
    ];
  });
}

export interface AdminReviewRow {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  authorName: string;
  rating: number;
  comment?: string;
  isVerifiedPurchase: boolean;
  isPublished: boolean;
  createdAt: string;
}

export async function listAdminReviews(opts: {
  hiddenOnly: boolean;
  page: number;
  limit: number;
}): Promise<{ reviews: AdminReviewRow[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  await connectDb();
  const filter: Record<string, unknown> = opts.hiddenOnly ? { isPublished: false } : {};
  const limit = Math.min(Math.max(opts.limit, 1), 50);
  const page = Math.max(opts.page, 1);
  const [total, docs] = await Promise.all([
    Review.countDocuments(filter),
    Review.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean<LeanReview[]>(),
  ]);
  const productIds = [...new Set(docs.map((d) => d.productId.toString()))];
  const products = await Product.find({ _id: { $in: productIds } })
    .select("name slug")
    .lean<{ _id: Types.ObjectId; name: string; slug: string }[]>();
  const byId = new Map(products.map((p) => [p._id.toString(), p]));
  return {
    reviews: docs.map((d) => ({
      id: d._id.toString(),
      productId: d.productId.toString(),
      productName: byId.get(d.productId.toString())?.name ?? "Unknown product",
      productSlug: byId.get(d.productId.toString())?.slug ?? "",
      authorName: d.authorName,
      rating: d.rating,
      comment: d.comment,
      isVerifiedPurchase: d.isVerifiedPurchase,
      isPublished: d.isPublished,
      createdAt: d.createdAt.toISOString(),
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
