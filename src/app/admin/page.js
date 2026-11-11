import { cookies } from 'next/headers';
import AdminClient from './AdminClient';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Atelier Operations & Merchant Portal | Satvastones Admin",
  description: "Secure merchant operations portal for managing customer orders, dispatch, and catalog.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage() {
  let initialAuthenticated = false;
  let initialAdminEmail = '';

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (token) {
      const session = verifyAdminToken(token);
      if (session) {
        initialAuthenticated = true;
        initialAdminEmail = session.email || '';
      }
    }
  } catch (err) {
    console.error('Server cookie verification error in admin/page.js:', err);
  }

  return (
    <main>
      <AdminClient
        initialAuthenticated={initialAuthenticated}
        initialAdminEmail={initialAdminEmail}
      />
    </main>
  );
}
