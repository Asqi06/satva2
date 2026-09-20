import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listAdminCategories } from "@/services/category-service";
import { getAdminProductById } from "@/services/product-service";
import { ProductForm, type ProductFormInitial } from "@/features/admin/ProductForm";

export const metadata: Metadata = { title: "Edit product" };
export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [detail, categories] = await Promise.all([
    getAdminProductById(id),
    listAdminCategories(),
  ]);
  if (!detail) notFound();

  const initial: ProductFormInitial = {
    name: detail.name,
    slug: detail.slug,
    description: detail.description,
    shortDescription: detail.shortDescription,
    categoryId: detail.category.id,
    subcategory: detail.subcategory,
    images: detail.images.map((i) => ({ ...i, alt: i.alt, isThumbnail: false })),
    videos: detail.videos,
    price: detail.price,
    compareAtPrice: detail.compareAtPrice,
    sku: detail.sku,
    variants: detail.variants,
    material: detail.material,
    color: detail.color,
    size: detail.size,
    dimensions: detail.dimensions,
    weight: detail.weight,
    tagsText: detail.tags.join(", "),
    stock: detail.stock,
    lowStockThreshold: detail.lowStockThreshold,
    isPublished: detail.isPublished,
    isFeatured: detail.isFeatured,
    seoTitle: detail.seo.title,
    seoDescription: detail.seo.description,
  };
  // Restore thumbnail flag on the first image when none is set.
  const firstImage = initial.images[0];
  if (firstImage && !initial.images.some((i) => i.isThumbnail)) {
    firstImage.isThumbnail = true;
  }

  return (
    <ProductForm
      mode="edit"
      productId={id}
      initial={initial}
      categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
    />
  );
}
