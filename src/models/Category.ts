import mongoose, { Document, Model, Schema, Types } from "mongoose";

/**
 * Product categories. Managed from /admin; the storefront only ever
 * lists `isPublished` categories. `parentId` enables subcategories.
 */

export interface ICategoryImage {
  publicId: string;
  secureUrl: string;
  alt: string;
}

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: ICategoryImage;
  parentId?: Types.ObjectId | null;
  isPublished: boolean;
  sortOrder: number;
  seo: { title?: string; description?: string };
  createdAt: Date;
  updatedAt: Date;
}

const categoryImageSchema = new Schema<ICategoryImage>(
  {
    publicId: { type: String, required: true, maxlength: 512 },
    secureUrl: { type: String, required: true, maxlength: 2048 },
    alt: { type: String, required: true, maxlength: 200 },
  },
  { _id: false },
);

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 140,
    },
    description: { type: String, trim: true, maxlength: 2000 },
    image: { type: categoryImageSchema, required: false },
    parentId: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    isPublished: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    seo: {
      title: { type: String, trim: true, maxlength: 160 },
      description: { type: String, trim: true, maxlength: 320 },
    },
  },
  { timestamps: true, collection: "categories" },
);

categorySchema.index({ isPublished: 1, sortOrder: 1 });

export const Category: Model<ICategory> =
  (mongoose.models.Category as Model<ICategory> | undefined) ??
  mongoose.model<ICategory>("Category", categorySchema);
