import type { Metadata } from "next";
import { GarbaWheel } from "@/features/garba/GarbaWheel";
import { garbaPaymentsEnabled } from "@/services/garba-service";

export const metadata: Metadata = {
  title: { absolute: "Garba Ghumar • Navratri Special — SatvaStones" },
  description: "A festive spin, a little shagun. Discover SatvaStones’ Garba Ghumar wheel, seven jewellery offers and the guaranteed Nav29 coupon.",
  alternates: { canonical: "/garba-ghumar" },
};

export default function GarbaPage() {
  return <GarbaWheel paymentsEnabled={garbaPaymentsEnabled()} />;
}
