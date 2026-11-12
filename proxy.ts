/* soulsetathletics.com shows only the coming-soon cover (app/landing); every other address gets the full site.
   Full site: English pages have no prefix (/shop) but live in app/[lang] like the Spanish ones (/es/shop):
   rewrite / → /en internally, and send any /en/... URL to its unprefixed address so each page has one URL.
   web.soulsetathletics.com is a preview of the shop before launch, kept out of search engines. */
import { NextResponse, type NextRequest } from 'next/server';
import { coverRoute, isLandingHost, isWebHost, WEB_HOST } from './lib/hosts.ts';

export function proxy(request: NextRequest) {
  const host = request.headers.get('host');
  const { pathname, search } = request.nextUrl;

  if (isLandingHost(host)) {
    const local = request.nextUrl.hostname.endsWith('.localhost');
    const webOrigin = local ? `${request.nextUrl.protocol}//localhost${request.nextUrl.port ? ':' + request.nextUrl.port : ''}` : `https://${WEB_HOST}`;
    const route = coverRoute(pathname, search, request.headers.get('accept-language'), webOrigin);
    if (route.kind === 'redirect') return NextResponse.redirect(route.url, 307);
    /* The language is picked here on every request, before any cache, so / needs no Vary header. */
    return NextResponse.rewrite(new URL(route.path, request.url));
  }

  const res = site(request, pathname, search);
  if (isWebHost(host)) res.headers.set('X-Robots-Tag', 'noindex');
  return res;
}

function site(request: NextRequest, pathname: string, search: string) {
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
