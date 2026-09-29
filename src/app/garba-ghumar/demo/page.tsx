import type { Metadata } from "next";
import { GarbaWheel } from "@/features/garba/GarbaWheel";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { absolute: "Garba Ghumar Demo — SatvaStones" },
  robots: { index: false, follow: false },
};

export default function GarbaDemoPage() {
  return <GarbaWheel paymentsEnabled={false} demoMode />;
}
