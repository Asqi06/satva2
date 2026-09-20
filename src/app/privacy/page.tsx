import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How SatvaStones collects, uses and protects your data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-full flex-1 bg-ivory text-ink">
      <div className="mx-auto w-full max-w-2xl px-6 py-16 sm:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-clay">The fine print</p>
        <h1 className="mt-2 font-display text-5xl tracking-tight">Privacy policy.</h1>
        <div className="mt-6 space-y-5 leading-8 text-ink/85">
          <p>
            <strong>What we collect:</strong> your name, email and profile photo (via Google login),
            delivery addresses, order history, wishlist, reviews, and newsletter consent. Analytics
            sees page views and shopping events — never passwords, card numbers, or addresses.
          </p>
          <p>
            <strong>What we never store:</strong> card details, UPI IDs, or payment credentials.
            Payments run entirely on Razorpay; we keep only the order id, amount and status.
          </p>
          <p>
            <strong>Who sees it:</strong> our fulfilment flow (addresses for delivery), and service
            providers who need it to operate (hosting, email, analytics) — under their own privacy
            terms. We don&apos;t sell data. Ever.
          </p>
          <p>
            <strong>Your rights:</strong> ask for a copy or deletion of your data any time via the
            contact page. Accounts and personal data are deleted on request; anonymised order
            records may remain for tax compliance.
          </p>
        </div>
      </div>
    </div>
  );
}
