import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { CartDrawer } from '../../components/CartDrawer.tsx';
import { CartProvider } from '../../components/CartProvider.tsx';
import { Footer } from '../../components/Footer.tsx';
import { HashRedirect } from '../../components/HashRedirect.tsx';
import { Header } from '../../components/Header.tsx';
import { dict } from '../../lib/dict.ts';
import { isLang, LANGS } from '../../lib/i18n.ts';
import { SITE_URL } from '../../lib/site.ts';
import '../globals.css';

const saira = localFont({
  src: [{ path: '../fonts/saira-extra-condensed-800.woff2', weight: '800' }, { path: '../fonts/saira-extra-condensed-900.woff2', weight: '900' }],
  variable: '--font-saira', display: 'swap',
});
const barlow = localFont({
  src: [{ path: '../fonts/barlow-400.woff2', weight: '400' }, { path: '../fonts/barlow-500.woff2', weight: '500' }, { path: '../fonts/barlow-600.woff2', weight: '600' }],
  variable: '--font-barlow', display: 'swap',
});
const plexMono = localFont({ src: '../fonts/ibm-plex-mono-500.woff2', weight: '500', variable: '--font-plex-mono', display: 'swap', preload: false });

export const dynamicParams = false;
export function generateStaticParams() { return LANGS.map(lang => ({ lang })); }

export const viewport: Viewport = { themeColor: '#0A0A0A', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const m = dict(lang).meta;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: m.title, template: '%s · Soulset Athletics' },
    description: m.description,
    openGraph: { title: m.ogTitle, description: m.ogDescription, siteName: 'Soulset Athletics', locale: lang === 'es' ? 'es_DO' : 'en_US', type: 'website', images: ['/img/hero.webp'] },
  };
}

export default async function LangLayout({ children, params }: { children: ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return (
    <html lang={lang} className={`${saira.variable} ${barlow.variable} ${plexMono.variable}`}>
      <body>
        <CartProvider lang={lang}>
          <HashRedirect lang={lang} />
          <Header lang={lang} />
          <main id="view">{children}</main>
          <Footer lang={lang} />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
