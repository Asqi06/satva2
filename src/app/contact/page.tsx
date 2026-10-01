import { getSettings } from "@/services/settings-service";
import type { Metadata } from "next";
import { ContactForm } from "@/features/content/ContactForm";
import { businessAddressText } from "@/lib/business-seo";

export const metadata: Metadata = {
  title: { absolute: "Contact — SatvaStones" },
  description: "Talk to SatvaStones — orders, sizing, gifting and everything else.",
  alternates: { canonical: "/contact" },
  openGraph: { title: "Contact — SatvaStones", description: "Talk to SatvaStones — orders, sizing, gifting and everything else.", url: "/contact", type: "website", siteName: "SatvaStones" },
};

export default async function ContactPage() {
  const settings = await getSettings();
  return (
    <div className="min-h-full flex-1 bg-ivory text-ink">
      <div className="mx-auto w-full max-w-2xl px-6 py-16 sm:px-10">
        <p className="eyebrow">Contact & support</p>
        <h1 className="section-title mt-2 text-3xl sm:text-4xl">How can we help?</h1>
        <p className="lede mt-3">Ask about a product, sizing, delivery or an existing order. Include your order number when contacting us about a purchase.</p>
        <dl className="mt-6 space-y-3 text-sm leading-7">
          {[["Seller", settings.legalName], ["Business address", businessAddressText(settings)], ["Email", settings.supportEmail], ["Phone", settings.supportPhone], ["Grievance officer", settings.grievanceContact], ["GSTIN", settings.gstin]].map(([label, value]) => value ? <div key={label}><dt className="font-semibold">{label}</dt><dd className="whitespace-pre-line">{label === "Email" ? <a href={`mailto:${value}`} className="underline">{value}</a> : label === "Phone" ? <a href={`tel:${value}`} className="underline">{value}</a> : value}</dd></div> : null)}
        </dl>
        {!settings.physicalStore && <p className="mt-4 text-sm leading-7 text-muted">SatvaStones is an online-only jewellery business based in Vapi, Gujarat. We do not have a shop for customer visits. For delivery questions, send your destination PIN code using the form below.</p>}
        <div className="mt-6">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
