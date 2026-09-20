import type { Metadata } from "next";
import Link from "next/link";
import { listPublicCategories } from "@/services/category-service";
import { listPublicProducts } from "@/services/product-service";
import { productQuerySchema } from "@/schemas/product";
import { ProductCard } from "@/features/products/ProductCard";
import { ShopFilters } from "@/features/products/ShopFilters";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const raw = await searchParams;
  const category = (Array.isArray(raw.category) ? raw.category[0] : raw.category)?.toLowerCase();
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.satvastones.in").replace(/\/$/, "");
  if (category) {
    const title = `${category.charAt(0).toUpperCase() + category.slice(1)} jewellery | SatvaStones`;
    const description = `Shop ${category} — Korean, Western and Pinterest-inspired jewellery. Anti-tarnish, honestly priced.`;
    return {
      title,
      description,
      alternates: { canonical: `${appUrl}/shop?category=${encodeURIComponent(category)}` },
      openGraph: { title, description, url: `${appUrl}/shop?category=${encodeURIComponent(category)}`, type: "website", siteName: "SatvaStones" },
      twitter: { card: "summary_large_image", title, description },
    };
  }
  return {
    title: "Shop all jewellery",
    description: "Rings, bracelets, necklaces, earrings and oxidised jewellery — premium-looking, honestly priced. Korean & Western styles, anti-tarnish.",
    alternates: { canonical: `${appUrl}/shop` },
    openGraph: { title: "Shop all jewellery | SatvaStones", description: "Rings, bracelets, necklaces, earrings and oxidised jewellery — premium-looking, honestly priced.", url: `${appUrl}/shop`, type: "website", siteName: "SatvaStones" },
    twitter: { card: "summary_large_image", title: "Shop all jewellery | SatvaStones", description: "Rings, bracelets, necklaces, earrings and oxidised jewellery — premium-looking, honestly priced." },
  };
}

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

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.satvastones.in").replace(/\/$/, "");
  const categoryName = flat.category ? categories.find((c) => c.slug === flat.category.toLowerCase())?.name ?? flat.category : null;
  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: categoryName ? `${categoryName} jewellery` : "All jewellery",
    url: `${appUrl}/shop${flat.category ? `?category=${encodeURIComponent(flat.category)}` : ""}`,
    isPartOf: { "@type": "WebSite", name: "SatvaStones", url: appUrl },
  };
  const breadcrumbLd =
    categoryName !== null
      ? {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: appUrl },
            { "@type": "ListItem", position: 2, name: "Shop", item: `${appUrl}/shop` },
            { "@type": "ListItem", position: 3, name: categoryName, item: `${appUrl}/shop?category=${encodeURIComponent(flat.category!)}` },
          ],
        }
      : null;

  const heading = categoryName ?? "All jewellery";
  return (
    <div className="min-h-full flex-1 bg-ivory text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }} />
      {breadcrumbLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      )}
      {/* Page header */}
      <div className="border-b border-ink/[0.07] bg-ivory">
        <div className="mx-auto w-full max-w-7xl px-6 pb-10 pt-12 sm:px-10">
          <p className="eyebrow">
            The shop · Prices in ₹, taxes included
          </p>
          <h1 className="section-title mt-2 text-5xl tracking-tight sm:text-7xl">
            {heading}
          </h1>
          <p className="lede mt-4 max-w-xl text-sm">
            {pagination.total === 0
              ? "No pieces match — try clearing a filter."
              : `${pagination.total} piece${pagination.total === 1 ? "" : "s"} · Free shipping over ₹399 · UPI, cards & netbanking accepted`}
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
            <p className="font-display italic text-3xl">Arre, the shelf is empty here.</p>
            <p className="mt-2 text-sm text-ink/50">Try a different budget or occasion — pretty things await.</p>
            <Link
              href="/shop"
              className="btn-primary mt-6"
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
