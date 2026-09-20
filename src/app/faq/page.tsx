import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Good questions, kept short",
  description: "SatvaStones FAQ — materials, water, storage, shipping and gifting.",
  alternates: { canonical: "/faq" },
  openGraph: { title: "FAQ | SatvaStones", description: "SatvaStones FAQ — materials, water, storage, shipping and gifting.", url: "/faq", type: "website", siteName: "SatvaStones" },
};

const QA: { q: string; a: string }[] = [
  {
    q: "What is SatvaStones jewellery made of?",
    a: "Stainless-steel and brass imitation jewellery with a gold-toned anti-tarnish finish. Gold-coloured, not solid gold — faux pearls and decorative elements are noted on each piece.",
  },
  {
    q: "Can I wear it around water?",
    a: "Everyday splashes are fine — the finish is water-friendly. For the longest shine, keep pieces dry in showers, pools and workouts.",
  },
  {
    q: "How should I store my jewellery?",
    a: "Dry, separate pouches, away from perfumes and sprays. Each order arrives gift-ready with a pouch — reuse it.",
  },
  {
    q: "How long does shipping take?",
    a: "Dispatch in 2–4 days, delivery in 5–7 days across India. Shipping is ₹49, free over ₹399.",
  },
  {
    q: "What if my piece arrives damaged?",
    a: "Write to us within 7 days with a photo — manufacturing defects and transit damage are replaced or refunded. See Returns & exchanges.",
  },
  {
    q: "How do payments work?",
    a: "UPI, cards, netbanking and wallets through Razorpay. Your card details never touch our servers.",
  },
];

export default function FaqPage() {
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: QA.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <div className="min-h-full flex-1 bg-ivory text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <div className="mx-auto w-full max-w-2xl px-6 py-16 sm:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-clay">Ask the desk</p>
        <h1 className="mt-2 font-display text-5xl tracking-tight">Good questions, kept short.</h1>
        <dl className="mt-8 space-y-4">
          {QA.map((item) => (
            <div key={item.q} className="rounded-2xl border border-ink/10 bg-white/60 p-5">
              <dt className="font-display text-xl">{item.q}</dt>
              <dd className="mt-2 leading-7 text-ink/80">{item.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
