"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, type ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { SignOutButton } from "@/features/auth/SignOutButton";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/products", label: "Products", icon: "box" },
  { href: "/admin/categories", label: "Categories", icon: "tag" },
  { href: "/admin/orders", label: "Orders", icon: "bag" },
  { href: "/admin/reviews", label: "Reviews", icon: "star" },
  { href: "/admin/coupons", label: "Coupons", icon: "ticket" },
  { href: "/admin/banners", label: "Banners", icon: "image" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const menu = useRef<HTMLDetailsElement>(null);
  const active = NAV_ITEMS.find((item) =>
    item.href === "/admin"
      ? pathname === item.href
      : pathname.startsWith(`${item.href}/`) || pathname === item.href,
  );
  const navigation = (
    <ul className="space-y-1">
      {NAV_ITEMS.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="admin-nav-item"
            aria-current={active?.href === item.href ? "page" : undefined}
            onClick={() => {
              if (menu.current) menu.current.open = false;
            }}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
  const brand = (
    <Link
      href="/admin"
      className="flex min-h-11 items-center gap-3"
      aria-label="SatvaStones administration"
    >
      <Image
        src="/favicon/android-chrome-192x192.png"
        width={36}
        height={36}
        alt=""
        className="rounded-md"
      />
      <div>
        <span className="text-sm font-semibold tracking-tight">
          SatvaStones
        </span>
        <span className="mt-0.5 block text-xs text-muted">
          Store management
        </span>
      </div>
    </Link>
  );

  return (
    <div className="admin-app grid flex-1 lg:grid-cols-[232px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-light-gray bg-white lg:flex">
        <div className="border-b border-light-gray px-5 py-5">{brand}</div>
        <nav
          aria-label="Admin navigation"
          className="flex-1 overflow-y-auto p-3"
        >
          <p className="px-3 pb-3 pt-4 text-[11px] font-medium uppercase tracking-wider text-muted">
            Workspace
          </p>
          {navigation}
        </nav>
        <div className="border-t border-light-gray p-3">
          <Link href="/" className="admin-nav-item">
            <Icon name="external" />
            View storefront
          </Link>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex min-h-[72px] items-center justify-between gap-3 border-b border-light-gray bg-white px-4 sm:px-6 lg:px-8">
          <div className="lg:hidden">{brand}</div>
          <p className="hidden items-center gap-3 text-sm lg:flex">
            <span className="text-muted">Administration</span>
            <span aria-hidden="true" className="text-muted">
              /
            </span>
            <span className="font-medium">{active?.label || "Store"}</span>
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden min-h-11 items-center gap-2 px-2 text-sm text-muted hover:text-ink sm:inline-flex"
            >
              <Icon name="external" width="16" height="16" />
              View store
            </Link>
            <SignOutButton />
          </div>
        </header>
        <details
          ref={menu}
          className="border-b border-light-gray bg-white lg:hidden"
        >
          <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 px-4 text-sm font-medium">
            <Icon name="menu" />
            <span>{active?.label || "Administration"}</span>
            <span className="ml-auto text-xs text-muted">Navigation</span>
            <Icon name="chevron" className="rotate-90" width="16" height="16" />
          </summary>
          <nav aria-label="Admin navigation" className="px-3 pb-3">
            {navigation}
          </nav>
        </details>
        <div className="mx-auto w-full max-w-[1400px] px-4 py-7 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
