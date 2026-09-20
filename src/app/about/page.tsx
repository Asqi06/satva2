import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our story — SatvaStones",
  description:
    "SatvaStones started with one idea: jewellery that looks expensive without costing the earth. Made in Vapi, Gujarat, worn everywhere.",
  alternates: { canonical: "/about" },
  openGraph: { title: "Our story — SatvaStones", description: "SatvaStones started with one idea: jewellery that looks expensive without costing the earth. Made in Vapi, Gujarat, worn everywhere.", url: "/about", type: "website", siteName: "SatvaStones" },
};

export default function AboutPage() {
  return (
    <div className="min-h-full flex-1 bg-ivory text-ink">
      {/* Large editorial header */}
      <div className="border-b border-ink/[0.07]">
        <div className="mx-auto w-full max-w-7xl px-6 pb-14 pt-16 sm:px-10">
          <p className="eyebrow animate-fade-up">
            Our story · Vapi → all of India
          </p>
          <h1 className="section-title mt-3 max-w-3xl text-7xl leading-[1.01] tracking-tight sm:text-8xl animate-fade-up delay-100">
            Pretty things,<br />honest prices.
          </h1>
        </div>
      </div>

      {/* Editorial spread */}
      <div className="mx-auto w-full max-w-7xl px-6 py-16 sm:px-10">
        <div className="grid gap-16 lg:grid-cols-[1fr_1fr] lg:gap-24">
          {/* Column 1 */}
          <div className="space-y-8 animate-fade-up delay-200">
            <div className="h-px bg-gradient-to-r from-[#c8a96e] to-transparent" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#c8a96e]">
              Why SatvaStones
            </p>
            <p className="font-display italic text-4xl leading-[1.25] tracking-tight sm:text-5xl">
              Korean finishes, Indian sensibility.
            </p>
            <div className="space-y-5 text-base leading-[1.85] text-ink/70">
              <p>
                SatvaStones started from a simple frustration: the jewellery that looked like it
                cost ten thousand rupees was mostly buying a brand name, not craftsmanship.
                We set out to close that gap.
              </p>
              <p>
                Everything we make is finished to an anti-tarnish standard that keeps it
                looking new for years — not weeks. Our aesthetic is Pinterest-first, drawing from
                Korean minimalism and Western editorial styling, but made for the realities of
                Indian weather, Indian skin tones and Indian occasions.
              </p>
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-8 animate-fade-up delay-300">
            <div className="h-px bg-gradient-to-r from-[#c8a96e] to-transparent" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#c8a96e]">
              How we work
            </p>
            <p className="font-display italic text-4xl leading-[1.25] tracking-tight sm:text-5xl">
              Crafted in Vapi, shipped to you.
            </p>
            <div className="space-y-5 text-base leading-[1.85] text-ink/70">
              <p>
                We work directly with craftspeople in Vapi, Gujarat — one of India&apos;s oldest
                jewellery-manufacturing clusters. No middlemen, no inflated margins. That&apos;s how
                we can sell rings for ₹349 that feel like ₹1,400.
              </p>
              <p>
                Each piece is photographed, quality-checked and packed in-house. Orders ship
                within 2–4 business days. We don&apos;t do cash on delivery because it creates waste
                on both ends — yours and ours.
              </p>
            </div>
          </div>
        </div>

        {/* Pull quote */}
        <div className="mt-24 border-y border-ink/[0.07] py-16 text-center animate-fade-up delay-300">
          <p className="font-display italic text-4xl leading-[1.3] text-ink/80 sm:text-5xl">
            &ldquo;Gold-coloured, not solid gold —{" "}
            <br className="hidden sm:block" />
            and proud of it.&rdquo;
          </p>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-[#c8a96e]">
            SatvaStones, since 2025
          </p>
        </div>

        {/* Values grid */}
        <div className="mt-20 grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Anti-tarnish",
              body: "A protective finish baked into every piece. Not a coating you peel off after three months.",
            },
            {
              title: "Honest pricing",
              body: "No 60% off \"sales\". The price you see is the price we've thought about.",
            },
            {
              title: "Free returns",
              body: "Not in love with it? Return within 7 days. No questions, no drama.",
            },
          ].map((v, i) => (
            <div
              key={v.title}
              className="border border-ink/[0.08] bg-white/50 p-8 animate-fade-up"
              style={{ animationDelay: `${300 + i * 80}ms` }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#c8a96e]">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h2 className="mt-3 font-display italic text-3xl">{v.title}</h2>
              <p className="mt-3 text-sm leading-7 text-ink/60">{v.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
