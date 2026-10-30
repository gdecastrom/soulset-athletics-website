import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProductCard } from '../../../../components/ProductCard.tsx';
import { ProductDetail } from '../../../../components/ProductDetail.tsx';
import { CATS, defaults, getProduct, imgSrc, mainImg, PRODUCTS } from '../../../../lib/catalog.ts';
import { dict } from '../../../../lib/dict.ts';
import { href, tr, type Lang } from '../../../../lib/i18n.ts';
import { alternates, type PageProps } from '../../../../lib/site.ts';

type Props = PageProps<{ id: string }>;

export const dynamicParams = false;
export function generateStaticParams() { return PRODUCTS.map(p => ({ id: p.id })); }

export async function generateMetadata({ params }: Props) {
  const { lang, id } = await params;
  const p = getProduct(id);
  if (!p) return {};
  const description = `${tr(lang as Lang, p.short)}. ${tr(lang as Lang, p.blurb)}`;
  return {
    title: p.name, description, alternates: alternates(lang as Lang, `/products/${p.id}`),
    openGraph: { title: `${p.name} · Soulset Athletics`, description, images: [imgSrc(mainImg(p, defaults(p)))] },
  };
}

export default async function ProductPage({ params }: Props) {
  const { lang: l, id } = await params;
  const lang = l as Lang;
  const p = getProduct(id);
  if (!p) notFound();
  const t = dict(lang).product;
  const extra = PRODUCTS.find(x => x.id !== p.id && !p.pairs.includes(x.id) && x.cat !== p.cat);
  const pairs = [...p.pairs, ...(extra ? [extra.id] : [])].slice(0, 3);

  return (
    <div className="wrap">
      <nav className="crumbs" aria-label={t.breadcrumb}>
        <Link href={href(lang, '/')}>{t.home}</Link><span>/</span>
        <Link href={href(lang, `/shop/${p.cat}`)}>{tr(lang, CATS[p.cat].name)}</Link><span>/</span>
        <span aria-current="page">{p.name}</span>
      </nav>
      <ProductDetail id={p.id} lang={lang}
        title={<div className="pdp-title"><span className="eyebrow">{p.code} · {tr(lang, CATS[p.cat].name)}</span><h1 className="d-l">{p.name}</h1><p className="mono" style={{ color: 'var(--muted)', fontSize: 14 }}>{tr(lang, p.short)}</p></div>}
        body={<>
          <p style={{ color: '#D6D3CC', fontSize: 17 }}>{tr(lang, p.blurb)}</p>
          <div className="stats">{p.stats.map(([b, s]) => <div className="stat" key={b + tr(lang, s)}><b>{b}</b><span>{tr(lang, s)}</span></div>)}</div>
        </>}
        after={<>
          <div className="assure">{t.assure.map(([b, s]) => <div key={b}><b>{b}</b>{s}</div>)}</div>
          <div className="acc">
            {p.nutrition && (
              <details open><summary>{t.inside}</summary><div className="acc-body">
                <div className="nutri">
                  <div className="nutri-head"><span>{t.nutrition}</span><span>{tr(lang, p.nutrition.serving)}</span></div>
                  {p.nutrition.rows.map(r => <div key={tr(lang, r[0])} className={'nutri-row ' + (r[2] || '')}><span>{tr(lang, r[0])}</span><span>{tr(lang, r[1])}</span></div>)}
                </div>
              </div></details>
            )}
            <details open={!p.nutrition}><summary>{t.howToUse}</summary><div className="acc-body">
              <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>{p.use[lang].map(u => <li key={u}>{u}</li>)}</ul>
            </div></details>
            {p.ingredients && (
              <details><summary>{t.ingredients}</summary><div className="acc-body">
                <p>{tr(lang, p.ingredients)}</p>
                {p.warn && <p style={{ color: 'var(--bone)' }}>{tr(lang, p.warn)}</p>}
              </div></details>
            )}
            <details><summary>{t.shipping}</summary><div className="acc-body"><p>{t.shippingText}</p></div></details>
          </div>
        </>}
      />
      <section className="section-tight">
        <div className="sec-head"><div><span className="eyebrow">{t.pairsEyebrow}</span><h2 className="d-m">{t.pairsTitle}</h2></div></div>
        <div className="grid">{pairs.map(pid => <ProductCard key={pid} p={getProduct(pid)!} lang={lang} />)}</div>
      </section>
    </div>
  );
}
