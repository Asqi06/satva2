import mongoose, { Document, Model, Schema, Types } from "mongoose";

/**
 * Products. Money is integer rupees (ADR-008). Images live on Cloudinary;
 * MongoDB stores references only. Unpublished products are invisible to
 * the public API and return 404 on the storefront.
 */

export interface IProductImage {
  publicId: string;
  secureUrl: string;
  alt: string;
  width?: number;
  height?: number;
  isThumbnail: boolean;
}

export interface IProductVideo {
  publicId: string;
  secureUrl: string;
}

export interface IProductVariant {
  sku: string;
  size?: string;
  color?: string;
  style?: string;
  price?: number;
  stock: number;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  categoryId: Types.ObjectId;
  subcategory?: string;
  images: IProductImage[];
  videos: IProductVideo[];
  price: number;
  compareAtPrice?: number;
  sku: string;
  variants: IProductVariant[];
  material?: string;
  color?: string;
  size?: string;
  dimensions?: string;
  weight?: string;
  tags: string[];
  stock: number;
  reservedStock: number;
  soldQuantity: number;
  lowStockThreshold: number;
  isPublished: boolean;
  isFeatured: boolean;
  ratingAverage: number;
  ratingCount: number;
  seo: { title?: string; description?: string };
  createdAt: Date;
  updatedAt: Date;
}

const imageSchema = new Schema<IProductImage>(
  {
    publicId: { type: String, required: true, maxlength: 512 },
    secureUrl: { type: String, required: true, maxlength: 2048 },
    alt: { type: String, required: true, maxlength: 200 },
    width: { type: Number, min: 1 },
    height: { type: Number, min: 1 },
    isThumbnail: { type: Boolean, default: false },
  },
  { _id: false },
);

const videoSchema = new Schema<IProductVideo>(
  {
    publicId: { type: String, required: true, maxlength: 512 },
    secureUrl: { type: String, required: true, maxlength: 2048 },
  },
  { _id: false },
);

const variantSchema = new Schema<IProductVariant>(
  {
    sku: { type: String, required: true, trim: true, maxlength: 64 },
    size: { type: String, trim: true, maxlength: 64 },
    color: { type: String, trim: true, maxlength: 64 },
    style: { type: String, trim: true, maxlength: 64 },
    price: { type: Number, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false },
);

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 140,
    },
    description: { type: String, required: true, maxlength: 20000 },
    shortDescription: { type: String, trim: true, maxlength: 280 },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    subcategory: { type: String, trim: true, maxlength: 120 },
    images: { type: [imageSchema], default: [] },
    videos: { type: [videoSchema], default: [] },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    sku: { type: String, required: true, unique: true, trim: true, maxlength: 64 },
    variants: { type: [variantSchema], default: [] },
    material: { type: String, trim: true, maxlength: 120 },
    color: { type: String, trim: true, maxlength: 64 },
    size: { type: String, trim: true, maxlength: 64 },
    dimensions: { type: String, trim: true, maxlength: 120 },
    weight: { type: String, trim: true, maxlength: 64 },
    tags: { type: [String], default: [] },
    stock: { type: Number, required: true, min: 0, default: 0 },
    reservedStock: { type: Number, min: 0, default: 0 },
    soldQuantity: { type: Number, min: 0, default: 0 },
    lowStockThreshold: { type: Number, min: 0, default: 5 },
    isPublished: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    ratingAverage: { type: Number, min: 0, max: 5, default: 0 },
    ratingCount: { type: Number, min: 0, default: 0 },
    seo: {
      title: { type: String, trim: true, maxlength: 160 },
      description: { type: String, trim: true, maxlength: 320 },
    },
  },
  { timestamps: true, collection: "products" },
);

productSchema.index({ categoryId: 1, isPublished: 1 });
productSchema.index({ isPublished: 1, createdAt: -1 });
productSchema.index({ name: "text", description: "text", tags: "text" });

/** Variant SKUs must be unique within a product (global check lives in the service). */
productSchema.path("variants").validate(
  (variants: IProductVariant[] | undefined) => {
    const seen = new Set<string>();
    for (const variant of variants ?? []) {
      const key = variant.sku.trim().toUpperCase();
      if (seen.has(key)) return false;
      seen.add(key);
    }
    return true;
  },
  "Variant SKUs must be unique within a product",
);

export const Product: Model<IProduct> =
  (mongoose.models.Product as Model<IProduct> | undefined) ??
  mongoose.model<IProduct>("Product", productSchema);
