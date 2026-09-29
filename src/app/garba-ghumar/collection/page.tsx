import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GARBA_OFFERS } from "@/lib/garba-offers";
import { garbaApprovedPrice } from "@/lib/garba-pricing";
import { connectDb } from "@/lib/db";
import { Product } from "@/models/Product";
import { listPublicProducts } from "@/services/product-service";
import { GarbaCollectionPicker } from "@/features/garba/GarbaCollectionPicker";
import { GarbaShoppingGuide } from "@/features/garba/GarbaShoppingGuide";
import { auth } from "@/lib/auth";
import { getGarbaBenefit } from "@/services/garba-benefit-service";

export const metadata: Metadata = { title: "Your festive collection", robots: { index: false, follow: true } };

export default async function GarbaCollection({ searchParams }: { searchParams: Promise<{ offer?: string; page?: string }> }) {
  const params = await searchParams;
  if (!params.offer || !/^[0-6]$/.test(params.offer)) notFound();
  const index = Number(params.offer);
  const offer = GARBA_OFFERS[index];
  const page = Number(params.page ?? 1);
  if (!Number.isInteger(page) || page < 1) notFound();
  await connectDb();
  const [{ products, pagination }, eligible] = await Promise.all([
    listPublicProducts({ collection: offer.tag, minPrice: garbaApprovedPrice(index), sort: "featured", page, limit: 24, inStock: true }),
    Product.find({ isPublished: true, tags: offer.tag, variants: { $size: 0 }, price: { $gte: garbaApprovedPrice(index) } }).select("_id").lean(),
  ]);
  const ids = new Set(eligible.map(p => p._id.toString()));
  const session = await auth();
  const benefit = session?.user?.id ? await getGarbaBenefit(session.user.id) : null;
  const wonIds = benefit?.offerIndex === index ? new Set(benefit.eligibleProductIds) : null;
  const selected = products.filter(p => ids.has(p.id) && (!wonIds || wonIds.has(p.id)));
  return <section className="shopping-section w-full py-10">
    <Link href="/garba-ghumar" className="text-xs underline underline-offset-4">← Back to Garba Ghumar</Link>
    <p className="eyebrow mt-8">Your selected festive collection</p>
    <h1 className="section-title mt-3 text-3xl sm:text-4xl">{offer.name}</h1>
    <GarbaShoppingGuide />
    <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">{offer.description} Add the required items. Your earned reward applies automatically at checkout when your selection qualifies. Delivery is charged under the usual store policy. One reward per order.</p>
    {(index === 4 || index === 6) && <p className="mt-3 text-sm leading-7">{index === 6 ? "Add the mystery piece revealed in your saved wheel reward as your fourth item." : <><Link href="/shop?collection=garba-gift" className="underline">Choose one selected gift</Link> and add it along with ₹499+ of the eligible pieces below.</>}</p>}
    {selected.length ? <GarbaCollectionPicker products={selected} /> : <p className="mt-8 rounded border border-light-gray bg-cream p-6 text-sm leading-7">We’re preparing this selected collection. Please check back before buying a paid spin.</p>}
    {pagination.totalPages > 1 && <nav className="mt-8 flex gap-6 text-sm" aria-label="Collection pages">{page > 1 && <Link href={`?offer=${index}&page=${page - 1}`}>← Previous</Link>}{page < pagination.totalPages && <Link href={`?offer=${index}&page=${page + 1}`}>Next →</Link>}</nav>}
  </section>;
}
