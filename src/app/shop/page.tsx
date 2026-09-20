import type { Metadata } from "next";
import Link from "next/link";
import { listPublicCategories } from "@/services/category-service";
import { listPublicProducts } from "@/services/product-service";
import { productQuerySchema } from "@/schemas/product";
import { ProductCard } from "@/features/products/ProductCard";
import { ShopFilters } from "@/features/products/ShopFilters";

export const metadata: Metadata = {
  title: "Shop all jewellery",
  description:
    "Rings, bracelets, necklaces, earrings and oxidised jewellery — premium-looking, honestly priced.",
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function pageLink(params: Record<string, string | undefined>, page: number): string {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) search.set(k, v);
  }
  search.set("page", String(page));
  return `/shop?${search.toString()}`;
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const flat: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    const single = first(v);
    if (single !== undefined) flat[k] = single;
  }
  const parsed = productQuerySchema.safeParse(flat);
  const query = parsed.success
    ? parsed.data
    : { sort: "featured" as const, page: 1, limit: 12 };

  const [{ products, pagination }, categories] = await Promise.all([
    listPublicProducts(query),
    listPublicCategories(),
  ]);

  return (
    <div className="min-h-full flex-1 bg-ivory text-ink">
      {/* Page header */}
      <div className="border-b border-ink/[0.07] bg-ivory">
        <div className="mx-auto w-full max-w-7xl px-6 pb-10 pt-12 sm:px-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#c8a96e]">
            The shop
          </p>
          <h1 className="mt-2 font-display italic text-6xl tracking-tight sm:text-7xl">
            All jewellery
          </h1>
          <p className="mt-4 text-sm text-ink/50">
            {pagination.total === 0
              ? "No pieces match — try clearing a filter."
              : `${pagination.total} piece${pagination.total === 1 ? "" : "s"}`}
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-6 py-8 sm:px-10">
        {/* Filters */}
        <ShopFilters categories={categories} />

        {/* Grid */}
        {products.length > 0 ? (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {products.map((p, i) => (
              <div
                key={p.id}
                className="animate-fade-up"
                style={{ animationDelay: `${Math.min(i, 7) * 40}ms` }}
              >
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8 border border-ink/[0.08] bg-white/50 p-16 text-center">
            <p className="font-display italic text-3xl">The shelf is empty here.</p>
            <Link
              href="/shop"
              className="mt-5 inline-flex items-center gap-2 text-sm text-ink/50 underline underline-offset-4 hover:text-ink"
            >
              Clear all filters →
            </Link>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <nav aria-label="Pagination" className="mt-14 flex items-center justify-center gap-4">
            {pagination.page > 1 && (
              <Link
                href={pageLink(flat, pagination.page - 1)}
                className="flex items-center gap-2 border border-ink/15 px-6 py-2.5 text-sm font-medium transition-colors hover:border-[#c8a96e] hover:text-[#c8a96e]"
              >
                ← Previous
              </Link>
            )}
            <span className="text-sm text-ink/40">
              {pagination.page} / {pagination.totalPages}
            </span>
            {pagination.page < pagination.totalPages && (
              <Link
                href={pageLink(flat, pagination.page + 1)}
                className="flex items-center gap-2 border border-ink/15 px-6 py-2.5 text-sm font-medium transition-colors hover:border-[#c8a96e] hover:text-[#c8a96e]"
              >
                Next →
              </Link>
            )}
          </nav>
        )}
      </div>
    </div>
  );
}
