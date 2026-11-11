import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  verifyCustomerToken,
  CUSTOMER_COOKIE_NAME,
} from '@/lib/customerAuth';
import { connectDb } from '@/lib/db';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(CUSTOMER_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false });
    }

    const payload = verifyCustomerToken(token);
    if (!payload || !payload.email) {
      return NextResponse.json({ authenticated: false });
    }

    // Attempt to fetch fresh profile from MongoDB
    try {
      await connectDb();
      const userDoc = await mongoose.connection.db.collection('users').findOne({
        email: payload.email.toLowerCase(),
      });

      if (userDoc) {
        // Query user's past orders
        const orders = await mongoose.connection.db
          .collection('orders')
          .find({
            $or: [
              { 'customer.email': payload.email.toLowerCase() },
              { 'shippingAddress.email': payload.email.toLowerCase() },
              { guestEmail: payload.email.toLowerCase() },
            ],
          })
          .sort({ createdAt: -1 })
          .toArray();

        const totalSpend = orders.reduce((sum, o) => sum + Number(o.amount || o.total || 0), 0);
        const ordersCount = orders.length;

        const user = {
          id: userDoc._id.toString(),
          _id: userDoc._id.toString(),
          name: userDoc.name,
          email: userDoc.email,
          phone: userDoc.phone || userDoc.addresses?.[0]?.phone || '',
          avatar: userDoc.avatar || userDoc.image || '',
          role: userDoc.role || 'CUSTOMER',
          addresses: userDoc.addresses || [],
          ordersCount,
          totalSpend,
          joinedDate: userDoc.createdAt
            ? new Date(userDoc.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
            : 'Nov 2026',
          status: totalSpend >= 2000 ? 'VIP Platinum Tier' : ordersCount >= 2 ? 'Loyal Patron' : 'Verified Client',
          provider: 'google',
        };

        return NextResponse.json({ authenticated: true, user });
      }
    } catch (dbErr) {
      console.error('Error fetching user doc in /api/auth/session:', dbErr);
    }

    // Fallback to token payload
    return NextResponse.json({
      authenticated: true,
      user: {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        avatar: payload.avatar,
        role: payload.role,
        provider: 'google',
      },
    });
  } catch (err) {
    console.error('Customer session check error:', err);
    return NextResponse.json({ authenticated: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action = 'logout' } = body;

    const response = NextResponse.json({
      success: true,
      message: 'Customer session terminated.',
    });

    response.cookies.set({
      name: CUSTOMER_COOKIE_NAME,
      value: '',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      sameSite: 'lax',
    });

    response.cookies.set({
      name: 'satva_user_profile',
      value: '',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
      sameSite: 'lax',
    });

    return response;
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
