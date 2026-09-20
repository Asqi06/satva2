import { z } from "zod";
import { objectIdSchema, slugSchema } from "./category";

const MAX_IMAGES = 12;
const MAX_VARIANTS = 20;

const imageSchema = z.object({
  publicId: z.string().min(1).max(512),
  secureUrl: z.string().url().max(2048),
  alt: z.string().min(1, "Image alt text is required").max(200),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  isThumbnail: z.boolean().default(false),
});

const videoSchema = z.object({
  publicId: z.string().min(1).max(512),
  secureUrl: z.string().url().max(2048),
});

const variantSchema = z.object({
  sku: z.string().trim().min(1).max(64),
  size: z.string().trim().max(64).optional(),
  color: z.string().trim().max(64).optional(),
  style: z.string().trim().max(64).optional(),
  price: z.number().int().min(0).optional(),
  stock: z.number().int().min(0).default(0),
});

const shortText = z.string().trim().max(120).optional();
const tagList = z.array(z.string().trim().min(1).max(40)).max(20).default([]);

export const productInputSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(160),
    slug: slugSchema.optional(),
    description: z.string().trim().min(1, "Description is required").max(20000),
    shortDescription: z.string().trim().max(280).optional(),
    categoryId: objectIdSchema,
    subcategory: z.string().trim().max(120).optional(),
    images: z.array(imageSchema).min(1, "At least one image is required").max(MAX_IMAGES),
    videos: z.array(videoSchema).max(4).default([]),
    price: z.number().int("Price must be whole rupees").min(0),
    compareAtPrice: z.number().int().min(0).optional(),
    sku: z.string().trim().min(1, "SKU is required").max(64),
    variants: z.array(variantSchema).max(MAX_VARIANTS).default([]),
    material: shortText,
    color: z.string().trim().max(64).optional(),
    size: z.string().trim().max(64).optional(),
    dimensions: z.string().trim().max(120).optional(),
    weight: z.string().trim().max(64).optional(),
    tags: tagList,
    stock: z.number().int().min(0),
    lowStockThreshold: z.number().int().min(0).default(5),
    isPublished: z.boolean().default(false),
    isFeatured: z.boolean().default(false),
    seoTitle: z.string().trim().max(160).optional(),
    seoDescription: z.string().trim().max(320).optional(),
  })
  .refine((v) => v.compareAtPrice === undefined || v.compareAtPrice > v.price, {
    message: "Compare-at price must be higher than price",
    path: ["compareAtPrice"],
  })
  .refine(
    (v) => {
      const seen = new Set(v.variants.map((x) => x.sku.trim().toUpperCase()));
      return seen.size === v.variants.length;
    },
    { message: "Variant SKUs must be unique", path: ["variants"] },
  )
  .refine(
    (v) =>
      !v.variants.some((x) => x.sku.trim().toUpperCase() === v.sku.trim().toUpperCase()),
    { message: "Variant SKU must differ from the product SKU", path: ["variants"] },
  );

export type ProductInput = z.infer<typeof productInputSchema>;

/** Query-string boolean: "true"/"1" → true, "false"/"0" → false. */
const queryBoolean = z
  .union([z.boolean(), z.enum(["true", "false", "1", "0"])])
  .transform((v) => v === true || v === "true" || v === "1")
  .optional();

export const PRODUCT_SORTS = [  "featured",
  "newest",
  "price-asc",
  "price-desc",
  "best-selling",
  "rating",
] as const;

export type ProductSort = (typeof PRODUCT_SORTS)[number];

export const productQuerySchema = z.object({
  category: z.string().trim().min(1).max(140).optional(),
  q: z.string().trim().min(1).max(100).optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  material: z.string().trim().max(120).optional(),
  color: z.string().trim().max(64).optional(),
  inStock: queryBoolean,
  collection: z.string().trim().max(40).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  minDiscount: z.coerce.number().min(0).max(100).optional(),
  sort: z.enum(PRODUCT_SORTS).default("featured"),
  page: z.coerce.number().int().min(1).default(1),
  // Clamp (don't reject): oversized pages silently shrink to the cap.
  limit: z.coerce.number().int().min(1).default(12).transform((v) => Math.min(v, 50)),
});

export type ProductQuery = z.infer<typeof productQuerySchema>;

export const bulkActionSchema = z.object({
  action: z.enum(["publish", "unpublish", "delete", "feature", "unfeature"]),
  ids: z.array(objectIdSchema).min(1).max(100),
});

export type BulkAction = z.infer<typeof bulkActionSchema>;
