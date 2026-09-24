import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/admin-guard";
import { AppError } from "@/lib/errors";

/** Admin shell. Server-side ADMIN check — proxy redirect is UX only. */
export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/banners", label: "Banners" },
  { href: "/admin/settings", label: "Settings" },
] as const;

const COMING_SOON = ["Customers", "Inventory"];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AppError && error.status === 403) redirect("/account");
    if (error instanceof AppError && error.status === 401) redirect("/login");
    throw error;
  }

  return (
    <div className="min-h-full flex-1 bg-ink text-ivory">
      <div className="mx-auto grid w-full max-w-[1400px] lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* ── Sidebar ── */}
        <aside className="min-w-0 border-b border-ivory/[0.06] lg:border-b-0 lg:border-r">
          {/* Brand bar */}
          <div className="flex items-center justify-between gap-3 border-b border-ivory/[0.06] px-4 py-4 sm:px-6 lg:block lg:py-5">
            <div>
              <Link href="/" className="font-display italic text-xl text-gold">
                SatvaStones
              </Link>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-ivory/30">
                Back office · Vapi studio
              </p>
            </div>
            <Link
              href="/"
              className="shrink-0 border border-ivory/15 px-3 py-1.5 text-xs text-ivory/50 lg:hidden"
            >
              ← Store
            </Link>
          </div>

          {/* Nav */}
          <nav aria-label="Admin navigation" className="sticky top-0 z-30 bg-ink/95 px-3 py-3 backdrop-blur-sm lg:static lg:bg-transparent lg:py-4">
            {/* Mobile: horizontal scroll */}
            <ul className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:pb-0">
              {NAV_ITEMS.map((item) => (
                <li key={item.href} className="shrink-0">
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 whitespace-nowrap px-4 py-2.5 text-sm font-medium text-ivory/55 transition-colors hover:bg-ivory/[0.06] hover:text-ivory lg:rounded-none"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}

              {/* Divider */}
              <li className="hidden lg:block">
                <div className="my-2 border-t border-ivory/[0.06]" />
              </li>

              {/* Coming soon */}
              {COMING_SOON.map((label) => (
                <li key={label} className="shrink-0">
                  <span className="flex items-center gap-3 whitespace-nowrap px-4 py-2.5 text-sm text-ivory/25">
                    {label}
                    <span className="ml-auto hidden rounded bg-gold/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-gold lg:block">
                      Soon
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer: back to store */}
          <div className="hidden border-t border-ivory/[0.06] px-6 py-4 lg:block">
            <Link
              href="/"
              className="flex items-center gap-2 text-xs text-ivory/30 transition-colors hover:text-ivory/60"
            >
              ← Back to store
            </Link>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="min-w-0 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
