import type { Metadata } from "next";
import { CartView } from "@/features/cart/CartView";

export const metadata: Metadata = {
  title: "Your bag",
  description: "Review your SatvaStones bag before checkout.",
};

/** Public: guests keep a local bag, members a server bag. */
export default function CartPage() {
  return <CartView />;
}
