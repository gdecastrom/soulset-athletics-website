import { dict } from '../../../lib/dict.ts';
import type { Lang } from '../../../lib/i18n.ts';
import { alternates, type PageProps } from '../../../lib/site.ts';

export async function generateMetadata({ params }: PageProps) {
  const lang = (await params).lang as Lang;
  return { title: dict(lang).help.title, alternates: alternates(lang, '/help') };
}

export default async function Help({ params }: PageProps) {
  const lang = (await params).lang as Lang;
  const h = dict(lang).help;
  return (
    <div className="wrap">
      <div className="shop-top"><span className="eyebrow">{h.eyebrow}</span><h1 className="d-xl">{h.title}</h1></div>
      <div className="acc section-tight" style={{ maxWidth: 820, border: 0 }}>
        {h.faq.map(([q, a], i) => <details key={q} open={i < 2}><summary>{q}</summary><div className="acc-body"><p>{a}</p></div></details>)}
      </div>
    </div>
  );
}
