/* Server-side checks on everything the browser sends. The browser validates too, but anything can POST here. */
import { getProduct, unitPrice, variantSku, type Opts } from '../catalog.ts';
import type { Lang } from '../i18n.ts';
import { PROVINCES as PROVINCE_LIST } from '../provinces.ts';

const PROVINCES = new Set(PROVINCE_LIST);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[\d\s().-]{7,20}$/;

type Body = Record<string, unknown>;
type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const text = (v: unknown, max: number) => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
const isObject = (v: unknown): v is Body => !!v && typeof v === 'object' && !Array.isArray(v);
const lang = (v: unknown): Lang => (v === 'es' ? 'es' : 'en');

export type WaitlistPick = { productId: string; sku: string; opts: Opts; qty: number; subscribe: boolean };
export type Signup = { email: string; firstName: string | null; province: string | null; picks: WaitlistPick[]; source: 'home' | 'waitlist_page'; siteLanguage: Lang; browserLanguage: string | null };

/* A cart line as the site stores it ({ id, opts, qty, sub }), checked against the catalogue. Lines that don't match are dropped. */
function parsePick(p: unknown): WaitlistPick | null {
  if (!isObject(p) || typeof p.id !== 'string' || !isObject(p.opts)) return null;
  const product = getProduct(p.id);
  if (!product) return null;
  const opts = Object.fromEntries(product.options.map(op => [op.key, String((p.opts as Body)[op.key] ?? '')]));
  if (unitPrice(product, opts) == null) return null;
  return {
    productId: product.id, sku: variantSku(product, opts), opts,
    qty: Math.max(1, Math.min(99, parseInt(String(p.qty), 10) || 1)),
    subscribe: (p.sub === true || p.subscribe === true) && product.sub,
  };
}

export function parseSignup(body: unknown): Result<Signup> {
  if (!isObject(body)) return { ok: false, error: 'invalid_body' };
  const email = text(body.email, 254).toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'invalid_email' };
  const province = text(body.province, 60);
  /* One pick per variant and purchase type; the last one wins. */
  const picks = new Map<string, WaitlistPick>();
  for (const raw of (Array.isArray(body.picks) ? body.picks : []).slice(0, 30)) {
    const pick = parsePick(raw);
    if (pick) picks.set(`${pick.sku}/${pick.subscribe}`, pick);
  }
  return { ok: true, value: {
    email,
    firstName: text(body.firstName, 60) || null,
    province: PROVINCES.has(province) ? province : null,
    picks: [...picks.values()],
    source: body.source === 'home' ? 'home' : 'waitlist_page',
    siteLanguage: lang(body.siteLanguage),
    browserLanguage: text(body.language, 35) || null,
  } };
}

export type Customer = { firstName: string; lastName: string; phone: string; address: string; city: string; province: string; notes: string | null };

/* Delivery details for an order. */
export function parseCustomer(body: unknown): Result<{ email: string; customer: Customer; siteLanguage: Lang }> {
  if (!isObject(body)) return { ok: false, error: 'invalid_body' };
  const c = isObject(body.customer) ? body.customer : {};
  const email = text(body.email, 254).toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'invalid_email' };
  const customer: Customer = {
    firstName: text(c.firstName, 60), lastName: text(c.lastName, 60), phone: text(c.phone, 20),
    address: text(c.address, 200), city: text(c.city, 80), province: text(c.province, 60), notes: text(c.notes, 500) || null,
  };
  for (const k of ['firstName', 'lastName', 'address', 'city'] as const) if (!customer[k]) return { ok: false, error: 'missing_' + k };
  if (!PHONE_RE.test(customer.phone)) return { ok: false, error: 'invalid_phone' };
  if (!PROVINCES.has(customer.province)) return { ok: false, error: 'invalid_province' };
  return { ok: true, value: { email, customer, siteLanguage: lang(body.siteLanguage) } };
}
