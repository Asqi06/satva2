import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/admin-guard";
import { AppError } from "@/lib/errors";

/** Admin shell. Server-side ADMIN check — proxy redirect is UX only. */
export const dynamic = "force-dynamic";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "◈" },
  { href: "/admin/products", label: "Products", icon: "◻" },
  { href: "/admin/categories", label: "Categories", icon: "◫" },
  { href: "/admin/orders", label: "Orders", icon: "◪" },
  { href: "/admin/reviews", label: "Reviews", icon: "◉" },
  { href: "/admin/coupons", label: "Coupons", icon: "◎" },
  { href: "/admin/banners", label: "Banners", icon: "◬" },
] as const;

const COMING_SOON = ["Customers", "Inventory"];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AppError && error.status === 403) redirect("/account");
    redirect("/login");
  }

  return (
    <div className="min-h-full flex-1 bg-[#0f0f0f] text-ivory">
      <div className="mx-auto grid w-full max-w-[1400px] lg:grid-cols-[240px_1fr]">
        {/* ── Sidebar ── */}
        <aside className="border-r border-ivory/[0.06]">
          {/* Brand bar */}
          <div className="border-b border-ivory/[0.06] px-6 py-5">
            <Link href="/" className="font-display italic text-xl text-[#c8a96e]">
              SatvaStones ✦
            </Link>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-ivory/30">
              Back office · Vapi studio
            </p>
          </div>

          {/* Nav */}
          <nav aria-label="Admin navigation" className="px-3 py-4">
            {/* Mobile: horizontal scroll */}
            <ul className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:pb-0">
              {NAV_ITEMS.map((item) => (
                <li key={item.href} className="shrink-0">
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 whitespace-nowrap px-4 py-2.5 text-sm font-medium text-ivory/55 transition-colors hover:bg-ivory/[0.06] hover:text-ivory lg:rounded-none"
                  >
                    <span aria-hidden="true" className="text-[#c8a96e]">
                      {item.icon}
                    </span>
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
                    <span aria-hidden="true" className="text-ivory/15">◌</span>
                    {label}
                    <span className="ml-auto hidden rounded bg-[#c8a96e]/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#c8a96e] lg:block">
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
        <main className="min-h-screen px-6 py-8 sm:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
