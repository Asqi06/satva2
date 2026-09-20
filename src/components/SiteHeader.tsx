"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { BagButton } from "./BagButton";

const BASE_LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/account", label: "Account" },
];

/** Scroll-aware, mobile-capable editorial site header. */
export function SiteHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "ADMIN";
  const NAV_LINKS = isAdmin ? [...BASE_LINKS, { href: "/admin", label: "Admin" }] : BASE_LINKS;
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Scroll detection
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMenuOpen(false);
  }

  // Escape key closes menu
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

  // Lock body scroll when mobile menu is open (also pauses Lenis
  // virtual scroll, which ignores body overflow on its own).
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
      // Only restart Lenis on cleanup if the menu was open; otherwise
      // we could restart it while the cart drawer keeps it stopped.
      if (menuOpen) lenis?.start();
    };
  }, [menuOpen]);

  return (
    <>
      {/* Festive announcement bar — trust-first for Indian shoppers */}
      <div className="bg-[#0a0a0a] text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-[#c8a96e]">
        <p className="mx-auto max-w-7xl px-6 py-2 sm:px-10">
          Free shipping over ₹399 ✦ UPI, cards & netbanking ✦ 7-day easy cover
        </p>
      </div>
      <header
        className={`sticky top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-ivory/98 shadow-[0_1px_0_rgba(10,10,10,0.08)] backdrop-blur-md"
            : "bg-ivory/80 backdrop-blur-sm"
        }`}
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 sm:px-10">

          {/* Wordmark */}
          <Link
            href="/"
            aria-label="SatvaStones home"
            className="font-display italic text-xl tracking-tight text-ink transition-opacity hover:opacity-70 sm:text-2xl"
          >
            SatvaStones
          </Link>

          {/* Desktop Nav */}
          <nav aria-label="Primary" className="hidden md:block">
            <ul className="flex items-center gap-8 text-sm font-medium tracking-wide">
              {NAV_LINKS.map((link) => {
                const active = pathname === link.href || pathname.startsWith(link.href + "/");
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`relative pb-0.5 transition-colors hover:text-gold ${
                        active ? "text-ink after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-gold" : "text-ink/70"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Right icons */}
          <div className="flex items-center gap-3">
            <BagButton />

            {/* Mobile hamburger */}
            <button
              ref={toggleRef}
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((v) => !v)}
              className="relative flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-full border border-ink/15 md:hidden"
            >
              <span
                className={`h-px w-4 bg-ink transition-all duration-300 ${menuOpen ? "translate-y-[2.5px] rotate-45 w-5" : ""}`}
              />
              <span
                className={`h-px w-5 bg-ink transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`}
              />
              <span
                className={`h-px w-4 bg-ink transition-all duration-300 ${menuOpen ? "-translate-y-[4.5px] -rotate-45 w-5" : ""}`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-ink/50 backdrop-blur-sm md:hidden animate-fade-in"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          {/* Panel */}
          <div
            id="mobile-menu"
            ref={menuRef}
            className="fixed top-0 right-0 bottom-0 z-50 flex w-72 flex-col bg-ivory text-ink md:hidden animate-slide-in-right"
          >
            <div className="flex items-center justify-between border-b border-ink/10 px-6 py-5">
              <span className="font-display italic text-xl">SatvaStones</span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/15 text-sm"
              >
                ✕
              </button>
            </div>
            <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-6 py-8" data-lenis-prevent>
              <ul className="space-y-1">
                {NAV_LINKS.map((link, i) => {
                  const active = pathname === link.href || pathname.startsWith(link.href + "/");
                  return (
                    <li
                      key={link.href}
                      className="animate-fade-up"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <Link
                        href={link.href}
                        className={`block rounded-xl px-4 py-3 text-lg font-medium transition-colors ${
                          active
                            ? "bg-ink text-ivory"
                            : "hover:bg-ink/5 text-ink"
                        }`}
                      >
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className="border-t border-ink/10 px-6 py-5 text-xs text-ink/40">
              Crafted in Vapi, Gujarat
            </div>
          </div>
        </>
      )}
    </>
  );
}
