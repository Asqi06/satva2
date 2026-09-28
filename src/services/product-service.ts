import { cache } from "react";
import { Review } from "@/models/Review";
import { connection, Types, type PipelineStage } from "mongoose";
import { connectDb } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { Category } from "@/models/Category";
import { Product, type IProduct } from "@/models/Product";
import type { BulkAction, ProductInput, ProductQuery } from "@/schemas/product";
import { ensureUnique, slugify } from "@/utils/slug";
import { cloudinaryPublicId } from "@/utils/cloudinary-url";

/** Escape user text for safe case-insensitive regex matching (no ReDoS). */
export function escapeRegExp(input: string): string {
  return input.slice(0, 120).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
  availableStock?: number;
  priceFrom?: boolean;
  soldQuantity?: number;
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

async function withPublishedRatings(docs: LeanProduct[]): Promise<void> {
  const ratings = await Review.aggregate<{ _id: Types.ObjectId; average: number; count: number }>([
    { $match: { productId: { $in: docs.map((doc) => doc._id) }, isPublished: true } },
    { $group: { _id: "$productId", average: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  const byId = new Map(ratings.map((rating) => [rating._id.toString(), rating]));
  for (const doc of docs) {
    const rating = byId.get(doc._id.toString());
    doc.ratingAverage = rating ? Math.round(rating.average * 10) / 10 : 0;
    doc.ratingCount = rating?.count ?? 0;
  }
}

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

  const basePrice = typeof doc.price === "number" ? doc.price : 0;
  const variants = Array.isArray(doc.variants) ? doc.variants : [];
  const price = variants.length ? Math.min(...variants.map((variant) => variant.price ?? basePrice)) : basePrice;
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
    inStock: stock - reservedStock > 0 && (!variants.length || variants.some((variant) => variant.stock - (variant.reservedStock ?? 0) > 0)),
    availableStock: Math.max(stock - reservedStock, 0),
    soldQuantity: doc.soldQuantity ?? 0,
    priceFrom: variants.some((variant) => (variant.price ?? basePrice) !== price),
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
    variants: rawVariants.map((v) => ({ ...v, price: v.price ?? doc.price, stock: Math.max(0, Math.min(v.stock - (v.reservedStock ?? 0), doc.stock - (doc.reservedStock ?? 0))) })),
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
  const detail = toDetail(doc, []);
  return {
    ...detail,
    images: detail.images.map((image) => ({
      ...image,
      publicId: image.publicId || cloudinaryPublicId(image.secureUrl),
    })),
    price: doc.price,
    variants: (doc.variants ?? []).map((variant) => ({ ...variant })),
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

const COMMON_CATEGORY_TERMS: Record<string, string[]> = {
  earrings: ["jhumka", "jhumkas", "jhumke", "bali", "baali", "jhumka earrings", "earing", "earings", "earring"],
  rings: ["anguthi", "angoothi", "finger ring"],
  necklaces: ["haar", "mala", "gale ka haar"],
  bracelets: ["kangan", "kada", "chudi", "chura", "braclet", "braclets", "bracelet"],
  anklets: ["payal", "paayal"],
};

export type CatalogueFilters = Record<"color" | "size" | "material", { value: string; count: number }[]>;

export async function getCatalogueFilters(categorySlug?: string): Promise<CatalogueFilters> {
  await connectDb();
  const category = categorySlug ? await Category.findOne({ slug: categorySlug, isPublished: true }).select("_id").lean() : null;
  const fields = ["color", "size", "material"] as const;
  const facet = Object.fromEntries(fields.map(field => [field, [
    { $project: { values: { $setUnion: [field === "material" ? [`$${field}`] : { $map: { input: { $cond: [{ $gt: [{ $size: { $ifNull: ["$variants", []] } }, 0] }, "$variants", [{}]] }, as: "v", in: { $ifNull: [`$$v.${field}`, `$${field}`] } } }, []] } } },
    { $unwind: "$values" }, { $match: { values: { $type: "string", $ne: "" } } },
    { $group: { _id: "$values", count: { $sum: 1 } } }, { $sort: { _id: 1 as const } }, { $limit: 30 },
    { $project: { _id: 0, value: "$_id", count: 1 } },
  ]]));
  const [result] = await Product.aggregate<CatalogueFilters>([
    { $match: { isPublished: true, ...(category ? { categoryId: category._id } : {}) } },
    { $facet: facet },
  ]);
  return result ?? { color: [], size: [], material: [] };
}

export async function listPublicProducts(
  query: ProductQuery,
): Promise<{ products: ProductListItem[]; pagination: Pagination }> {
  await connectDb();
  const filter: Record<string, unknown> = { isPublished: true };

  if (query.category) {
    const category = await Category.findOne({
      $or: [{ slug: query.category.toLowerCase() }, { previousSlugs: query.category.toLowerCase() }],
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
  if (query.q) {
    const term = query.q.trim().toLocaleLowerCase("en-IN");
    // ponytail: category count is small; if it grows into thousands, index a normalized alias field.
    const categories = await Category.find({ isPublished: true })
      .select("_id name slug searchTerms")
      .lean<{ _id: Types.ObjectId; name: string; slug: string; searchTerms?: string[] }[]>();
    const alias = categories.find((category) =>
      [category.name, category.slug, ...(category.searchTerms ?? []), ...(COMMON_CATEGORY_TERMS[category.slug] ?? [])]
        .some((value) => value.toLocaleLowerCase("en-IN") === term || (term.length >= 3 && value.toLocaleLowerCase("en-IN").startsWith(term))),
    );
    // ponytail: bounded literal searches suit this catalogue; use a search index when catalogue size makes scans expensive.
    const words = term.split(/\s+/).slice(0, 8).map(word => ({ $or: ["name", "sku", "variants.sku", "tags", "description"].map(field => ({ [field]: new RegExp(escapeRegExp(word), "i") })) }));
    filter.$and = [alias ? { $or: [{ categoryId: alias._id }, { $and: words }] } : { $and: words }];
  }
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.listPrice = {
      ...(query.minPrice !== undefined ? { $gte: query.minPrice } : {}),
      ...(query.maxPrice !== undefined ? { $lte: query.maxPrice } : {}),
    };
  }
  if (query.material) filter.material = { $in: query.material.split("|").filter(Boolean).slice(0, 8).map(value => new RegExp(`^${escapeRegExp(value)}$`, "i")) };
  const optionConditions = (["color", "size"] as const).filter(field => query[field]).map(field => ({ $regexMatch: {
    input: { $ifNull: [`$$v.${field}`, { $ifNull: [`$${field}`, ""] }] },
    regex: `^(?:${query[field]!.split("|").filter(Boolean).slice(0, 8).map(escapeRegExp).join("|")})$`, options: "i",
  } }));
  if (optionConditions.length) filter.$and = [...(filter.$and as Record<string, unknown>[] ?? []), { $expr: { $anyElementTrue: [{ $map: {
    input: { $cond: [{ $gt: [{ $size: { $ifNull: ["$variants", []] } }, 0] }, "$variants", [{}]] }, as: "v", in: { $and: optionConditions },
  } }] } }];
  if (query.inStock) filter.listInStock = true;
  if (query.minRating !== undefined) filter.ratingAverage = { $gte: query.minRating };
  if (query.minDiscount !== undefined && query.minDiscount > 0) {
    filter.$and = [...(filter.$and as Record<string, unknown>[] ?? []),
      { compareAtPrice: { $gt: 0 } },
      {
        $expr: {
          $gte: [
            {
              $multiply: [
                { $divide: [{ $subtract: ["$compareAtPrice", "$listPrice"] }, "$compareAtPrice"] },
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

  const textSearch = filter.$text;
  delete filter.$text;
  const pipeline: PipelineStage[] = [
    { $match: { isPublished: true, ...(textSearch ? { $text: textSearch } : {}) } },
    { $set: {
      listPrice: { $cond: [
        { $gt: [{ $size: { $ifNull: ["$variants", []] } }, 0] },
        { $min: { $map: { input: "$variants", as: "variant", in: { $ifNull: ["$$variant.price", "$price"] } } } },
        "$price",
      ] },
      listInStock: { $and: [
        { $gt: ["$stock", { $ifNull: ["$reservedStock", 0] }] },
        { $or: [
          { $eq: [{ $size: { $ifNull: ["$variants", []] } }, 0] },
          { $anyElementTrue: [{ $map: { input: { $ifNull: ["$variants", []] }, as: "variant", in: { $gt: ["$$variant.stock", { $ifNull: ["$$variant.reservedStock", 0] }] } } }] },
        ] },
      ] },
    } },
  ];
  if (query.sort === "rating" || query.minRating !== undefined) {
    pipeline.push(
      { $lookup: {
        from: Review.collection.name, localField: "_id", foreignField: "productId", as: "publishedRatings",
        pipeline: [{ $match: { isPublished: true } }, { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } }],
      } },
      { $set: { ratingAverage: { $ifNull: [{ $arrayElemAt: ["$publishedRatings.average", 0] }, 0] }, ratingCount: { $ifNull: [{ $arrayElemAt: ["$publishedRatings.count", 0] }, 0] } } },
    );
  }
  const sort = query.sort === "price-asc" ? { listPrice: 1 as const } : query.sort === "price-desc" ? { listPrice: -1 as const } : SORT_MAP[query.sort];
  pipeline.push({ $match: filter }, { $facet: {
    counts: [{ $count: "total" }],
    products: [
      { $sort: { ...sort, _id: 1 } },
      { $skip: (query.page - 1) * query.limit }, { $limit: query.limit },
      { $project: { name: 1, slug: 1, shortDescription: 1, price: 1, compareAtPrice: 1, sku: 1, images: 1, ratingAverage: 1, ratingCount: 1, stock: 1, reservedStock: 1, variants: 1, categoryId: 1, tags: 1, isFeatured: 1, soldQuantity: 1, createdAt: 1 } },
    ],
  } });
  const [result] = await Product.aggregate<{ products: LeanProduct[]; counts: { total: number }[] }>(pipeline);
  const docs = await Product.populate(result?.products ?? [], { path: "categoryId", select: "name slug" });
  const total = result?.counts[0]?.total ?? 0;
  await withPublishedRatings(docs);
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

export const getPublicProductBySlug = cache(async (slug: string): Promise<ProductDetail | null> => {
  await connectDb();
  const doc = await Product.findOne({ $or: [{ slug: slug.toLowerCase() }, { previousSlugs: slug.toLowerCase() }], isPublished: true })
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
  await withPublishedRatings([doc, ...related]);
  return toDetail(doc, related.map(toListItem));
});

/** Resolve legacy /product URLs without exposing unpublished products. */
export async function getPublicProductSlug(identifier: string): Promise<string | null> {
  await connectDb();
  const filter = /^[0-9a-f]{24}$/i.test(identifier)
    ? { _id: new Types.ObjectId(identifier) }
    : { $or: [{ slug: identifier.toLowerCase() }, { previousSlugs: identifier.toLowerCase() }] };
  const product = await Product.findOne({ ...filter, isPublished: true })
    .select("slug")
    .lean<{ slug: string } | null>();
  return product?.slug ?? null;
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
    Product.exists({ $or: [{ slug: c }, { previousSlugs: c }] }).then(Boolean),
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
  await connection.transaction(async (session) => {
    const doc = await Product.findById(objectId).session(session);
    if (!doc) throw notFound();

    const category = await Category.findById(input.categoryId).select("_id").lean();
    if (!category) throw new AppError("NOT_FOUND", "Category not found", 404);

    if (input.stock < doc.reservedStock) throw new AppError("CONFLICT", "Stock cannot be lower than active order reservations", 409);
    if (doc.variants.some((variant) => (variant.reservedStock ?? 0) > 0 && !input.variants.some((next) => next.sku.trim().toUpperCase() === variant.sku.toUpperCase() && next.stock >= (variant.reservedStock ?? 0)))) {
      throw new AppError("CONFLICT", "An option with active reservations cannot be removed or reduced below its reserved quantity", 409);
    }
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
      const taken = await Product.exists({ $or: [{ slug: newSlug }, { previousSlugs: newSlug }], _id: { $ne: objectId } });
      if (taken) throw new AppError("CONFLICT", "Product slug already in use", 409);
      doc.previousSlugs = [...new Set([...(doc.previousSlugs ?? []), doc.slug])].filter((slug) => slug !== newSlug);
    }
    const updated = toDoc(input, newSlug);
    updated.variants = updated.variants.map((variant) => ({ ...variant, reservedStock: doc.variants.find((old) => old.sku.toUpperCase() === variant.sku)?.reservedStock ?? 0 }));
    doc.set({ ...updated, reservedStock: doc.reservedStock, soldQuantity: doc.soldQuantity, ratingAverage: doc.ratingAverage, ratingCount: doc.ratingCount });
    await doc.save({ session });
  });
  const detail = await getAdminProductById(id);
  if (!detail) throw notFound();
  return detail;
}

export async function deleteProduct(id: string): Promise<void> {
  await connectDb();
  const objectId = assertObjectId(id);
  const doc = await Product.findById(objectId).select("images reservedStock").lean();
  if (!doc) throw notFound();
  if (doc.reservedStock > 0) throw new AppError("CONFLICT", "Product has active order reservations; unpublish it instead", 409);
  const deleted = await Product.deleteOne({ _id: objectId, $or: [{ reservedStock: { $lte: 0 } }, { reservedStock: { $exists: false } }] });
  if (!deleted.deletedCount) throw new AppError("CONFLICT", "Product changed during deletion; refresh and try again", 409);
  // ponytail: retain shared Cloudinary assets on deletion; clean up only after checking all catalogue references.

}

export async function duplicateProduct(id: string): Promise<AdminProductDetail> {
  await connectDb();
  const objectId = assertObjectId(id);
  const source = await Product.findById(objectId).lean<LeanProduct | null>();
  if (!source) throw notFound();
  const copySkus = new Set<string>();
  const skuTaken = async (c: string) => {
    if (copySkus.has(c.toUpperCase())) return true;
    const clash = await Product.exists({
      $or: [
        { sku: new RegExp(`^${escapeRegExp(c)}$`, "i") },
        { "variants.sku": new RegExp(`^${escapeRegExp(c)}$`, "i") },
      ],
    });
    return Boolean(clash);
  };
  const sku = await ensureUnique(`${source.sku.slice(0, 54)}-COPY`, skuTaken);
  copySkus.add(sku.toUpperCase());
  const variants = [];
  for (const variant of source.variants ?? []) {
    const variantSku = await ensureUnique(`${variant.sku.slice(0, 54)}-COPY`, skuTaken);
    copySkus.add(variantSku.toUpperCase());
    variants.push({ ...variant, sku: variantSku, reservedStock: 0 });
  }
  const slug = await ensureUnique(`${source.slug}-copy`, (c) =>
    Product.exists({ $or: [{ slug: c }, { previousSlugs: c }] }).then(Boolean),
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
    previousSlugs: [],
    slug,
    sku,
    variants,
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
    if (await Product.exists({ _id: { $in: ids }, reservedStock: { $gt: 0 } })) throw new AppError("CONFLICT", "Some products have active order reservations; unpublish them instead", 409);
    const result = await Product.deleteMany({ _id: { $in: ids }, $or: [{ reservedStock: { $lte: 0 } }, { reservedStock: { $exists: false } }] });
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
