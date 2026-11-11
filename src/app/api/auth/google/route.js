import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const returnUrl = searchParams.get('returnUrl') || '/account';

    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json(
        { error: 'GOOGLE_CLIENT_ID is not configured in server environment.' },
        { status: 500 }
      );
    }

    // Determine current host and scheme
    const proto =
      request.headers.get('x-forwarded-proto') ||
      (request.headers.get('host')?.includes('localhost') ? 'http' : 'https');
    const host = request.headers.get('host');
    const redirectUri = `${proto}://${host}/api/auth/callback/google`;

    const statePayload = {
      csrf: crypto.randomBytes(16).toString('hex'),
      returnUrl,
      redirectUri,
    };
    const state = Buffer.from(JSON.stringify(statePayload)).toString('base64url');

    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.set('client_id', clientId);
    googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
    googleAuthUrl.searchParams.set('response_type', 'code');
    googleAuthUrl.searchParams.set('scope', 'openid profile email');
    googleAuthUrl.searchParams.set('access_type', 'offline');
    googleAuthUrl.searchParams.set('prompt', 'select_account');
    googleAuthUrl.searchParams.set('state', state);

    const response = NextResponse.redirect(googleAuthUrl.toString(), { status: 302 });
    response.cookies.set({
      name: 'satva_oauth_state',
      value: state,
      path: '/',
      httpOnly: true,
      maxAge: 15 * 60, // 15 mins
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (err) {
    console.error('Failed to initiate Google OAuth:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
