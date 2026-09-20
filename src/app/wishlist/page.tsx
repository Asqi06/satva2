import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { WishlistView } from "@/features/wishlist/WishlistView";

export const metadata: Metadata = {
  title: "Wishlist — SatvaStones",
  description: "Your saved SatvaStones pieces.",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/** Auth-only: proxy redirects guests, layout re-verifies. */
export default async function WishlistPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return <WishlistView />;
}
