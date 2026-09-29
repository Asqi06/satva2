import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Route guards (Phase 1). UX-only: every protected page and API
 * re-verifies the session server-side — the proxy never grants access.
 *
 * Reads the JWT directly (edge-safe). On missing/invalid env it passes
 * through and lets page/API checks fail explicitly.
 */

function sessionCookieName(req: NextRequest): string {
  const secure =
    req.nextUrl.protocol === "https:" || process.env.NODE_ENV === "production";
  return secure ? "__Secure-authjs.session-token" : "authjs.session-token";
}

async function readToken(req: NextRequest) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  const token = await getToken({ req, secret, cookieName: sessionCookieName(req) });
  if (token) return token;
  // Legacy fallback cookie name (Auth.js v4-era).
  return getToken({ req, secret, cookieName: "next-auth.session-token" });
}

function apiDenied(req: NextRequest, status: number, code: string, message: string) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status, headers: { "x-proxy-guard": req.nextUrl.pathname } },
  );
}

export async function proxy(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;
  // Derive the preview marker from the URL; never trust a browser-supplied marker.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.delete("x-satva-offline-demo");
  if (pathname === "/garba-ghumar/demo") requestHeaders.set("x-satva-offline-demo", "true");
  const passthrough = () => NextResponse.next({ request: { headers: requestHeaders } });
  const needsAdmin =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  const needsAuth =
    pathname.startsWith("/account") ||
    pathname.startsWith("/wishlist") ||
    pathname.startsWith("/api/account") ||
    pathname.startsWith("/api/wishlist") ||
    pathname.startsWith("/api/uploads") ||
    pathname.startsWith("/api/reviews");
  if (!needsAuth && !needsAdmin) return passthrough();

  const isApi = pathname.startsWith("/api/");
  try {
    const token = await readToken(req);
    if (!token) {
      if (isApi) return apiDenied(req, 401, "UNAUTHORIZED", "Login required");
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    if (needsAdmin && (token as { role?: string }).role !== "ADMIN") {
      if (isApi) return apiDenied(req, 403, "FORBIDDEN", "Admin access required");
      const url = req.nextUrl.clone();
      url.pathname = "/account";
      return NextResponse.redirect(url);
    }
  } catch {
    // Env missing or token undecodable: pass through; page/API
    // server checks fail explicitly with a clear error.
    return passthrough();
  }
  return passthrough();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
