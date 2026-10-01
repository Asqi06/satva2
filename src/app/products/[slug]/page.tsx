import { jsonLd as serializeJsonLd } from "@/utils/jsonld";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { getSettings } from "@/services/settings-service";
import { getClientEnv, isIndexingEnabled } from "@/lib/env";
import { getPublicProductBySlug, type ProductDetail } from "@/services/product-service";
import { ProductCard } from "@/features/products/ProductCard";
import { ProductGallery } from "@/features/products/ProductGallery";
import { PurchasePanel } from "@/features/products/PurchasePanel";
import { RecentlyViewed } from "@/features/products/RecentlyViewed";
import { ReviewsSection } from "@/features/reviews/ReviewsSection";
import { ViewItemTracker } from "@/features/products/ViewItemTracker";

type Params = { slug: string };

function productDescription(product: ProductDetail): string {
  const copy = product.shortDescription?.trim() || product.description.trim();
  if (copy) return copy;
  const specifications = [
    ["Material", product.material], ["Colour", product.color], ["Size", product.size], ["Dimensions", product.dimensions],
  ].flatMap(([label, value]) => value?.trim() ? [`${label}: ${value.trim()}`] : []);
  return `${product.name.trim()} in the ${product.category.name.trim()} collection at SatvaStones. ${specifications.length ? `${specifications.join(". ")}.` : "View current price, options and availability on this product page."}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublicProductBySlug(slug);
  if (!product) notFound();
  if (slug !== product.slug) permanentRedirect(`/products/${encodeURIComponent(product.slug)}`);
  const title = product.seo.title?.trim() || `${product.name} | SatvaStones`;
  const description =
    product.seo.description?.trim() || productDescription(product).slice(0, 160);
  const images = product.images.slice(0, 4).map((i) => ({ url: i.secureUrl, alt: i.alt }));
  const appUrl = getClientEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const canonical = `${appUrl}/products/${encodeURIComponent(product.slug)}`;
  return {
    title: { absolute: title },
    description,
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
    robots: {
      index: isIndexingEnabled(), follow: true,
      googleBot: { index: isIndexingEnabled(), follow: true, "max-image-preview": "large" },
    },
  };
}

export default async function ProductPage({ params, searchParams }: {
  params: Promise<Params>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const product = await getPublicProductBySlug(slug);
  if (!product) notFound();
  if (slug !== product.slug) permanentRedirect(`/products/${encodeURIComponent(product.slug)}`);

  const appUrl = getClientEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const canonical = `${appUrl}/products/${encodeURIComponent(product.slug)}`;
  const settings = await getSettings();
  const query = await searchParams;
  const requestedSku = typeof query.variant === "string" ? query.variant : undefined;
  const selectedVariant = product.variants.find((variant) => variant.sku === requestedSku)
    ?? product.variants.find((variant) => variant.stock > 0) ?? product.variants[0];
  // Legacy catalogue records may predate SKU validation. Never publish a fabricated
  // variant URL or offer that cannot select an identifiable option in the bag.
  const schemaVariants = product.variants.filter((variant) => typeof variant.sku === "string" && variant.sku.trim().length > 0);
  const variesBy = [
    ...(schemaVariants.some((variant) => variant.size) ? ["https://schema.org/size"] : []),
    ...(schemaVariants.some((variant) => variant.color) ? ["https://schema.org/color"] : []),
  ];
  const offer = (price: number, inStock: boolean, url: string) => ({
    "@type": "Offer", price, priceCurrency: "INR",
    availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    url, itemCondition: "https://schema.org/NewCondition",
    seller: { "@type": "Organization", "@id": `${appUrl}/#organization`, name: "SatvaStones", url: appUrl },
  });
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": schemaVariants.length ? "ProductGroup" : "Product",
    "@id": `${canonical}#product`,
    name: product.name,
    description: productDescription(product),
    ...(product.material ? { material: product.material } : {}),
    ...(!product.variants.length && product.color ? { color: product.color } : {}),
    ...(!product.variants.length && product.size ? { size: product.size } : {}),
    category: product.category.name,
    image: product.images.map((image) => image.secureUrl),
    url: canonical,
    ...(schemaVariants.length ? {
      productGroupID: product.sku?.trim() || product.id,
      ...(variesBy.length ? { variesBy } : {}),
      hasVariant: schemaVariants.map((variant) => ({
        "@type": "Product", sku: variant.sku,
        "@id": `${canonical}?variant=${encodeURIComponent(variant.sku)}#product`,
        url: `${canonical}?variant=${encodeURIComponent(variant.sku)}`,
        isVariantOf: { "@id": `${canonical}#product` },
        name: [product.name, variant.size, variant.color, variant.style].filter(Boolean).join(" — ") +
          (!variant.size && !variant.color && !variant.style ? ` — ${variant.sku}` : ""),
        ...(variant.size ? { size: variant.size } : {}),
        ...(variant.color ? { color: variant.color } : {}),
        ...(variant.style ? { additionalProperty: { "@type": "PropertyValue", name: "Style", value: variant.style } } : {}),
        description: productDescription(product),
        image: product.images.map((image) => image.secureUrl),
        offers: offer(variant.price ?? product.price, variant.stock > 0, `${canonical}?variant=${encodeURIComponent(variant.sku)}`),
      })),
    } : {
      ...(product.sku?.trim() ? { sku: product.sku } : {}),
      // A product with only malformed legacy variants is not a simple purchasable offer.
      ...(!product.variants.length ? { offers: offer(product.price, product.inStock, canonical) } : {}),
    }),
    ...(product.ratingCount > 0 ? {
      aggregateRating: {
        "@type": "AggregateRating", ratingValue: product.ratingAverage,
        reviewCount: product.ratingCount, bestRating: 5, worstRating: 1,
      },
    } : {}),
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
              item: `${appUrl}/shop?category=${encodeURIComponent(product.category.slug)}`,
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
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbLd) }}
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
                  <Link href={`/shop?category=${encodeURIComponent(product.category.slug)}`} className="hover:text-ink hover:underline">
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
            <h1 className="section-title mt-3 text-3xl sm:text-4xl">
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

            {/* Short description */}
            {product.shortDescription?.trim() && (
              <p className="mt-5 max-w-prose text-base leading-7 text-warm-gray">{product.shortDescription}</p>
            )}

            {/* Purchase panel */}
            <PurchasePanel
              key={selectedVariant?.sku ?? product.id}
              initialVariantSku={selectedVariant?.sku}
              settings={settings}
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
                stock: product.availableStock ?? product.stock,
                variants: product.variants,
              }}
            />


          </div>
        </div>

        <section aria-label="Product details" className="mt-12 max-w-3xl">
          <details className="detail-section" open><summary>Description</summary><div className="space-y-4">{(product.description.trim() || productDescription(product)).split(/\n\s*\n/).filter(Boolean).map((text, index) => <p className="whitespace-pre-line" key={index}>{text}</p>)}</div></details>
          <details className="detail-section"><summary>Details & dimensions</summary><div><dl>{([["SKU",product.sku],["Material",product.material],["Colour",product.color],["Size",product.size],["Dimensions",product.dimensions],["Weight",product.weight]] as [string,string | undefined][]).filter(([,value]) => value).map(([term,value]) => <div key={term} className="grid grid-cols-[110px_1fr] gap-4 py-2"><dt>{term}</dt><dd className="text-ink">{value}</dd></div>)}</dl></div></details>
          <details className="detail-section"><summary>Shipping & returns</summary><div><p>Delivery is free from ₹{settings.freeShippingThreshold} after discounts; otherwise ₹{settings.shippingFlatFee}.</p>{settings.dispatchInformation && <p className="mt-2">{settings.dispatchInformation}</p>}{settings.deliveryInformation && <p className="mt-2">{settings.deliveryInformation}</p>}<p className="mt-3"><Link className="underline underline-offset-4" href="/shipping">Shipping information</Link> · <Link className="underline underline-offset-4" href="/returns">Return & refund eligibility</Link></p></div></details>
        </section>
        <ReviewsSection slug={product.slug} />
        {/* Related */}
        {product.related.length > 0 && (
          <section aria-label="Related products" className="mt-16">
            <div className="mb-6">

              <h2 className="section-title mt-1 text-2xl sm:text-3xl">You may also like</h2>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-6 lg:grid-cols-4">
              {product.related.slice(0,4).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

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
