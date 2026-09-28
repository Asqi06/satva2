"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import type { ShippingSettings } from "@/services/settings-service";
import type { CategoryDTO } from "@/services/category-service";
import { SearchDialog } from "@/features/products/SearchDialog";
import { BagButton } from "./BagButton";
import { Icon } from "./Icon";

export function SiteHeader({ settings, categories }: { settings: ShippingSettings; categories: CategoryDTO[] }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const menu = useRef<HTMLDialogElement>(null);
  const checkout = pathname === "/checkout";
  const announcement = settings.announcement?.split("|").map(v => v.trim()).find(Boolean)
    || `Free delivery from ₹${settings.freeShippingThreshold}`;
  useEffect(() => {
    if (menuOpen) menu.current?.showModal(); else menu.current?.close();
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [menuOpen]);
  const close = () => setMenuOpen(false);
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return null;
  return <>
    {!checkout && <div className="bg-cream px-4 py-2 text-center text-xs text-ink">{announcement}</div>}
    <header className="sticky top-0 z-40 border-b border-light-gray bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-1 px-3 sm:gap-4 sm:px-8 lg:h-[72px]">
        {checkout ? <Link href="/cart" className="icon-button" aria-label="Back to cart"><Icon name="arrow" className="rotate-180" /></Link>
          : <button type="button" className="icon-button lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu" aria-expanded={menuOpen}><Icon name="menu" /></button>}
        <Link href="/" aria-label="SatvaStones home" className="mr-auto font-display text-[25px] font-semibold tracking-tight text-primary sm:text-3xl">SatvaStones</Link>
        {checkout ? <span className="flex items-center gap-2 text-xs text-muted"><Icon name="shield" />Secure checkout</span> : <>
          <nav aria-label="Primary" className="mr-auto hidden items-center gap-6 text-sm lg:flex">
            <Link href="/shop" aria-current={pathname === "/shop" ? "page" : undefined}>Shop all</Link>
            {categories.slice(0, 3).map(c => <Link key={c.id} href={`/shop/${c.slug}`}>{c.name}</Link>)}
            <Link href="/shop?sort=newest">New arrivals</Link>
          </nav>
          <button type="button" className="icon-button" aria-label="Search jewellery" onClick={() => setSearchOpen(true)}><Icon name="search" /></button>
          <Link href="/account" aria-label="Account" className="icon-button hidden sm:inline-flex"><Icon name="user" /></Link>
          <Link href="/wishlist" aria-label="Wishlist" className="icon-button hidden sm:inline-flex"><Icon name="heart" /></Link>
          <BagButton />
        </>}
      </div>
    </header>
    <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} categories={categories} />
    <dialog ref={menu} className="menu-dialog" aria-labelledby="menu-title" onCancel={close} onClick={e => { if (e.target === e.currentTarget) close(); }}>
      <div className="flex items-center justify-between border-b border-light-gray px-5 py-4"><h2 id="menu-title" className="font-display text-2xl">Explore SatvaStones</h2><button className="icon-button" onClick={close} aria-label="Close menu"><Icon name="close" /></button></div>
      <nav aria-label="Mobile" className="p-5" onClick={e => { if ((e.target as HTMLElement).closest("a")) close(); }}>
        <Link href="/shop" className="block py-3 font-semibold">Shop all jewellery</Link>
        {categories.map(c => <Link className="flex items-center justify-between py-3" key={c.id} href={`/shop/${c.slug}`}>{c.name}<Icon name="chevron" className="-rotate-90" /></Link>)}
        <div className="mt-4 border-t border-light-gray pt-4">
          {[["/shop?sort=newest", "New arrivals"], ["/account", "My account"], ["/wishlist", "Wishlist"], ["/account/orders", "My orders"], ["/contact", "Contact & help"], ["/about", "Our story"]].map(([href, label]) => <Link className="block py-3 text-sm" href={href} key={href}>{label}</Link>)}
          {session?.user?.role === "ADMIN" && <Link href="/admin" className="block py-3 text-sm">Admin panel</Link>}
        </div>
      </nav>
    </dialog>
  </>;
}
