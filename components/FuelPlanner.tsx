'use client';
import { useState } from 'react';
import { getProduct, mainImg, unitPrice } from '../lib/catalog.ts';
import { dict } from '../lib/dict.ts';
import { money, type Lang } from '../lib/i18n.ts';
import { computePlan, type Intensity, type Sweat } from '../lib/planner.ts';
import { useCart } from './CartProvider.tsx';
import { Thumb } from './CartDrawer.tsx';

const INTENSITIES: Intensity[] = ['easy', 'steady', 'race'];
const SWEATS: Sweat[] = ['light', 'average', 'salty'];

export function FuelPlanner({ lang }: { lang: Lang }) {
  const t = dict(lang).planner;
  const { add, open } = useCart();
  const [d, setD] = useState(3);
  const [int, setInt] = useState<Intensity>('steady');
  const [sweat, setSweat] = useState<Sweat>('average');
  const [heat, setHeat] = useState(true);
  const [caf, setCaf] = useState(false);
  const plan = computePlan(d, int, sweat, heat, caf);

  const describe = (i: (typeof plan.items)[number]) =>
    i.kind === 'gel' ? t.items.gel(i.count, plan.every) : i.kind === 'cafGel' ? t.items.cafGel(i.count)
      : i.kind === 'mix' ? t.items.mix(i.count) : t.items.sodium(i.count, plan.strength);

  return (
    <form className="planner" onSubmit={e => e.preventDefault()}>
      <div>
        <div className="field">
          <label htmlFor="plDur">{t.length} <output htmlFor="plDur">{t.hours(d)}</output></label>
          <input type="range" id="plDur" min={0.5} max={8} step={0.5} value={d} onChange={e => setD(parseFloat(e.target.value))} />
        </div>
        <div className="field" role="radiogroup" aria-label={t.intensity}>
          <span className="lbl">{t.intensity}</span>
          <div className="seg">{INTENSITIES.map(v => <label key={v}><input type="radio" name="plInt" value={v} checked={int === v} onChange={() => setInt(v)} /><span>{t.intensities[v]}</span></label>)}</div>
        </div>
        <div className="field" role="radiogroup" aria-label={t.sweat}>
          <span className="lbl">{t.sweat}</span>
          <div className="seg">{SWEATS.map(v => <label key={v}><input type="radio" name="plSweat" value={v} checked={sweat === v} onChange={() => setSweat(v)} /><span>{t.sweats[v]}</span></label>)}</div>
          <p style={{ fontSize: 13, color: 'var(--dim)' }}>{t.sweatHint}</p>
        </div>
        <label className="check"><input type="checkbox" checked={heat} onChange={e => setHeat(e.target.checked)} /> {t.heat}</label>
        <label className="check"><input type="checkbox" checked={caf} onChange={e => setCaf(e.target.checked)} /> {t.caffeine}</label>
      </div>
      <div className="plan-out" aria-live="polite">
        <span className="eyebrow">{t.yourPlan} · {t.hours(d)} · {t.intensities[int].toLowerCase()}</span>
        <div className="plan-nums">
          <div><b>{plan.carbs}</b><span>{t.carbs}</span></div>
          <div><b>{plan.sodium}</b><span>{t.sodium}</span></div>
          <div><b>{plan.fluid}</b><span>{t.fluid}</span></div>
        </div>
        {plan.gels > 0 && (
          <div style={{ display: 'grid', gap: 8 }}>
            <div className="plan-tl" aria-hidden>{Array.from({ length: plan.gels }, (_, i) => <i key={i} className={i >= plan.gels - plan.cafGels ? 'c' : 'g'} />)}</div>
            <div className="plan-legend">
              <span style={{ '--k': 'var(--bone)' } as React.CSSProperties}>{t.gelLegend}</span>
              {plan.cafGels > 0 && <span style={{ '--k': 'var(--ignite)' } as React.CSSProperties}>{t.cafLegend}</span>}
              {plan.mix > 0 && <span style={{ '--k': 'var(--raised-2)' } as React.CSSProperties}>{t.mixLegend(plan.mix)}</span>}
            </div>
          </div>
        )}
        <div className="plan-list">
          {plan.items.length ? plan.items.map(i => {
            const p = getProduct(i.id)!;
            const [title, sub] = describe(i);
            return (
              <div className="plan-item" key={i.kind}>
                <Thumb img={mainImg(p, i.opts)} size={56} />
                <div><b>{title}</b><small>{sub}</small></div>
                <span className="mono" style={{ fontSize: 13, color: 'var(--muted)' }}>{money(unitPrice(p, i.opts)!)}</span>
              </div>
            );
          }) : <p style={{ color: 'var(--muted)' }}>{t.nothing}</p>}
        </div>
        {plan.items.length > 0 && (
          <button className="btn btn-primary btn-l btn-block" type="button" onClick={() => { plan.items.forEach(i => add(i.id, i.opts, 1, false, false)); open(); }}>{t.addPlan}</button>
        )}
        <p className="plan-note">{t.note}</p>
      </div>
    </form>
  );
}
