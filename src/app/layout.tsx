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
});

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const mono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SatvaStones — Everyday Aesthetic Jewellery",
    template: "%s | SatvaStones",
  },
  description:
    "Korean, Western and Pinterest-inspired jewellery for India: rings, bracelets, necklaces, earrings, oxidised pieces and gift hampers.",
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
