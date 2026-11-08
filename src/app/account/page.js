import AccountClient from './AccountClient';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import TrustStrip from '../../components/TrustStrip';
import WhatsAppWidget from '../../components/WhatsAppWidget';

export const metadata = {
  title: "Client Portal & Orders | Satvastones Demi-Fine Jewelry",
  description: "View your order history, track live shipments, and manage saved delivery addresses.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AccountPage() {
  return (
    <>
      <Header />
      <main>
        <AccountClient />
        <TrustStrip />
      </main>
      <WhatsAppWidget />
      <Footer />
    </>
  );
}
