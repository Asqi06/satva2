import type { Metadata } from "next";
import { listAdminCategories } from "@/services/category-service";
import { ProductForm } from "@/features/admin/ProductForm";

export const metadata: Metadata = { title: "New product" };
export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await listAdminCategories();
  if (categories.length === 0) {
    return (
      <div>
        <h1 className="admin-title">New product</h1>
        <p className="mt-4 rounded-lg border border-ink/10 bg-white/60 p-4 text-sm">
          Create a category first — every product needs one.{" "}
          <a href="/admin/categories" className="underline underline-offset-4">
            Go to categories
          </a>
        </p>
      </div>
    );
  }
  return (
    <ProductForm
      mode="create"
      categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
    />
  );
}
