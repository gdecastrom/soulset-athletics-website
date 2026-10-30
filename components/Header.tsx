'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { CATEGORIES, CATS, getProduct } from '../lib/catalog.ts';
import { dict } from '../lib/dict.ts';
import { href, tr, type Lang } from '../lib/i18n.ts';
import { useCart } from './CartProvider.tsx';
import { LogoHorizontal } from './Logos.tsx';

/* The page path without its language prefix: '/es/shop/fuel' → '/shop/fuel'. English pages are rendered
   internally under /en (see proxy.ts), so during rendering the path can start with /en too. */
export function basePath(pathname: string) {
  const m = pathname.match(/^\/(en|es)(\/.*)?$/);
  return m ? m[2] || '/' : pathname;
}

export function Header({ lang }: { lang: Lang }) {
  const d = dict(lang);
  const pathname = usePathname() || '/';
  const path = basePath(pathname);
  const { count, open } = useCart();
  const [shopOpen, setShopOpen] = useState(false);
  const [shut, setShut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const drop = useRef<HTMLDivElement>(null);
  const shopBtn = useRef<HTMLButtonElement>(null);

  const product = path.startsWith('/products/') ? getProduct(path.split('/')[2]) : undefined;
  const current = product ? `/shop/${product.cat}` : path;
  const inShop = current === '/shop' || current.startsWith('/shop/');

  useEffect(() => {
    setMenuOpen(false);
    setShopOpen(false);
    if (drop.current?.matches(':hover')) setShut(true);
  }, [pathname]);
  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (!drop.current?.contains(e.target as Node)) setShopOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && shopOpen) { setShopOpen(false); shopBtn.current?.focus(); } };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', onClick); document.removeEventListener('keydown', onKey); };
  }, [shopOpen]);

  const navLink = (to: string, label: string, extra?: ReactNode) => (
    <Link href={href(lang, to)} aria-current={current === to ? 'page' : undefined}>{label}{extra}</Link>
  );
  const otherLang: Lang = lang === 'en' ? 'es' : 'en';

  return (
    <>
      <div className="announce" role="note">
        <b>{d.announce.soon}</b>
        <span className="an-x"> · <Link href={href(lang, '/waitlist')}>{d.announce.join}</Link></span>
        <span className="an-y"> · {d.announce.shipping}</span>
      </div>
      <header className="site-head">
        <div className="wrap head-in">
          <Link className="brand" href={href(lang, '/')} aria-label={d.nav.home}><LogoHorizontal label="Soulset Athletics" /></Link>
          <nav className="nav" aria-label={d.nav.main}>
            <div className={'nav-drop' + (shopOpen ? ' open' : '') + (shut ? ' shut' : '')} ref={drop} onMouseLeave={() => setShut(false)}>
              <button ref={shopBtn} className={'nav-btn' + (inShop ? ' is-current' : '')} type="button" aria-expanded={shopOpen} aria-controls="shopMenu"
                onClick={() => { if (shopOpen) { setShopOpen(false); setShut(true); } else { setShopOpen(true); setShut(false); } }}>
                {d.nav.shop}
                <svg className="caret" viewBox="0 0 10 6" aria-hidden><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
              </button>
              <div className="drop" id="shopMenu">
                {navLink('/shop', d.nav.allProducts, <span>{d.nav.everything}</span>)}
                {CATEGORIES.map(c => <Fragment key={c}>{navLink(`/shop/${c}`, tr(lang, CATS[c].name), <span>{d.nav.catHints[c]}</span>)}</Fragment>)}
              </div>
            </div>
            {navLink('/fuel-planner', d.nav.planner)}
            {navLink('/manifesto', d.nav.manifesto)}
            {navLink('/waitlist', d.nav.waitlist)}
          </nav>
          <div className="head-actions">
            <Link className="lang-switch" href={href(otherLang, path)} hrefLang={otherLang} lang={otherLang} aria-label={d.nav.otherLangLabel}>{d.nav.otherLang}</Link>
            <button className="icon-btn" aria-label={d.nav.cart(count)} onClick={open}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M4 7h16l-1.5 13h-13z" /><path d="M8.5 10V6a3.5 3.5 0 0 1 7 0v4" /></svg>
              <span className="cart-count" data-n={count}>{count}</span>
            </button>
            <button className="icon-btn menu-btn" aria-label={d.nav.openMenu} aria-expanded={menuOpen} aria-controls="mnav" onClick={() => setMenuOpen(o => !o)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M3 7h18M3 12h18M3 17h18" /></svg>
            </button>
          </div>
        </div>
        <nav className={'mnav wrap' + (menuOpen ? ' open' : '')} id="mnav" aria-label={d.nav.mobile}>
          <Link href={href(lang, '/shop')}>{d.nav.shopAll}</Link>
          {CATEGORIES.map(c => <Link key={c} href={href(lang, `/shop/${c}`)}>{tr(lang, CATS[c].name)}</Link>)}
          <Link href={href(lang, '/fuel-planner')}>{d.nav.planner}</Link>
          <Link href={href(lang, '/manifesto')}>{d.nav.manifesto}</Link>
          <Link href={href(lang, '/waitlist')}>{d.nav.joinWaitlist}</Link>
        </nav>
      </header>
    </>
  );
}
