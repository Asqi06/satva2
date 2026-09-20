import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of service — SatvaStones",
  description: "The rules of shopping at SatvaStones.",
  alternates: { canonical: "/terms" },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <div className="min-h-full flex-1 bg-ivory text-ink">
      <div className="mx-auto w-full max-w-2xl px-6 py-16 sm:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-clay">The fine print</p>
        <h1 className="mt-2 font-display text-5xl tracking-tight">Terms of service.</h1>
        <div className="mt-6 space-y-5 leading-8 text-ink/85">
          <p>
            <strong>What we sell:</strong> gold-coloured imitation jewellery — stainless steel, brass
            and plated pieces with an anti-tarnish finish. Not solid gold, and priced accordingly.
          </p>
          <p>
            <strong>Prices & payment:</strong> prices in Indian Rupees, inclusive of taxes. Payment
            is captured online via Razorpay at checkout; orders ship after successful payment
            verification. Unpaid reservations expire after 30 minutes.
          </p>
          <p>
            <strong>Accounts:</strong> one account per person, via Google login. You&apos;re
            responsible for activity under your account; tell us about misuse and we&apos;ll lock it.
          </p>
          <p>
            <strong>Reviews & content:</strong> reviews must be honest and yours; we may hide
            abusive, fake or off-topic content. Product photos and copy on this site belong to
            SatvaStones.
          </p>
          <p>
            <strong>Liability:</strong> to the extent permitted by Indian law, our liability is
            limited to the value of the order in question. Disputes fall under the jurisdiction of
            courts in Valsad, Gujarat.
          </p>
        </div>
      </div>
    </div>
  );
}
