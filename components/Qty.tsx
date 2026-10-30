'use client';
import { dict } from '../lib/dict.ts';
import type { Lang } from '../lib/i18n.ts';

/* Quantity stepper, 1–99. */
export function Qty({ lang, value, onChange, small = false, min = 1, id }: { lang: Lang; value: number; onChange: (n: number) => void; small?: boolean; min?: number; id?: string }) {
  const c = dict(lang).cart;
  return (
    <div className={'qty' + (small ? ' qty-s' : '')}>
      <button type="button" aria-label={c.decrease} onClick={() => onChange(Math.max(min, value - 1))}>−</button>
      <input id={id} type="number" min={1} max={99} inputMode="numeric" aria-label={c.quantity} value={value}
        onChange={e => onChange(Math.max(1, Math.min(99, parseInt(e.target.value, 10) || 1)))} />
      <button type="button" aria-label={c.increase} onClick={() => onChange(Math.min(99, value + 1))}>+</button>
    </div>
  );
}
