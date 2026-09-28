import { jsonLd as serializeJsonLd } from "@/utils/jsonld";
import type { Metadata } from "next";
import Link from "next/link";
import { getClientEnv } from "@/lib/env";
import { CloudinaryImage as Image } from "@/components/CloudinaryImage";
import { NewsletterForm } from "@/features/content/NewsletterForm";
import { ProductCard } from "@/features/products/ProductCard";
import { listLiveBanners } from "@/services/banner-service";
import { listPublicCategories } from "@/services/category-service";
import { listPublicProducts } from "@/services/product-service";
import { listFeaturedReviews } from "@/services/review-service";
import { getSettings } from "@/services/settings-service";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const title = settings.homeSeoTitle || "SatvaStones — Everyday Aesthetic Jewellery";
  const description = settings.homeSeoDescription || "Shop rings, bracelets, necklaces, earrings and oxidised jewellery online in India at SatvaStones.";
  return {
    title: { absolute: title }, description, alternates: { canonical: "/" },
    openGraph: { type: "website", title, description, url: "/" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export const revalidate = 60;
export const dynamic = "force-static";

export default async function Home() {
  const appUrl = getClientEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const [banners, categories, newest, bestsellers, wall, settings] = await Promise.all([
    listLiveBanners(),
    listPublicCategories(),
    listPublicProducts({ sort: "newest", page: 1, limit: 8 }),
    listPublicProducts({ sort: "best-selling", page: 1, limit: 8 }),
    listFeaturedReviews(6),
    getSettings(),
  ]);
  const hero = banners[0];

  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "SatvaStones",
    url: appUrl,

    description: "Jewellery online in India with current prices and product details.",
    ...(settings.legalName ? { legalName: settings.legalName } : {}),
    ...(settings.businessAddress ? { address: settings.businessAddress } : {}),
    ...(settings.supportEmail || settings.supportPhone ? { contactPoint: {
      "@type": "ContactPoint", contactType: "customer service",
      ...(settings.supportEmail ? { email: settings.supportEmail } : {}),
      ...(settings.supportPhone ? { telephone: settings.supportPhone } : {}),
    } } : {}),
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
  return (
    <div className="flex flex-1 flex-col bg-white font-sans text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(orgLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(websiteLd) }} />

      <section className="mx-auto grid w-full max-w-7xl bg-cream md:grid-cols-2" aria-label="Featured collection">
        <div className="flex flex-col items-start justify-center px-6 py-10 sm:px-10 md:py-16 lg:px-16">
          <p className="eyebrow">Everyday jewellery</p>
          <h1 className="section-title mt-4 max-w-md text-4xl sm:text-5xl lg:text-6xl">{hero?.title || "Small pieces. Everyday favourites."}</h1>
          <p className="mt-5 max-w-sm text-sm leading-7 text-muted">{hero?.subtitle || "Discover rings, earrings, necklaces and bracelets to wear your way."}</p>
          <Link href={hero?.link || "/shop"} className="btn-primary mt-7">Explore the collection</Link>
        </div>
        <div className="relative aspect-[5/4] md:aspect-[4/5] lg:aspect-square">
          {(hero?.image || allProducts[0]?.images[0]) && <Image src={(hero?.image || allProducts[0].images[0]).secureUrl} alt={(hero?.image || allProducts[0].images[0]).alt || "SatvaStones jewellery collection"} fill priority fetchPriority="high" sizes="(min-width: 1280px) 640px, (min-width: 768px) 50vw, 100vw" className="object-cover" />}
        </div>
      </section>
      {categories.length > 0 && <section aria-labelledby="category-heading" className="shopping-section">
        <div className="flex items-baseline justify-between gap-4"><h2 id="category-heading" className="section-title text-2xl sm:text-3xl">Shop by category</h2><Link href="/shop" className="text-sm underline underline-offset-4">View all</Link></div>
        <ul className="mt-6 grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-6 sm:gap-5">{categories.filter(c => c.image || (c.productCount ?? 0) > 0).slice(0,6).map(c => {
          const image = c.image;
          return <li key={c.id}><Link href={`/shop/${c.slug}`} className="group block"><span className="relative block aspect-square overflow-hidden rounded-[3px] bg-cream">{image ? <Image src={image.secureUrl} alt={image.alt || c.name} fill sizes="(min-width: 1280px) 186px, (min-width: 640px) calc((100vw - 164px) / 6), calc((100vw - 56px) / 3)" className="object-cover transition-opacity duration-200 group-hover:opacity-90" /> : <span className="flex h-full items-center justify-center px-2 text-center text-xs text-muted">{c.name}</span>}</span><span className="mt-3 block text-center text-xs font-medium sm:text-sm">{c.name}</span></Link></li>;
        })}</ul>
      </section>}
      {bestsellers.products.length > 0 && <section aria-labelledby="popular-heading" className="shopping-section">
        <div className="flex items-baseline justify-between gap-4"><h2 id="popular-heading" className="section-title text-2xl sm:text-3xl">{bestsellers.products.some(p => (p.soldQuantity ?? 0) > 0) ? "Bestsellers" : "Explore the collection"}</h2><Link href="/shop?sort=best-selling" className="text-sm underline underline-offset-4">Shop all</Link></div>
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 sm:gap-6">{bestsellers.products.slice(0,4).map(p => <ProductCard key={p.id} product={p} sizes="(min-width: 1280px) 286px, (min-width: 640px) calc((100vw - 136px) / 4), calc((100vw - 48px) / 2)" badge={(p.soldQuantity ?? 0) > 0 ? "bestseller" : undefined} />)}</div>
      </section>}
      <section aria-label="Shopping information" className="shopping-section"><div className="grid gap-6 border-y border-light-gray py-7 sm:grid-cols-3 sm:gap-10">
        <div><h2 className="text-sm font-medium">Delivery, clearly priced</h2><p className="mt-2 text-xs leading-6 text-muted">Free from ₹{settings.freeShippingThreshold}; otherwise ₹{settings.shippingFlatFee}. Threshold applies after discounts.</p><Link href="/shipping" className="mt-2 inline-block py-1 text-xs underline underline-offset-4">Shipping information</Link></div>
        <div><h2 className="text-sm font-medium">Secure payments</h2><p className="mt-2 text-xs leading-6 text-muted">Pay through Razorpay. See your final amount before you pay.</p></div>
        <div><h2 className="text-sm font-medium">Help when you need it</h2><p className="mt-2 text-xs leading-6 text-muted">Questions about a piece or your order? Get in touch with our team.</p><Link href="/contact" className="mt-2 inline-block py-1 text-xs underline underline-offset-4">Contact us</Link></div>
      </div></section>
      {newest.products.length > 0 && <section aria-labelledby="new-heading" className="shopping-section">
        <div className="flex items-baseline justify-between gap-4"><h2 id="new-heading" className="section-title text-2xl sm:text-3xl">New arrivals</h2><Link href="/shop?sort=newest" className="text-sm underline underline-offset-4">View all</Link></div>
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 sm:gap-6">{newest.products.slice(0,4).map(p => <ProductCard key={p.id} product={p} sizes="(min-width: 1280px) 286px, (min-width: 640px) calc((100vw - 136px) / 4), calc((100vw - 48px) / 2)" badge="new" />)}</div>
      </section>}
      {wall.length > 0 && <section aria-label="Customer reviews" className="shopping-section"><h2 className="section-title text-2xl sm:text-3xl">From our customers</h2><ul className="mt-6 grid gap-6 sm:grid-cols-3">{wall.slice(0,3).map(r => <li key={r.id} className="border-t border-light-gray pt-5"><p className="text-xs text-muted">{r.rating} / 5 · Verified purchase</p><blockquote className="mt-3 text-sm leading-7">“{r.comment}”</blockquote><p className="mt-4 text-xs text-muted">{r.authorName} · <Link href={`/products/${r.productSlug}`} className="underline">{r.productName}</Link></p></li>)}</ul></section>}
      <section className="shopping-section"><div className="grid gap-8 bg-cream px-6 py-8 sm:grid-cols-2 sm:p-10"><div><h2 className="section-title text-2xl">Get to know SatvaStones</h2><p className="mt-3 max-w-md text-sm leading-7 text-muted">{settings.aboutInformation?.split("\n")[0] || "Explore the collection and find the details that matter to you. Our team is here to help you choose."}</p><Link href="/about" className="mt-4 inline-block py-2 text-sm underline underline-offset-4">Our story</Link></div><div><h2 className="section-title text-2xl">Shopping questions?</h2><div className="mt-3 flex flex-col items-start text-sm">{[["/shipping", "Delivery & shipping fees"], ["/returns", "Returns & refunds"], ["/faq", "Frequently asked questions"]].map(([href,label]) => <Link key={href} className="py-3 underline underline-offset-4" href={href}>{label}</Link>)}</div></div></div></section>
      <section aria-label="Newsletter" className="shopping-section"><div className="grid items-center gap-6 border-t border-light-gray pt-8 md:grid-cols-2"><div><h2 className="section-title text-2xl">New pieces, in your inbox</h2><p className="mt-2 text-sm text-muted">Sign up for collection updates and offers.</p></div><NewsletterForm /></div></section>
    </div>
  );
}
