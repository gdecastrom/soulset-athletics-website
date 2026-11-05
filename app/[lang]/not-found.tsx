'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { dict } from '../../lib/dict.ts';
import { href } from '../../lib/i18n.ts';

export default function NotFound() {
  const lang = usePathname()?.startsWith('/es') ? 'es' : 'en';
  const t = dict(lang).notFound;
  /* not-found pages get no params, so they can't set a per-language title in metadata; set it in the browser. */
  useEffect(() => { document.title = `${t.title} · Soulset Athletics`; }, [t.title]);
  return (
    <div className="wrap conf">
      <h1 className="d-xl">{t.title}</h1>
      <p className="lead">{t.text}</p>
      <div><Link className="btn btn-primary btn-l" href={href(lang, '/shop')}>{t.shopAll}</Link></div>
    </div>
  );
}
