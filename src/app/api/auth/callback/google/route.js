import { NextResponse } from 'next/server';
import {
  createCustomerToken,
  syncGoogleUser,
  CUSTOMER_COOKIE_NAME,
} from '@/lib/customerAuth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const stateRaw = requestUrl.searchParams.get('state');

  let returnUrl = '/account';
  let dynamicRedirectUri = '';

  if (stateRaw) {
    try {
      const stateObj = JSON.parse(Buffer.from(stateRaw, 'base64url').toString('utf8'));
      if (stateObj.returnUrl) returnUrl = stateObj.returnUrl;
      if (stateObj.redirectUri) dynamicRedirectUri = stateObj.redirectUri;
    } catch {}
  }

  if (error || !code) {
    console.error('Google OAuth callback returned error:', error);
    return NextResponse.redirect(
      new URL(`${returnUrl}?auth_error=${encodeURIComponent(error || 'Authorization failed')}`, request.url)
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET on server.');
    return NextResponse.redirect(
      new URL(`${returnUrl}?auth_error=Server+OAuth+configuration+missing`, request.url)
    );
  }

  // Fallback redirectUri if not in state
  if (!dynamicRedirectUri) {
    const proto =
      request.headers.get('x-forwarded-proto') ||
      (request.headers.get('host')?.includes('localhost') ? 'http' : 'https');
    const host = request.headers.get('host');
    dynamicRedirectUri = `${proto}://${host}/api/auth/callback/google`;
  }

  try {
    // 1. Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: dynamicRedirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Failed to exchange code with Google:', tokenData);
      return NextResponse.redirect(
        new URL(`${returnUrl}?auth_error=Failed+to+exchange+Google+token`, request.url)
      );
    }

    // 2. Fetch authenticated user's Google profile
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const profile = await profileRes.json();
    if (!profileRes.ok || !profile.email) {
      console.error('Failed to fetch userinfo from Google:', profile);
      return NextResponse.redirect(
        new URL(`${returnUrl}?auth_error=Failed+to+retrieve+profile+from+Google`, request.url)
      );
    }

    // 3. Upsert / synchronize customer in MongoDB Atlas
    const syncedUser = await syncGoogleUser({
      googleId: profile.sub,
      name: profile.name || profile.given_name || profile.email.split('@')[0],
      email: profile.email,
      avatar: profile.picture || '',
    });

    // 4. Create signed 30-day customer session token
    const sessionToken = createCustomerToken(syncedUser);

    const redirectTarget = new URL(returnUrl, request.url);
    redirectTarget.searchParams.set('auth_success', '1');

    const response = NextResponse.redirect(redirectTarget, { status: 302 });

    // Set secure HTTP-only customer session cookie
    response.cookies.set({
      name: CUSTOMER_COOKIE_NAME,
      value: sessionToken,
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    // Set client-accessible user profile cookie for instant synchronous hydration
    response.cookies.set({
      name: 'satva_user_profile',
      value: encodeURIComponent(JSON.stringify(syncedUser)),
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
      httpOnly: false, // Accessible to client JS for immediate UI update
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return response;
  } catch (err) {
    console.error('Exception during Google OAuth callback:', err);
    return NextResponse.redirect(
      new URL(`${returnUrl}?auth_error=${encodeURIComponent(err.message)}`, request.url)
    );
  }
}
