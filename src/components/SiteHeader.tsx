"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { BagButton } from "./BagButton";

const NAV_LINKS = [
  { href: "/shop", label: "Categories" },
  { href: "/shop?sort=best-selling", label: "Best Sellers" },
  { href: "/about", label: "Store" },
  { href: "/account/orders", label: "Track Order" },
  { href: "/returns", label: "Returns / Exchange" },
  { href: "/contact", label: "Contact Us" },
];

const DEFAULT_UTILITY_ITEMS = [
  "Free gift on order above INR 899",
  "COD available",
  "Easy return",
  "Free shipping above INR 899",
];

/** Jewelsmars-style header: logo row, nav row, black utility strip. */
export function SiteHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "ADMIN";
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [utilityItems, setUtilityItems] = useState<string[]>(DEFAULT_UTILITY_ITEMS);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Announcement strip is edited in Admin → Settings.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/settings");
        const body = (await res.json()) as {
          success: boolean;
          data?: { announcement?: string };
        };
        const raw = body.success ? body.data?.announcement?.trim() : "";
        if (raw) {
          const items = raw
            .split("|")
            .map((s) => s.trim())
            .filter(Boolean);
          if (items.length > 0) setUtilityItems(items);
        }
      } catch {
        // Defaults above cover the fallback.
      }
    })();
  }, []);

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  useEffect(() => {
    const lenis = (window as unknown as { __lenis?: { stop: () => void; start: () => void } }).__lenis;
    if (menuOpen) {
      document.body.style.overflow = "hidden";
      lenis?.stop();
    } else {
      document.body.style.overflow = "";
      lenis?.start();
    }
    return () => {
      document.body.style.overflow = "";
      if (menuOpen) lenis?.start();
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className={`sticky top-0 z-50 bg-white transition-shadow duration-300 ${
          scrolled ? "shadow-[0_2px_16px_rgba(0,0,0,0.08)]" : ""
        }`}
      >
        {/* ── Logo row ── */}
        <div className="relative mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-8">
          {/* Left: mobile menu + search */}
          <div className="flex flex-1 items-center gap-1">
            <button
              ref={toggleRef}
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-black/5 md:hidden"
            >
              <span className="relative block h-3.5 w-5">
                <span className={`absolute left-0 top-0 h-0.5 w-5 bg-ink transition-all duration-300 ${menuOpen ? "top-1.5 rotate-45" : ""}`} />
                <span className={`absolute left-0 top-1.5 h-0.5 w-5 bg-ink transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
                <span className={`absolute left-0 top-3 h-0.5 w-5 bg-ink transition-all duration-300 ${menuOpen ? "top-1.5 -rotate-45" : ""}`} />
              </span>
            </button>
            <Link
              href="/shop#shop-search"
              aria-label="Search jewellery"
              className="hidden h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-black/5 sm:flex"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </Link>
          </div>

          {/* Center: wordmark */}
          <Link href="/" aria-label="SatvaStones home" className="flex flex-col items-center leading-none">
            <span className="font-display text-[26px] font-black tracking-tight text-primary sm:text-3xl">
              SatvaStones
            </span>
            <span className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.42em] text-ink/50">
              Everyday Jewellery
            </span>
          </Link>

          {/* Right: icons */}
          <div className="flex flex-1 items-center justify-end gap-0.5 sm:gap-1">
            <Link href="/account" aria-label="Account" className="hidden h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-black/5 sm:flex">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
              </svg>
            </Link>
            <Link href="/wishlist" aria-label="Wishlist" className="hidden h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-black/5 sm:flex">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </Link>
            <BagButton />
            {isAdmin && (
              <Link href="/admin" className="ml-1 hidden rounded-full bg-ink px-3 py-1.5 text-[11px] font-bold text-white md:block">
                Admin
              </Link>
            )}
          </div>
        </div>

        {/* ── Nav row (desktop) ── */}
        <nav aria-label="Primary" className="hidden border-t border-black/5 md:block">
          <ul className="mx-auto flex w-full max-w-7xl items-center justify-center gap-8 px-8">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href || (link.href === "/shop" && pathname.startsWith("/products"));
              return (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className={`relative flex items-center gap-1.5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors hover:text-primary ${
                      active ? "text-primary" : "text-ink/70"
                    }`}
                  >
                    {link.label.toUpperCase()}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ── Black utility strip ── */}
        <div className="overflow-hidden bg-ink py-1.5" aria-hidden="true">
          <div className="marquee-track animate-marquee whitespace-nowrap md:justify-center md:[animation:none] md:flex-wrap">
            {[...utilityItems, ...utilityItems].map((item, i) => (
              <span
                key={i}
                className={`mx-6 inline-flex items-center gap-6 text-[9px] font-bold uppercase tracking-[0.2em] text-white/85 md:mx-4 ${i >= utilityItems.length ? "md:hidden" : ""}`}
              >
                {item}
                <span className="text-primary">✦</span>
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm md:hidden animate-fade-in"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed bottom-0 left-0 top-0 z-50 flex w-80 flex-col bg-white md:hidden animate-slide-in-right">
            <div className="flex items-center justify-between border-b border-black/10 px-6 py-5">
              <span className="font-display text-2xl font-black text-primary">SatvaStones</span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5"
              >
                ✕
              </button>
            </div>
            <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-4 py-6" data-lenis-prevent>
              <ul className="space-y-1">
                {[{ href: "/shop", label: "Categories" }, ...NAV_LINKS.slice(1)].map((link, i) => (
                  <li key={link.href + link.label} className="animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                    <Link
                      href={link.href}
                      className="block rounded-xl px-4 py-3 text-[15px] font-bold transition-colors hover:bg-blush"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                {isAdmin && (
                  <li>
                    <Link href="/admin" className="block rounded-xl bg-ink px-4 py-3 text-[15px] font-bold text-white">
                      Admin
                    </Link>
                  </li>
                )}
              </ul>
            </nav>
            <div className="border-t border-black/10 px-6 py-5 text-xs text-muted">
              Crafted in Vapi, Gujarat · COD available
            </div>
          </div>
        </>
      )}
    </>
  );
}
