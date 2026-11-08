import { Suspense } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import SearchClient from './SearchClient';
import { getLiveCatalog } from '../../lib/catalog';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Search Demi-Fine Jewellery | Satvastones Atelier",
  description: "Search waterproof, anti-tarnish chains, Korean minimalist hoops, and handcrafted Indian jewellery.",
};

export default async function SearchPage() {
  const products = await getLiveCatalog();

  return (
    <div className="site-wrapper">
      <Header />
      <main id="main-content">
        <Suspense fallback={<div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>Searching atelier catalog...</div>}>
          <SearchClient initialProducts={products} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
