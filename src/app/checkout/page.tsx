import type { Metadata } from "next";
import { CheckoutWizard } from "@/features/checkout/CheckoutWizard";

export const metadata: Metadata = {
  title: "Checkout — SatvaStones",
  description: "Delivery, payment and confirmation for your SatvaStones order.",
  robots: { index: false, follow: false },
};

/** Public entry; the wizard gates guests to login before payment. */
export default function CheckoutPage() {
  return (
    <div className="min-h-full flex-1 bg-ivory text-ink">
      <div className="mx-auto w-full max-w-2xl px-6 py-12 sm:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-clay">Checkout</p>
        <h1 className="mt-2 font-display text-5xl tracking-tight">Nearly there.</h1>
        <div className="mt-6">
          <CheckoutWizard />
        </div>
      </div>
    </div>
  );
}
