import type { MetadataRoute } from 'next';
import { CATEGORIES, PRODUCTS } from '../lib/catalog.ts';
import { href } from '../lib/i18n.ts';
import { SITE_URL } from '../lib/site.ts';

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ['/', '/shop', ...CATEGORIES.map(c => `/shop/${c}`), ...PRODUCTS.map(p => `/products/${p.id}`), '/fuel-planner', '/manifesto', '/help', '/waitlist'];
  return paths.map(path => ({
    url: SITE_URL + href('en', path),
    alternates: { languages: { en: SITE_URL + href('en', path), es: SITE_URL + href('es', path) } },
  }));
}
