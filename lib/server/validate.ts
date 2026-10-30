/* Server-side checks on everything the browser sends. The browser validates too, but anything can POST here. */
import { getProduct } from '../catalog.ts';
import type { Lang } from '../i18n.ts';
import { PROVINCES as PROVINCE_LIST } from '../provinces.ts';

const PROVINCES = new Set(PROVINCE_LIST);
const SOURCES = new Set(['home', 'waitlist-page']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[\d\s().-]{7,20}$/;

type Body = Record<string, unknown>;
type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const text = (v: unknown, max: number) => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
const isObject = (v: unknown): v is Body => !!v && typeof v === 'object' && !Array.isArray(v);
const lang = (v: unknown): Lang => (v === 'es' ? 'es' : 'en');

export type WaitlistPick = { id: string; name: string; options: string; qty: number; subscribe: boolean };
export type Signup = { email: string; firstName: string; province: string; picks: WaitlistPick[]; source: string; siteLanguage: Lang; browserLanguage: string };

export function parseSignup(body: unknown): Result<Signup> {
  if (!isObject(body)) return { ok: false, error: 'invalid_body' };
  const email = text(body.email, 254).toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'invalid_email' };
  const province = text(body.province, 60);
  const picks = (Array.isArray(body.picks) ? body.picks : []).slice(0, 30)
    .filter((p): p is Body => isObject(p) && typeof p.id === 'string' && !!getProduct(p.id))
    .map(p => ({
      id: String(p.id),
      name: getProduct(String(p.id))!.name,
      options: text(p.options, 200),
      qty: Math.max(1, Math.min(99, parseInt(String(p.qty), 10) || 1)),
      subscribe: p.subscribe === true,
    }));
  return { ok: true, value: {
    email,
    firstName: text(body.firstName, 60),
    province: PROVINCES.has(province) ? province : '',
    picks,
    source: SOURCES.has(String(body.source)) ? String(body.source) : 'website',
    siteLanguage: lang(body.siteLanguage),
    browserLanguage: text(body.language, 35),
  } };
}

export type Customer = { firstName: string; lastName: string; phone: string; address: string; city: string; province: string; notes: string };

/* Delivery details for an order. */
export function parseCustomer(body: unknown): Result<{ email: string; customer: Customer; siteLanguage: Lang }> {
  if (!isObject(body)) return { ok: false, error: 'invalid_body' };
  const c = isObject(body.customer) ? body.customer : {};
  const email = text(body.email, 254).toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'invalid_email' };
  const customer: Customer = {
    firstName: text(c.firstName, 60), lastName: text(c.lastName, 60), phone: text(c.phone, 20),
    address: text(c.address, 200), city: text(c.city, 80), province: text(c.province, 60), notes: text(c.notes, 500),
  };
  for (const k of ['firstName', 'lastName', 'address', 'city'] as const) if (!customer[k]) return { ok: false, error: 'missing_' + k };
  if (!PHONE_RE.test(customer.phone)) return { ok: false, error: 'invalid_phone' };
  if (!PROVINCES.has(customer.province)) return { ok: false, error: 'invalid_province' };
  return { ok: true, value: { email, customer, siteLanguage: lang(body.siteLanguage) } };
}
