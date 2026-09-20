import type { Metadata } from "next";
import { ContactForm } from "@/features/content/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Talk to SatvaStones — orders, sizing, gifting and everything else.",
};

export default function ContactPage() {
  return (
    <div className="min-h-full flex-1 bg-ivory text-ink">
      <div className="mx-auto w-full max-w-2xl px-6 py-16 sm:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-clay">Write to us</p>
        <h1 className="mt-2 font-display text-5xl tracking-tight">Hello, human.</h1>
        <p className="mt-3 text-ink/70">We reply within 2 working days — usually faster.</p>
        <div className="mt-6">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
