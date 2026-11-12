import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
export const ADMIN_COOKIE_NAME = 'satva_admin_session';

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET must be configured with at least 32 characters.');
  }
  return secret;
}

export function createAdminToken(payload = {}) {
  const sessionData = {
    role: 'admin',
    email: payload.email,
    name: payload.name || 'SatvaStones Admin',
    iat: Date.now(),
    exp: Date.now() + 8 * 60 * 60 * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(sessionData)).toString('base64url');
  const signature = crypto.createHmac('sha256', getSecret()).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

export function verifyAdminToken(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const [encoded, signature, ...extra] = token.split('.');
    if (!encoded || !signature || extra.length) return null;
    const expected = crypto.createHmac('sha256', getSecret()).update(encoded).digest();
    const received = Buffer.from(signature, 'base64url');
    if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) return null;
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (payload.role !== 'admin' || !Number.isFinite(payload.exp) || Date.now() >= payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function validateAdminCredentials({ password, email }) {
  const expectedPassword = process.env.ADMIN_PASSWORD;
  const expectedEmail = process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase();
  if (!expectedPassword || !process.env.AUTH_SECRET) {
    return { ok: false, error: 'Admin authentication is not configured on the server.' };
  }
  if (typeof password !== 'string' || !password || password.length > 256) {
    return { ok: false, error: 'Invalid credentials.' };
  }

  const supplied = Buffer.from(password);
  const expected = Buffer.from(expectedPassword);
  const passwordMatches = supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
  const suppliedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const emailMatches = !expectedEmail || suppliedEmail === expectedEmail;
  if (!passwordMatches || !emailMatches) return { ok: false, error: 'Invalid credentials.' };
  return { ok: true, email: expectedEmail || suppliedEmail, name: 'SatvaStones Admin' };
}

export async function requireAdmin() {
  const token = (await cookies()).get(ADMIN_COOKIE_NAME)?.value;
  if (verifyAdminToken(token)) return null;
  return NextResponse.json({ success: false, error: 'Administrator authentication required.' }, { status: 401 });
}
