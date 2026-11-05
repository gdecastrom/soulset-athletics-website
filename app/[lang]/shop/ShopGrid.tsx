'use client';
/* Shop page for all products or one category, with client-side sorting so the page itself stays static. */
import Link from 'next/link';
import { useState } from 'react';
import { ProductCard } from '../../../components/ProductCard.tsx';
import { CATEGORIES, CATS, fromPrice, PRODUCTS, type Category } from '../../../lib/catalog.ts';
import { dict } from '../../../lib/dict.ts';
import { href, tr, type Lang } from '../../../lib/i18n.ts';

type Sort = 'featured' | 'low' | 'high';

export function ShopGrid({ lang, cat }: { lang: Lang; cat?: Category }) {
  const s = dict(lang).shop;
  const [sort, setSort] = useState<Sort>('featured');
  const list = PRODUCTS.filter(p => !cat || p.cat === cat);
  if (sort !== 'featured') list.sort((a, b) => (sort === 'low' ? 1 : -1) * (fromPrice(a) - fromPrice(b)));
  const chips: [string, string][] = [['', s.all], ...CATEGORIES.map(k => [k, tr(lang, CATS[k].name)] as [string, string])];
  return (
    <div className="wrap">
      <div className="shop-top">
        <span className="eyebrow">{s.eyebrow}{cat ? ' · ' + tr(lang, CATS[cat].name) : ''}</span>
        <h1 className="d-xl">{cat ? tr(lang, CATS[cat].name) : s.allTitle}</h1>
        <p className="lead">{cat ? tr(lang, CATS[cat].line) : s.allLead}</p>
      </div>
      <div className="filters">
        <div className="chips" role="group" aria-label={s.filter}>
          {chips.map(([k, n]) => <Link key={k} className="chip" href={href(lang, k ? `/shop/${k}` : '/shop')} aria-pressed={(cat || '') === k}>{n}</Link>)}
        </div>
        <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14, color: 'var(--muted)' }}>
          <span>{s.sort}</span>
          <select className="select" value={sort} onChange={e => setSort(e.target.value as Sort)}>
            <option value="featured">{s.featured}</option><option value="low">{s.low}</option><option value="high">{s.high}</option>
          </select>
        </label>
      </div>
      <p className="mono" style={{ color: 'var(--dim)', fontSize: 13, marginBottom: 20 }}>{s.count(list.length)}</p>
      <div className="grid" style={{ paddingBottom: 96 }}>{list.map(p => <ProductCard key={p.id} p={p} lang={lang} />)}</div>
    </div>
  );
}
