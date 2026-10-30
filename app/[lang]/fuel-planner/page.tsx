import { FuelPlanner } from '../../../components/FuelPlanner.tsx';
import { dict } from '../../../lib/dict.ts';
import type { Lang } from '../../../lib/i18n.ts';
import { alternates, type PageProps } from '../../../lib/site.ts';

export async function generateMetadata({ params }: PageProps) {
  const lang = (await params).lang as Lang;
  const t = dict(lang).planner;
  return { title: t.pageEyebrow, description: t.pageLead, alternates: alternates(lang, '/fuel-planner') };
}

export default async function PlannerPage({ params }: PageProps) {
  const lang = (await params).lang as Lang;
  const t = dict(lang).planner;
  return (
    <div className="wrap">
      <div className="shop-top"><span className="eyebrow">{t.pageEyebrow}</span><h1 className="d-xl">{t.pageTitle}</h1><p className="lead">{t.pageLead}</p></div>
      <div className="section-tight"><FuelPlanner lang={lang} /></div>
      <div className="section-tight" style={{ paddingTop: 0, display: 'grid', gap: 20, maxWidth: '70ch', color: 'var(--muted)' }}>
        <h2 className="d-m" style={{ color: 'var(--bone)' }}>{t.howTitle}</h2>
        {t.how.map(([b, text]) => <p key={b}><b style={{ color: 'var(--bone)' }}>{b}</b> {text}</p>)}
      </div>
    </div>
  );
}
