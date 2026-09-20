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

const TRUST_ITEMS = [
  { title: "Free shipping over ₹399", body: "Flat ₹49 below · 5–7 day delivery" },
  { title: "UPI • Cards • Netbanking", body: "Secure Razorpay checkout, online only" },
  { title: "7-day easy cover", body: "Defects & transit damage replaced" },
  { title: "Anti-tarnish finish", body: "Water-friendly shine, made in Vapi" },
];

/** Site-wide desi-editorial footer — trust badges, links, payments, SEO-rich. */
export function SiteFooter() {
  return (
    <footer className="bg-[#0a0a0a] text-ivory">
      {/* Gold divider */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#c8a96e] to-transparent" />

      {/* Trust badges — the reassurance Indian shoppers look for */}
      <div className="border-b border-ivory/[0.07]">
        <ul className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-px px-6 py-8 sm:px-10 lg:grid-cols-4" aria-label="Why shop with SatvaStones">
          {TRUST_ITEMS.map((t) => (
            <li key={t.title} className="px-2 py-2">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#c8a96e]">{t.title}</p>
              <p className="mt-1 text-xs leading-5 text-ivory/45">{t.body}</p>
            </li>
          ))}
        </ul>
      </div>

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
              honestly priced, anti-tarnish finish. Every piece ships gift-ready
              in a shagun-worthy pouch.
            </p>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-[#c8a96e]">
              Crafted in Vapi, Gujarat ✦ Worn across India
            </p>
          </div>

          {/* Link columns */}
          <nav aria-label="Footer" className="grid gap-8 sm:grid-cols-3">
            {FOOTER_COLS.map((col) => (
              <div key={col.title}>
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c8a96e]">
                  {col.title}
                </h2>
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
          </nav>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-ivory/[0.07]">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-5 text-xs text-ivory/30 sm:px-10">
          <p>© {new Date().getFullYear()} SatvaStones · Vapi, Gujarat. All rights reserved.</p>
          <p>Prices in ₹, inclusive of taxes ✦ Made with ♥ in India</p>
        </div>
      </div>
    </footer>
  );
}
