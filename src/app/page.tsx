import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getClientEnv } from "@/lib/env";
import { cloudinaryResize } from "@/utils/cloudinary-url";
import { NewsletterForm } from "@/features/content/NewsletterForm";
import { ProductCard } from "@/features/products/ProductCard";
import { listLiveBanners } from "@/services/banner-service";
import { listPublicCategories } from "@/services/category-service";
import { listPublicProducts } from "@/services/product-service";
import { listFeaturedReviews } from "@/services/review-service";

export const metadata: Metadata = {
  title: "SatvaStones — Everyday Aesthetic Jewellery",
  description:
    "Korean, Western and Pinterest-inspired jewellery for India: rings, bracelets, necklaces, earrings, oxidised pieces and gift hampers. Anti-tarnish, honestly priced.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    title: "SatvaStones — Everyday Aesthetic Jewellery",
    description:
      "Korean, Western and Pinterest-inspired jewellery for India: rings, bracelets, necklaces, earrings, oxidised pieces and gift hampers.",
  },
};

export const revalidate = 60;
export const dynamic = "force-static";

const TRENDS = [
  { label: "Office Girl", href: "/shop?sort=best-selling", bg: "bg-stone-700" },
  { label: "Dreamy Girl", href: "/shop?sort=newest", bg: "bg-rose-300" },
  { label: "Island", href: "/shop", bg: "bg-amber-600" },
  { label: "Party Night", href: "/shop?maxPrice=999", bg: "bg-zinc-500" },
];

export default async function Home() {
  const appUrl = getClientEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const [banners, categories, newest, bestsellers, wall] = await Promise.all([
    listLiveBanners(),
    listPublicCategories(),
    listPublicProducts({ sort: "newest", page: 1, limit: 8 }),
    listPublicProducts({ sort: "best-selling", page: 1, limit: 8 }),
    listFeaturedReviews(6),
  ]);
  const hero = banners[0];

  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "SatvaStones",
    url: appUrl,
    logo: `${appUrl}/icon.png`,
    description: "Everyday aesthetic jewellery for India — Korean, Western and Pinterest-inspired, anti-tarnish, crafted in Vapi, Gujarat.",
    sameAs: [],
  };

  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "SatvaStones",
    url: appUrl,
    description: "Korean, Western and Pinterest-inspired jewellery for India.",
    publisher: { "@type": "Organization", name: "SatvaStones", url: appUrl },
    potentialAction: {
      "@type": "SearchAction",
      target: `${appUrl}/shop?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const allProducts = [...bestsellers.products, ...newest.products];
  const imgForCategory = (name: string) => {
    const found = allProducts.find((p) => p.category.name.toLowerCase() === name.toLowerCase());
    return found?.images[0];
  };
  const trendImgs = [0, 1, 2, 3].map((i) => allProducts[i]?.images[0]);
  // banners[0] = main hero image, banners[1] = sale strip image (Admin → Banners, ordered by Sort order).
  const promo = banners[1];

  return (
    <div className="flex flex-1 flex-col bg-white font-sans text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }} />

      <main>
        {/* ───────── HERO — full banner image, edited in Admin → Banners ───────── */}
        <section aria-label="Featured collection">
          {hero ? (
            <Link href={hero.link} className="group relative block overflow-hidden bg-blush">
              <span className="relative block aspect-[5/4] w-full sm:aspect-[16/8] lg:aspect-[21/9]">
                <Image
                  src={cloudinaryResize(hero.image.secureUrl, 1600)}
                  alt={hero.image.alt}
                  fill
                  priority
                  fetchPriority="high"
                  sizes="100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.01]"
                />
              </span>
              <span className="block bg-cream px-6 py-7 sm:absolute sm:bottom-8 sm:left-8 sm:max-w-md sm:rounded-2xl sm:bg-white/95 sm:p-8 sm:shadow-xl lg:bottom-12 lg:left-12">
                <span className="eyebrow block">Featured collection · {hero.title}</span>
                <h1 className="section-title mt-2 block text-3xl text-ink sm:text-4xl">
                  Little pieces, big feelings.
                </h1>
                <span className="mt-3 block max-w-sm text-sm leading-6 text-warm-gray">
                  Jewellery to make every day feel like an occasion.
                </span>
                <span className="mt-5 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-primary">
                  Explore the collection
                </span>
              </span>
            </Link>
          ) : (
            <div className="bg-blush">
              <div className="mx-auto flex w-full max-w-7xl flex-col items-center px-4 py-14 text-center sm:px-8">
                <p className="eyebrow">Everyday jewellery, made to gift</p>
                <h1 className="section-title mt-2 text-3xl sm:text-5xl">
                  Pretty things for every-day you.
                </h1>
                <p className="lede mt-3 max-w-md text-sm">
                  Rings, bracelets, necklaces and oxidised pieces — premium-looking,
                  honestly priced and made to gift.
                </p>
                <Link href="/shop" className="btn-primary mt-6">
                  Browse the collection →
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* ───────── CATEGORY STRIP ───────── */}
        {categories.length > 0 && (
          <section aria-labelledby="category-heading" className="border-y border-light-gray bg-cream">
            <div className="mx-auto w-full max-w-7xl px-4 pb-8 pt-9 sm:px-8">
              <p className="eyebrow">Find your kind of sparkle</p>
              <h2 id="category-heading" className="section-title mt-1 text-2xl sm:text-3xl">Shop by category</h2>
            <ul className="no-scrollbar mt-6 flex gap-4 overflow-x-auto pb-1 sm:gap-6">
              {categories.slice(0, 6).map((c) => {
                const img = imgForCategory(c.name);
                return (
                  <li key={c.id} className="w-24 shrink-0 sm:w-32">
                    <Link href={`/shop?category=${c.slug}`} className="group block text-center">
                      <span className="relative block aspect-square overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition-transform group-hover:scale-[1.03]">
                        {img ? (
                          <Image
                            src={cloudinaryResize(img.secureUrl, 400)}
                            alt={img.alt || c.name}
                            fill
                            sizes="160px"
                            loading="lazy"
                            className="object-cover"
                          />
                        ) : (
                          <span className="flex h-full items-center justify-center bg-gradient-to-br from-blush via-[#f6e4dd] to-peach/60 font-display text-5xl font-semibold text-maroon/80">
                            {c.name.charAt(0)}
                          </span>
                        )}
                      </span>
                      <span className="mt-2 block text-xs font-semibold text-ink sm:text-sm">
                        {c.name}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            </div>
          </section>
        )}

        {/* ───────── SHOP BY TREND ───────── */}
        <section aria-labelledby="trend-heading" className="mx-auto w-full max-w-7xl px-4 pt-14 sm:px-8">
          <p className="eyebrow">A mood for every moment</p>
          <h2 id="trend-heading" className="section-title mt-1 text-3xl sm:text-4xl">Shop by trend</h2>
          <ul className="no-scrollbar mt-6 flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-4 sm:gap-4 sm:overflow-visible">
            {TRENDS.map((t, i) => {
              const img = trendImgs[i];
              return (
                <li key={t.label} className="w-40 shrink-0 sm:w-auto">
                  <Link href={t.href} className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-cream">
                    {img ? (
                      <Image
                        src={cloudinaryResize(img.secureUrl, 500)}
                        alt={t.label}
                        fill
                        sizes="300px"
                        loading="lazy"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <span className={`absolute inset-0 ${t.bg}`} />
                    )}
                    <span className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" aria-hidden="true" />
                    <span className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5">
                      <span className="font-display text-xl font-semibold group-hover:underline sm:text-2xl">{t.label}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {/* ───────── INSTAGRAM VIRAL ───────── */}
        {bestsellers.products.length > 0 && (
          <section aria-labelledby="popular-heading" className="mx-auto mt-14 w-full max-w-7xl rounded-[28px] bg-cream px-4 py-9 sm:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Most loved</p>
                <h2 id="popular-heading" className="section-title mt-1 text-3xl sm:text-4xl">The popular pieces</h2>
              </div>
              <Link href="/shop?sort=best-selling" className="text-sm font-bold text-primary underline-offset-4 hover:underline">
                View all best sellers
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {bestsellers.products.slice(0, 4).map((p, i) => (
                <div key={p.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 7) * 40}ms` }}>
                  <ProductCard product={p} badge="bestseller" eager={i < 2} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ───────── SALE STRIP — 2nd banner image, edited in Admin → Banners ───────── */}
        {promo && (
          <section aria-label={promo.title} className="mx-auto w-full max-w-7xl px-4 pt-10 sm:px-8">
            <Link href={promo.link} className="group relative block overflow-hidden rounded-2xl">
              <span className="relative block aspect-[4/3] w-full sm:aspect-[21/8]">
                <Image
                  src={cloudinaryResize(promo.image.secureUrl, 1400)}
                  alt={promo.image.alt}
                  fill
                  sizes="100vw"
                  loading="lazy"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.01]"
                />
              </span>
              <span className="sr-only">{promo.title}{promo.subtitle ? ` — ${promo.subtitle}` : ""}</span>
            </Link>
          </section>
        )}

        {/* ───────── NEW ARRIVALS ───────── */}
        {newest.products.length > 0 && (
          <section aria-labelledby="new-heading" className="mx-auto w-full max-w-7xl px-4 pt-14 sm:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Fresh finds</p>
                <h2 id="new-heading" className="section-title mt-1 text-3xl sm:text-4xl">New arrivals</h2>
              </div>
              <Link href="/shop?sort=newest" className="text-sm font-bold text-primary underline-offset-4 hover:underline">
                Shop all new
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {newest.products.slice(0, 4).map((p, i) => (
                <div key={p.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 7) * 40}ms` }}>
                  <ProductCard product={p} badge="new" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ───────── REVIEWS ───────── */}
        {wall.length > 0 && (
          <section aria-label="Customer reviews" className="mx-auto w-full max-w-7xl px-4 pt-14 sm:px-8">
            <p className="eyebrow">From the community</p>
            <h2 className="section-title mt-1 text-3xl sm:text-4xl">Worn & loved</h2>
            <ul className="no-scrollbar mt-6 flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible">
              {wall.slice(0, 6).map((r) => (
                <li key={r.id} className="w-72 shrink-0 rounded-2xl border border-light-gray bg-white p-6 shadow-sm sm:w-auto">
                  <p aria-label={`${r.rating} out of 5 stars`} className="text-sm font-bold text-amber-500">
                    {"★".repeat(r.rating)}
                    <span className="text-black/15">{"★".repeat(5 - r.rating)}</span>
                  </p>
                  <blockquote className="clamp-2 mt-2 text-sm leading-6 text-ink/80">
                    &ldquo;{r.comment}&rdquo;
                  </blockquote>
                  <p className="mt-3 text-xs text-muted">
                    {r.authorName} ·{" "}
                    <Link href={`/products/${r.productSlug}`} className="font-semibold text-primary hover:underline">
                      {r.productName}
                    </Link>
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ───────── NEWSLETTER ───────── */}
        <section aria-label="Newsletter" className="mt-12 bg-blush py-12">
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-8 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="eyebrow">The Sunday note</p>
              <h2 className="section-title mt-2 text-3xl sm:text-4xl">
                First dibs, little notes.
              </h2>
              <p className="lede mt-3 max-w-sm text-sm">
                Fresh drops and quiet offers, once a week. Never noise.
              </p>
            </div>
            <div>
              <NewsletterForm />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
