import Header from '../../components/Header';
import Footer from '../../components/Footer';
import TrustStrip from '../../components/TrustStrip';
import CollectionPage from '../../components/CollectionPage';
import CollectionSeoFaq from '../../components/CollectionSeoFaq';
import WhatsAppWidget from '../../components/WhatsAppWidget';
import { getLiveProductsByCategory } from '../../lib/catalog';

export const metadata = {
  title: "Western & Stacking Jewellery Online India | Layered Chains & Rings | Satvastones",
  description:
    "Shop chic Western jewellery in India. 18K gold-plated herringbone chains, chunky croissant dome rings, and 5A cubic zirconia tennis bracelets. Waterproof & anti-tarnish. COD & Free Shipping ₹499+.",
  keywords: [
    "western jewellery online india",
    "herringbone chain online",
    "cz tennis bracelet india",
    "twisted croissant ring",
    "stackable gold rings",
    "paperclip chain bracelet",
    "layering chains for women",
    "daily wear western jewellery",
  ],
  alternates: {
    canonical: "https://satvastones.com/western-jewellery",
  },
  openGraph: {
    title: "Western Layering & Stacking Jewellery Online | Satvastones",
    description: "Tangle-free 18K gold vacuum PVD herringbone chains, croissant rings, and Roman numeral bangles.",
    url: "https://satvastones.com/western-jewellery",
    type: "website",
    locale: "en_IN",
    siteName: "Satvastones",
    images: [
      {
        url: "https://satvastones.com/logo.png",
        width: 1200,
        height: 630,
        alt: "Satvastones Western & Stacking Jewellery Collection",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Western & Stacking Jewellery Online India | Satvastones",
    description: "Waterproof 18k gold snake chains and stackable rings starting ₹349.",
    images: ["https://satvastones.com/logo.png"],
  },
};

export const dynamic = 'force-dynamic';

export default async function WesternCollection() {
  const products = await getLiveProductsByCategory('western');

  const faqs = [
    {
      question: "How do I layer multiple gold chains without them tangling together?",
      answer: "The golden rule of layering is combining distinct chain textures and varying lengths by at least 2 inches. Pair a 14-inch flat snake herringbone chain with an 18-inch cable chain and a 20-inch pendant. The contrasting weights and link types naturally prevent twisting and knotting.",
    },
    {
      question: "Will the gold finish on the croissant dome ring wear off when washing hands?",
      answer: "No. Unlike cheap alloy rings that tarnish within days of hand washing, our croissant dome rings are vacuum PVD coated in 18k real gold over 316L surgical steel. Soaps, water, and alcohol sanitizers will not strip or degrade the finish.",
    },
    {
      question: "What stones are used in the tennis bracelet?",
      answer: "Our tennis bracelets feature 5A hand-selected cubic zirconia stones cut with precision optical facets to match the refractive brilliance and fire of authentic VVS diamonds.",
    },
  ];

  const seoGuideSections = [
    {
      heading: "The Parisian Stacking Aesthetic for Everyday Styling",
      paragraphs: [
        "Western stacking focuses on curated asymmetry. Mixing bold sculptural forms like the chunky croissant ring with delicate roman numeral bangles creates visual contrast that looks intentional and effortless.",
        "Satvastones constructs every piece in 316L surgical steel, giving you the substantial weight and golden warmth of solid 18k gold jewelry without the exorbitant price point.",
      ],
    },
  ];

  const relatedTags = [
    { label: "Anti-Tarnish Bestsellers", href: "/anti-tarnish-jewellery" },
    { label: "100% Waterproof Daily Wear", href: "/waterproof-jewellery" },
    { label: "Korean Minimalist", href: "/korean-jewellery" },
    { label: "Modern Mangalsutras", href: "/indian-jewellery" },
    { label: "Curated Sets & 35% Savings", href: "/sale" },
  ];

  return (
    <>
      <Header />
      <main>
        <CollectionPage
          title="Western & Stacking Collection"
          tagline="Tangle-free layering chains, croissant dome rings, and brilliant tennis bracelets. 18k gold plated on surgical steel for non-stop daily wear."
          bannerBg="var(--canvas-subtle)"
          initialProducts={products}
          categorySlug="western-jewellery"
        />

        <CollectionSeoFaq
          categoryName="Western Stacking Jewellery"
          categorySlug="western-jewellery"
          faqs={faqs}
          seoGuideTitle="The Art of Layering: Western Stacking Chains & Sculptural Rings"
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
