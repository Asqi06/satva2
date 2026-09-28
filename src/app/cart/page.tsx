import type { Metadata } from "next";
import { getSettings } from "@/services/settings-service";
import { CartView } from "@/features/cart/CartView";

export const metadata: Metadata = {
  title: { absolute: "Your bag — SatvaStones" },
  description: "Review your SatvaStones bag before checkout.",
  robots: { index: false, follow: false },
};

/** Public: guests keep a local bag, members a server bag. */
export default async function CartPage() {
  return <CartView settings={await getSettings()} />;
}
