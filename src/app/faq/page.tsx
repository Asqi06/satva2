import { jsonLd as serializeJsonLd } from "@/utils/jsonld";
import { getSettings } from "@/services/settings-service";
import { formatINR } from "@/utils/format";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Jewellery & order FAQ | SatvaStones" },
  description: "SatvaStones FAQ — materials, water, storage, shipping and gifting.",
  alternates: { canonical: "/faq" },
  openGraph: { title: "FAQ | SatvaStones", description: "SatvaStones FAQ — materials, water, storage, shipping and gifting.", url: "/faq", type: "website", siteName: "SatvaStones" },
};

const QA: { q: string; a: string }[] = [
  {
    q: "What is SatvaStones jewellery made of?",
    a: "Materials and finishes vary by product. Check the details on the product page or contact us before ordering.",
  },
  {
    q: "Can I wear it around water?",
    a: "Check the care information for your specific piece. If you are unsure whether a finish is suitable for water exposure, contact us.",
  },
  {
    q: "How should I store my jewellery?",
    a: "Store pieces separately in a dry place and follow the care information supplied for your product.",
  },
  {
    q: "How long does shipping take?",
    a: "Dispatch in 2–4 days, delivery in 5–7 days across India. Shipping is ₹49, free over ₹899.",
  },
  {
    q: "What if my piece arrives damaged?",
    a: "Contact us with your order number and clear photos. Read the returns policy for eligibility and next steps.",
  },
  {
    q: "How do payments work?",
    a: "Payments are processed by Razorpay. Available methods are shown in its secure payment window.",
  },
];

export default async function FaqPage() {
  const settings = await getSettings();
  const questions = QA.map((item) => item.q === "How long does shipping take?"
    ? { ...item, a: `${settings.dispatchInformation || "See our shipping policy for dispatch details."} ${settings.deliveryInformation || "Contact us for destination-specific delivery estimates."} Shipping is ${formatINR(settings.shippingFlatFee)} below ${formatINR(settings.freeShippingThreshold)}, and free at or above that amount after discounts.` }
    : item.q === "What if my piece arrives damaged?" && settings.returnPolicy
      ? { ...item, a: settings.returnPolicy } : item);
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <div className="min-h-full flex-1 bg-ivory text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqLd) }} />
      <div className="mx-auto w-full max-w-2xl px-6 py-16 sm:px-10">
        <p className="eyebrow">Shopping help</p>
        <h1 className="section-title mt-2 text-3xl sm:text-4xl">Frequently asked questions</h1>
        <div className="mt-8">
          {questions.map((item) => (
            <details key={item.q} className="detail-section">
              <summary>{item.q}</summary>
              <div>{item.a}</div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
