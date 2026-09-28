import type { Metadata } from "next";
import { getSettings } from "@/services/settings-service";
import { CheckoutWizard } from "@/features/checkout/CheckoutWizard";

export const metadata: Metadata = {
  title: { absolute: "Checkout — SatvaStones" },
  description: "Delivery, payment and confirmation for your SatvaStones order.",
  robots: { index: false, follow: false },
};

/** Guest and member checkout share server pricing and payment verification. */
export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ order?: string | string[] }> }) {
  const settings = await getSettings();
  const { order } = await searchParams;
  return (
    <div className="min-h-full flex-1 bg-ivory text-ink">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
        <p className="eyebrow">Secure checkout</p>
        <h1 className="section-title mt-2 text-3xl sm:text-4xl">Checkout</h1>
        <p className="lede mt-2 max-w-lg text-sm">
          Add your delivery details, review the total and pay securely.
        </p>
        <div className="mt-6">
          <CheckoutWizard settings={settings} resumeOrderId={typeof order === "string" && /^[a-f0-9]{24}$/.test(order) ? order : undefined} />
        </div>
      </div>
    </div>
  );
}
