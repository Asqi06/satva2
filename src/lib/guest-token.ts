import { encode, decode } from "next-auth/jwt";
import { randomBytes } from "node:crypto";
import { requireServerVar } from "./env";

export const GUEST_COOKIE = "satva-guest-checkout";
// ponytail: guest tracking is limited to this browser for 30 days; verified email recovery is the upgrade path.
export const GUEST_MAX_AGE = 30 * 24 * 60 * 60;

export async function createGuestToken(): Promise<{ id: string; token: string }> {
  const id = randomBytes(12).toString("hex");
  const token = await encode({ token: { sub: id }, salt: GUEST_COOKIE, secret: requireServerVar("AUTH_SECRET"), maxAge: GUEST_MAX_AGE });
  return { id, token };
}

export async function readGuestToken(token?: string): Promise<string | null> {
  if (!token) return null;
  try {
    const value = await decode({ token, salt: GUEST_COOKIE, secret: requireServerVar("AUTH_SECRET") });
    return value?.sub && /^[a-f0-9]{24}$/.test(value.sub) ? value.sub : null;
  } catch { return null; }
}
