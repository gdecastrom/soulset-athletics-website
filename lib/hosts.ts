/* Which site each address gets. soulsetathletics.com (and www) shows only the coming-soon cover; the full site lives
   on web.soulsetathletics.com, the Vercel URLs and localhost. In local dev, soulsetathletics.localhost shows the cover. */

export const LANDING_HOSTS = ['soulsetathletics.com', 'www.soulsetathletics.com', 'soulsetathletics.localhost'];
export const WEB_HOST = 'web.soulsetathletics.com';

const hostname = (host: string | null) => (host || '').toLowerCase().replace(/:\d+$/, '');
export const isLandingHost = (host: string | null) => LANDING_HOSTS.includes(hostname(host));
export const isWebHost = (host: string | null) => hostname(host) === WEB_HOST;

/* True when the browser's most preferred language is Spanish (Accept-Language, highest q wins, ties keep order). */
export function prefersSpanish(acceptLanguage: string | null) {
  let best = { tag: '', q: -1 };
  for (const part of (acceptLanguage || '').split(',')) {
    const [tag, ...params] = part.trim().toLowerCase().split(';');
    if (!tag) continue;
    const qParam = params.map(p => p.trim()).find(p => p.startsWith('q='));
    const q = qParam ? Number(qParam.slice(2)) : 1;
    if (Number.isFinite(q) && q > best.q) best = { tag, q };
  }
  return best.tag === 'es' || best.tag.startsWith('es-');
}

export type CoverRoute = { kind: 'rewrite'; path: string } | { kind: 'redirect'; url: string };

/* On the cover's address: / in the visitor's language, /es and /en in that language, and any other path goes to the
   same path on the full site, so old links keep working. */
export function coverRoute(pathname: string, search: string, acceptLanguage: string | null, webOrigin: string): CoverRoute {
  if (pathname === '/') return { kind: 'rewrite', path: prefersSpanish(acceptLanguage) ? '/landing/es' : '/landing/en' };
  if (pathname === '/es' || pathname === '/en') return { kind: 'rewrite', path: '/landing' + pathname };
  return { kind: 'redirect', url: webOrigin + pathname + search };
}
