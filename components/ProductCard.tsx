import Image from 'next/image';
import Link from 'next/link';
import { CATS, defaults, fromPrice, hasPriceRange, imgSrc, levelOf, mainImg, type Product } from '../lib/catalog.ts';
import { dict } from '../lib/dict.ts';
import { href, money, tr, type Lang } from '../lib/i18n.ts';
import { AddButton } from './AddButton.tsx';
import { Levels } from './Levels.tsx';

export function ProductCard({ p, lang }: { p: Product; lang: Lang }) {
  const c = dict(lang).card;
  const o = defaults(p);
  const lvl = levelOf(p, o);
  const url = href(lang, `/products/${p.id}`);
  return (
    <article className="card">
      <Link className="card-media" href={url} tabIndex={-1} aria-hidden>
        <Image className="pack" src={imgSrc(mainImg(p, o))} alt="" width={900} height={900} sizes="(max-width: 560px) 92vw, (max-width: 1080px) 46vw, 400px" />
      </Link>
      <div className="card-tags"><span className={'tag' + (p.cat === 'stacks' ? ' tag-ignite' : '')}>{tr(lang, p.tag)}</span></div>
      <div className="card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
          <span className="card-code">{p.code} · {tr(lang, CATS[p.cat].name).toUpperCase()}</span>
          {lvl > 0 && <span className="lv-label"><Levels n={lvl} /></span>}
        </div>
        <h3 className="card-name"><Link href={url}>{p.name}</Link></h3>
        <p className="card-spec">{tr(lang, p.short)}</p>
        <div className="card-foot">
          <span className="price">{hasPriceRange(p) ? c.from : ''}{money(fromPrice(p))}{p.compare ? <s>{money(p.compare)}</s> : null}</span>
          <AddButton id={p.id} label={c.addLabel(p.name)} text={c.add} />
        </div>
      </div>
    </article>
  );
}
