import type { Metadata } from "next";
import { CartView } from "@/features/cart/CartView";

export const metadata: Metadata = {
  title: "Your bag — SatvaStones",
  description: "Review your SatvaStones bag before checkout.",
  robots: { index: false, follow: false },
};

/** Public: guests keep a local bag, members a server bag. */
export default function CartPage() {
  return <CartView />;
}
