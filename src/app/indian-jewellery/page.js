import Header from '../../components/Header';
import Footer from '../../components/Footer';
import TrustStrip from '../../components/TrustStrip';
import CollectionPage from '../../components/CollectionPage';
import CollectionSeoFaq from '../../components/CollectionSeoFaq';
import WhatsAppWidget from '../../components/WhatsAppWidget';
import { getLiveProductsByCategory } from '../../lib/catalog';

export const metadata = {
  title: "Modern Daily Mangalsutra & Indian Heritage Jewellery Online | Satvastones",
  description:
    "Buy waterproof daily wear solitaire mangalsutras, royal Jaipur kundan chokers, temple necklaces, and lightweight jhumkas. 18K gold vacuum PVD & hypoallergenic. COD & Free Shipping ₹499+.",
  keywords: [
    "daily wear mangalsutra online",
    "waterproof mangalsutra",
    "solitaire mangalsutra modern",
    "kundan choker set india",
    "temple jewellery online",
    "oxidised silver jhumka",
    "modern indian bridal jewellery",
    "lightweight mangalsutra for office",
  ],
  alternates: {
    canonical: "https://satvastones.com/indian-jewellery",
  },
  openGraph: {
    title: "Modern Daily Wear Mangalsutras & Indian Heritage Jewellery | Satvastones",
    description: "Re-imagined for the modern working woman. 100% waterproof black bead solitaire mangalsutras and handcrafted Kundan chokers.",
    url: "https://satvastones.com/indian-jewellery",
    type: "website",
    locale: "en_IN",
    siteName: "Satvastones",
    images: [
      {
        url: "https://satvastones.com/logo.png",
        width: 1200,
        height: 630,
        alt: "Satvastones Modern Indian Heritage & Mangalsutra Collection",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Waterproof Daily Mangalsutra & Indian Heritage | Satvastones",
    description: "Modern, featherlight solitaire mangalsutras starting ₹499. Shop with Cash on Delivery.",
    images: ["https://satvastones.com/logo.png"],
  },
};

export const dynamic = 'force-dynamic';

export default async function IndianCollection() {
  const products = await getLiveProductsByCategory('indian');

  const faqs = [
    {
      question: "Can I wear the Satvastones solitaire mangalsutra in the shower every day?",
      answer: "Yes. Our daily wear mangalsutras are engineered with surgical 316L stainless steel chains and high-grade 18k real gold vacuum PVD. The micro black beads are heat-sealed and moisture-resistant, ensuring they never bleed color, tarnish, or break during daily showers or workouts.",
    },
    {
      question: "Are these mangalsutras lightweight enough for corporate office wear?",
      answer: "Yes, exactly. Traditional gold mangalsutras are often heavy, ornate, and uncomfortable under collared shirts or western workwear. Satvastones modern mangalsutras weigh under 6 grams, featuring sleek minimalist chains and single 5A cubic zirconia solitaires that pair seamlessly with blazers and formal shirts.",
    },
    {
      question: "What stones are used in your Jaipur Kundan and Polki chokers?",
      answer: "Our bridal and festive heritage chokers feature hand-set faceted glass crystals and uncut polki stones set in meenakari enamelled backings. They offer the opulent sparkle of royal bridal heirlooms at an accessible demi-fine price point.",
    },
    {
      question: "Is Cash on Delivery available for Indian heritage jewellery?",
      answer: "Yes, Cash on Delivery is available across all serviceable pin codes in India with free express shipping on orders above ₹499.",
    },
  ];

  const seoGuideSections = [
    {
      heading: "Re-Inventing the Sacred Mangalsutra for the 21st Century",
      paragraphs: [
        "For generations, Indian women were caught between two extremes: heavy, high-value 22k gold mangalsutras locked away in bank lockers for safety, or fragile brass imitation pieces that turned green within weeks of daily wear.",
        "Satvastones created the Modern Daily Mangalsutra to solve this dilemma. Handcrafted in 316L medical steel with 18k gold vacuum bonding, our black-bead solitaires are 100% waterproof, lightweight, and completely safe to wear everywhere without anxiety.",
      ],
    },
    {
      heading: "Preserving Authentic Craftsmanship Without the Bridal Price Tag",
      paragraphs: [
        "From delicate temple coin motifs to Royal Jaipur kundan settings, our heritage collection bridges traditional artistry with modern wearability. Every piece undergoes rigorous quality control to ensure stones remain secure through festive seasons and weddings.",
      ],
    },
  ];

  const relatedTags = [
    { label: "Anti-Tarnish Collection", href: "/anti-tarnish-jewellery" },
    { label: "Waterproof Daily Wear", href: "/waterproof-jewellery" },
    { label: "Korean Minimalist", href: "/korean-jewellery" },
    { label: "Everyday Rings & Chains", href: "/western-jewellery" },
    { label: "Curated Sets & Stacks", href: "/sale" },
  ];

  return (
    <>
      <Header />
      <main>
        <CollectionPage
          title="Indian Traditional & Mangalsutra"
          tagline="Authentic Indian craftsmanship engineered with modern durability. Featuring waterproof daily solitaire mangalsutras, temple harams, and Jaipur kundan."
          bannerBg="var(--canvas-subtle)"
          initialProducts={products}
          categorySlug="indian-jewellery"
        />

        <CollectionSeoFaq
          categoryName="Modern Indian Jewellery"
          categorySlug="indian-jewellery"
          faqs={faqs}
          seoGuideTitle="Modern Indian Heritage: Daily Wear Mangalsutras & Handcrafted Kundan"
          seoGuideSections={seoGuideSections}
          relatedTags={relatedTags}
        />

        <TrustStrip />
      </main>
      <WhatsAppWidget />
      <Footer />
    </>
  );
}
