import type { Metadata } from "next";
import { ContactForm } from "@/features/content/ContactForm";

export const metadata: Metadata = {
  title: "Contact — SatvaStones",
  description: "Talk to SatvaStones — orders, sizing, gifting and everything else.",
  alternates: { canonical: "/contact" },
  openGraph: { title: "Contact — SatvaStones", description: "Talk to SatvaStones — orders, sizing, gifting and everything else.", url: "/contact", type: "website", siteName: "SatvaStones" },
};

export default function ContactPage() {
  return (
    <div className="min-h-full flex-1 bg-ivory text-ink">
      <div className="mx-auto w-full max-w-2xl px-6 py-16 sm:px-10">
        <p className="eyebrow">Write to us · Vapi studio</p>
        <h1 className="section-title mt-2 text-5xl tracking-tight">Hello, human.</h1>
        <p className="lede mt-3">We reply within 2 working days — usually faster. Orders, sizing, gifting, bulk shaadi orders — all welcome.</p>
        <div className="mt-6">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
