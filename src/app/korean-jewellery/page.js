import Header from '../../components/Header';
import Footer from '../../components/Footer';
import TrustStrip from '../../components/TrustStrip';
import CollectionPage from '../../components/CollectionPage';
import CollectionSeoFaq from '../../components/CollectionSeoFaq';
import WhatsAppWidget from '../../components/WhatsAppWidget';
import { getLiveProductsByCategory } from '../../lib/catalog';

export const metadata = {
  title: "Korean Minimalist Jewellery Online India | Freshwater Pearls & S925",
  description:
    "Explore minimalist Korean jewellery online in India. Hypoallergenic S925 silver needles, organic freshwater pearls, wave rings, and delicate huggies starting ₹249. Cash on Delivery & Free Shipping ₹499+.",
  keywords: [
    "korean jewellery online india",
    "k style earrings",
    "k drama jewellery",
    "minimalist pearl choker",
    "hypoallergenic korean earrings",
    "aesthetic jewellery india",
    "seoul aesthetic accessories",
    "dainty korean rings",
  ],
  alternates: {
    canonical: "https://satvastones.com/korean-jewellery",
  },
  openGraph: {
    title: "Korean Minimalist Jewellery Online India | Satvastones Atelier",
    description: "Featherlight, aesthetic Seoul-inspired demi-fine jewellery. Organic freshwater pearls and hypoallergenic S925 silver needles.",
    url: "https://satvastones.com/korean-jewellery",
    type: "website",
    locale: "en_IN",
    siteName: "Satvastones",
    images: [
      {
        url: "https://satvastones.com/logo.png",
        width: 1200,
        height: 630,
        alt: "Satvastones Korean Minimalist Jewellery Collection",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Korean Minimalist Jewellery India | Satvastones",
    description: "Delicate freshwater pearls and dainty huggies starting ₹249. Cash on Delivery available.",
    images: ["https://satvastones.com/logo.png"],
  },
};

export const dynamic = 'force-dynamic';

export default async function KoreanCollection() {
  const products = await getLiveProductsByCategory('korean');

  const faqs = [
    {
      question: "Are your Korean earrings suitable for sensitive, freshly pierced ears?",
      answer: "Yes. All our Korean style earrings feature genuine S925 sterling silver ear needles or 316L medical stainless steel posts. They are 100% nickel-free and hypoallergenic, designed to prevent redness, itching, or irritation even during long office hours.",
    },
    {
      question: "Are the pearls genuine freshwater pearls or plastic imitations?",
      answer: "We use authentic cultivated baroque freshwater pearls in our Korean collection. Each pearl features natural organic iridescence, subtle unique contours, and a luminous luster that synthetic plastic beads cannot replicate.",
    },
    {
      question: "How do I style Korean minimalist jewellery for daily office wear?",
      answer: "Korean styling thrives on the 'effortless dainty' philosophy. Pair a single freshwater pearl pendant choker with minimalist huggie hoops and one slim wave ring. This keeps your look elegant and refined without looking overloaded.",
    },
    {
      question: "Can I wear Korean pearl jewelry in the shower?",
      answer: "While the gold-plated metal chains and silver posts are waterproof, we advise avoiding soaking natural freshwater pearls in heavy shampoos or spraying alcohol-based perfume directly on them, as prolonged exposure can dull the pearl's organic nacre.",
    },
  ];

  const seoGuideSections = [
    {
      heading: "The Korean Demi-Fine Aesthetic: Understated Grace",
      paragraphs: [
        "Korean jewelry trends popularized by modern Seoul fashion and K-dramas focus on weightlessness, organic fluid curves, and micro-proportions. Rather than heavy, ornate pieces, Korean minimalist jewelry serves as a subtle accent that complements the wearer rather than overwhelming them.",
        "Satvastones combines this contemporary Seoul aesthetic with high-durability metals, ensuring delicate chains and dainty huggies withstand daily wear without breaking or tarnishing.",
      ],
    },
    {
      heading: "S925 Sterling Silver Needles for All-Day Ear Comfort",
      paragraphs: [
        "Many fashion earrings cause earlobe pain because they use nickel-plated iron or cheap zinc posts. Every Satvastones Korean earring is constructed with hypoallergenic S925 sterling silver posts, ensuring zero ear inflammation even for the most sensitive earlobes.",
      ],
    },
  ];

  const relatedTags = [
    { label: "Anti-Tarnish Bestsellers", href: "/anti-tarnish-jewellery" },
    { label: "Waterproof Daily Wear", href: "/waterproof-jewellery" },
    { label: "Everyday Rings & Bangles", href: "/western-jewellery" },
    { label: "Indian Heritage Pieces", href: "/indian-jewellery" },
    { label: "Curated Sets & Stacks", href: "/sale" },
  ];

  return (
    <>
      <Header />
      <main>
        <CollectionPage
          title="Korean Minimalist Collection"
          tagline="Delicate aesthetics crafted with organic freshwater pearls and hypoallergenic S925 silver needles. Lightweight pieces designed for daily wear."
          bannerBg="var(--canvas-subtle)"
          initialProducts={products}
          categorySlug="korean-jewellery"
        />

        <CollectionSeoFaq
          categoryName="Korean Minimalist Jewellery"
          categorySlug="korean-jewellery"
          faqs={faqs}
          seoGuideTitle="The Art of Korean Minimalist Jewellery: Seoul Street Style Meets Daily Luxury"
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
