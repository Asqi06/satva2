import type { Metadata } from "next";
import { Fraunces, Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getSettings } from "@/services/settings-service";
import { AnalyticsLoader } from "@/components/Analytics";
import { listPublicCategories } from "@/services/category-service";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { AuthSessionProvider } from "@/features/auth/SessionProvider";
import { CartDrawer } from "@/features/cart/CartDrawer";
import { CartProvider } from "@/features/cart/CartProvider";
import { getClientEnv, isIndexingEnabled } from "@/lib/env";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
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

const appUrl = getClientEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "SatvaStones — Everyday Aesthetic Jewellery",
    template: "%s | SatvaStones",
  },
  description:
    "Korean, Western and Pinterest-inspired jewellery for India: rings, bracelets, necklaces, earrings, oxidised pieces and gift hampers. Explore current prices, product details and availability.",
  applicationName: "SatvaStones",
  category: "jewelry",
  authors: [{ name: "SatvaStones", url: appUrl }],
  creator: "SatvaStones",
  publisher: "SatvaStones",
  formatDetection: { email: false, address: false, telephone: false },
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
    creator: "@satvastones",
  },
  robots: {
    index: isIndexingEnabled(),
    follow: true,
    googleBot: { index: isIndexingEnabled(), follow: true, "max-image-preview": "large", "max-video-preview": -1, "max-snippet": -1 },
  },
  icons: { icon: "/favicon.ico" },
};

export const revalidate = 60;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, categories] = await Promise.all([getSettings(), listPublicCategories()]);
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable} antialiased`}
    >
      <head><link rel="preconnect" href="https://res.cloudinary.com" /></head>
      <body className="flex min-h-screen flex-col bg-background font-sans text-foreground">
        <AnalyticsLoader />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-5 focus:py-2 focus:text-sm focus:text-ivory"
        >
          Skip to content
        </a>
        <AuthSessionProvider>
          <CartProvider>
            <SiteHeader settings={settings} categories={categories} />
            <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col">
              {children}
            </main>
            <SiteFooter settings={settings} categories={categories} />
            <CartDrawer settings={settings} />
          </CartProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
