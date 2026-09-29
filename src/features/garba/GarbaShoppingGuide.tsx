"use client";
import Link from "next/link";
import { useState } from "react";
import { useBag } from "@/features/cart/CartProvider";
import { GARBA_OFFERS } from "@/lib/garba-offers";
import type { GarbaBenefit, GarbaGift } from "@/lib/garba-benefit";
import { useGarbaBenefit } from "./useGarbaBenefit";
import styles from "./garba.module.css";

export function GarbaBenefitCard({ benefit, checkout = false }: { benefit: GarbaBenefit; checkout?: boolean }) {
  const { add, setDrawerOpen } = useBag();
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  async function addGift(gift: GarbaGift) {
    setAdding(true); setError("");
    const success = await add({ ...gift, qty: 1 });
    setDrawerOpen(false);
    if (!success) setError("This gift couldn’t be added. Check its availability and try again.");
    setAdding(false);
  }
  return <section className={styles.shoppingGuide} aria-label="Your Garba reward">
    <p className={styles.eyebrow}>✦ YOUR FESTIVE REWARD</p>
    <h2>{GARBA_OFFERS[benefit.offerIndex].name}</h2>
    <p role="status">{benefit.valid && checkout ? `Automatically applied. You save ₹${benefit.discount} — no code needed.` : benefit.message}</p>
    <progress value={benefit.progress} max={100} aria-label="Progress toward your reward" />
    <div className={styles.guideActions}><Link href={`/garba-ghumar/collection?offer=${benefit.offerIndex}`}>Choose eligible jewellery ↗</Link>{benefit.valid && !checkout && <Link href="/checkout">Checkout with my reward ↗</Link>}</div>
    {benefit.giftCount === 0 && benefit.gifts.length > 0 && <div className={styles.giftChoices}><p>{benefit.offerIndex === 6 ? "Your mystery piece is ready to join your bag." : "Choose one of these approved free pieces."}</p>{benefit.gifts.map(gift => <div key={gift.productId}><Link href={`/products/${gift.slug}`}>{gift.name}</Link><button disabled={adding} onClick={() => void addGift(gift)}>{adding ? "Adding…" : "Add reward gift +"}</button></div>)}<small>The gift becomes free when your cart meets the offer conditions.</small></div>}
    {error && <p role="alert">{error}</p>}
  </section>;
}

export function GarbaShoppingGuide() {
  const { authed, loading, lines } = useBag();
  const state = useGarbaBenefit(authed && !loading, JSON.stringify(lines.map(l => [l.key, l.qty, l.price, l.available])));
  if (state.error) return <p className="my-5 text-sm">Couldn’t load your festive reward. <button className="underline" onClick={state.retry}>Try again</button></p>;
  return state.benefit ? <GarbaBenefitCard benefit={state.benefit} /> : null;
}
