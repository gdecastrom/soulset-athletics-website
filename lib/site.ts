import type { Metadata } from 'next';
import { href, type Lang } from './i18n.ts';
/* Public base URL, used for canonical links, sitemap and social previews.
   Set SITE_URL in Vercel once the domain is live; until then Vercel's production URL is used. */
export const SITE_URL = (
  process.env.SITE_URL
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000')
).replace(/\/+$/, '');

/* Canonical URL plus the other language's URL for a page, for search engines. */
export function alternates(lang: Lang, path: string): Metadata['alternates'] {
  return { canonical: href(lang, path), languages: { en: href('en', path), es: href('es', path), 'x-default': href('en', path) } };
}

export type PageProps<P = object> = { params: Promise<{ lang: string } & P> };
