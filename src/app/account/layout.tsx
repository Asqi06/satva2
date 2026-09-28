import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/lib/auth";

/** Session-dependent — never prerender (also keeps builds secret-free). */
export const dynamic = "force-dynamic";

/**
 * Account shell. Server-side session check — proxy redirect is UX only.
 * Section links beyond Overview arrive in later phases (rendered disabled,
 * never as broken links).
 */
export default async function AccountLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-full flex-1 bg-ivory text-ink">
      <div className="mx-auto grid w-full max-w-5xl gap-8 px-6 py-12 sm:px-10 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Account" className="lg:pt-2">
          <ul className="flex gap-2 overflow-x-auto lg:flex-col">
            <li>
              <Link
                href="/account"
                className="block rounded-[3px] bg-ink min-h-11 px-5 py-3 text-sm font-medium text-ivory"
              >
                Overview
              </Link>
            </li>
            <li>
              <Link
                href="/account/orders"
                className="block rounded-[3px] border border-ink/15 min-h-11 px-5 py-3 text-sm hover:border-ink"
              >
                Orders
              </Link>
            </li>
            <li><Link href="/wishlist" className="block min-h-11 rounded-[3px] border border-light-gray px-5 py-3 text-sm">Wishlist</Link></li>
          </ul>
        </nav>
        <div>{children}</div>
      </div>
    </div>
  );
}
