/* Catalogue, pricing, planner and copy checks. No database needed. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { CATEGORIES, CATS, defaults, mainImg, PRODUCTS, priceCart, priceLine, unitPrice } from '../lib/catalog.ts';
import { DICT } from '../lib/dict.ts';
import { href } from '../lib/i18n.ts';
import { computePlan } from '../lib/planner.ts';
import { oldHashTarget } from '../lib/legacy-routes.ts';

test('every product is complete in both languages and its images exist', () => {
  const ids = new Set<string>();
  for (const p of PRODUCTS) {
    assert.ok(!ids.has(p.id), `duplicate id ${p.id}`); ids.add(p.id);
    assert.ok(CATEGORIES.includes(p.cat), p.id);
    assert.notEqual(unitPrice(p, defaults(p)), null, `${p.id} has no price for its default options`);
    for (const t of [p.tag, p.short, p.blurb]) if (typeof t !== 'string') assert.ok(t.en && t.es, p.id);
    assert.equal(p.use.en.length, p.use.es.length, `${p.id} use`);
    for (const op of p.options) {
      assert.equal(new Set(op.values.map(v => v.id)).size, op.values.length, `${p.id}.${op.key} ids`);
      for (const v of op.values) if (v.img) assert.ok(existsSync(`public/img/${v.img}.webp`), v.img);
    }
    for (const g of [...p.gallery, mainImg(p, defaults(p))]) assert.ok(existsSync(`public/img/${g}.webp`), g);
    for (const id of p.pairs) assert.ok(PRODUCTS.some(x => x.id === id), `${p.id} pairs with unknown ${id}`);
  }
  for (const c of CATEGORIES) assert.ok(CATS[c].name.en && CATS[c].name.es);
});

test('English and Spanish copy have the same shape', () => {
  const shape = (x: unknown): unknown => Array.isArray(x) ? x.map(shape) : x && typeof x === 'object' ? Object.fromEntries(Object.entries(x).map(([k, v]) => [k, shape(v)])) : typeof x;
  assert.deepEqual(shape(DICT.es), shape(DICT.en));
});

test('prices cart lines and applies Subscribe & save', () => {
  assert.equal(priceLine({ id: 'carb-gel-30', opts: { flavour: 'citrus', pack: 'box-of-24' }, qty: 2, sub: false })!.totalCents, 11200);
  const sub = priceLine({ id: 'sodium', opts: { strength: '1000-mg' }, qty: 1, sub: true })!;
  assert.equal(sub.unitCents, 2380);
  assert.equal(sub.options, '1000 mg');
  assert.equal(priceLine({ id: 'race-day-stack', opts: {}, qty: 1, sub: true })!.subscribe, false, 'stacks cannot be subscribed');
});

test('refuses anything not in the catalogue', () => {
  assert.equal(priceLine({ id: 'carb-gel-30', opts: { flavour: 'citrus' }, qty: 1 }), null, 'missing option');
  assert.equal(priceLine({ id: 'carb-gel-30', opts: { flavour: 'citrus', pack: 'box-of-1000' }, qty: 1 }), null);
  assert.equal(priceLine({ id: 'carb-gel-30', opts: { flavour: 'Citrus', pack: 'Box of 12' }, qty: 1 }), null, 'labels are not ids');
  assert.equal(priceLine({ id: 'sodium', opts: { strength: '1000-mg' }, qty: 0 }), null);
  assert.equal(priceLine({ id: 'sodium', opts: { strength: '1000-mg' }, qty: 1.5 }), null);
  assert.equal(priceLine({ id: 'free-stuff', opts: {}, qty: 1 }), null);
  assert.equal(priceLine('nope'), null);
  assert.equal(priceCart([], { shippingCents: 500 }), null);
});

test('free shipping from US$75', () => {
  const small = priceCart([{ id: 'sodium', opts: { strength: '500-mg' }, qty: 1 }], { shippingCents: 500 })!;
  assert.deepEqual([small.subtotalCents, small.shippingCents, small.totalCents], [2800, 500, 3300]);
  const big = priceCart([{ id: 'sodium', opts: { strength: '500-mg' }, qty: 3 }], { shippingCents: 500 })!;
  assert.deepEqual([big.subtotalCents, big.shippingCents, big.totalCents], [8400, 0, 8400]);
});

test('fuel planner: same numbers as the original site, and every suggested item is a real product choice', () => {
  const plan = computePlan(3, 'steady', 'average', true, false);
  assert.deepEqual([plan.carbs, plan.sodium, plan.fluid, plan.gels, plan.mix, plan.every], [75, 1000, 750, 2, 3, 90]);
  const caf = computePlan(5, 'race', 'salty', true, true);
  assert.ok(caf.cafGels > 0);
  for (const d of [0.5, 1, 2, 4, 8]) for (const i of computePlan(d, 'race', 'salty', true, true).items) {
    assert.notEqual(unitPrice(PRODUCTS.find(p => p.id === i.id)!, i.opts), null, `${d} h: ${i.id}`);
  }
  assert.equal(computePlan(0.5, 'easy', 'light', false, false).items.length, 1);
});

test('URLs: English unprefixed, Spanish under /es, old hash links still land somewhere', () => {
  assert.equal(href('en', '/'), '/');
  assert.equal(href('es', '/'), '/es');
  assert.equal(href('es', '/shop/fuel'), '/es/shop/fuel');
  assert.equal(oldHashTarget('#p-sodium'), '/products/sodium');
  assert.equal(oldHashTarget('#shop-fuel'), '/shop/fuel');
  assert.equal(oldHashTarget('#checkout'), '/waitlist');
  assert.equal(oldHashTarget('#whatever'), null);
});
