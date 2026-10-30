import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { CineMedia } from '../../components/CineMedia.tsx';
import { FuelPlanner } from '../../components/FuelPlanner.tsx';
import { ProductCard } from '../../components/ProductCard.tsx';
import { NewsForm } from '../../components/WaitlistForms.tsx';
import { CATS, getProduct, imgSrc, PRODUCTS } from '../../lib/catalog.ts';
import { dict } from '../../lib/dict.ts';
import { href, tr, type Lang } from '../../lib/i18n.ts';
import { alternates, type PageProps } from '../../lib/site.ts';

export async function generateMetadata({ params }: PageProps) {
  const lang = (await params).lang as Lang;
  return { alternates: alternates(lang, '/') };
}

const FEATURED = ['carb-gel-30', 'fuel-mix-60', 'sodium', 'carb-gel-30-caffeine', 'pre-workout', 'creatine'];
const GOALS = [['fuel', '01', 'gel-citrus'], ['hydrate', '02', 'na-1000'], ['build', '03', 'cre-300'], ['ignite', '04', 'pre-mango']] as const;

export default async function Home({ params }: PageProps) {
  const lang = (await params).lang as Lang;
  const h = dict(lang).home;
  const l = (path: string) => href(lang, path);
  const ticker = (k: string) => [...h.ticker.map((w, i) => <span key={`${k}${i}`}>{w}</span>), <span key={`${k}r`}>{h.tickerRule[0]} <i>&gt;</i> {h.tickerRule[1]}</span>]
    .flatMap((el, i) => [el, <span key={`${k}g${i}`} className="gt">›</span>]);

  return (
    <>
      <section className="cine cine-color cine-hero" style={{ '--pos': '50% 25%' } as CSSProperties}>
        <CineMedia still="run-track" priority />
        <div className="wrap cine-in">
          <span className="eyebrow">{h.eyebrow}</span>
          <h1 className="d-xxl">{h.h1a}{lang === 'es' ? ' ' : ' '}<span className="gt">&gt;</span> {h.h1b}</h1>
          <p className="lead">{h.lead}</p>
          <div className="hero-cta">
            <Link className="btn btn-primary btn-l" href={l('/shop')}>{h.shop} <span className="edge">›</span></Link>
            <Link className="btn btn-secondary btn-l" href={l('/manifesto')}>{h.readManifesto}</Link>
          </div>
          <div className="hero-facts">{h.facts.map(f => <span key={f}>{f}</span>)}</div>
        </div>
      </section>
      <div className="ticker" aria-hidden><div className="ticker-track">{ticker('a')}{ticker('b')}</div></div>

      <section className="band"><div className="section wrap">
        <div className="sec-head"><div><span className="eyebrow">{h.goalEyebrow}</span><h2 className="d-l">{h.goalTitle}</h2></div>
          <Link className="btn-ghost btn" href={l('/shop')}>{h.shopAll} <span className="edge">›</span></Link></div>
        <div className="cats">
          {GOALS.map(([k, num, img]) => {
            const name = tr(lang, CATS[k].name);
            return (
              <Link key={k} className="cat" href={l(`/shop/${k}`)}>
                <Image className="cat-img" src={imgSrc(img)} alt="" width={900} height={900} sizes="200px" />
                <span className="num">{num}</span>
                <div style={{ display: 'grid', gap: 8 }}><span className="d-m">{name}</span><p>{h.cats[k]}</p></div>
                <span className="go">{h.shopCat(name)} ›</span>
              </Link>
            );
          })}
        </div>
      </div></section>

      <section className="section wrap">
        <div className="sec-head"><div><span className="eyebrow">{h.lineupEyebrow}</span><h2 className="d-l">{h.lineupTitle}</h2></div>
          <Link className="btn-ghost btn" href={l('/shop')}>{h.viewAll(PRODUCTS.length)} <span className="edge">›</span></Link></div>
        <div className="grid">{FEATURED.map(id => <ProductCard key={id} p={getProduct(id)!} lang={lang} />)}</div>
      </section>

      <section className="band"><div className="wrap section" style={{ display: 'grid', gap: 28 }}>
        <span className="eyebrow">{h.bandEyebrow}</span>
        <h2 className="d-xl" style={{ maxWidth: '14ch' }}>{h.bandTitle}</h2>
        <p className="lead" style={{ maxWidth: '60ch' }}>{h.bandText}</p>
        <div><Link className="btn btn-primary btn-l" href={l('/manifesto')} style={{ background: 'var(--void)', color: 'var(--bone)' }}>{h.readManifesto} <span className="edge">›</span></Link></div>
      </div></section>

      <section className="section wrap">
        <div className="sec-head"><div><span className="eyebrow">{h.plannerEyebrow}</span><h2 className="d-l">{h.plannerTitle}</h2><p className="lead">{h.plannerLead}</p></div></div>
        <FuelPlanner lang={lang} />
      </section>

      <section className="band"><div className="section wrap">
        <div className="sec-head"><div><span className="eyebrow">{h.stackEyebrow}</span><h2 className="d-l">{h.stackTitle}</h2></div></div>
        <div className="loop">{h.stack.map(([k, n, d]) => <div key={k}><span className="mono">{k}</span><span className="d-s">{n}</span><p>{d}</p></div>)}</div>
      </div></section>

      <section className="cine cine-bw" style={{ '--pos': '60% 30%' } as CSSProperties}>
        <CineMedia still="gym-barbell" />
        <div className="wrap cine-in" style={{ '--h': 'clamp(440px,64vh,640px)' } as CSSProperties}><div className="news">
          <div style={{ display: 'grid', gap: 12 }}><span className="eyebrow">{h.newsEyebrow}</span><h2 className="d-l">{h.newsTitle}</h2><p className="lead">{h.newsLead}</p></div>
          <NewsForm lang={lang} />
        </div></div>
      </section>
    </>
  );
}
