import { Types } from "mongoose";
import { connectDb } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { Category, type ICategory } from "@/models/Category";
import { Product } from "@/models/Product";
import type { CategoryInput } from "@/schemas/category";
import { ensureUnique, slugify } from "@/utils/slug";

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: { publicId: string; secureUrl: string; alt: string };
  parentId: string | null;
  isPublished: boolean;
  sortOrder: number;
  seo: { title?: string; description?: string };
  productCount?: number;
}

type LeanCategory = Omit<ICategory, "_id" | "parentId"> & {
  _id: Types.ObjectId;
  parentId: Types.ObjectId | null;
};

function toDTO(doc: LeanCategory, productCount?: number): CategoryDTO {
  return {
    id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    description: doc.description,
    image: doc.image
      ? { publicId: doc.image.publicId, secureUrl: doc.image.secureUrl, alt: doc.image.alt }
      : undefined,
    parentId: doc.parentId ? doc.parentId.toString() : null,
    isPublished: doc.isPublished,
    sortOrder: doc.sortOrder,
    seo: { title: doc.seo?.title, description: doc.seo?.description },
    productCount,
  };
}

function assertObjectId(id: string, notFound: AppError): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) throw notFound;
  return new Types.ObjectId(id);
}

export async function listPublicCategories(): Promise<CategoryDTO[]> {
  await connectDb();
  const docs = await Category.find({ isPublished: true })
    .sort({ sortOrder: 1, name: 1 })
    .lean<LeanCategory[]>();
  const counts = await Product.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { isPublished: true } },
    { $group: { _id: "$categoryId", count: { $sum: 1 } } },
  ]);
  const byCategory = new Map(counts.map((c) => [c._id.toString(), c.count]));
  return docs.map((d) => toDTO(d, byCategory.get(d._id.toString()) ?? 0));
}

export async function listAdminCategories(): Promise<CategoryDTO[]> {
  await connectDb();
  const docs = await Category.find({})
    .sort({ sortOrder: 1, name: 1 })
    .lean<LeanCategory[]>();
  return docs.map((d) => toDTO(d));
}

export async function getCategoryBySlug(slug: string): Promise<CategoryDTO | null> {
  await connectDb();
  const doc = await Category.findOne({ slug: slug.toLowerCase(), isPublished: true }).lean<LeanCategory | null>();
  return doc ? toDTO(doc) : null;
}

export async function createCategory(input: CategoryInput): Promise<CategoryDTO> {
  await connectDb();
  if (input.parentId) {
    const parent = await Category.findById(input.parentId).select("_id").lean();
    if (!parent) throw new AppError("NOT_FOUND", "Parent category not found", 404);
  }
  const slug = input.slug ?? slugify(input.name);
  const uniqueSlug = await ensureUnique(slug, (c) => Category.exists({ slug: c }).then(Boolean));
  const doc = await Category.create({
    name: input.name,
    slug: uniqueSlug,
    description: input.description,
    image: input.image,
    parentId: input.parentId ? new Types.ObjectId(input.parentId) : null,
    isPublished: input.isPublished,
    sortOrder: input.sortOrder,
    seo: { title: input.seoTitle, description: input.seoDescription },
  });
  return toDTO(doc.toObject() as LeanCategory);
}

export async function updateCategory(
  id: string,
  input: Partial<CategoryInput>,
): Promise<CategoryDTO> {
  await connectDb();
  const notFound = new AppError("NOT_FOUND", "Category not found", 404);
  const objectId = assertObjectId(id, notFound);
  const doc = await Category.findById(objectId);
  if (!doc) throw notFound;

  if (input.slug && input.slug !== doc.slug) {
    const taken = await Category.exists({ slug: input.slug, _id: { $ne: objectId } });
    if (taken) throw new AppError("CONFLICT", "Category slug already in use", 409);
    doc.slug = input.slug;
  }
  if (input.name !== undefined) doc.name = input.name;
  if (input.description !== undefined) doc.description = input.description;
  if (input.image !== undefined) doc.image = input.image;
  if (input.parentId !== undefined) {
    if (input.parentId && input.parentId === id) {
      throw new AppError("VALIDATION_ERROR", "Category cannot be its own parent", 400);
    }
    doc.parentId = input.parentId ? new Types.ObjectId(input.parentId) : null;
  }
  if (input.isPublished !== undefined) doc.isPublished = input.isPublished;
  if (input.sortOrder !== undefined) doc.sortOrder = input.sortOrder;
  if (input.seoTitle !== undefined) doc.seo.title = input.seoTitle;
  if (input.seoDescription !== undefined) doc.seo.description = input.seoDescription;
  await doc.save();
  return toDTO(doc.toObject() as LeanCategory);
}

export async function deleteCategory(id: string): Promise<void> {
  await connectDb();
  const notFound = new AppError("NOT_FOUND", "Category not found", 404);
  const objectId = assertObjectId(id, notFound);
  const inUse = await Product.exists({ categoryId: objectId });
  if (inUse) {
    throw new AppError("CONFLICT", "Category has products and cannot be deleted", 409);
  }
  const result = await Category.deleteOne({ _id: objectId });
  if (result.deletedCount === 0) throw notFound;
}
