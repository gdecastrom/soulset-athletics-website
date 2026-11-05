import type { MetadataRoute } from 'next';
import { SITE_URL } from '../lib/site.ts';

export default function robots(): MetadataRoute.Robots {
  /* Preview deployments stay out of search results; only production is indexed. */
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') return { rules: { userAgent: '*', disallow: '/' } };
  return { rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/waitlist/confirmed', '/es/waitlist/confirmed'] }, sitemap: `${SITE_URL}/sitemap.xml` };
}
