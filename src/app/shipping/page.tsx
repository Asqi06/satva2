import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Shipping & packaging — SatvaStones",
  description: "SatvaStones shipping timelines, fees and gift packaging. Dispatch 2–4 days, free shipping over ₹399.",
  alternates: { canonical: "/shipping" },
  openGraph: { title: "Shipping & packaging — SatvaStones", description: "Dispatch 2–4 days, delivery 5–7 days across India. Free shipping over ₹399.", url: "/shipping", type: "website", siteName: "SatvaStones" },
};

export default function ShippingPage() {
  return (
    <div className="min-h-full flex-1 bg-ivory text-ink">
      <div className="mx-auto w-full max-w-2xl px-6 py-16 sm:px-10">
        <p className="eyebrow">Reader services · Pan-India</p>
        <h1 className="section-title mt-2 text-5xl tracking-tight">Shipping & packaging.</h1>
        <div className="mt-6 space-y-5 leading-8 text-ink/85">
          <p><strong>Dispatch:</strong> 2–4 working days from our Vapi studio.</p>
          <p><strong>Delivery:</strong> 5–7 days across India via tracked courier.</p>
          <p><strong>Fees:</strong> ₹49 flat, free on orders over ₹399.</p>
          <p><strong>Packaging:</strong> every piece arrives gift-ready — pouch, box, and a note. No extra charge, no plastic fuss.</p>
          <p>
            Something wrong with your delivery? <Link href="/contact" className="underline underline-offset-4">Write to us</Link> with
            your order number.
          </p>
        </div>
      </div>
    </div>
  );
}
