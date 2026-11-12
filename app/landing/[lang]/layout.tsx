/* The coming-soon cover at soulsetathletics.com (proxy.ts sends that address here). Its own root layout: no header,
   footer or cart, only the display font. */
import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { dict } from '../../../lib/dict.ts';
import { isLang, LANGS } from '../../../lib/i18n.ts';
import './landing.css';

const saira = localFont({ src: '../../fonts/saira-extra-condensed-900.woff2', weight: '900', variable: '--font-saira', display: 'swap' });

export const dynamicParams = false;
export function generateStaticParams() { return LANGS.map(lang => ({ lang })); }

export const viewport: Viewport = { themeColor: '#0A0A0A', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const t = dict(lang);
  return {
    metadataBase: new URL('https://soulsetathletics.com'),
    title: t.meta.title,
    description: t.footer.tagline,
    alternates: { canonical: '/' + lang, languages: { en: '/en', es: '/es', 'x-default': '/' } },
    openGraph: { title: t.meta.ogTitle, description: t.footer.tagline, siteName: 'Soulset Athletics', locale: lang === 'es' ? 'es_DO' : 'en_US', type: 'website', images: ['/media/run-track.webp'] },
  };
}

export default async function CoverLayout({ children, params }: { children: ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return (
    <html lang={lang} className={saira.variable}>
      <body>{children}</body>
    </html>
  );
}
