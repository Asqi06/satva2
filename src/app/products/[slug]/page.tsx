import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getClientEnv } from "@/lib/env";
import { getPublicProductBySlug } from "@/services/product-service";
import { formatINR } from "@/utils/format";
import { ProductCard } from "@/features/products/ProductCard";
import { ProductGallery } from "@/features/products/ProductGallery";
import { PurchasePanel } from "@/features/products/PurchasePanel";
import { RecentlyViewed } from "@/features/products/RecentlyViewed";
import { ReviewsSection } from "@/features/reviews/ReviewsSection";
import { ViewItemTracker } from "@/features/products/ViewItemTracker";

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublicProductBySlug(slug);
  if (!product) return { title: "Not found", robots: { index: false, follow: false } };
  const title = product.seo.title || `${product.name} | SatvaStones`;
  const description =
    product.seo.description ||
    product.shortDescription ||
    product.description.slice(0, 155);
  const images = product.images.slice(0, 4).map((i) => ({ url: i.secureUrl, alt: i.alt, width: 1200, height: 630 }));
  const appUrl = getClientEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const canonical = `${appUrl}/products/${product.slug}`;
  return {
    title,
    description,
    keywords: [product.name, product.category.name, ...(product.tags ?? []), product.material ?? "", product.color ?? ""].filter(Boolean),
    alternates: { canonical },
    openGraph: {
      type: "website",
      title,
      description,
      images,
      url: canonical,
      siteName: "SatvaStones",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.map((i) => i.url),
    },
    robots: { index: true, follow: true },
  };
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const product = await getPublicProductBySlug(slug);
  if (!product) notFound();

  const appUrl = getClientEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const canonical = `${appUrl}/products/${product.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription ?? product.description.slice(0, 300),
    sku: product.sku,
    brand: { "@type": "Brand", name: "SatvaStones" },
    category: product.category.name,
    image: product.images.map((i) => i.secureUrl),
    url: canonical,
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: product.price,
      availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: canonical,
      seller: { "@type": "Organization", name: "SatvaStones", url: appUrl },
      itemCondition: "https://schema.org/NewCondition",
      ...(product.compareAtPrice ? { highPrice: product.compareAtPrice } : {}),
    },
    ...(product.ratingCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.ratingAverage,
            reviewCount: product.ratingCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: appUrl },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${appUrl}/shop` },
      ...(product.category.slug
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: product.category.name,
              item: `${appUrl}/shop?category=${product.category.slug}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: product.category.slug ? 4 : 3,
        name: product.name,
        item: canonical,
      },
    ],
  };

  return (
    <div className="min-h-full flex-1 bg-ivory text-ink">
      <ViewItemTracker id={product.id} name={product.name} price={product.price} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <div className="mx-auto w-full max-w-7xl px-6 py-10 sm:px-10">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-ink/40">
            <li>
              <Link href="/" className="hover:text-ink">
                Home
              </Link>
            </li>
            <li aria-hidden="true">·</li>
            <li>
              <Link href="/shop" className="hover:text-ink">
                Shop
              </Link>
            </li>
            {product.category.slug && (
              <>
                <li aria-hidden="true">·</li>
                <li>
                  <Link
                    href={`/shop?category=${product.category.slug}`}
                    className="hover:text-ink"
                  >
                    {product.category.name}
                  </Link>
                </li>
              </>
            )}
            <li aria-hidden="true">·</li>
            <li aria-current="page" className="text-ink/70">
              {product.name}
            </li>
          </ol>
        </nav>

        {/* Editorial two-column split */}
        <div className="mt-8 grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Gallery */}
          <ProductGallery images={product.images} productName={product.name} />

          {/* Info panel */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#c8a96e]">
              {product.category.name}
            </p>
            <h1 className="mt-2 font-display italic text-5xl leading-[1.08] tracking-tight sm:text-6xl">
              {product.name}
            </h1>

            {/* Rating */}
            {product.ratingCount > 0 && (
              <p className="mt-3 flex items-center gap-2 text-sm">
                <span className="text-[#c8a96e]">
                  {"★".repeat(Math.round(product.ratingAverage))}
                  {"★"
                    .repeat(5)
                    .split("")
                    .slice(Math.round(product.ratingAverage))
                    .join("")
                    .replace(/★/g, "☆")}
                </span>
                <span className="text-ink/40">
                  {product.ratingAverage.toFixed(1)} · {product.ratingCount} review
                  {product.ratingCount === 1 ? "" : "s"}
                </span>
              </p>
            )}

            {/* Price */}
            <p className="mt-5 flex items-baseline gap-3" aria-label="Price">
              <span className="font-mono text-3xl font-semibold">
                {formatINR(product.price)}
              </span>
              {product.compareAtPrice !== undefined &&
                product.compareAtPrice > product.price && (
                  <>
                    <s className="font-mono text-lg text-ink/35">
                      {formatINR(product.compareAtPrice)}
                    </s>
                    <span className="bg-[#c8a96e] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.15em] text-[#0a0a0a]">
                      Save {product.discountPercent}%
                    </span>
                  </>
                )}
            </p>

            {/* Stock + shipping note */}
            <p className="mt-2 text-sm" aria-live="polite">
              {product.inStock ? (
                <span className="font-medium text-emerald-800">
                  In stock — ships in 2–4 days from Vapi
                </span>
              ) : (
                <span className="font-medium text-red-700">Out of stock</span>
              )}
              <span className="text-ink/40">
                {" "}
                · Free shipping over ₹399 · UPI, cards &amp; netbanking
              </span>
            </p>
            <p className="price-note mt-1">Price in ₹, inclusive of all taxes</p>

            {/* Short description */}
            {product.shortDescription && (
              <p className="mt-5 leading-7 text-ink/70">{product.shortDescription}</p>
            )}

            {/* Purchase panel */}
            <PurchasePanel
              product={{
                id: product.id,
                name: product.name,
                slug: product.slug,
                price: product.price,
                compareAtPrice: product.compareAtPrice,
                image: product.images[0]
                  ? { secureUrl: product.images[0].secureUrl, alt: product.images[0].alt }
                  : undefined,
                inStock: product.inStock,
                variants: product.variants,
              }}
            />

            {/* Trust + delivery panel — reassurance Indian shoppers expect */}
            <section aria-label="Delivery and promises" className="mt-8 border border-ink/[0.08] bg-white/50 p-5">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink/40">
                Good to know
              </h2>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/70">
                <li>🚚 <strong>Delivery in 5–7 days</strong> across India, tracked to your pincode.</li>
                <li>💳 <strong>UPI, cards, netbanking & wallets</strong> via Razorpay. Online payments only — no COD.</li>
                <li>🎁 <strong>Gift-ready packing free</strong> — pouch, box & note for shagun and birthdays.</li>
                <li>🛡️ <strong>7-day easy cover</strong> for defects & transit damage.</li>
              </ul>
            </section>

            {/* Gold divider */}
            <div className="divider-gold my-8" />

            {/* Details */}
            <section aria-label="Product details">
              <h2 className="font-display italic text-2xl">The details</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-ink/70">
                {product.description}
              </p>
              <dl className="mt-5 grid grid-cols-2 gap-2.5 text-sm">
                {(
                  [
                    ["SKU", product.sku],
                    ["Material", product.material],
                    ["Colour", product.color],
                    ["Size", product.size],
                    ["Dimensions", product.dimensions],
                    ["Weight", product.weight],
                  ] as [string, string | undefined][]
                ).map(([term, value]) =>
                  value ? (
                    <div key={term} className="border border-ink/[0.07] bg-white/50 p-3">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/40">
                        {term}
                      </dt>
                      <dd className="mt-1 font-medium">{value}</dd>
                    </div>
                  ) : null,
                )}
              </dl>

              {/* Tags */}
              {product.tags.length > 0 && (
                <ul aria-label="Tags" className="mt-5 flex flex-wrap gap-2">
                  {product.tags.map((t) => (
                    <li key={t}>
                      <Link
                        href={`/shop?q=${encodeURIComponent(t)}`}
                        className="border border-ink/[0.1] px-3 py-1 text-xs text-ink/50 hover:border-[#c8a96e] hover:text-[#c8a96e]"
                      >
                        #{t}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>

        {/* Related */}
        {product.related.length > 0 && (
          <section aria-label="Related products" className="mt-24">
            <div className="mb-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#c8a96e]">
                Complete the look
              </p>
              <h2 className="mt-1 font-display italic text-4xl">You may also like</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {product.related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        <ReviewsSection slug={product.slug} />
        <RecentlyViewed
          current={{
            slug: product.slug,
            name: product.name,
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            image: product.images[0]
              ? { secureUrl: product.images[0].secureUrl, alt: product.images[0].alt }
              : undefined,
          }}
        />
      </div>
    </div>
  );
}
