import Header from '../../components/Header';
import Footer from '../../components/Footer';
import WishlistClient from './WishlistClient';

export const metadata = {
  title: "Saved Pieces | Satvastones Atelier",
  description: "View and manage your saved anti-tarnish, Korean, and Indian demi-fine jewellery pieces.",
  robots: { index: false, follow: false },
};

export default function WishlistPage() {
  return (
    <div className="site-wrapper">
      <Header />
      <main id="main-content">
        <WishlistClient />
      </main>
      <Footer />
    </div>
  );
}
