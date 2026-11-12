import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  createAdminToken,
  verifyAdminToken,
  validateAdminCredentials,
  ADMIN_COOKIE_NAME,
} from '@/lib/adminAuth';
import { checkRateLimit, getClientKey } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false });
    }

    const payload = verifyAdminToken(token);
    if (!payload) {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        email: payload.email,
        name: payload.name,
        role: payload.role,
      },
    });
  } catch (err) {
    console.error('Admin session check error:', err);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const rate = checkRateLimit(`admin-login:${getClientKey(request)}`, 10, 15 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json({ success: false, error: 'Too many login attempts. Try again later.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } });
    }
    if (Number(request.headers.get('content-length') || 0) > 16 * 1024) {
      return NextResponse.json({ success: false, error: 'Request is too large.' }, { status: 413 });
    }
    const body = await request.json().catch(() => ({}));
    const { action = 'login', password, email } = body;

    if (action === 'logout') {
      const response = NextResponse.json({
        success: true,
        message: 'Admin session terminated successfully.',
      });

      response.cookies.set({
        name: ADMIN_COOKIE_NAME,
        value: '',
        path: '/',
        maxAge: 0,
        expires: new Date(0),
        httpOnly: true,
        sameSite: 'lax',
      });

      return response;
    }

    // Default action: login
    const validation = await validateAdminCredentials({ password, email });
    if (!validation.ok) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error || 'Access denied. Incorrect master key or password.',
        },
        { status: 401 }
      );
    }

    const token = createAdminToken({
      email: validation.email,
      name: validation.name,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Admin authorization successful.',
      user: {
        email: validation.email,
        name: validation.name,
        role: 'admin',
      },
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return response;
  } catch (err) {
    console.error('Admin auth error:', err);
    return NextResponse.json(
      { success: false, error: 'Authentication could not be completed.' },
      { status: 500 }
    );
  }
}
