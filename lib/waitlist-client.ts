/* Browser side of the waitlist: posts to /api/waitlist and remembers the sign-up for the confirmation page. */
import { getProduct, type CartLine } from './catalog.ts';
import type { Lang } from './i18n.ts';
import { lineSummary } from './cart.ts';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const KEY = 'ss_waitlist';

export type SavedSignup = { email: string; firstName: string; province: string; at: string };

export function savedSignup(): SavedSignup | null {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
}

export class WaitlistError extends Error {
  status: number;
  constructor(status: number) { super('Waitlist request failed with ' + status); this.status = status; }
}

export async function joinWaitlist(lang: Lang, lines: CartLine[], data: { email: string; firstName?: string; province?: string; source: 'home' | 'waitlist-page' }) {
  const picks = lines.map(l => ({ id: l.id, name: getProduct(l.id)!.name, options: lineSummary(l, lang), qty: l.qty, subscribe: l.sub }));
  const payload = {
    email: data.email, firstName: data.firstName || '', province: data.province || '',
    picks, picksSummary: picks.map(p => `${p.qty} × ${p.name} (${p.options})`).join('; '),
    source: data.source, language: navigator.language || '', siteLanguage: lang, submittedAt: new Date().toISOString(),
  };
  const res = await fetch('/api/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) });
  if (!res.ok) throw new WaitlistError(res.status);
  try { localStorage.setItem(KEY, JSON.stringify({ email: payload.email, firstName: payload.firstName, province: payload.province, at: payload.submittedAt })); } catch { /* storage blocked */ }
}
