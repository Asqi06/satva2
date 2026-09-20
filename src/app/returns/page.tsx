import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Returns & exchanges — SatvaStones",
  description: "SatvaStones return policy — defects, transit damage and size help. 7-day cover.",
  alternates: { canonical: "/returns" },
  openGraph: { title: "Returns & exchanges — SatvaStones", description: "7-day cover for defects and transit damage.", url: "/returns", type: "website", siteName: "SatvaStones" },
};

export default function ReturnsPage() {
  return (
    <div className="min-h-full flex-1 bg-ivory text-ink">
      <div className="mx-auto w-full max-w-2xl px-6 py-16 sm:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-clay">Reader services</p>
        <h1 className="mt-2 font-display text-5xl tracking-tight">Returns & exchanges.</h1>
        <div className="mt-6 space-y-5 leading-8 text-ink/85">
          <p>
            <strong>7-day cover:</strong> manufacturing defects and transit damage are replaced or
            refunded within 7 days of delivery — photo required, questions minimal.
          </p>
          <p>
            <strong>Size help:</strong> rings that don&apos;t fit can be exchanged once for another
            size of the same piece, within 7 days, unworn.
          </p>
          <p>
            <strong>Not covered:</strong> change-of-mind returns, worn pieces, and damage from
            water, perfume or drops. Imitation jewellery can&apos;t be resold once worn — we keep
            prices honest instead of building returns into them.
          </p>
          <p>
            To start a claim, <Link href="/contact" className="underline underline-offset-4">write to us</Link> with
            your order number and a photo.
          </p>
        </div>
      </div>
    </div>
  );
}
