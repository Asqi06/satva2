import AdminClient from './AdminClient';

export const metadata = {
  title: "Atelier Operations & Order Dispatch | Satvastones Admin",
  description: "Merchant operations portal for fulfilling orders, tracking AOV performance, and managing inventory.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  return (
    <main>
      <AdminClient />
    </main>
  );
}
