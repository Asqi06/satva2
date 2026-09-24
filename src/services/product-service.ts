import { Types } from "mongoose";
import { connectDb } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { Category } from "@/models/Category";
import { Product, type IProduct } from "@/models/Product";
import type { BulkAction, ProductInput, ProductQuery } from "@/schemas/product";
import { deleteAssets } from "@/lib/cloudinary";
import { ensureUnique, slugify } from "@/utils/slug";

/** Escape user text for safe case-insensitive regex matching (no ReDoS). */
export function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 120);
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  discountPercent: number;
  sku: string;
  images: { publicId: string; secureUrl: string; alt: string; isThumbnail: boolean }[];
  ratingAverage: number;
  ratingCount: number;
  stock: number;
  inStock: boolean;
  category: { id: string; name: string; slug: string };
  tags: string[];
  isFeatured: boolean;
  createdAt: string;
}

export interface AdminProductRow extends ProductListItem {
  isPublished: boolean;
  reservedStock: number;
  soldQuantity: number;
  lowStockThreshold: number;
}

export interface ProductDetail extends ProductListItem {
  description: string;
  subcategory?: string;
  videos: { publicId: string; secureUrl: string }[];
  variants: {
    sku: string;
    size?: string;
    color?: string;
    style?: string;
    price?: number;
    stock: number;
  }[];
  material?: string;
  color?: string;
  size?: string;
  dimensions?: string;
  weight?: string;
  seo: { title?: string; description?: string };
  related: ProductListItem[];
}

export interface AdminProductDetail extends ProductDetail {
  isPublished: boolean;
  reservedStock: number;
  soldQuantity: number;
  lowStockThreshold: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type PopulatedCategory = { _id: Types.ObjectId; name: string; slug: string };

type LeanProduct = Omit<IProduct, "_id" | "categoryId" | "createdAt" | "updatedAt"> & {
  _id: Types.ObjectId;
  categoryId: Types.ObjectId | PopulatedCategory;
  createdAt: Date;
  updatedAt: Date;
};

function discountPercent(price: number, compareAtPrice?: number): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

function categoryOf(doc: LeanProduct): ProductListItem["category"] {
  const c = doc.categoryId;
  if (!c) {
    return { id: "", name: "Uncategorised", slug: "uncategorised" };
  }
  if (c instanceof Types.ObjectId) {
    return { id: c.toString(), name: "Uncategorised", slug: "uncategorised" };
  }
  return {
    id: c._id ? c._id.toString() : "",
    name: c.name ?? "Uncategorised",
    slug: c.slug ?? "uncategorised",
  };
}

function toListItem(doc: LeanProduct): ProductListItem {
  const anyDoc = doc as unknown as Record<string, unknown>;
  const name =
    typeof doc.name === "string" && doc.name.trim()
      ? doc.name
      : typeof anyDoc.title === "string" && anyDoc.title.trim()
        ? anyDoc.title
        : "Untitled Product";

  const rawImages = Array.isArray(doc.images) ? doc.images : [];
  const normalizedImages = rawImages.map((i: unknown) => {
    if (typeof i === "string") {
      return { publicId: "", secureUrl: i, alt: name, isThumbnail: false };
    }
    if (i && typeof i === "object") {
      const obj = i as Record<string, unknown>;
      return {
        publicId: typeof obj.publicId === "string" ? obj.publicId : "",
        secureUrl:
          typeof obj.secureUrl === "string"
            ? obj.secureUrl
            : typeof obj.url === "string"
              ? obj.url
              : "",
        alt: typeof obj.alt === "string" ? obj.alt : name,
        isThumbnail: obj.isThumbnail === true,
      };
    }
    return { publicId: "", secureUrl: "", alt: name, isThumbnail: false };
  }).sort((a, b) => Number(b.isThumbnail) - Number(a.isThumbnail));

  const price = typeof doc.price === "number" ? doc.price : 0;
  const compareAtPrice =
    typeof doc.compareAtPrice === "number"
      ? doc.compareAtPrice
      : typeof anyDoc.oldPrice === "number"
        ? anyDoc.oldPrice
        : undefined;
  const stock =
    typeof doc.stock === "number"
      ? doc.stock
      : typeof anyDoc.stockQuantity === "number"
        ? anyDoc.stockQuantity
        : 0;
  const reservedStock = typeof doc.reservedStock === "number" ? doc.reservedStock : 0;
  const createdAtDate = doc.createdAt ? new Date(doc.createdAt) : new Date();

  return {
    id: doc._id.toString(),
    name,
    slug: doc.slug ?? "",
    shortDescription: doc.shortDescription,
    price,
    compareAtPrice,
    discountPercent: discountPercent(price, compareAtPrice),
    sku: doc.sku ?? "",
    images: normalizedImages,
    ratingAverage: typeof doc.ratingAverage === "number" ? doc.ratingAverage : 0,
    ratingCount: typeof doc.ratingCount === "number" ? doc.ratingCount : 0,
    stock,
    inStock: stock - reservedStock > 0,
    category: categoryOf(doc),
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    isFeatured: Boolean(doc.isFeatured),
    createdAt: isNaN(createdAtDate.getTime())
      ? new Date().toISOString()
      : createdAtDate.toISOString(),
  };
}

function toDetail(doc: LeanProduct, related: ProductListItem[]): ProductDetail {
  const rawVideos = Array.isArray(doc.videos) ? doc.videos : [];
  const normalizedVideos = rawVideos.map((v) => ({
    publicId: typeof v?.publicId === "string" ? v.publicId : "",
    secureUrl: typeof v?.secureUrl === "string" ? v.secureUrl : "",
  }));
  const rawVariants = Array.isArray(doc.variants) ? doc.variants : [];

  return {
    ...toListItem(doc),
    description: doc.description ?? "",
    subcategory: doc.subcategory,
    videos: normalizedVideos,
    variants: rawVariants.map((v) => ({ ...v })),
    material: doc.material,
    color: doc.color,
    size: doc.size,
    dimensions: doc.dimensions,
    weight: doc.weight,
    seo: { title: doc.seo?.title, description: doc.seo?.description },
    related,
  };
}

function toAdminDetail(doc: LeanProduct): AdminProductDetail {
  return {
    ...toDetail(doc, []),
    isPublished: Boolean(doc.isPublished),
    reservedStock: typeof doc.reservedStock === "number" ? doc.reservedStock : 0,
    soldQuantity: typeof doc.soldQuantity === "number" ? doc.soldQuantity : 0,
    lowStockThreshold:
      typeof doc.lowStockThreshold === "number" ? doc.lowStockThreshold : 5,
  };
}

const SORT_MAP: Record<ProductQuery["sort"], Record<string, 1 | -1>> = {
  featured: { isFeatured: -1, soldQuantity: -1, createdAt: -1 },
  newest: { createdAt: -1 },
  "price-asc": { price: 1 },
  "price-desc": { price: -1 },
  "best-selling": { soldQuantity: -1 },
  rating: { ratingAverage: -1, ratingCount: -1 },
};

export async function listPublicProducts(
  query: ProductQuery,
): Promise<{ products: ProductListItem[]; pagination: Pagination }> {
  await connectDb();
  const filter: Record<string, unknown> = { isPublished: true };

  if (query.category) {
    const category = await Category.findOne({
      slug: query.category.toLowerCase(),
      isPublished: true,
    })
      .select("_id")
      .lean<{ _id: Types.ObjectId } | null>();
    if (!category) {
      return {
        products: [],
        pagination: { page: query.page, limit: query.limit, total: 0, totalPages: 0 },
      };
    }
    filter.categoryId = category._id;
  }
  if (query.q) filter.$text = { $search: query.q };
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.price = {
      ...(query.minPrice !== undefined ? { $gte: query.minPrice } : {}),
      ...(query.maxPrice !== undefined ? { $lte: query.maxPrice } : {}),
    };
  }
  if (query.material) filter.material = new RegExp(`^${escapeRegExp(query.material)}$`, "i");
  if (query.color) filter.color = new RegExp(`^${escapeRegExp(query.color)}$`, "i");
  if (query.inStock) filter.$expr = { $gt: ["$stock", "$reservedStock"] };
  if (query.minRating !== undefined) filter.ratingAverage = { $gte: query.minRating };
  if (query.minDiscount !== undefined && query.minDiscount > 0) {
    filter.$and = [
      { compareAtPrice: { $gt: 0 } },
      {
        $expr: {
          $gte: [
            {
              $multiply: [
                { $divide: [{ $subtract: ["$compareAtPrice", "$price"] }, "$compareAtPrice"] },
                100,
              ],
            },
            query.minDiscount,
          ],
        },
      },
    ];
  }
  // Collections are curated tag sets until a dedicated model exists.
  if (query.collection) filter.tags = query.collection;

  const [total, docs] = await Promise.all([
    Product.countDocuments(filter),
    Product.find(filter)
      .select(
        "name slug shortDescription price compareAtPrice sku images ratingAverage ratingCount stock reservedStock categoryId tags isFeatured createdAt",
      )
      .sort(SORT_MAP[query.sort])
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .populate("categoryId", "name slug")
      .lean<LeanProduct[]>(),
  ]);
  return {
    products: docs.map(toListItem),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function getPublicProductBySlug(slug: string): Promise<ProductDetail | null> {
  await connectDb();
  const doc = await Product.findOne({ slug: slug.toLowerCase(), isPublished: true })
    .populate("categoryId", "name slug")
    .lean<LeanProduct | null>();
  if (!doc) return null;
  const categoryId = !doc.categoryId
    ? null
    : doc.categoryId instanceof Types.ObjectId
      ? doc.categoryId
      : doc.categoryId._id;
  const related = categoryId
    ? await Product.find({
        _id: { $ne: doc._id },
        categoryId,
        isPublished: true,
      })
        .sort({ soldQuantity: -1 })
        .limit(4)
        .populate("categoryId", "name slug")
        .lean<LeanProduct[]>()
    : [];
  return toDetail(doc, related.map(toListItem));
}

function notFound(): AppError {
  return new AppError("NOT_FOUND", "Product not found", 404);
}

function assertObjectId(id: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) throw notFound();
  return new Types.ObjectId(id);
}

/** Global SKU collision check across product SKUs and variant SKUs. */
async function assertSkuFree(sku: string, excludeId?: Types.ObjectId): Promise<void> {
  const upper = sku.trim().toUpperCase();
  const clause = excludeId ? { _id: { $ne: excludeId } } : {};
  const clash = await Product.exists({
    ...clause,
    $or: [{ sku: new RegExp(`^${escapeRegExp(upper)}$`, "i") }, { "variants.sku": new RegExp(`^${escapeRegExp(upper)}$`, "i") }],
  });
  if (clash) throw new AppError("CONFLICT", `SKU already in use: ${sku}`, 409);
}

function toDoc(input: ProductInput, slug: string) {
  return {
    name: input.name,
    slug,
    description: input.description,
    shortDescription: input.shortDescription,
    categoryId: new Types.ObjectId(input.categoryId),
    subcategory: input.subcategory,
    images: input.images,
    videos: input.videos,
    price: input.price,
    compareAtPrice: input.compareAtPrice,
    sku: input.sku.trim().toUpperCase(),
    variants: input.variants.map((v) => ({ ...v, sku: v.sku.trim().toUpperCase() })),
    material: input.material,
    color: input.color,
    size: input.size,
    dimensions: input.dimensions,
    weight: input.weight,
    tags: input.tags,
    stock: input.stock,
    lowStockThreshold: input.lowStockThreshold,
    isPublished: input.isPublished,
    isFeatured: input.isFeatured,
    seo: { title: input.seoTitle, description: input.seoDescription },
  };
}

export async function createProduct(input: ProductInput): Promise<AdminProductDetail> {
  await connectDb();
  const category = await Category.findById(input.categoryId).select("_id").lean();
  if (!category) throw new AppError("NOT_FOUND", "Category not found", 404);
  await assertSkuFree(input.sku);
  for (const variant of input.variants) {
    await assertSkuFree(variant.sku);
  }
  const slug = await ensureUnique(input.slug ?? slugify(input.name), (c) =>
    Product.exists({ slug: c }).then(Boolean),
  );
  const created = await Product.create(toDoc(input, slug));
  const detail = await getAdminProductById(created._id.toString());
  if (!detail) throw notFound();
  return detail;
}

export async function getAdminProductById(id: string): Promise<AdminProductDetail | null> {
  await connectDb();
  if (!Types.ObjectId.isValid(id)) return null;
  const doc = await Product.findById(id)
    .populate("categoryId", "name slug")
    .lean<LeanProduct | null>();
  if (!doc) return null;
  return toAdminDetail(doc);
}

export async function updateProduct(id: string, input: ProductInput): Promise<AdminProductDetail> {
  await connectDb();
  const objectId = assertObjectId(id);
  const doc = await Product.findById(objectId);
  if (!doc) throw notFound();

  const category = await Category.findById(input.categoryId).select("_id").lean();
  if (!category) throw new AppError("NOT_FOUND", "Category not found", 404);

  const newSku = input.sku.trim().toUpperCase();
  if (newSku !== doc.sku.toUpperCase()) await assertSkuFree(input.sku, objectId);
  const oldVariants = new Set(doc.variants.map((v) => v.sku.toUpperCase()));
  for (const variant of input.variants) {
    if (!oldVariants.has(variant.sku.trim().toUpperCase())) {
      await assertSkuFree(variant.sku, objectId);
    }
  }
  const newSlug = input.slug ?? doc.slug;
  if (newSlug !== doc.slug) {
    const taken = await Product.exists({ slug: newSlug, _id: { $ne: objectId } });
    if (taken) throw new AppError("CONFLICT", "Product slug already in use", 409);
  }
  doc.set({ ...toDoc(input, newSlug), reservedStock: doc.reservedStock, soldQuantity: doc.soldQuantity, ratingAverage: doc.ratingAverage, ratingCount: doc.ratingCount });
  await doc.save();
  const detail = await getAdminProductById(id);
  if (!detail) throw notFound();
  return detail;
}

export async function deleteProduct(id: string): Promise<void> {
  await connectDb();
  const objectId = assertObjectId(id);
  const doc = await Product.findById(objectId).select("images").lean();
  if (!doc) throw notFound();
  await Product.deleteOne({ _id: objectId });
  const publicIds = (doc.images ?? []).map((i: { publicId: string }) => i.publicId).filter(Boolean);
  if (publicIds.length > 0) {
    await deleteAssets(publicIds).catch((error: unknown) => {
      logger.warn("product image cleanup failed", {
        productId: id,
        message: error instanceof Error ? error.message : "unknown",
      });
    });
  }
}

export async function duplicateProduct(id: string): Promise<AdminProductDetail> {
  await connectDb();
  const objectId = assertObjectId(id);
  const source = await Product.findById(objectId).lean<LeanProduct | null>();
  if (!source) throw notFound();
  const baseSku = `${source.sku}-COPY`;
  const sku = await ensureUnique(baseSku, async (c) => {
    const clash = await Product.exists({
      $or: [
        { sku: new RegExp(`^${escapeRegExp(c)}$`, "i") },
        { "variants.sku": new RegExp(`^${escapeRegExp(c)}$`, "i") },
      ],
    });
    return Boolean(clash);
  });
  const slug = await ensureUnique(`${source.slug}-copy`, (c) =>
    Product.exists({ slug: c }).then(Boolean),
  );
  const categoryObjectId =
    source.categoryId instanceof Types.ObjectId ? source.categoryId : source.categoryId._id;
  // Strip DB-managed keys for the copy (rest siblings intentionally unused).
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, createdAt, updatedAt, ...rest } = source;
  const created = await Product.create({
    ...rest,
    categoryId: categoryObjectId,
    name: `${source.name} (Copy)`,
    slug,
    sku,
    isPublished: false,
    isFeatured: false,
    reservedStock: 0,
    soldQuantity: 0,
    ratingAverage: 0,
    ratingCount: 0,
  });
  const detail = await getAdminProductById(created._id.toString());
  if (!detail) throw notFound();
  return detail;
}

export async function bulkProductAction(action: BulkAction): Promise<{ matched: number; modified: number }> {
  await connectDb();
  const ids = action.ids.map((id) => new Types.ObjectId(id));
  if (action.action === "delete") {
    const result = await Product.deleteMany({ _id: { $in: ids } });
    return { matched: result.deletedCount, modified: result.deletedCount };
  }
  const update =
    action.action === "publish"
      ? { isPublished: true }
      : action.action === "unpublish"
        ? { isPublished: false }
        : action.action === "feature"
          ? { isFeatured: true }
          : { isFeatured: false };
  const result = await Product.updateMany({ _id: { $in: ids } }, { $set: update });
  return { matched: result.matchedCount, modified: result.modifiedCount };
}

export async function listAdminProducts(opts: {
  q?: string;
  published?: boolean;
  page: number;
  limit: number;
}): Promise<{ products: AdminProductRow[]; pagination: Pagination }> {
  await connectDb();
  const filter: Record<string, unknown> = {};
  if (opts.q) {
    const safe = escapeRegExp(opts.q);
    filter.$or = [
      { name: new RegExp(safe, "i") },
      { sku: new RegExp(safe, "i") },
      { slug: new RegExp(safe, "i") },
    ];
  }
  if (opts.published !== undefined) filter.isPublished = opts.published;
  const limit = Math.min(Math.max(opts.limit, 1), 50);
  const page = Math.max(opts.page, 1);
  const [total, docs] = await Promise.all([
    Product.countDocuments(filter),
    Product.find(filter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("categoryId", "name slug")
      .lean<LeanProduct[]>(),
  ]);
  return {
    products: docs.map((d) => ({
      ...toListItem(d),
      isPublished: d.isPublished,
      reservedStock: d.reservedStock,
      soldQuantity: d.soldQuantity,
      lowStockThreshold: d.lowStockThreshold,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
