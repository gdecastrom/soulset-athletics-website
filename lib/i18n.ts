/* English lives at /, Spanish at /es. proxy.ts maps / to the [lang] = 'en' routes. */
export const LANGS = ['en', 'es'] as const;
export type Lang = (typeof LANGS)[number];
export type Text = string | { en: string; es: string };

export const isLang = (x: unknown): x is Lang => x === 'en' || x === 'es';
export const tr = (lang: Lang, x: Text) => (typeof x === 'string' ? x : x[lang]);

/* Public URL of a page in a language: href('es', '/shop') → '/es/shop', href('en', '/') → '/'. */
export function href(lang: Lang, path = '/') {
  if (lang === 'en') return path;
  return path === '/' ? '/es' : '/es' + path;
}

export const money = (n: number) => 'US$' + (Math.round(n * 100) / 100).toFixed(2).replace(/\.00$/, '');
export const money2 = (n: number) => 'US$' + (Math.round(n * 100) / 100).toFixed(2);
