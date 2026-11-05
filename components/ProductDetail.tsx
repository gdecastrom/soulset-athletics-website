'use client';
/* The interactive half of a product page: images, options, purchase type, quantity, add to cart. */
import Image from 'next/image';
import { useState, type ReactNode } from 'react';
import { defaults, getProduct, imgSrc, levelOf, mainImg, optionValue, subPrice, unitPrice, type Opts } from '../lib/catalog.ts';
import { dict } from '../lib/dict.ts';
import { money, money2, tr, type Lang } from '../lib/i18n.ts';
import { useCart } from './CartProvider.tsx';
import { Levels } from './Levels.tsx';
import { Qty } from './Qty.tsx';
import { Chevrons } from './Logos.tsx';

/* title, body (blurb + stats) and after (guarantees + accordions) are rendered on the server and slotted in. */
export function ProductDetail({ id, lang, title, body, after }: { id: string; lang: Lang; title: ReactNode; body: ReactNode; after: ReactNode }) {
  const p = getProduct(id)!;
  const t = dict(lang).product;
  const { add } = useCart();
  const [opts, setOpts] = useState<Opts>(() => defaults(p));
  const [sub, setSub] = useState(false);
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState<string | null>(null);
  const unit = unitPrice(p, opts)!;
  const price = sub ? subPrice(unit) : unit;
  const lvl = levelOf(p, opts);
  const gallery = [null, ...p.gallery];
  const shown = img ?? mainImg(p, opts);

  return (
    <div className="pdp">
      <div className="pdp-media">
        <div className="pdp-stage">
          <div className="bigchev"><Chevrons /></div>
          <Image className="pack" src={imgSrc(shown)} alt={p.name} width={900} height={900} priority sizes="(max-width: 860px) 92vw, 50vw" />
        </div>
        {gallery.length > 1 && (
          <div className="thumbs" role="group" aria-label={t.images}>
            {gallery.map((g, i) => (
              <button key={i} type="button" className="thumb" aria-label={t.image(i + 1)} aria-pressed={(img ?? null) === g} onClick={() => setImg(g)}>
                <Image src={imgSrc(g ?? mainImg(p, opts))} alt="" width={900} height={900} sizes="150px" />
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="pdp-info">
        {title}
        <div className="pdp-price">
          <span className="price">{sub ? money2(price) : money(price)}</span>
          {p.compare && <s className="mono" style={{ color: 'var(--dim)' }}>{money(p.compare)}</s>}
          <span className="lv-label">
            {lvl ? <><Levels n={lvl} /> {t.caffeineLevel(lvl)}</> : p.cat === 'fuel' || p.cat === 'hydrate' ? <><Levels n={0} /> {t.noCaffeine}</> : null}
          </span>
        </div>
        {body}
        <form style={{ display: 'grid', gap: 22 }} onSubmit={e => { e.preventDefault(); add(p.id, opts, qty, sub, true); }}>
          {p.options.map(op => {
            const current = optionValue(p, opts, op.key);
            return (
              <fieldset className="opt" key={op.key}>
                <legend>{tr(lang, op.label)}<b>{current && tr(lang, current.label)}</b></legend>
                <div className="seg">
                  {op.values.map(v => (
                    <label key={v.id}>
                      <input type="radio" name={op.key} value={v.id} checked={opts[op.key] === v.id}
                        onChange={() => { setOpts(o => ({ ...o, [op.key]: v.id })); setImg(null); }} />
                      <span>{tr(lang, v.label)}{v.note && <> <small className="save">{tr(lang, v.note)}</small></>}</span>
                    </label>
                  ))}
                </div>
                {op.values.some(v => v.hint) && <p className="hint" style={{ fontSize: 14, color: 'var(--muted)' }}>{current?.hint ? tr(lang, current.hint) : ''}</p>}
              </fieldset>
            );
          })}
          {p.contents && (
            <div className="opt"><span className="eyebrow">{t.inTheBox}</span>
              <ul style={{ margin: 0, paddingLeft: 18, color: '#D6D3CC' }}>{p.contents[lang].map(c => <li key={c}>{c}</li>)}</ul>
            </div>
          )}
          {p.sub && (
            <div className="buy-type" role="radiogroup" aria-label={t.purchaseType}>
              <label><input type="radio" name="bt" checked={!sub} onChange={() => setSub(false)} /><span className="bt"><b>{t.once}</b></span><span className="bt-price">{money(unit)}</span></label>
              <label><input type="radio" name="bt" checked={sub} onChange={() => setSub(true)} /><span className="bt"><b>{t.subscribe}</b><small>{t.subscribeNote}</small></span><span className="bt-price">{money2(subPrice(unit))}</span></label>
            </div>
          )}
          <div className="buy-row">
            <Qty lang={lang} value={qty} onChange={setQty} id="pdpQty" />
            <button className="btn btn-primary btn-l" type="submit">{t.addToCart} · {money2(price * qty)}</button>
          </div>
        </form>
        {after}
      </div>
    </div>
  );
}
