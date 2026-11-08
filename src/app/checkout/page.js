import CheckoutClient from './CheckoutClient';

export const metadata = {
  title: "Secure Checkout | Satvastones Demi-Fine Jewelry",
  description: "Complete your order with Cash on Delivery or Instant UPI. 100% secure checkout.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutPage() {
  return (
    <main>
      <CheckoutClient />
    </main>
  );
}
