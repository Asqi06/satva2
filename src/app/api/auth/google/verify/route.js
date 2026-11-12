import { NextResponse } from 'next/server';
import {
  createCustomerToken,
  syncGoogleUser,
  CUSTOMER_COOKIE_NAME,
} from '@/lib/customerAuth';
import { checkRateLimit, getClientKey } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const rate = checkRateLimit(`google-login:${getClientKey(request)}`, 10, 10 * 60 * 1000);
    if (!rate.allowed) return NextResponse.json({ success: false, error: 'Too many sign-in attempts. Try again later.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } });
    const body = await request.json().catch(() => ({}));
    const { credential } = body;

    if (!credential) {
      return NextResponse.json(
        { success: false, error: 'Google credential (id_token) is required.' },
        { status: 400 }
      );
    }

    // Verify id_token with Google tokeninfo endpoint
    const verifyRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    );
    const tokenInfo = await verifyRes.json();

    if (!verifyRes.ok || !tokenInfo.email || tokenInfo.email_verified !== 'true') {
      return NextResponse.json(
        { success: false, error: 'Invalid Google credential token.' },
        { status: 401 }
      );
    }

    // Verify audience matches our Client ID
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || tokenInfo.aud !== clientId) {
      return NextResponse.json(
        { success: false, error: 'Token audience does not match configured Google Client ID.' },
        { status: 403 }
      );
    }

    // Synchronize customer record in MongoDB Atlas
    const syncedUser = await syncGoogleUser({
      googleId: tokenInfo.sub,
      name: tokenInfo.name || tokenInfo.given_name || tokenInfo.email.split('@')[0],
      email: tokenInfo.email,
      avatar: tokenInfo.picture || '',
    });

    const sessionToken = createCustomerToken(syncedUser);

    const response = NextResponse.json({
      success: true,
      user: syncedUser,
    });

    response.cookies.set({
      name: CUSTOMER_COOKIE_NAME,
      value: sessionToken,
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    response.cookies.set({
      name: 'satva_user_profile',
      value: encodeURIComponent(JSON.stringify(syncedUser)),
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return response;
  } catch (err) {
    console.error('Google verify API error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
