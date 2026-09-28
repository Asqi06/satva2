import { getSettings } from "@/services/settings-service";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: { absolute: "Returns & exchanges — SatvaStones" },
  description: "Return, exchange, refund and cancellation information for SatvaStones orders.",
  alternates: { canonical: "/returns" },
  openGraph: { title: "Returns & exchanges — SatvaStones", description: "Return, exchange, refund and cancellation information for SatvaStones orders.", url: "/returns", type: "website", siteName: "SatvaStones" },
};

export default async function ReturnsPage() {
  const settings = await getSettings();
  return (
    <div className="min-h-full flex-1 bg-ivory text-ink">
      <div className="mx-auto w-full max-w-2xl px-6 py-16 sm:px-10">
        <p className="eyebrow">Reader services</p>
        <h1 className="section-title mt-2 text-3xl sm:text-4xl">Returns & exchanges.</h1>
        {settings.returnPolicy ? <div className="mt-6 whitespace-pre-line leading-8 text-ink/85">{settings.returnPolicy}</div> : (
        <div className="mt-6 space-y-5 text-sm leading-8 text-muted"><p>Contact us with your order number before requesting a return, exchange or refund. Our team can confirm the eligibility and steps for your order.</p><p>If a product arrives damaged or incorrect, include clear photos and your order details so we can investigate.</p><Link href="/contact" className="inline-block min-h-11 underline underline-offset-4">Contact support</Link></div>
        )}
        <section className="mt-8 space-y-3 leading-8 text-warm-gray">
          <h2 className="section-title text-2xl">Cancellation</h2>
          <p className="whitespace-pre-line">{settings.cancellationPolicy || "Unpaid pending orders can be cancelled on your order status page. For paid orders, contact support before dispatch."}</p>
          <Link href="/contact" className="underline underline-offset-4">Contact support</Link>
        </section>
      </div>
    </div>
  );
}
