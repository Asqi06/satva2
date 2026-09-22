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

      <div className="mx-auto w-full max-w-7xl px-6 py-12 sm:px-10">
        {/* Breadcrumb — playful pills */}
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <li>
              <Link href="/" className="rounded-full bg-white border-2 border-light-gray px-3 py-1 text-muted hover:border-primary hover:text-primary transition-all">
                Home
              </Link>
            </li>
            <li>
              <Link href="/shop" className="rounded-full bg-white border-2 border-light-gray px-3 py-1 text-muted hover:border-primary hover:text-primary transition-all">
                Shop
              </Link>
            </li>
            {product.category.slug && (
              <li>
                <Link
                  href={`/shop?category=${product.category.slug}`}
                  className="rounded-full bg-white border-2 border-light-gray px-3 py-1 text-muted hover:border-primary hover:text-primary transition-all"
                >
                  {product.category.name}
                </Link>
              </li>
            )}
            <li aria-current="page" className="rounded-full bg-ink px-3 py-1 text-white">
              {product.name}
            </li>
          </ol>
        </nav>

        {/* Playful two-column split */}
        <div className="mt-10 grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Gallery */}
          <ProductGallery images={product.images} productName={product.name} />

          {/* Info panel */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
              ✦ {product.category.name}
            </span>
            <h1 className="mt-3 section-title text-4xl leading-[1.1] tracking-tight sm:text-5xl">
              {product.name}
            </h1>

            {/* Rating */}
            {product.ratingCount > 0 && (
              <p className="mt-4 flex items-center gap-2 text-sm">
                <span className="rounded-full bg-amber-100 px-3 py-1 font-bold text-amber-500">
                  ★ {product.ratingAverage.toFixed(1)}
                </span>
                <span className="text-muted font-medium">
                  {product.ratingCount} review
                  {product.ratingCount === 1 ? "" : "s"} 💬
                </span>
              </p>
            )}

            {/* Price */}
            <p className="mt-6 flex flex-wrap items-center gap-3" aria-label="Price">
              <span className="text-4xl font-extrabold tracking-tight">
                {formatINR(product.price)}
              </span>
              {product.compareAtPrice !== undefined &&
                product.compareAtPrice > product.price && (
                  <>
                    <s className="text-lg text-muted">
                      {formatINR(product.compareAtPrice)}
                    </s>
                    <span className="badge-off">
                      Save {product.discountPercent}% 🎉
                    </span>
                  </>
                )}
            </p>

            {/* Stock + shipping note */}
            <p className="mt-4 text-sm" aria-live="polite">
              {product.inStock ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 font-bold text-green-700">
                  ✓ In stock — ships in 2–4 days
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 font-bold text-red-600">Out of stock</span>
              )}
              <span className="text-muted">
                {" "}
                · Free shipping over ₹899 · COD available
              </span>
            </p>
            <p className="price-note mt-1">Price in ₹, inclusive of all taxes</p>

            {/* Short description */}
            {product.shortDescription && (
              <p className="mt-6 text-base leading-7 text-warm-gray">{product.shortDescription}</p>
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

            {/* Trust + delivery panel */}
            <section aria-label="Delivery and promises" className="mt-10 rounded-2xl bg-blush/60 p-6">
              <h2 className="eyebrow">
                ✨ Good to know
              </h2>
              <ul className="mt-4 space-y-2.5 text-sm leading-6 text-warm-gray">
                <li>🚚 <strong>Delivery in 5–7 days</strong> across India, tracked to your pincode.</li>
                <li>💳 <strong>COD available</strong> + UPI, cards & netbanking via Razorpay.</li>
                <li>🎁 <strong>Free gift above ₹899</strong> — pouch, box & note in every order.</li>
                <li>🛡️ <strong>Easy return</strong> — 7-day cover on defects & transit damage.</li>
              </ul>
            </section>

            {/* Divider */}
            <div className="divider-gold my-10" />

            {/* Details */}
            <section aria-label="Product details">
              <h2 className="section-title text-3xl">The details 👀</h2>
              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-warm-gray">
                {product.description}
              </p>
              <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
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
                    <div key={term} className="rounded-2xl border-2 border-light-gray bg-white p-3.5 transition-all hover:border-primary hover:scale-[1.02]">
                      <dt className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">
                        {term}
                      </dt>
                      <dd className="mt-1 font-bold">{value}</dd>
                    </div>
                  ) : null,
                )}
              </dl>

              {/* Tags */}
              {product.tags.length > 0 && (
                <ul aria-label="Tags" className="mt-6 flex flex-wrap gap-2">
                  {product.tags.map((t) => (
                    <li key={t}>
                      <Link
                        href={`/shop?q=${encodeURIComponent(t)}`}
                        className="rounded-full border-2 border-light-gray bg-white px-4 py-1.5 text-xs font-bold text-muted hover:border-primary hover:text-primary transition-all hover:scale-105"
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
          <section aria-label="Related products" className="mt-16">
            <div className="mb-6 text-center">
              <p className="eyebrow">
                Complete the look
              </p>
              <h2 className="section-title mt-1 text-2xl sm:text-3xl">You May Also Like</h2>
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
