import { NextResponse } from 'next/server';

// Maintenance mode: every URL renders the same coming-soon page.
export function proxy(request) {
  if (request.nextUrl.pathname === '/') return NextResponse.next();
  return NextResponse.rewrite(new URL('/', request.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt).*)'],
};
