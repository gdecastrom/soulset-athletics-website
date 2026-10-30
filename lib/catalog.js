/* Server-side prices. Checkout totals are always computed from this file, never from what the browser sends.
   Mirrors the P arrays in assets/js/app.js and app.es.js; test/catalog.test.js fails if they drift apart.
   Option values are [English, Spanish, price?]: the cart stores option names in the visitor's language. */

export const CURRENCY = 'USD';
export const SUB_OFF = 0.15;        // Subscribe & save
export const FREE_SHIP_OVER = 75;   // free standard shipping from this subtotal

export const CATALOG = {
  'carb-gel-30': { name: 'Carb Gel 30', sub: true, options: {
    flavour: [['Neutral', 'Neutro'], ['Citrus', 'Cítrico'], ['Salted Berry', 'Frutos rojos con sal']],
    pack: [['Box of 12', 'Caja de 12', 30], ['Box of 24', 'Caja de 24', 56]] } },
  'carb-gel-30-caffeine': { name: 'Carb Gel 30 Caffeine', sub: true, options: {
    caffeine: [['Level 1 · 50 mg · Citrus', 'Nivel 1 · 50 mg · Cítrico'], ['Level 2 · 100 mg · Cola', 'Nivel 2 · 100 mg · Cola']],
    pack: [['Box of 12', 'Caja de 12', 34], ['Box of 24', 'Caja de 24', 64]] } },
  'fuel-mix-60': { name: 'Fuel Mix 60', sub: true, options: {
    flavour: [['Neutral', 'Neutro'], ['Citrus', 'Cítrico']],
    size: [['Tub · 15 servings', 'Pote · 15 porciones', 42], ['Tub · 30 servings', 'Pote · 30 porciones', 76]] } },
  'sodium': { name: 'Sodium', sub: true, options: {
    strength: [['500 mg', '500 mg', 28], ['1000 mg', '1000 mg', 28], ['1500 mg', '1500 mg', 28]] } },
  'creatine': { name: 'Creatine Monohydrate', sub: true, options: {
    size: [['300 g · 60 servings', '300 g · 60 porciones', 32], ['600 g · 120 servings', '600 g · 120 porciones', 55]] } },
  'pre-workout': { name: 'Pre-Workout', sub: true, basePrice: 45, options: {
    flavour: [['Sour Apple', 'Manzana ácida'], ['Blood Orange', 'Naranja sanguina'], ['Mango', 'Mango']] } },
  'race-day-stack': { name: 'Race Day Stack', sub: false, basePrice: 85, options: {} },
  'strength-stack': { name: 'Strength Stack', sub: false, basePrice: 68, options: {} },
};

const cents = n => Math.round(n * 100);

/* Prices one cart line ({ id, opts, qty, sub } as stored by the site). Returns null if anything doesn't match the catalogue. */
export function priceLine(line) {
  const p = CATALOG[line?.id];
  if (!p || !line.opts || typeof line.opts !== 'object') return null;
  const qty = Number(line.qty);
  if (!Number.isInteger(qty) || qty < 1 || qty > 99) return null;
  const keys = Object.keys(p.options);
  if (Object.keys(line.opts).length !== keys.length) return null;
  let unit = p.basePrice ?? null;
  const optionLabels = [];
  for (const key of keys) {
    const v = p.options[key].find(([en, es]) => line.opts[key] === en || line.opts[key] === es);
    if (!v) return null;
    if (v[2] != null) unit = v[2];
    optionLabels.push(v[0]);
  }
  if (unit == null) return null;
  const subscribe = line.sub === true && p.sub;
  const unitCents = subscribe ? Math.round(cents(unit) * (1 - SUB_OFF)) : cents(unit);
  return { productId: line.id, name: p.name, options: optionLabels.join(' · '), qty, subscribe, unitCents, totalCents: unitCents * qty };
}

/* Prices a whole cart. shippingCents is the flat standard rate below the free-shipping threshold. */
export function priceCart(lines, { shippingCents }) {
  if (!Array.isArray(lines) || !lines.length || lines.length > 30) return null;
  const items = lines.map(priceLine);
  if (items.some(i => !i)) return null;
  const subtotalCents = items.reduce((a, i) => a + i.totalCents, 0);
  const shipping = subtotalCents >= cents(FREE_SHIP_OVER) ? 0 : shippingCents;
  return { items, subtotalCents, shippingCents: shipping, totalCents: subtotalCents + shipping, currency: CURRENCY };
}
