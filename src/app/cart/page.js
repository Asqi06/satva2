import CartClient from './CartClient';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import TrustStrip from '../../components/TrustStrip';
import WhatsAppWidget from '../../components/WhatsAppWidget';

export const metadata = {
  title: "Your Shopping Bag | Satvastones Demi-Fine Jewelry",
  description: "Review your shopping bag. Free express delivery on orders above ₹499 and nationwide cash on delivery available.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CartPage() {
  return (
    <>
      <Header />
      <main>
        <CartClient />
        <TrustStrip />
      </main>
      <WhatsAppWidget />
      <Footer />
    </>
  );
}
