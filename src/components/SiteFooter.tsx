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
      { href: "/returns", label: "Returns / Exchange" },
      { href: "/account/orders", label: "Track order" },
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

const TRUST_ITEMS = [
  { title: "Free shipping over ₹899", body: "Tracked delivery across India" },
  { title: "UPI • Cards • Netbanking", body: "Secure Razorpay checkout" },
  { title: "Easy return", body: "7-day cover on defects & damage" },
  { title: "Free gift above ₹899", body: "Gift-ready pouch in every order" },
];

/** D2C footer — black trust band, red wordmark, link columns. */
export function SiteFooter() {
  return (
    <footer className="bg-ink text-white">
      <div className="border-b border-white/10">
        <ul className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-3 px-4 py-8 sm:px-8 lg:grid-cols-4" aria-label="Why shop with SatvaStones">
          {TRUST_ITEMS.map((t) => (
            <li key={t.title} className="rounded-xl border border-white/10 bg-white/[0.04] p-5 text-left">
              <p className="text-xs font-extrabold uppercase tracking-wider text-white">{t.title}</p>
              <p className="mt-1 text-xs leading-5 text-white/65">{t.body}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="font-display text-4xl font-black tracking-tight text-primary">
              SatvaStones
            </p>
            <p className="mt-3 max-w-xs text-sm leading-6 text-white/65">
              Korean and Western aesthetic jewellery for India — premium-looking,
              honestly priced, anti-tarnish finish. Every piece ships gift-ready.
            </p>
            <p className="mt-5 text-[11px] font-extrabold uppercase tracking-[0.2em] text-white/70">
              Crafted in Vapi, Gujarat
            </p>
          </div>

          <nav aria-label="Footer" className="grid gap-8 sm:grid-cols-3">
            {FOOTER_COLS.map((col) => (
              <div key={col.title}>
                <h2 className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-white/80">
                  {col.title}
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-white/65 transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-[11px] text-white/35 sm:px-8">
          <p>© {new Date().getFullYear()} SatvaStones · Vapi, Gujarat. All rights reserved.</p>
          <p>Prices in ₹, inclusive of taxes · Made with care in India</p>
        </div>
      </div>
    </footer>
  );
}
