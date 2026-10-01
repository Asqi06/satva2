import Link from "next/link";
import { pageMetadata } from "@/lib/page-seo";
import { getClientEnv } from "@/lib/env";
import { getSettings } from "@/services/settings-service";
import { listPublicCategories } from "@/services/category-service";
import { listPublicProducts } from "@/services/product-service";
import { ProductCard } from "@/features/products/ProductCard";
import { formatINR } from "@/utils/format";
import { jsonLd } from "@/utils/jsonld";

const path = "/guides/jewellery-buying-guide";
const title = "Buying Jewellery Online in India: Size, Materials & Delivery | SatvaStones";
const description = "Compare SatvaStones jewellery, check size and material details, understand variant prices, and calculate delivery costs before ordering online in India.";
export const metadata = pageMetadata(path, title, description);
export const revalidate = 60;

export default async function JewelleryBuyingGuide() {
  const [settings, categories, catalogue] = await Promise.all([
    getSettings(), listPublicCategories(), listPublicProducts({ sort: "newest", page: 1, limit: 4 }),
  ]);
  const base = getClientEnv().NEXT_PUBLIC_APP_URL;
  const structured = {
    "@context": "https://schema.org", "@graph": [
      {
        "@type": "Article", "@id": `${base}${path}#article`, headline: title, description,
        mainEntityOfPage: `${base}${path}`, inLanguage: "en-IN",
        author: { "@type": "Organization", name: "SatvaStones", url: `${base}/about` },
        publisher: { "@id": `${base}/#organization` },
      },
      {
        "@type": "BreadcrumbList", itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: base },
          { "@type": "ListItem", position: 2, name: "Jewellery buying guide", item: `${base}${path}` },
        ],
      },
    ],
  };
  return (
    <article className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-8 sm:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structured) }} />
      <nav aria-label="Breadcrumb" className="text-sm text-muted"><Link href="/" className="underline">Home</Link> / Jewellery buying guide</nav>
      <header className="mt-8 max-w-3xl">
        <p className="eyebrow">SatvaStones shopping guide</p>
        <h1 className="section-title mt-3 text-3xl sm:text-5xl">Buying jewellery online in India</h1>
        <p className="mt-5 text-sm leading-8 text-muted">Start with the product details, then choose the exact option you want. This guide explains how to compare pieces in our collection, check the price you will pay and find help before ordering.</p>
        <p className="mt-3 text-sm text-muted">By <Link href="/about" className="underline">SatvaStones</Link> · Online jewellery business based in Vapi, Gujarat</p>
      </header>
      <div className="mt-10 max-w-3xl space-y-10 text-sm leading-8 text-muted">
        <section aria-labelledby="compare-materials">
          <h2 id="compare-materials" className="section-title text-2xl text-ink">Which material and finish am I buying?</h2>
          <p className="mt-4">Use the material, dimensions and description on each product page to compare pieces. A gold colour describes appearance; it does not establish gold purity. Material, plating and care requirements can differ between products.</p>
          <p className="mt-3">If a detail matters to you—such as the base metal, coating, water exposure or suitability for sensitive skin—<Link href="/contact" className="underline">ask us about that specific item</Link> before buying. A collection name or photo alone cannot answer those questions.</p>
        </section>
        <section aria-labelledby="check-fit">
          <h2 id="check-fit" className="section-title text-2xl text-ink">How do I choose the right size or option?</h2>
          <p className="mt-4">Read the listed size and dimensions, and select an available option in the purchase panel. Ring sizing systems and bracelet lengths can differ, so compare the stated measurement with a piece that already fits you. Ask for the measurement or sizing system if it is missing.</p>
          <p className="mt-3">Changing an option can change its price and availability. A “from” price in the collection is the lowest listed option price; the selected option’s price appears on the product page and in your bag. Sold-out options cannot be added to the bag.</p>
        </section>
        <section aria-labelledby="delivery-cost">
          <h2 id="delivery-cost" className="section-title text-2xl text-ink">What will delivery cost?</h2>
          <p className="mt-4">Our current delivery fee is {formatINR(settings.shippingFlatFee)} when your subtotal after discounts is below {formatINR(settings.freeShippingThreshold)}. Delivery is free at or above {formatINR(settings.freeShippingThreshold)} after discounts. Review the final total at checkout.</p>
          <p className="mt-3">{settings.dispatchInformation || "Ask our team for the current dispatch estimate."} {settings.deliveryInformation || "Delivery timing depends on your destination; share your PIN code and needed date for an estimate."}</p>
          <p className="mt-3">For a gift or a time-sensitive occasion, confirm timing before paying. See <Link href="/shipping" className="underline">shipping information</Link> and <Link href="/returns" className="underline">return and cancellation details</Link> for the current terms.</p>
        </section>
        <section aria-labelledby="care-details">
          <h2 id="care-details" className="section-title text-2xl text-ink">What should I check before paying?</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5">
            <li>Confirm the selected size, colour, style and quantity in your bag.</li>
            <li>Check material, dimensions and any product-specific care information.</li>
            <li>Read the return policy, especially for sizing or gifting decisions.</li>
            <li>Check your delivery address and the final amount, including shipping.</li>
          </ul>
          <p className="mt-3">Payments are processed through Razorpay. For help after ordering, contact us with your order number; for a damaged delivery, include clear photos. Our <Link href="/faq" className="underline">shopping FAQ</Link> answers common questions.</p>
        </section>
      </div>
      <section className="mt-12 border-t border-light-gray pt-8" aria-labelledby="guide-categories">
        <h2 id="guide-categories" className="section-title text-2xl">Explore the jewellery collection</h2>
        <ul className="mt-5 flex flex-wrap gap-3">{categories.filter((category) => (category.productCount ?? 0) > 0).map((category) => <li key={category.id}><Link href={`/shop?category=${encodeURIComponent(category.slug)}`} className="inline-block border border-light-gray px-4 py-3 text-sm">{category.name}</Link></li>)}</ul>
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 sm:gap-6">{catalogue.products.map((product) => <ProductCard key={product.id} product={product} />)}</div>
        <Link href="/shop" className="btn-primary mt-8">Shop all jewellery</Link>
      </section>
    </article>
  );
}
