import type { Metadata } from "next";
import { Fraunces, Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AnalyticsLoader } from "@/components/Analytics";
import { LenisProvider } from "@/components/LenisProvider";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { AuthSessionProvider } from "@/features/auth/SessionProvider";
import { CartDrawer } from "@/features/cart/CartDrawer";
import { CartProvider } from "@/features/cart/CartProvider";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  axes: ["SOFT", "WONK"],
  preload: true,
  fallback: ["Georgia", "serif"],
  adjustFontFallback: true,
});

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
  fallback: ["system-ui", "Arial", "sans-serif"],
  adjustFontFallback: true,
});

const mono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  preload: false,
  fallback: ["ui-monospace", "monospace"],
  adjustFontFallback: false,
});

const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.satvastones.in").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "SatvaStones — Everyday Aesthetic Jewellery",
    template: "%s | SatvaStones",
  },
  description:
    "Korean, Western and Pinterest-inspired jewellery for India: rings, bracelets, necklaces, earrings, oxidised pieces and gift hampers. Anti-tarnish, honestly priced, crafted in Vapi, Gujarat.",
  applicationName: "SatvaStones",
  category: "jewelry",
  keywords: [
    "SatvaStones",
    "Korean jewellery India",
    "Western jewellery",
    "Pinterest jewellery",
    "rings bracelets necklaces earrings",
    "oxidised jewellery",
    "anti-tarnish jewellery",
    "gift hampers India",
  ],
  authors: [{ name: "SatvaStones", url: appUrl }],
  creator: "SatvaStones",
  publisher: "SatvaStones",
  formatDetection: { email: false, address: false, telephone: false },
  alternates: { canonical: appUrl },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: appUrl,
    siteName: "SatvaStones",
    title: "SatvaStones — Everyday Aesthetic Jewellery",
    description:
      "Korean, Western and Pinterest-inspired jewellery for India: rings, bracelets, necklaces, earrings, oxidised pieces and gift hampers.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SatvaStones — Everyday Aesthetic Jewellery",
    description:
      "Korean, Western and Pinterest-inspired jewellery for India: rings, bracelets, necklaces, earrings, oxidised pieces and gift hampers.",
    creator: "@satvastones",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-video-preview": -1, "max-snippet": -1 },
  },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable} antialiased`}
    >
      <body className="flex min-h-screen flex-col font-sans">
        <LenisProvider />
        <AnalyticsLoader />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-5 focus:py-2 focus:text-sm focus:text-ivory"
        >
          Skip to content
        </a>
        <AuthSessionProvider>
          <CartProvider>
            <SiteHeader />
            <div id="main-content" className="flex flex-1 flex-col">
              {children}
            </div>
            <SiteFooter />
            <CartDrawer />
          </CartProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
