import Link from "next/link";

const FOOTER_COLS = [
  {
    title: "Shop",
    links: [
      { href: "/shop", label: "All jewellery" },
      { href: "/shop?category=rings", label: "Rings" },
      { href: "/shop?category=bracelets", label: "Bracelets" },
      { href: "/shop?category=necklaces", label: "Necklaces" },
      { href: "/shop?category=earrings", label: "Earrings" },
      { href: "/shop?sort=newest", label: "New arrivals" },
      { href: "/shop?sort=best-selling", label: "Best sellers" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact us" },
      { href: "/shipping", label: "Shipping info" },
      { href: "/returns", label: "Returns" },
      { href: "/account", label: "My account" },
      { href: "/wishlist", label: "Wishlist" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "Our story" },
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms of service" },
    ],
  },
];

/** Site-wide editorial magazine footer — dark background with gold accents. */
export function SiteFooter() {
  return (
    <footer className="bg-[#0a0a0a] text-ivory">
      {/* Gold divider */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#c8a96e] to-transparent" />

      {/* Main content */}
      <div className="mx-auto w-full max-w-7xl px-6 py-16 sm:px-10">
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">

          {/* Brand column */}
          <div>
            <p className="font-display italic text-3xl tracking-tight text-ivory sm:text-4xl">
              SatvaStones
            </p>
            <p className="mt-3 max-w-xs text-sm leading-7 text-ivory/50">
              Korean and Western aesthetic jewellery for India — premium-looking,
              honestly priced, anti-tarnish finish.
            </p>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-[#c8a96e]">
              Crafted in Vapi, Gujarat
            </p>
          </div>

          {/* Link columns */}
          <div className="grid gap-8 sm:grid-cols-3">
            {FOOTER_COLS.map((col) => (
              <div key={col.title}>
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c8a96e]">
                  {col.title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-ivory/55 transition-colors hover:text-ivory"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-ivory/[0.07]">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-5 text-xs text-ivory/30 sm:px-10">
          <p>© {new Date().getFullYear()} SatvaStones. All rights reserved.</p>
          <p>Made with ♥ in India</p>
        </div>
      </div>
    </footer>
  );
}
