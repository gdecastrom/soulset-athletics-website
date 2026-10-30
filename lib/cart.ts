import { getProduct, optionsLabel, type CartLine } from './catalog.ts';
import { dict } from './dict.ts';
import type { Lang } from './i18n.ts';

/* "Citrus · Box of 12 · Subscribe · every 4 weeks" */
export function lineSummary(l: CartLine, lang: Lang) {
  const parts = [optionsLabel(getProduct(l.id)!, l.opts, lang)].filter(Boolean);
  if (l.sub) parts.push(dict(lang).cart.subscription);
  return parts.join(' · ');
}
