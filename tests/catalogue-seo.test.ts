import { Children, isValidElement, type ReactNode } from "react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import type { ProductDetail } from "@/services/product-service";
import ProductPage, { generateMetadata as productMetadata } from "@/app/products/[slug]/page";
import ShopPage, { generateMetadata as shopMetadata } from "@/app/shop/page";
import sitemap from "@/app/sitemap";

const mocks = vi.hoisted(() => ({
  product: vi.fn(), list: vi.fn(), categories: vi.fn(), facets: vi.fn(), sitemapProducts: vi.fn(),
}));
vi.mock("@/services/product-service", () => ({ getPublicProductBySlug: mocks.product, listPublicProducts: mocks.list, getCatalogueFilters: mocks.facets }));
vi.mock("@/services/category-service", () => ({ listPublicCategories: mocks.categories }));
vi.mock("@/services/settings-service", () => ({ getSettings: async () => ({ shippingFlatFee: 49, freeShippingThreshold: 399 }) }));
vi.mock("@/lib/db", () => ({ connectDb: async () => undefined }));
vi.mock("@/models/Product", () => ({ Product: { find: (filter: unknown) => { mocks.sitemapProducts(filter); return { select: () => ({ lean: async () => mocks.sitemapProducts.mock.results.at(-1)?.value }) }; } } }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND"); }, permanentRedirect: (url: string) => { throw new Error(`REDIRECT:${url}`); } }));
vi.mock("@/features/products/ProductCard", () => ({ ProductCard: () => null }));
vi.mock("@/features/products/ProductGallery", () => ({ ProductGallery: () => null }));
vi.mock("@/features/products/PurchasePanel", () => ({ PurchasePanel: () => null }));
vi.mock("@/features/products/RecentlyViewed", () => ({ RecentlyViewed: () => null }));
vi.mock("@/features/products/ViewItemTracker", () => ({ ViewItemTracker: () => null }));
vi.mock("@/features/reviews/ReviewsSection", () => ({ ReviewsSection: () => null }));
vi.mock("@/features/products/ShopFilters", () => ({ ShopFilters: () => null }));

const image = { publicId: "ring", secureUrl: "https://res.cloudinary.com/demo/image/upload/ring.jpg", alt: "Silver ring", isThumbnail: true };
const category = { id: "rings", slug: "rings", name: "Rings", previousSlugs: ["old-rings"], productCount: 1, seo: {}, image };
const product: ProductDetail = {
  id: "ring-1", slug: "silver-ring", name: "Silver ring", description: "A silver ring.",
  images: [image], videos: [], related: [], price: 500, sku: "RING-1", discountPercent: 0,
  ratingAverage: 0, ratingCount: 0, stock: 2, inStock: true, tags: [], isFeatured: false,
  createdAt: "2026-09-01T00:00:00.000Z", category, variants: [], seo: {}, material: "Silver", color: "Silver", size: "Adjustable",
};

function elements(node: ReactNode): { type: unknown; props: Record<string, unknown> }[] {
  return Children.toArray(node).flatMap((child) => {
    if (!isValidElement<Record<string, unknown>>(child)) return [];
    return [{ type: child.type, props: child.props }, ...elements(child.props.children as ReactNode)];
  });
}
type SchemaDocument = Record<string, unknown> & {
  url: string;
  "@id": string;
  itemListElement: { item: string }[];
  hasVariant: (Record<string, unknown> & { url: string })[];
  mainEntity: { itemListElement: { url: string }[] };
};
function structuredData(node: ReactNode): SchemaDocument[] {
  return elements(node).filter((element) => element.type === "script" && element.props.type === "application/ld+json")
    .map((element) => JSON.parse((element.props.dangerouslySetInnerHTML as { __html: string }).__html));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("VERCEL_ENV", "production"); vi.stubEnv("SITE_INDEXING_ENABLED", "true");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://www.satvastones.in");
  mocks.product.mockResolvedValue(product);
  mocks.categories.mockResolvedValue([category]);
  mocks.list.mockResolvedValue({ products: [product], pagination: { page: 1, limit: 12, total: 1, totalPages: 1 } });
  mocks.facets.mockResolvedValue({});
  mocks.sitemapProducts.mockReturnValue([{ slug: product.slug, updatedAt: new Date("2026-09-01T00:00:00.000Z"), images: [image, image] }]);
});
afterEach(() => vi.unstubAllEnvs());

describe("catalogue SEO", () => {
  it("fills blank legacy product descriptions using only product name, category and stored specifications", async () => {
    mocks.product.mockResolvedValue({ ...product, description: " \n ", shortDescription: "  ", seo: { title: "  ", description: "  " } });
    const metadata = await productMetadata({ params: Promise.resolve({ slug: product.slug }) });
    expect(metadata.description).toBe("Silver ring in the Rings collection at SatvaStones. Material: Silver. Colour: Silver. Size: Adjustable.");
    expect(metadata.title).toEqual({ absolute: "Silver ring | SatvaStones" });
    const [schema] = structuredData(await ProductPage({ params: Promise.resolve({ slug: product.slug }), searchParams: Promise.resolve({}) }));
    expect(schema.description).toBe(metadata.description);
  });

  it("never makes product pages indexable on previews or when indexing is disabled", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    expect((await productMetadata({ params: Promise.resolve({ slug: product.slug }) })).robots).toMatchObject({ index: false, googleBot: { index: false } });
    vi.stubEnv("VERCEL_ENV", "production"); vi.stubEnv("SITE_INDEXING_ENABLED", "false");
    expect((await productMetadata({ params: Promise.resolve({ slug: product.slug }) })).robots).toMatchObject({ index: false });
  });

  it("describes simple products with factual attributes and omits unearned ratings", async () => {
    const [schema, breadcrumbs] = structuredData(await ProductPage({ params: Promise.resolve({ slug: product.slug }), searchParams: Promise.resolve({}) }));
    expect(schema).toMatchObject({ "@context": "https://schema.org", "@type": "Product", material: "Silver", color: "Silver", size: "Adjustable", offers: { price: 500, priceCurrency: "INR" } });
    expect(schema.aggregateRating).toBeUndefined();
    expect(breadcrumbs.itemListElement.at(-1)?.item).toBe(schema.url);
  });

  it("keeps each variant's URL, price and availability distinct", async () => {
    mocks.product.mockResolvedValue({ ...product, variants: [{ sku: "RING S/1", size: "S", stock: 1, price: 550 }, { sku: "RING-L", size: "L", stock: 0, price: 600 }] });
    const tree = await ProductPage({ params: Promise.resolve({ slug: product.slug }), searchParams: Promise.resolve({ variant: "RING-L" }) });
    const [schema] = structuredData(tree);
    expect(schema).toMatchObject({ "@type": "ProductGroup", productGroupID: product.sku, variesBy: ["https://schema.org/size"] });
    expect(schema.hasVariant[0].url).toContain("?variant=RING%20S%2F1");
    expect(schema.hasVariant[1]).toMatchObject({ isVariantOf: { "@id": schema["@id"] }, offers: { price: 600, availability: "https://schema.org/OutOfStock" } });
    expect(elements(tree).find((element) => element.props.initialVariantSku)?.props.initialVariantSku).toBe("RING-L");
  });

  it("represents style literally without manufacturing size, pattern or an empty variesBy", async () => {
    mocks.product.mockResolvedValue({ ...product, variants: [{ sku: "RING-MOON", style: "Moon", stock: 1, price: 500 }] });
    const [schema] = structuredData(await ProductPage({ params: Promise.resolve({ slug: product.slug }), searchParams: Promise.resolve({}) }));
    expect(schema.variesBy).toBeUndefined();
    expect(schema.hasVariant[0].additionalProperty).toEqual({ "@type": "PropertyValue", name: "Style", value: "Moon" });
    expect(schema.hasVariant[0].pattern).toBeUndefined();
  });

  it("omits legacy variants with missing SKUs instead of publishing undefined URLs or invented offers", async () => {
    const malformed = { size: "M", stock: 1, price: 500 };
    mocks.product.mockResolvedValue({ ...product, variants: [malformed, { sku: "  ", size: "L", stock: 1, price: 550 }] });
    const [schema] = structuredData(await ProductPage({ params: Promise.resolve({ slug: product.slug }), searchParams: Promise.resolve({}) }));
    expect(schema["@type"]).toBe("Product");
    expect(schema.hasVariant).toBeUndefined();
    expect(schema.offers).toBeUndefined();
    expect(JSON.stringify(schema)).not.toContain("variant=undefined");
    mocks.product.mockResolvedValue({ ...product, variants: [malformed, { sku: "RING-L", size: "L", stock: 1, price: 550 }] });
    const [mixed] = structuredData(await ProductPage({ params: Promise.resolve({ slug: product.slug }), searchParams: Promise.resolve({}) }));
    expect(mixed.hasVariant).toHaveLength(1);
    expect(mixed.hasVariant[0]).toMatchObject({ sku: "RING-L", offers: { price: 550 } });
  });

  it("preserves search and facets while redirecting both metadata and page to the current category slug", async () => {
    const searchParams = { category: "old-rings", q: "silver", sort: "price-asc", page: "1", color: "Silver" };
    const expected = "REDIRECT:/shop?q=silver&sort=price-asc&page=1&color=Silver&category=rings";
    await expect(shopMetadata({ searchParams: Promise.resolve(searchParams) })).rejects.toThrow(expected);
    await expect(ShopPage({ searchParams: Promise.resolve(searchParams) })).rejects.toThrow(expected);
  });

  it("links visible collection items and its breadcrumb to their canonical URLs", async () => {
    const [schema, breadcrumbs] = structuredData(await ShopPage({ searchParams: Promise.resolve({ category: "rings" }) }));
    expect(schema).toMatchObject({ "@type": "CollectionPage", name: "Rings", mainEntity: { "@type": "ItemList", numberOfItems: 1 } });
    expect(schema.mainEntity.itemListElement[0].url).toBe("https://www.satvastones.in/products/silver-ring");
    expect(breadcrumbs.itemListElement.at(-1)?.item).toBe(schema.url);
  });

  it("points empty-state category suggestions directly to canonical collection URLs", async () => {
    mocks.list.mockResolvedValue({ products: [], pagination: { page: 1, limit: 12, total: 0, totalPages: 0 } });
    const tree = await ShopPage({ searchParams: Promise.resolve({}) });
    const hrefs = elements(tree).map((element) => element.props.href).filter(Boolean);
    expect(hrefs).toContain("/shop?category=rings");
    expect(hrefs).not.toContain("/shop/rings");
  });

  it("includes unique product/category images and genuine modification dates in the sitemap", async () => {
    mocks.categories.mockResolvedValue([category, { ...category, slug: "empty", productCount: 0 }]);
    const entries = await sitemap();
    expect(mocks.sitemapProducts).toHaveBeenCalledWith({ isPublished: true });
    expect(entries.find((entry) => entry.url.endsWith("/products/silver-ring"))).toMatchObject({ images: [image.secureUrl], lastModified: new Date("2026-09-01T00:00:00.000Z") });
    expect(entries.find((entry) => entry.url.endsWith("/shop?category=rings"))?.images).toEqual([image.secureUrl]);
    expect(entries.some((entry) => entry.url.includes("category=empty"))).toBe(false);
    expect(entries.some((entry) => entry.url.endsWith("/guides/jewellery-buying-guide"))).toBe(true);
    expect(entries.find((entry) => entry.url === "https://www.satvastones.in")?.lastModified).toBeUndefined();
    expect(entries.some((entry) => "priority" in entry || "changeFrequency" in entry)).toBe(false);
  });
});
