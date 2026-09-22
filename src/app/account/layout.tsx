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
                aria-current="page"
                className="block rounded-full bg-ink px-5 py-2 text-sm font-medium text-ivory"
              >
                Overview
              </Link>
            </li>
            <li>
              <Link
                href="/account/orders"
                className="block rounded-full border border-ink/15 px-5 py-2 text-sm hover:border-ink"
              >
                Orders
              </Link>
            </li>
            {["Wishlist", "Addresses", "Settings"].map((label) => (
              <li key={label}>
                <span
                  aria-disabled="true"
                  className="flex items-center gap-2 rounded-full border border-ink/15 px-5 py-2 text-sm text-muted"
                >
                  {label}
                  <span className="rounded-full bg-marigold/30 px-2 py-0.5 text-[11px] font-semibold text-warm-gray">
                    Soon
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </nav>
        <div>{children}</div>
      </div>
    </div>
  );
}
