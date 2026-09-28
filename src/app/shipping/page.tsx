import { getSettings } from "@/services/settings-service";
import { formatINR } from "@/utils/format";
import type { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
  title: { absolute: "Shipping & packaging — SatvaStones" },
  description: `Shipping fees and delivery information. Free shipping from ${formatINR(settings.freeShippingThreshold)}; otherwise ${formatINR(settings.shippingFlatFee)}.`,
  alternates: { canonical: "/shipping" },
  openGraph: { title: "Shipping & packaging — SatvaStones", description: "Shipping fees and delivery information for SatvaStones orders.", url: "/shipping", type: "website", siteName: "SatvaStones" },
};
}

export default async function ShippingPage() {
  const settings = await getSettings();
  return (
    <div className="min-h-full flex-1 bg-ivory text-ink">
      <div className="mx-auto w-full max-w-2xl px-6 py-16 sm:px-10">
        <p className="eyebrow">Reader services · Pan-India</p>
        <h1 className="section-title mt-2 text-3xl sm:text-4xl">Shipping & packaging.</h1>
        <div className="mt-6 space-y-5 leading-8 text-warm-gray">
          <p><strong>Dispatch:</strong> {settings.dispatchInformation || "Contact us for the current dispatch estimate."}</p>
          <p><strong>Delivery:</strong> {settings.deliveryInformation || "Delivery estimates depend on the destination; contact us for details."}</p>
          <p><strong>Fees:</strong> {formatINR(settings.shippingFlatFee)} below {formatINR(settings.freeShippingThreshold)}; free at or above that amount after discounts.</p>

          <p>
            Something wrong with your delivery? <Link href="/contact" className="underline underline-offset-4">Write to us</Link> with
            your order number.
          </p>
        </div>
      </div>
    </div>
  );
}
