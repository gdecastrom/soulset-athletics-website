/* English pages have no prefix (/shop) but live in app/[lang] like the Spanish ones (/es/shop):
   rewrite / → /en internally, and send any /en/... URL to its unprefixed address so each page has one URL. */
import { NextResponse, type NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === '/en' || pathname.startsWith('/en/')) {
    return NextResponse.redirect(new URL((pathname.slice(3) || '/') + search, request.url), 308);
  }
  if (pathname === '/es' || pathname.startsWith('/es/')) return NextResponse.next();
  return NextResponse.rewrite(new URL('/en' + (pathname === '/' ? '' : pathname) + search, request.url));
}

export const config = {
  /* Everything except API routes, Next internals and files with an extension (images, icons, robots.txt…). */
  matcher: ['/((?!api/|_next/|.*\\.[a-zA-Z0-9]+$).*)'],
};
