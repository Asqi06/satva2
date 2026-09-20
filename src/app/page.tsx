import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getClientEnv } from "@/lib/env";
import { NewsletterForm } from "@/features/content/NewsletterForm";
import { ProductCard } from "@/features/products/ProductCard";
import { listLiveBanners } from "@/services/banner-service";
import { listPublicCategories } from "@/services/category-service";
import { listPublicProducts } from "@/services/product-service";
import { listFeaturedReviews } from "@/services/review-service";

export const metadata: Metadata = {
  title: "SatvaStones — Everyday Aesthetic Jewellery",
  description:
    "Korean, Western and Pinterest-inspired jewellery for India: rings, bracelets, necklaces, earrings, oxidised pieces and gift hampers.",
};

/** Live catalogue content — never prerender (also keeps builds secret-free). */
export const dynamic = "force-dynamic";

const MARQUEE_ITEMS = [
  "Free shipping over ₹399",
  "Anti-tarnish finish",
  "Crafted in Vapi, Gujarat",
  "Verified reviews",
  "COD not available",
  "Korean & Western styles",
  "Premium-looking, honestly priced",
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
    description: "Everyday aesthetic jewellery for India.",
  };

  return (
    <div className="flex min-h-full flex-1 flex-col bg-ivory font-sans text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />

      {/* ───────── HERO ───────── */}
      <main>
        {hero ? (
          /* Banner hero — two-column editorial split */
          <div className="relative overflow-hidden">
            <Link
              href={hero.link}
              className="group grid min-h-[85vh] lg:grid-cols-2"
            >
              {/* Text side */}
              <div className="flex flex-col items-start justify-end gap-6 bg-ivory px-8 py-16 sm:px-14 sm:py-20 lg:justify-center">
                <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#c8a96e] animate-fade-up">
                  Featured
                </span>
                <h1 className="max-w-xl font-display italic text-6xl leading-[1.02] tracking-tight sm:text-7xl lg:text-8xl animate-fade-up delay-100">
                  {hero.title}
                </h1>
                {hero.subtitle && (
                  <p className="max-w-sm text-base leading-7 text-ink/60 animate-fade-up delay-200">
                    {hero.subtitle}
                  </p>
                )}
                <span className="animate-fade-up delay-300 group inline-flex items-center gap-3 border border-ink/20 px-7 py-3.5 text-sm font-medium tracking-wide transition-all hover:border-[#c8a96e] hover:text-[#c8a96e]">
                  Shop the story
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1" aria-hidden="true">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
              {/* Image side */}
              <div className="relative min-h-[50vh] overflow-hidden bg-[#e8e0d5] lg:min-h-full">
                <Image
                  src={hero.image.secureUrl}
                  alt={hero.image.alt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0a0a]/20" />
              </div>
            </Link>
          </div>
        ) : (
          /* Typographic fallback hero */
          <div className="relative flex min-h-[88vh] flex-col items-start justify-end overflow-hidden bg-ivory px-8 pb-20 sm:px-14 sm:pb-28">
            {/* Background decorative line */}
            <div className="absolute right-0 top-0 h-full w-px bg-ink/[0.06]" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-ink/[0.06]" />

            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#c8a96e] animate-fade-up">
              Everyday jewellery, made to gift
            </p>
            <h1 className="mt-4 max-w-4xl font-display italic text-7xl leading-[1.0] tracking-tight sm:text-8xl lg:text-[7rem] animate-fade-up delay-100">
              Pretty things for<br />every-day you.
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-ink/55 animate-fade-up delay-200">
              Rings, bracelets, necklaces and oxidised pieces —<br />
              premium-looking, honestly priced.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4 animate-fade-up delay-300">
              <Link
                href="/shop"
                className="group inline-flex items-center gap-3 bg-[#0a0a0a] px-8 py-4 text-sm font-medium tracking-wide text-ivory transition-colors hover:bg-[#c8a96e] hover:text-[#0a0a0a]"
              >
                Browse the collection
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <Link href="/about" className="text-sm text-ink/60 underline underline-offset-4 hover:text-ink">
                Our story
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* ───────── MARQUEE STRIP ───────── */}
      <div
        className="overflow-hidden border-y border-ink/[0.07] bg-[#0a0a0a] py-3"
        aria-hidden="true"
      >
        <div className="marquee-track animate-marquee whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.22em] text-[#c8a96e]">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="inline-block px-10">
              {item}
              <span className="mx-10 opacity-40">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ───────── DEPARTMENTS ───────── */}
      {categories.length > 0 && (
        <section aria-label="Shop by department" className="mx-auto w-full max-w-7xl px-6 pt-20 sm:px-10">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#c8a96e]">
                Explore
              </p>
              <h2 className="mt-1 font-display italic text-5xl tracking-tight sm:text-6xl">
                Departments
              </h2>
            </div>
            <Link
              href="/shop"
              className="hidden text-sm font-medium text-ink/50 underline underline-offset-4 hover:text-ink sm:block"
            >
              View everything →
            </Link>
          </div>
          <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {categories.map((c, i) => (
              <li key={c.id} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                <Link
                  href={`/shop?category=${c.slug}`}
                  className="group block border border-ink/[0.08] bg-white/50 p-6 transition-all hover:border-[#c8a96e] hover:bg-white"
                >
                  <span className="font-display italic text-2xl leading-tight group-hover:text-[#c8a96e]">
                    {c.name}
                  </span>
                  <span className="mt-2 block text-xs text-ink/40">
                    {c.productCount ?? 0} piece{(c.productCount ?? 0) === 1 ? "" : "s"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 block sm:hidden">
            <Link href="/shop" className="text-sm text-ink/50 underline underline-offset-4">
              View everything →
            </Link>
          </div>
        </section>
      )}

      {/* ───────── NEW ARRIVALS ───────── */}
      {newest.products.length > 0 && (
        <section aria-label="New arrivals" className="mx-auto w-full max-w-7xl px-6 pt-20 sm:px-10">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#c8a96e]">
                Just arrived
              </p>
              <h2 className="mt-1 font-display italic text-5xl tracking-tight sm:text-6xl">
                New pieces
              </h2>
            </div>
            <Link href="/shop?sort=newest" className="hidden text-sm font-medium text-ink/50 underline underline-offset-4 hover:text-ink sm:block">
              See all →
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {newest.products.map((p, i) => (
              <div key={p.id} className="animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ───────── EDITORIAL BREAK — full-bleed quote ───────── */}
      <div className="mx-auto w-full max-w-7xl px-6 pt-24 sm:px-10">
        <div className="border-y border-ink/[0.08] py-14 text-center">
          <p className="font-display italic text-3xl leading-[1.4] text-ink/70 sm:text-4xl lg:text-5xl">
            &ldquo;Gold-coloured, not solid gold — and proud of it.&rdquo;
          </p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.28em] text-[#c8a96e]">
            SatvaStones, Vapi
          </p>
        </div>
      </div>

      {/* ───────── BEST SELLERS ───────── */}
      {bestsellers.products.length > 0 && (
        <section aria-label="Best sellers" className="mx-auto w-full max-w-7xl px-6 pt-20 sm:px-10">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#c8a96e]">
                Community favourites
              </p>
              <h2 className="mt-1 font-display italic text-5xl tracking-tight sm:text-6xl">
                Most loved
              </h2>
            </div>
            <Link href="/shop?sort=best-selling" className="hidden text-sm font-medium text-ink/50 underline underline-offset-4 hover:text-ink sm:block">
              Shop all →
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {bestsellers.products.map((p, i) => (
              <div key={p.id} className="animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ───────── REVIEW WALL ───────── */}
      {wall.length > 0 && (
        <section aria-label="Customer reviews" className="mx-auto w-full max-w-7xl px-6 pt-24 sm:px-10">
          <div className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#c8a96e]">
              What they say
            </p>
            <h2 className="mt-2 font-display italic text-5xl tracking-tight sm:text-6xl">
              Worn & loved
            </h2>
          </div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {wall.map((r, i) => (
              <li
                key={r.id}
                className="border border-ink/[0.08] bg-white/60 p-7 animate-fade-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {/* Stars */}
                <p aria-label={`${r.rating} out of 5 stars`} className="text-[#c8a96e]">
                  {"★".repeat(r.rating)}
                  <span className="text-ink/15">{"★".repeat(5 - r.rating)}</span>
                </p>
                <blockquote className="mt-3 text-base leading-7 text-ink/80 italic font-display">
                  &ldquo;{r.comment}&rdquo;
                </blockquote>
                <p className="mt-4 text-xs text-ink/50">
                  {r.authorName} ·{" "}
                  <Link href={`/products/${r.productSlug}`} className="underline underline-offset-4 hover:text-ink">
                    {r.productName}
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ───────── NEWSLETTER ───────── */}
      <section aria-label="Newsletter" className="mt-24 bg-[#0a0a0a] py-20 text-ivory">
        <div className="mx-auto w-full max-w-7xl px-6 sm:px-10">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#c8a96e]">
                The Sunday note
              </p>
              <h2 className="mt-3 font-display italic text-5xl leading-[1.08] tracking-tight sm:text-6xl">
                First dibs,<br />little notes.
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-7 text-ivory/50">
                Fresh drops and quiet offers, once a week. Never noise.
              </p>
            </div>
            <div>
              <NewsletterForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
