import "./globals.css";
import { Bodoni_Moda, Plus_Jakarta_Sans } from "next/font/google";
import { CartProvider } from "../context/CartContext";
import MiniBagDrawer from "../components/MiniBagDrawer";
import ToastNotification from "../components/ToastNotification";

const bodoniModa = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-bodoni-moda",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://satvastones.com"),
  title: {
    default: "Satvastones: Anti-Tarnish, Korean & Indian Demi-Fine Jewellery Online India",
    template: "%s | Satvastones Jewellery",
  },
  description:
    "Buy 18K gold-plated anti-tarnish jewellery, waterproof daily wear chains, Korean minimalist earrings, and handcrafted Indian bridal pieces. COD Available & Free Express Shipping ₹499+.",
  keywords: [
    "anti tarnish jewellery",
    "anti tarnish jewellery india",
    "waterproof jewellery online",
    "demi fine jewellery india",
    "18k gold plated jewellery",
    "korean jewellery online",
    "daily wear mangalsutra",
    "palmonas alternatives",
    "skin safe jewellery",
    "satvastones",
  ],
  authors: [{ name: "Satvastones" }],
  creator: "Satvastones Luxury",
  publisher: "Satvastones",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "https://satvastones.com",
  },
  openGraph: {
    title: "Satvastones: Everyday Anti-Tarnish & Demi-Fine Luxury Jewellery",
    description:
      "Waterproof, sweatproof, skin-friendly 18K gold-plated jewellery for daily wear. Korean aesthetics meets Indian craftsmanship. Shop with Cash on Delivery & 7-Day Returns.",
    url: "https://satvastones.com",
    siteName: "Satvastones",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://satvastones.com/logo.png",
        width: 1200,
        height: 630,
        alt: "Satvastones Everyday Demi-Fine Jewellery India",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Satvastones | Anti-Tarnish & Demi-Fine Jewellery India",
    description: "Waterproof, gym-safe 18K gold plated demi-fine jewellery starting ₹249. Shop online with COD.",
    images: ["https://satvastones.com/logo.png"],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "google-site-verification-satvastones",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }) {
  // Rich Structured Data (JSON-LD) for Google SERP & Knowledge Graph
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "JewelryStore",
    name: "Satvastones",
    url: "https://satvastones.com",
    logo: "https://satvastones.com/logo.png",
    image: "https://satvastones.com/logo.png",
    description: "India's premier demi-fine jewellery brand offering waterproof, anti-tarnish 18K gold plated and handcrafted Indian jewellery.",
    telephone: "+91-97244-59218",
    sameAs: [
      "https://www.instagram.com/satvastones",
      "https://www.facebook.com/satvastones",
      "https://pinterest.com/satvastones",
    ],
    address: {
      "@type": "PostalAddress",
      addressLocality: "Mumbai",
      addressRegion: "Maharashtra",
      addressCountry: "IN",
    },
    priceRange: "₹₹",
    paymentAccepted: ["Cash on Delivery", "UPI", "Credit Card", "Net Banking"],
    currenciesAccepted: "INR",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91-97244-59218",
      contactType: "customer service",
      areaServed: "IN",
      availableLanguage: ["English", "Hindi"],
    },
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Satvastones",
    url: "https://satvastones.com",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://satvastones.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en" className={`${bodoniModa.variable} ${plusJakartaSans.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className={plusJakartaSans.className}>
        <CartProvider>
          {children}
          <MiniBagDrawer />
          <ToastNotification />
        </CartProvider>
      </body>
    </html>
  );
}
