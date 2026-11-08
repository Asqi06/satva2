import Header from '../../components/Header';
import Footer from '../../components/Footer';
import TrustStrip from '../../components/TrustStrip';
import CollectionPage from '../../components/CollectionPage';
import CollectionSeoFaq from '../../components/CollectionSeoFaq';
import WhatsAppWidget from '../../components/WhatsAppWidget';
import { getLiveProductsByTag } from '../../lib/catalog';

export const metadata = {
  title: "Anti-Tarnish Jewellery Online India | 100% Waterproof Daily Wear",
  description:
    "Buy 18K gold-plated anti-tarnish jewellery online in India. Waterproof, gym-safe, hypoallergenic 316L surgical stainless steel chains, bangles, and earrings starting ₹349. COD available nationwide.",
  keywords: [
    "anti tarnish jewellery",
    "anti tarnish jewellery india",
    "waterproof jewellery online",
    "sweatproof jewellery india",
    "18k gold plated stainless steel",
    "demi fine everyday jewellery",
    "palmonas alternatives india",
    "shower safe jewellery india",
    "hypoallergenic daily jewellery",
  ],
  alternates: {
    canonical: "https://satvastones.com/anti-tarnish-jewellery",
  },
  openGraph: {
    title: "18K Gold Plated Anti-Tarnish & Waterproof Jewellery | Satvastones",
    description: "Solid 316L surgical steel bonded with 18k real gold via vacuum PVD. Never turns green, never tarnishes. Shop with Cash on Delivery & 7-Day Easy Returns.",
    url: "https://satvastones.com/anti-tarnish-jewellery",
    type: "website",
    locale: "en_IN",
    siteName: "Satvastones",
    images: [
      {
        url: "https://satvastones.com/logo.png",
        width: 1200,
        height: 630,
        alt: "Satvastones Anti-Tarnish Demi-Fine Jewellery Collection",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Anti-Tarnish Jewellery Online India | Satvastones Atelier",
    description: "100% shower & sweat safe 18K gold plated demi-fine jewellery starting ₹349. Cash on Delivery available.",
    images: ["https://satvastones.com/logo.png"],
  },
};

export const dynamic = 'force-dynamic';

export default async function AntiTarnishCollection() {
  const products = await getLiveProductsByTag('anti-tarnish');

  const faqs = [
    {
      question: "What makes Satvastones anti-tarnish jewellery 100% waterproof?",
      answer: "Unlike traditional fashion jewelry plated over brass or copper that oxidizes quickly, Satvastones uses medical-grade 316L surgical stainless steel. We vaporize real 18k gold inside a high-vacuum chamber (Physical Vapour Deposition / PVD), bonding gold atoms directly to the steel. This creates a dense, non-porous layer that will not peel, rust, or tarnish when exposed to water, chlorine, or sweat.",
    },
    {
      question: "Can I wear anti-tarnish jewellery in the shower, pool, and gym every day?",
      answer: "Yes, absolutely. Our entire anti-tarnish line is engineered specifically for active daily living. You can wear your chains, bracelets, and rings while taking hot showers, swimming, washing hands, or doing intensive workouts without fear of discoloration.",
    },
    {
      question: "Will Satvastones jewellery turn my skin green or cause an itchy rash?",
      answer: "No. The greenish discoloration associated with cheap jewelry is caused by copper or brass reacting with skin sweat. Satvastones pieces are 100% nickel-free, lead-free, and cadmium-free. 316L surgical steel is the exact grade used in surgical implants and body piercings, making it ideal for women with sensitive skin.",
    },
    {
      question: "How does Satvastones compare to Palmonas and conventional gold plated jewelry?",
      answer: "Satvastones utilizes the identical high-vacuum PVD 18k gold coating over 316L stainless steel that luxury demi-fine brands like Palmonas use. However, because we run an independent direct-to-consumer atelier without heavy celebrity marketing overheads, we offer these pieces at ₹349 to ₹699, compared to the ₹1,200 to ₹3,000 charged elsewhere.",
    },
    {
      question: "How should I clean and maintain my anti-tarnish pieces?",
      answer: "Maintenance is effortless. If your pieces gather natural skin oils or dust, simply rinse them under lukewarm water with a drop of mild dish soap, pat dry with a soft cloth, and wear them immediately. Avoid spraying high-alcohol perfumes directly on natural freshwater pearls.",
    },
    {
      question: "What are your shipping, Cash on Delivery (COD), and return terms?",
      answer: "We offer complimentary express delivery across India on orders above ₹499 via Bluedart. Cash on delivery (COD) is available nationwide with zero advance payment needed. We provide a 7-day hassle-free return and exchange guarantee if you are not completely delighted with your purchase.",
    },
  ];

  const seoGuideSections = [
    {
      heading: "The Science of Physical Vapour Deposition (PVD)",
      paragraphs: [
        "Conventional fashion jewelry relies on electroplating, where a micro-thin film of gold (often less than 0.1 microns) is dipped over reactive base metals like copper, brass, or alloy. In India's warm and humid climate, moisture and sweat penetrate this layer within weeks, causing the base metal to oxidize into copper carbonate, leaving unsightly green stains.",
        "Satvastones utilizes titanium-based vacuum physical vapour deposition (PVD). Inside an ultra-high vacuum chamber, pure 18k gold is vaporized into plasma and blasted at high velocity onto medical-grade 316L stainless steel. This creates a molecular bond ten times thicker and vastly more durable than standard electroplating.",
      ],
    },
    {
      heading: "Why 316L Surgical Stainless Steel Outlasts Traditional Silver & Brass",
      paragraphs: [
        "Sterling silver (925 silver) naturally tarnishes when exposed to airborne sulfur and moisture, requiring frequent polishing with harsh chemicals. Brass and copper react immediately with body perspiration.",
        "316L surgical steel contains molybdenum, which grants exceptional resistance to corrosion, body salts, chlorinated pool water, and sea water. It provides the heavy, reassuring weight of fine jewelry while remaining completely hypoallergenic.",
      ],
    },
  ];

  const relatedTags = [
    { label: "Waterproof Jewellery", href: "/waterproof-jewellery" },
    { label: "Korean Minimalist", href: "/korean-jewellery" },
    { label: "Everyday Rings & Bangles", href: "/western-jewellery" },
    { label: "Indian Heritage Mangalsutras", href: "/indian-jewellery" },
    { label: "Curated Sets & Stacks", href: "/sale" },
    { label: "Jewelry Care Guide", href: "/jewellery-care" },
  ];

  return (
    <>
      <Header />
      <main>
        <CollectionPage
          title="Anti-Tarnish & Waterproof Collection"
          tagline="Solid 316L medical stainless steel coated in 18k real gold through vacuum PVD bonding. Safe for shower, workout, and swimming."
          bannerBg="var(--canvas-subtle)"
          initialProducts={products}
          categorySlug="anti-tarnish-jewellery"
        />

        {/* In-Depth Editorial SEO Guide & Schema.org/FAQPage */}
        <CollectionSeoFaq
          categoryName="Anti-Tarnish Jewellery"
          categorySlug="anti-tarnish-jewellery"
          faqs={faqs}
          seoGuideTitle="The Definitive Guide to Everyday Anti-Tarnish Jewellery"
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
