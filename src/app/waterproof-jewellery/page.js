import Header from '../../components/Header';
import Footer from '../../components/Footer';
import TrustStrip from '../../components/TrustStrip';
import CollectionPage from '../../components/CollectionPage';
import CollectionSeoFaq from '../../components/CollectionSeoFaq';
import WhatsAppWidget from '../../components/WhatsAppWidget';
import { getLiveProductsByTag } from '../../lib/catalog';

export const metadata = {
  title: "Waterproof Jewellery Online India | 100% Shower & Gym Safe 18K Gold",
  description:
    "Buy 100% waterproof jewellery online in India. 18K gold vacuum PVD over medical 316L steel. Never fades in showers, swimming pools, or intense workouts. Free Express Delivery & COD nationwide.",
  keywords: [
    "waterproof jewellery online india",
    "waterproof jewellery",
    "shower safe jewellery india",
    "sweatproof daily chains",
    "gym safe jewellery",
    "waterproof gold chains for women",
    "waterproof rings india",
    "anti tarnish waterproof jewellery",
  ],
  alternates: {
    canonical: "https://satvastones.com/waterproof-jewellery",
  },
  openGraph: {
    title: "100% Waterproof & Shower-Safe Jewellery Online India | Satvastones",
    description: "Wear your chains, rings, and bangles 24/7 through showers, workouts, and swimming without ever taking them off. 18K real gold vacuum PVD.",
    url: "https://satvastones.com/waterproof-jewellery",
    type: "website",
    locale: "en_IN",
    siteName: "Satvastones",
    images: [
      {
        url: "https://satvastones.com/logo.png",
        width: 1200,
        height: 630,
        alt: "Satvastones Waterproof Jewellery Collection",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Waterproof Jewellery Online India | Satvastones Atelier",
    description: "Never take your jewellery off again. 100% waterproof 18K gold plated pieces starting ₹349.",
    images: ["https://satvastones.com/logo.png"],
  },
};

export const dynamic = 'force-dynamic';

export default async function WaterproofCollection() {
  const products = await getLiveProductsByTag('waterproof');

  const faqs = [
    {
      question: "Can I wear Satvastones waterproof jewellery in the ocean, pool, and shower?",
      answer: "Yes. Our waterproof pieces are engineered from 316L medical stainless steel bonded with 18k real gold using vacuum Physical Vapour Deposition (PVD). This metallurgy is impervious to saltwater, chlorinated pool water, shampoo, and soaps. You never need to take them off.",
    },
    {
      question: "What is the difference between waterproof and water-resistant jewellery?",
      answer: "Water-resistant jewellery can only withstand accidental light splashes or gentle rain and will quickly tarnish if worn into the shower. Satvastones waterproof jewellery is rated for total daily submersion, hot showers, intense gym sweating, and ocean swimming with zero corrosion or loss of shine.",
    },
    {
      question: "Will chlorine from swimming pools ruin the 18k gold coating?",
      answer: "No. Unlike traditional flash-plated jewelry where chlorine causes immediate pitting and green tarnish, high-vacuum PVD creates a molecular ceramic-like bond with steel that is chemically non-reactive to chlorine at swimming pool concentrations.",
    },
    {
      question: "Do you offer Cash on Delivery (COD) on waterproof jewellery?",
      answer: "Yes, Cash on Delivery is available across all postal codes in India. You only pay once the package arrives at your doorstep.",
    },
  ];

  const seoGuideSections = [
    {
      heading: "Why Indian Women Need Truly Waterproof Jewellery",
      paragraphs: [
        "In India's climate, high humidity, monsoons, and daily routines make traditional plated jewelry impractical. Taking off necklaces and rings before every shower, hand-wash, or gym session is tedious, and forgetting just once often ruins cheap alloy pieces.",
        "Satvastones was founded to eliminate this problem. By combining surgical-grade 316L steel with real 18k gold vacuum deposition, our pieces function like second skin. They stay on while you cook, shower, swim, and sleep.",
      ],
    },
    {
      heading: "Zero Green Residue Guarantee",
      paragraphs: [
        "The notorious green ring on fingers or green neck marks come from copper salts formed when brass reacts with sweat. Satvastones contains zero copper or zinc in contact with the skin, guaranteeing zero discoloration permanently.",
      ],
    },
  ];

  const relatedTags = [
    { label: "Anti-Tarnish Collection", href: "/anti-tarnish-jewellery" },
    { label: "Everyday Chains & Necklaces", href: "/anti-tarnish-jewellery" },
    { label: "Korean Minimalist", href: "/korean-jewellery" },
    { label: "Indian Daily Mangalsutras", href: "/indian-jewellery" },
    { label: "Curated Sets", href: "/sale" },
  ];

  return (
    <>
      <Header />
      <main>
        <CollectionPage
          title="100% Waterproof Daily Wear Jewellery"
          tagline="Engineered in 316L medical-grade stainless steel with 18k real gold vacuum PVD. Never take your pieces off again."
          bannerBg="var(--canvas-subtle)"
          initialProducts={products}
          categorySlug="waterproof-jewellery"
        />

        <CollectionSeoFaq
          categoryName="Waterproof Jewellery"
          categorySlug="waterproof-jewellery"
          faqs={faqs}
          seoGuideTitle="The Waterproof Jewellery Standard: Wear It Everywhere"
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
