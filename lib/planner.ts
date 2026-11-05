/* Fuel planner maths: carbs, sodium and fluid per hour, and the products that cover them. */
import type { Opts } from './catalog.ts';

export type Intensity = 'easy' | 'steady' | 'race';
export type Sweat = 'light' | 'average' | 'salty';
export type PlanItem = { id: string; opts: Opts; count: number; kind: 'gel' | 'cafGel' | 'mix' | 'sodium' };

const STRENGTH = { light: 500, average: 1000, salty: 1500 } as const;

export function computePlan(d: number, int: Intensity, sweat: Sweat, heat: boolean, caf: boolean) {
  let carbs = d < 1 ? 30 : d < 1.5 ? 45 : d < 2.5 ? 60 : d < 4 ? 75 : 90;
  if (d >= 1) carbs = Math.max(30, Math.min(90, carbs + (int === 'easy' ? -15 : int === 'race' ? 10 : 0)));
  const sodium = { light: 400, average: 700, salty: 1000 }[sweat] + (heat ? 300 : 0);
  const fluid = 500 + (heat ? 250 : 0) + (int === 'race' ? 50 : 0);
  const useMix = carbs >= 60 && d >= 1.5;
  const mix = useMix ? Math.ceil(d) : 0;
  const gels = Math.max(d < 1 ? 1 : 0, Math.ceil(((carbs - (useMix ? 60 : 0)) * d) / 30));
  const cafGels = caf && d >= 1.5 ? Math.min(Math.floor(gels / 2), 6) : 0;
  const plainGels = gels - cafGels;
  const strength = STRENGTH[sweat];
  const naServ = Math.max(0, Math.ceil((sodium * d - (gels * 200 + mix * 500)) / strength));
  const every = gels ? Math.max(15, Math.round((d * 60) / gels / 5) * 5) : 0;

  const items: PlanItem[] = [];
  if (plainGels) items.push({ id: 'carb-gel-30', opts: { flavour: 'citrus', pack: plainGels > 12 ? 'box-of-24' : 'box-of-12' }, count: plainGels, kind: 'gel' });
  if (cafGels) items.push({ id: 'carb-gel-30-caffeine', opts: { caffeine: 'level-1-50-mg-citrus', pack: 'box-of-12' }, count: cafGels, kind: 'cafGel' });
  if (mix) items.push({ id: 'fuel-mix-60', opts: { flavour: 'citrus', size: 'tub-15-servings' }, count: mix, kind: 'mix' });
  if (naServ) items.push({ id: 'sodium', opts: { strength: `${strength}-mg` }, count: naServ, kind: 'sodium' });
  return { carbs, sodium, fluid, gels, cafGels, mix, every, strength, items };
}
