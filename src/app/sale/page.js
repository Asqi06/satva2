import Header from '../../components/Header';
import Footer from '../../components/Footer';
import TrustStrip from '../../components/TrustStrip';
import CollectionPage from '../../components/CollectionPage';
import WhatsAppWidget from '../../components/WhatsAppWidget';
import CompleteTheLook from '../../components/CompleteTheLook';
import { getLiveCatalog } from '../../lib/catalog';

export const metadata = {
  title: "Curated Sets & Special Offers | Satvastones Jewellery",
  description:
    "Explore curated jewelry sets and special offers on anti-tarnish jewelry. Extra bundle savings when pieces are purchased together. Nationwide COD available.",
  keywords: [
    "jewellery sets online india",
    "curated jewellery stacks",
    "anti tarnish sets",
    "layering chain set india",
  ],
  alternates: {
    canonical: "https://satvastones.com/sale",
  },
};

export const dynamic = 'force-dynamic';

export default async function SaleCollection() {
  const all = await getLiveCatalog();
  const saleProducts = [...all].sort((a, b) => {
    const savingsA = (a.mrp - a.price) / a.mrp;
    const savingsB = (b.mrp - b.price) / b.mrp;
    return savingsB - savingsA;
  });

  return (
    <>
      <Header />
      <main>
        <CollectionPage
          title="Curated Sets & Selected Offers"
          tagline="Bundle complementary waterproof chains, rings, and earrings to unlock automatic set pricing. All pieces backed by our 18k PVD guarantee."
          bannerBg="var(--canvas-subtle)"
          initialProducts={saleProducts}
        />
        <CompleteTheLook />
        <TrustStrip />
      </main>
      <WhatsAppWidget />
      <Footer />
    </>
  );
}
