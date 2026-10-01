"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ShippingSettings } from "@/services/settings-service";
import type { CategoryDTO } from "@/services/category-service";
import { businessAddressText } from "@/lib/business-seo";

export function SiteFooter({ settings, categories }: { settings: ShippingSettings; categories: CategoryDTO[] }) {
  const pathname = usePathname();
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return null;
  if (pathname === "/checkout") return <footer className="border-t border-light-gray px-4 py-5 text-center text-xs text-muted"><Link href="/privacy">Privacy</Link><span className="mx-4">·</span><Link href="/terms">Terms</Link><span className="mx-4">·</span><Link href="/contact">Need help?</Link></footer>;
  const columns = [
    { title: "Shop", links: [["/shop", "All jewellery"], ...categories.slice(0, 5).map(c => [`/shop?category=${encodeURIComponent(c.slug)}`, c.name]), ["/shop?sort=newest", "New arrivals"]] },
    { title: "Help", links: [["/contact", "Contact us"], ["/guides/jewellery-buying-guide", "Jewellery buying guide"], ["/shipping", "Shipping & delivery"], ["/returns", "Returns & refunds"], ["/faq", "Frequently asked questions"], ["/account/orders", "My orders"]] },
    { title: "Company", links: [["/about", "Our story"], ["/privacy", "Privacy policy"], ["/terms", "Terms of service"]] },
  ];
  return <footer className="mt-16 border-t border-light-gray bg-cream">
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-8 lg:grid-cols-[1.2fr_2fr]">
      <div><Link href="/" className="font-display text-3xl font-semibold tracking-tight text-primary">SatvaStones</Link>
        <p className="mt-4 max-w-xs text-sm leading-6 text-muted">Jewellery for everyday moments. Find rings, earrings, necklaces and more in the collection.</p>
        {settings.legalName && <p className="mt-5 text-sm font-medium">{settings.legalName}</p>}
        {businessAddressText(settings) && <p className="mt-2 max-w-xs whitespace-pre-line text-sm leading-6 text-muted">{businessAddressText(settings)}</p>}
        {(settings.sameAs ?? []).filter((url) => /^https:\/\/(?:www\.)?instagram\.com\//i.test(url)).map((url) => <a key={url} href={url} className="mt-3 inline-block py-3 text-sm underline underline-offset-4" rel="me">Instagram</a>)}
        {settings.supportEmail && <a className="mt-3 block break-all text-sm" href={`mailto:${settings.supportEmail}`}>{settings.supportEmail}</a>}
        {settings.supportPhone && <a className="mt-2 block text-sm" href={`tel:${settings.supportPhone}`}>{settings.supportPhone}</a>}
      </div>
      <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3">{columns.map(col => <div key={col.title}><h2 className="eyebrow !text-ink">{col.title}</h2><ul className="mt-4 space-y-1">{col.links.map(([href, label]) => <li key={href}><Link className="inline-block py-2 text-sm text-muted hover:text-primary" href={href}>{label}</Link></li>)}</ul></div>)}</nav>
    </div>
    <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-3 border-t border-light-gray px-4 py-5 text-xs text-muted sm:px-8"><p>© {new Date().getFullYear()} SatvaStones</p><p>Prices in INR · Payments through Razorpay</p></div>
  </footer>;
}
