import { jsonLd as serializeJsonLd } from "@/utils/jsonld";
import type { Metadata } from "next";
import Link from "next/link";
import { listPublicCategories } from "@/services/category-service";
import { getCatalogueFilters, listPublicProducts } from "@/services/product-service";
import { productQuerySchema } from "@/schemas/product";
import { ProductCard } from "@/features/products/ProductCard";
import { ShopFilters } from "@/features/products/ShopFilters";
import { getSettings } from "@/services/settings-service";
import { notFound, permanentRedirect } from "next/navigation";
import { getClientEnv } from "@/lib/env";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const raw = await searchParams;
  const parsed = productQuerySchema.safeParse(Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, first(value)])));
  if (!parsed.success) notFound();
  const page = parsed.data.page;
  if (page > 1) {
    const { pagination } = await listPublicProducts(parsed.data);
    if (page > Math.max(pagination.totalPages, 1)) notFound();
  }
  const filtered = !parsed.success || Object.entries(parsed.data).some(([key, value]) =>
    !["category", "page"].includes(key) && value !== undefined &&
    !(key === "sort" && value === "featured") && !(key === "limit" && value === 12));
  const suffix = page > 1 ? ` — Page ${page}` : "";
  const category = (Array.isArray(raw.category) ? raw.category[0] : raw.category)?.toLowerCase();
  const categories = category ? await listPublicCategories() : [];
  const selected = categories.find((item) => (item.slug === category || item.previousSlugs?.includes(category!)));
  if (category && !selected) notFound();
  const appUrl = getClientEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  if (selected) {
    const title = (selected.seo.title || `Buy ${selected.name} Online in India | SatvaStones`) + suffix;
    const description = selected.seo.description || selected.description?.slice(0, 160) || `Shop ${selected.name.toLowerCase()} online at SatvaStones. Explore the collection, prices and product details.`;
    const canonical = `${appUrl}${shopUrl(selected.slug, page)}`;
    const images = selected.image ? [{ url: selected.image.secureUrl, alt: selected.image.alt }] : undefined;
    if (category !== selected.slug) permanentRedirect(shopUrl(selected.slug, page));
    return {
      title: { absolute: title },
      description,
      alternates: { canonical },
      openGraph: { title, description, url: canonical, images, type: "website", siteName: "SatvaStones" },
      twitter: { card: "summary_large_image", title, description, images: images?.map((image) => image.url) },
      ...(filtered || !selected.productCount ? { robots: { index: false, follow: true } } : {}),
    };
  }
  const settings = await getSettings();
  const title = (settings.shopSeoTitle || "Buy Jewellery Online in India | SatvaStones") + suffix;
  const canonical = `${appUrl}${shopUrl(undefined, page)}`;
  const description = settings.shopSeoDescription || "Shop rings, bracelets, necklaces, earrings and oxidised jewellery online in India at SatvaStones.";
  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website", siteName: "SatvaStones" },
    twitter: { card: "summary_large_image", title, description },
    ...(filtered || category ? { robots: { index: false, follow: true } } : {}),
  };
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function shopUrl(category: string | undefined, page = 1): string {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (page > 1) params.set("page", String(page));
  return `/shop${params.size ? `?${params}` : ""}`;
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
  if (!parsed.success) notFound();
  const query = parsed.data;

  const [{ products, pagination }, categories] = await Promise.all([
    listPublicProducts(query),
    listPublicCategories(),
  ]);

  const appUrl = getClientEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const selectedCategory = flat.category ? categories.find((c) => c.slug === flat.category.toLowerCase() || c.previousSlugs?.includes(flat.category.toLowerCase())) : undefined;
  if (query.category && !selectedCategory) notFound();
  if (selectedCategory && flat.category !== selectedCategory.slug) permanentRedirect(shopUrl(selectedCategory.slug, query.page));
  if (query.page > Math.max(pagination.totalPages, 1)) notFound();
  const categoryName = selectedCategory?.name ?? null;
  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: categoryName ? `${categoryName} jewellery` : "All jewellery",
    url: `${appUrl}${shopUrl(selectedCategory?.slug, query.page)}`,
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

  const facets = await getCatalogueFilters(selectedCategory?.slug);
  const suggestions = !products.length && query.q ? (await listPublicProducts({ sort: "best-selling", page: 1, limit: 4 })).products : [];
  const heading = query.q ? `Results for “${query.q}”` : categoryName ?? "All jewellery";
  return (
    <div className="min-h-full flex-1 bg-white text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(collectionLd) }} />
      {breadcrumbLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbLd) }} />
      )}
      {/* Page header — blush band like reference */}
      <div className="bg-cream">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 text-left sm:px-8">
          {<nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted">
            <ol className="flex flex-wrap gap-2">
              <li><Link href="/">Home</Link></li><li aria-hidden="true">/</li>
              <li><Link href="/shop">Shop</Link></li><li aria-hidden="true">/</li>
              <li aria-current="page">{selectedCategory?.name || "All jewellery"}</li>
            </ol>
          </nav>}
          <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-primary">
            The collection
          </p>
          <h1 className="section-title mt-2 text-3xl sm:text-4xl">
            {heading}
          </h1>
          {selectedCategory?.description && <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/70">{selectedCategory.description}</p>}
          <p className="mt-2 max-w-xl text-[13px] text-ink/60">
            {pagination.total === 0
              ? "No pieces match — try clearing a filter."
              : `${pagination.total} piece${pagination.total === 1 ? "" : "s"}`}
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-8">
        {/* Filters */}
        <ShopFilters categories={categories} facets={facets} />

        {/* Grid */}
        {products.length > 0 ? (
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
            {products.map((p, i) => (
              <div
                key={p.id}

              >
                <ProductCard product={p} priority={i === 0} />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 border border-light-gray bg-cream px-5 py-12 text-center">
            <p className="section-title mt-3 text-2xl">No pieces match these filters.</p>
            <p className="mt-2 text-sm text-muted">Try a shorter search, remove a filter or explore a category.</p>
            <Link
              href="/shop"
              className="btn-primary mt-6"
            >
              Clear all filters
            </Link>
            <div className="mt-5 flex flex-wrap justify-center gap-2">{categories.slice(0, 5).map(c => <Link key={c.id} className="filter-chip" href={`/shop/${c.slug}`}>{c.name}</Link>)}</div>
          </div>
        )}

        {suggestions.length > 0 && <section className="mt-12" aria-label="Explore other products"><h2 className="section-title text-2xl">Explore other pieces</h2><div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">{suggestions.map(product => <ProductCard key={product.id} product={product} />)}</div></section>}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <nav aria-label="Pagination" className="mt-16 flex items-center justify-center gap-3">
            {pagination.page > 1 && (
              <Link
                href={pageLink(flat, pagination.page - 1)}
                className="btn-ghost"
              >
                ← Previous
              </Link>
            )}
            <span className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white">
              {pagination.page} / {pagination.totalPages}
            </span>
            {pagination.page < pagination.totalPages && (
              <Link
                href={pageLink(flat, pagination.page + 1)}
                className="btn-ghost"
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
