/* Catalogue types and price logic, shared by the pages and the server. Data lives in catalog-data.ts. */
import { CATS, PRODUCTS } from './catalog-data.ts';
import { tr, type Lang, type Text } from './i18n.ts';

export type Category = 'fuel' | 'hydrate' | 'build' | 'ignite' | 'stacks';
export type OptionValue = { id: string; label: Text; img?: string; price?: number; level?: number; note?: Text; hint?: Text };
export type ProductOption = { key: string; label: Text; values: OptionValue[] };
export type Product = {
  id: string; code: string; cat: Category; name: string; tag: Text; level: number;
  short: Text; blurb: Text; stats: [string, Text][];
  options: ProductOption[]; gallery: string[];
  nutrition?: { serving: Text; rows: ([Text, Text] | [Text, Text, 'key' | 'sub'])[] };
  use: { en: string[]; es: string[] }; ingredients?: Text; warn?: Text; contents?: { en: string[]; es: string[] };
  pairs: string[]; sub: boolean; basePrice?: number; compare?: number; main?: string;
};
/* A choice of option values, by option key → value id, e.g. { flavour: 'citrus', pack: 'box-of-12' }. */
export type Opts = Record<string, string>;
export type CartLine = { id: string; opts: Opts; qty: number; sub: boolean };

export { CATS, PRODUCTS };
export const CATEGORIES = Object.keys(CATS) as Category[];
export const CURRENCY = 'USD';
export const SUB_OFF = 0.15;        // Subscribe & save
export const FREE_SHIP_OVER = 75;   // free standard shipping from this subtotal

const byId = new Map(PRODUCTS.map(p => [p.id, p]));
export const getProduct = (id: string) => byId.get(id);

export const imgSrc = (name: string) => `/img/${name}.webp`;

export function defaults(p: Product): Opts {
  return Object.fromEntries(p.options.map(op => [op.key, op.values[0].id]));
}
export function optionValue(p: Product, opts: Opts, key: string) {
  return p.options.find(o => o.key === key)?.values.find(v => v.id === opts[key]);
}
/* Unit price in USD for a choice of options, or null if the choice isn't valid for this product. */
export function unitPrice(p: Product, opts: Opts): number | null {
  let price = p.basePrice ?? null;
  for (const op of p.options) {
    const v = op.values.find(x => x.id === opts[op.key]);
    if (!v) return null;
    if (v.price != null) price = v.price;
  }
  return price;
}
export function fromPrice(p: Product) {
  if (p.basePrice) return p.basePrice;
  return Math.min(...p.options.flatMap(op => op.values.map(v => v.price ?? Infinity)));
}
export function hasPriceRange(p: Product) {
  return new Set(p.options.flatMap(op => op.values.map(v => v.price)).filter(x => x != null)).size > 1;
}
export function mainImg(p: Product, opts: Opts) {
  for (const op of p.options) { const v = op.values.find(x => x.id === opts[op.key]); if (v?.img) return v.img; }
  return p.main || p.options[0]?.values[0].img || '';
}
export function levelOf(p: Product, opts: Opts) {
  for (const op of p.options) { const v = op.values.find(x => x.id === opts[op.key]); if (v?.level != null) return v.level; }
  return p.level || 0;
}
export function optionsLabel(p: Product, opts: Opts, lang: Lang) {
  return p.options.map(op => { const v = op.values.find(x => x.id === opts[op.key]); return v ? tr(lang, v.label) : ''; }).filter(Boolean).join(' · ');
}
export const subPrice = (unit: number) => Math.round(unit * (1 - SUB_OFF) * 100) / 100;

/* Stock-keeping unit of a choice of options: product code plus the option value ids, e.g. GEL-030-CITRUS-BOX-OF-12.
   The database identifies variants by it (variant.sku), so it must never change for an existing choice. */
export function variantSku(p: Product, opts: Opts) {
  return [p.code, ...p.options.map(op => opts[op.key])].join('-').toUpperCase();
}

/* Every variant of a product: one value for each option. */
export function allVariants(p: Product): Opts[] {
  return p.options.reduce<Opts[]>((acc, op) => acc.flatMap(o => op.values.map(v => ({ ...o, [op.key]: v.id }))), [{}]);
}

/* ------------------------------------------------------------ server-side pricing (checkout) */
export type PricedLine = { productId: string; sku: string; name: string; options: string; qty: number; subscribe: boolean; listCents: number; unitCents: number; totalCents: number };

/* Prices one cart line exactly as the site stores it. Returns null if anything doesn't match the catalogue. */
export function priceLine(line: unknown): PricedLine | null {
  if (!line || typeof line !== 'object') return null;
  const l = line as Partial<CartLine>;
  const p = typeof l.id === 'string' ? byId.get(l.id) : undefined;
  if (!p || !l.opts || typeof l.opts !== 'object') return null;
  const qty = Number(l.qty);
  if (!Number.isInteger(qty) || qty < 1 || qty > 99) return null;
  if (Object.keys(l.opts).length !== p.options.length) return null;
  const unit = unitPrice(p, l.opts);
  if (unit == null) return null;
  const subscribe = l.sub === true && p.sub;
  const listCents = Math.round(unit * 100);
  const unitCents = subscribe ? Math.round(listCents * (1 - SUB_OFF)) : listCents;
  return { productId: p.id, sku: variantSku(p, l.opts), name: p.name, options: optionsLabel(p, l.opts, 'en'), qty, subscribe, listCents, unitCents, totalCents: unitCents * qty };
}

export function priceCart(lines: unknown, { shippingCents }: { shippingCents: number }) {
  if (!Array.isArray(lines) || !lines.length || lines.length > 30) return null;
  const items = lines.map(priceLine);
  if (items.some(i => !i)) return null;
  const priced = items as PricedLine[];
  const subtotalCents = priced.reduce((a, i) => a + i.totalCents, 0);
  const shipping = subtotalCents >= FREE_SHIP_OVER * 100 ? 0 : shippingCents;
  return { items: priced, subtotalCents, shippingCents: shipping, totalCents: subtotalCents + shipping, currency: CURRENCY };
}
