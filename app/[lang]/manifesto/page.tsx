import Link from 'next/link';
import { Mark } from '../../../components/Logos.tsx';
import { dict } from '../../../lib/dict.ts';
import { href, type Lang } from '../../../lib/i18n.ts';
import { alternates, type PageProps } from '../../../lib/site.ts';

export async function generateMetadata({ params }: PageProps) {
  const lang = (await params).lang as Lang;
  const m = dict(lang).manifesto;
  return { title: m.eyebrow, description: m.def, alternates: alternates(lang, '/manifesto') };
}

export default async function Manifesto({ params }: PageProps) {
  const lang = (await params).lang as Lang;
  const m = dict(lang).manifesto;
  const bone = { color: 'var(--bone)' };
  return (
    <>
      <div className="wrap">
        <section className="mf-hero">
          <span className="eyebrow">{m.eyebrow}</span>
          <div className="def"><div className="def-word">Soul<br />set</div>
            <div className="def-body"><span className="pos">{m.pos}</span>
              <p style={{ fontSize: 22, color: 'var(--bone)' }}>{m.def}</p>
              <blockquote>{m.quote}</blockquote>
              <p style={{ color: 'var(--muted)' }}>{m.nameNote[0]}<b style={bone}>{m.nameNote[1]}</b>{m.nameNote[2]}<b style={bone}>{m.nameNote[3]}</b>{m.nameNote[4]}</p>
            </div>
          </div>
        </section>
        <section className="section statement">
          <h2 className="d-xl">{m.statementTitle}</h2>
          <div className="copy">{m.statement.map(p => <p key={p}>{p}</p>)}<p><b style={bone}>{m.statementBold}</b></p></div>
        </section>
      </div>

      <section className="band"><div className="wrap section" style={{ display: 'grid', gap: 20, justifyItems: 'start' }}>
        <span className="eyebrow">{m.ruleEyebrow}</span>
        <h2 className="d-xxl">{dict(lang).home.h1a}{lang === 'es' ? ' ' : ' '}<span className="gt">&gt;</span> {dict(lang).home.h1b}</h2>
        <p className="lead" style={{ color: '#3A3936' }}>{m.ruleText}</p>
      </div></section>

      <div className="wrap">
        <section className="section" style={{ display: 'grid', gap: 32 }}>
          <div className="sec-head" style={{ margin: 0 }}><div><span className="eyebrow">{m.loopEyebrow}</span><h2 className="d-l">{m.loopTitle}</h2><p className="lead">{m.loopLead}</p></div></div>
          <div className="loop">{m.loop.map(([t, d], i) => <div key={t + i}><span className="mono">0{i + 1}</span><span className="d-s">{t}</span><p>{d}</p></div>)}</div>
        </section>
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="sec-head"><div><span className="eyebrow">{m.pillarsEyebrow}</span><h2 className="d-l">{m.pillarsTitle}</h2></div></div>
          <div className="pillars">{m.pillars.map(([t, d], i) => <div className="pillar" key={t}><span className="mono">0{i + 1}</span><span className="d-s" style={{ fontSize: 30 }}>{t}</span><p>{d}</p></div>)}</div>
        </section>
        <section className="section mark-story" style={{ paddingTop: 0 }}>
          <div><Mark label="Soulset SA mark" /></div>
          <div style={{ display: 'grid', gap: 24 }}>
            <div style={{ display: 'grid', gap: 12 }}><span className="eyebrow">{m.markEyebrow}</span><h2 className="d-l">{m.markTitle}</h2><p className="lead">{m.markLead}</p></div>
            <ol>{m.mark.map(([b, p], i) => <li key={b}><span className="mono">0{i + 1}</span><div><b>{b}</b><p>{p}</p></div></li>)}</ol>
          </div>
        </section>
        <section className="section" style={{ display: 'grid', gap: 28, justifyItems: 'start' }}>
          <h2 className="d-xxl">{m.endTitle}</h2>
          <p className="lead">{m.endLead}</p>
          <div className="hero-cta">
            <Link className="btn btn-primary btn-l" href={href(lang, '/shop')}>{m.shop} <span className="edge">›</span></Link>
            <Link className="btn btn-secondary btn-l" href={href(lang, '/fuel-planner')}>{m.plan}</Link>
          </div>
        </section>
      </div>
    </>
  );
}
