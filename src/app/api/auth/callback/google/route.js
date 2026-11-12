import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  createCustomerToken,
  syncGoogleUser,
  CUSTOMER_COOKIE_NAME,
} from '@/lib/customerAuth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const cookieStore = await cookies();
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const stateRaw = requestUrl.searchParams.get('state');
  const expectedState = cookieStore.get('satva_oauth_state')?.value;

  let returnUrl = '/account';
  let dynamicRedirectUri = '';

  if (!stateRaw || !expectedState || stateRaw !== expectedState) {
    const response = NextResponse.redirect(new URL('/account?auth_error=Invalid+OAuth+state', request.url));
    response.cookies.delete('satva_oauth_state');
    return response;
  }

  if (stateRaw) {
    try {
      const stateObj = JSON.parse(Buffer.from(stateRaw, 'base64url').toString('utf8'));
      if (typeof stateObj.returnUrl === 'string' && stateObj.returnUrl.startsWith('/') && !stateObj.returnUrl.startsWith('//') && !stateObj.returnUrl.includes('\\')) returnUrl = stateObj.returnUrl;
      if (typeof stateObj.redirectUri === 'string') dynamicRedirectUri = stateObj.redirectUri;
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
  dynamicRedirectUri = new URL('/api/auth/callback/google', process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin).toString();

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
      console.error('Failed to exchange Google authorization code.');
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
    if (!profileRes.ok || !profile.email || profile.email_verified !== true) {
      console.error('Failed to fetch verified Google profile.');
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
    response.cookies.delete('satva_oauth_state');

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
