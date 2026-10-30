'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { lineSummary } from '../lib/cart.ts';
import { defaults, getProduct, imgSrc, mainImg, unitPrice } from '../lib/catalog.ts';
import { dict } from '../lib/dict.ts';
import { href, money, money2, tr } from '../lib/i18n.ts';
import { linePrice, useCart } from './CartProvider.tsx';
import { Qty } from './Qty.tsx';

export function Thumb({ img, size = 76 }: { img: string; size?: number }) {
  return <div className="th"><Image src={imgSrc(img)} alt="" width={900} height={900} sizes={`${size}px`} /></div>;
}

export function CartDrawer() {
  const { lang, lines, isOpen, close, setQty, remove, add, subtotal } = useCart();
  const c = dict(lang).cart;
  const closeBtn = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<Element | null>(null);

  useEffect(() => {
    if (isOpen) {
      lastFocus.current = document.activeElement;
      const t = setTimeout(() => closeBtn.current?.focus(), 50);
      const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
      document.addEventListener('keydown', onKey);
      return () => { clearTimeout(t); document.removeEventListener('keydown', onKey); };
    }
    if (lastFocus.current instanceof HTMLElement) lastFocus.current.focus();
  }, [isOpen, close]);

  const inCart = new Set(lines.map(l => l.id));
  const upsell = ['sodium', 'carb-gel-30', 'creatine', 'fuel-mix-60'].map(id => getProduct(id)!).find(p => !inCart.has(p.id));

  return (
    <>
      <div className={'scrim' + (isOpen ? ' open' : '')} onClick={close} />
      <aside className={'drawer' + (isOpen ? ' open' : '')} aria-label={c.label} aria-hidden={!isOpen}>
        <div className="drawer-head">
          <span className="d-s">{c.title}</span>
          <button ref={closeBtn} className="icon-btn" aria-label={c.close} onClick={close}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M5 5l14 14M19 5L5 19" /></svg>
          </button>
        </div>
        <div className="ship-bar"><span><b>{c.prelaunch}</b> {c.prelaunchText}</span></div>
        <div className="drawer-items">
          {!lines.length ? (
            <div className="empty">
              <span className="d-m">{c.emptyTitle}</span>
              <p>{c.emptyText}</p>
              <Link className="btn btn-primary" href={href(lang, '/shop')} onClick={close}>{c.shopAll}</Link>
            </div>
          ) : (
            <>
              {lines.map((l, i) => {
                const p = getProduct(l.id)!;
                return (
                  <div className="li" key={`${l.id}-${JSON.stringify(l.opts)}-${l.sub}`}>
                    <Thumb img={mainImg(p, l.opts)} />
                    <div style={{ minWidth: 0 }}>
                      <Link className="li-name" href={href(lang, `/products/${p.id}`)} onClick={close}>{p.name}</Link>
                      <div className="li-opts">{lineSummary(l, lang)}</div>
                      <Qty lang={lang} small min={0} value={l.qty} onChange={n => setQty(i, n)} />
                    </div>
                    <div className="li-right">
                      <span className="price">{money2(linePrice(l) * l.qty)}</span>
                      {l.sub && <span className="save">−15%</span>}
                      <button className="li-rm" onClick={() => remove(i)}>{c.remove}</button>
                    </div>
                  </div>
                );
              })}
              {upsell && (
                <div style={{ padding: '18px 0', display: 'grid', gap: 10 }}>
                  <span className="eyebrow">{c.pairsWell}</span>
                  <div className="li" style={{ border: 0, padding: 0 }}>
                    <Thumb img={mainImg(upsell, defaults(upsell))} />
                    <div><b style={{ fontWeight: 600 }}>{upsell.name}</b><div className="li-opts">{tr(lang, upsell.short)}</div></div>
                    <div className="li-right">
                      <span className="price">{money(unitPrice(upsell, defaults(upsell))!)}</span>
                      <button className="btn btn-secondary" style={{ minHeight: 36, padding: '6px 12px', fontSize: 12 }}
                        onClick={() => add(upsell.id, defaults(upsell), 1, false, false)}>{c.add}</button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <div className="drawer-foot">
          {lines.length > 0 && (
            <>
              <div className="row-b"><span>{c.subtotal}</span><span className="price">{money2(subtotal)}</span></div>
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>{c.note}</p>
              <Link className="btn btn-primary btn-l btn-block" href={href(lang, '/waitlist')} onClick={close}>{c.join} <span className="edge">›</span></Link>
              <button className="btn-ghost" onClick={close} style={{ justifySelf: 'center', fontWeight: 600, fontSize: 13, letterSpacing: '.12em', textTransform: 'uppercase' }}>{c.keepShopping}</button>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
