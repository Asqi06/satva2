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

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8 sm:py-10">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <li>
              <Link href="/" className="hover:text-ink hover:underline">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/shop" className="hover:text-ink hover:underline">
                Shop
              </Link>
            </li>
            {product.category.slug && (
              <>
                <li aria-hidden="true">/</li>
                <li>
                  <Link href={`/shop?category=${product.category.slug}`} className="hover:text-ink hover:underline">
                    {product.category.name}
                  </Link>
                </li>
              </>
            )}
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="max-w-40 truncate font-medium text-ink sm:max-w-none">
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="mt-7 grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Gallery */}
          <ProductGallery images={product.images} productName={product.name} />

          {/* Info panel */}
          <div>
            <p className="eyebrow">{product.category.name}</p>
            <h1 className="section-title mt-3 text-4xl sm:text-5xl">
              {product.name}
            </h1>

            {/* Rating */}
            {product.ratingCount > 0 && (
              <p className="mt-3 text-sm text-muted">
                <span aria-hidden="true" className="text-amber-600">★</span>{" "}
                <span className="font-semibold text-ink">{product.ratingAverage.toFixed(1)}</span>
                {" · "}{product.ratingCount} review{product.ratingCount === 1 ? "" : "s"}
              </p>
            )}

            {/* Price */}
            <p className="mt-7 flex flex-wrap items-baseline gap-x-3 gap-y-1" aria-label="Price">
              <span className="text-3xl font-bold tracking-tight sm:text-4xl">
                {formatINR(product.price)}
              </span>
              {product.compareAtPrice !== undefined &&
                product.compareAtPrice > product.price && (
                  <>
                    <s className="text-lg text-muted">
                      {formatINR(product.compareAtPrice)}
                    </s>
                    <span className="text-sm font-semibold text-maroon">{product.discountPercent}% off</span>
                  </>
                )}
            </p>

            {/* Stock + shipping note */}
            <p className="mt-2 text-xs text-muted">Inclusive of all taxes</p>
            <p className={`mt-5 text-sm font-semibold ${product.inStock ? "text-mehendi" : "text-primary"}`} aria-live="polite">
              {product.inStock ? "In stock · Ships in 2–4 days" : "Out of stock"}
            </p>

            {/* Short description */}
            {product.shortDescription && (
              <p className="mt-5 max-w-prose text-base leading-7 text-warm-gray">{product.shortDescription}</p>
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

            <section aria-label="Delivery and shopping information" className="mt-9 border-t border-light-gray pt-7">
              <h2 className="text-sm font-bold">Shopping with SatvaStones</h2>
              <dl className="mt-4 space-y-3 text-sm leading-6">
                <div className="grid grid-cols-[80px_1fr] gap-4">
                  <dt className="font-semibold text-ink">Delivery</dt>
                  <dd className="text-warm-gray">Tracked across India, usually in 5–7 days.</dd>
                </div>
                <div className="grid grid-cols-[80px_1fr] gap-4">
                  <dt className="font-semibold text-ink">Payment</dt>
                  <dd className="text-warm-gray">UPI, cards and netbanking through secure online checkout.</dd>
                </div>
                <div className="grid grid-cols-[80px_1fr] gap-4">
                  <dt className="font-semibold text-ink">Gifting</dt>
                  <dd className="text-warm-gray">Gift-ready packaging; a free gift on orders over ₹899.</dd>
                </div>
                <div className="grid grid-cols-[80px_1fr] gap-4">
                  <dt className="font-semibold text-ink">Returns</dt>
                  <dd className="text-warm-gray">7-day cover for defects or transit damage.</dd>
                </div>
              </dl>
            </section>

            {/* Details */}
            <section aria-label="Product details" className="mt-9 border-t border-light-gray pt-7">
              <h2 className="section-title text-2xl sm:text-3xl">Product details</h2>
              {product.description.trim() && (
                <p className="mt-4 max-w-prose whitespace-pre-line text-sm leading-7 text-warm-gray">
                  {product.description}
                </p>
              )}
              <dl className="mt-5 divide-y divide-light-gray border-y border-light-gray text-sm">
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
                    <div key={term} className="grid grid-cols-[110px_1fr] gap-4 py-3">
                      <dt className="text-muted">
                        {term}
                      </dt>
                      <dd className="font-medium text-ink">{value}</dd>
                    </div>
                  ) : null,
                )}
              </dl>

              {product.tags.length > 0 && (
                <ul aria-label="Explore similar products" className="mt-5 flex flex-wrap gap-x-4 gap-y-2">
                  {product.tags.map((t) => (
                    <li key={t}>
                      <Link
                        href={`/shop?q=${encodeURIComponent(t)}`}
                        className="text-xs font-medium text-muted underline underline-offset-4 hover:text-primary"
                      >
                        {t}
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
          <section aria-label="Related products" className="mt-16">
            <div className="mb-6">
              <p className="eyebrow">
                Complete the look
              </p>
              <h2 className="section-title mt-1 text-2xl sm:text-3xl">You may also like</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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
