/* The site shows prices from assets/js/app.js (English) and app.es.js (Spanish); checkout charges from lib/catalog.js.
   These tests fail if any product, option or price differs between them. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CATALOG, SUB_OFF, FREE_SHIP_OVER, priceLine, priceCart } from '../lib/catalog.js';

async function siteCatalog(file) {
  const src = await readFile(new URL(`../assets/js/${file}`, import.meta.url), 'utf8');
  const body = src.slice(src.indexOf('const GEL_USE'), src.indexOf('\nconst byId'));
  const consts = src.match(/const SUB_OFF = ([\d.]+), FREE_SHIP = (\d+);/);
  return { P: new Function(body + '; return P;')(), subOff: Number(consts[1]), freeShip: Number(consts[2]) };
}

for (const [file, lang] of [['app.js', 0], ['app.es.js', 1]]) {
  test(`lib/catalog.js matches ${file}`, async () => {
    const { P, subOff, freeShip } = await siteCatalog(file);
    assert.equal(subOff, SUB_OFF);
    assert.equal(freeShip, FREE_SHIP_OVER);
    assert.deepEqual(P.map(p => p.id), Object.keys(CATALOG));
    for (const p of P) {
      const c = CATALOG[p.id];
      assert.equal(p.sub, c.sub, p.id);
      assert.equal(p.basePrice, c.basePrice, p.id);
      assert.deepEqual(p.options.map(o => o.key), Object.keys(c.options), p.id);
      for (const op of p.options) {
        assert.deepEqual(op.values.map(v => [v.v, v.price]), c.options[op.key].map(v => [v[lang], v[2]]), `${p.id}.${op.key}`);
      }
    }
  });
}

test('prices lines in either language and applies Subscribe & save', () => {
  assert.equal(priceLine({ id: 'carb-gel-30', opts: { flavour: 'Cítrico', pack: 'Caja de 24' }, qty: 2, sub: false }).totalCents, 11200);
  const sub = priceLine({ id: 'sodium', opts: { strength: '1000 mg' }, qty: 1, sub: true });
  assert.equal(sub.unitCents, 2380);
  assert.equal(sub.options, '1000 mg');
  assert.equal(priceLine({ id: 'race-day-stack', opts: {}, qty: 1, sub: true }).subscribe, false, 'stacks cannot be subscribed');
});

test('refuses anything not in the catalogue', () => {
  assert.equal(priceLine({ id: 'carb-gel-30', opts: { flavour: 'Citrus' }, qty: 1 }), null, 'missing option');
  assert.equal(priceLine({ id: 'carb-gel-30', opts: { flavour: 'Citrus', pack: 'Box of 1000' }, qty: 1 }), null);
  assert.equal(priceLine({ id: 'sodium', opts: { strength: '1000 mg' }, qty: 0 }), null);
  assert.equal(priceLine({ id: 'sodium', opts: { strength: '1000 mg' }, qty: 1.5 }), null);
  assert.equal(priceLine({ id: 'free-stuff', opts: {}, qty: 1 }), null);
  assert.equal(priceCart([], { shippingCents: 500 }), null);
});

test('free shipping from US$75', () => {
  const small = priceCart([{ id: 'sodium', opts: { strength: '500 mg' }, qty: 1 }], { shippingCents: 500 });
  assert.deepEqual([small.subtotalCents, small.shippingCents, small.totalCents], [2800, 500, 3300]);
  const big = priceCart([{ id: 'sodium', opts: { strength: '500 mg' }, qty: 3 }], { shippingCents: 500 });
  assert.deepEqual([big.subtotalCents, big.shippingCents, big.totalCents], [8400, 0, 8400]);
});
