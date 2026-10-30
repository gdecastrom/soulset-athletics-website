/* Checkout, payment callback and the rules the database enforces, against a real Postgres (see test/db.ts),
   with the fake 'test' payment provider. */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type postgres from 'postgres';
import { syncCatalog } from '../lib/server/catalog-sync.ts';
import { freshDatabase, skipReason as skip, TEST_DB } from './db.ts';

let checkout: typeof import('../app/api/checkout/route.ts');
let callback: typeof import('../app/api/payment-callback/route.ts');
let sql: postgres.Sql;

before(async () => {
  if (skip) return;
  Object.assign(process.env, { DATABASE_URL: TEST_DB, APP_SECRET: 'test-secret', SITE_URL: 'https://soulset.test', CHECKOUT_ENABLED: 'true', SHIPPING_FEE_USD: '5', PAYMENT_PROVIDER: 'test' });
  sql = await freshDatabase();
  checkout = await import('../app/api/checkout/route.ts');
  callback = await import('../app/api/payment-callback/route.ts');
});
after(async () => {
  await (await import('../lib/server/db.ts')).db()?.end();
  if (sql) await sql.end();
});

let ipN = 0;
const order = (extra: Record<string, unknown> = {}) => ({
  email: 'Buyer@Email.com', siteLanguage: 'es',
  customer: { firstName: 'Ana', lastName: 'Pérez', phone: '+1 809-555-0100', address: 'Calle 1 #2', city: 'Santiago', province: 'Santiago' },
  cart: [{ id: 'sodium', opts: { strength: '1000-mg' }, qty: 1, sub: false, price: 0.01 }],
  ...extra,
});
const post = (body: unknown, query = '') => checkout.POST(new Request('https://soulset.test/api/checkout' + query, {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'x-forwarded-for': `10.1.0.${++ipN}` }, body: JSON.stringify(body),
}));
const follow = async (res: Response) => callback.GET(new Request((await res.json()).redirectUrl));
const orderRow = (id: number) => sql`select * from sales_order where id = ${id}`.then(r => r[0]);

test('is closed unless CHECKOUT_ENABLED=true', { skip }, async () => {
  process.env.CHECKOUT_ENABLED = 'false';
  assert.equal((await post(order())).status, 404);
  process.env.CHECKOUT_ENABLED = 'true';
});

test('charges catalogue prices, not what the browser sends, and marks the order paid', { skip }, async () => {
  const res = await post(order({ cart: [
    { id: 'sodium', opts: { strength: '1000-mg' }, qty: 1, sub: false, price: 0.01 },
    { id: 'carb-gel-30', opts: { flavour: 'citrus', pack: 'box-of-12' }, qty: 2, sub: true },
  ] }));
  assert.equal(res.status, 200);
  const row = await orderRow(1);
  assert.equal(row.order_number, 'SA-000001');
  assert.equal(row.status, 'pending');
  /* 28 + 2 × (30 − 15%) = 28 + 51 = 79 → free shipping */
  assert.deepEqual([row.subtotal_cents, row.shipping_cents, row.total_cents, row.currency], [7900, 0, 7900, 'USD']);
  assert.equal(row.shipping_city, 'Santiago');
  const items = await sql`select v.sku, i.quantity, i.unit_price_cents, i.is_subscription from sales_order_item i join variant v on v.id = i.variant_id where i.sales_order_id = 1 order by v.sku`;
  assert.deepEqual(items.map(i => [i.sku, i.quantity, i.unit_price_cents, i.is_subscription]),
    [['GEL-030-CITRUS-BOX-OF-12', 2, 2550, true], ['NA-MIX-1000-MG', 1, 2800, false]]);
  const [cust] = await sql`select email, last_name, phone from customer`;
  assert.deepEqual([cust.email, cust.last_name, cust.phone], ['buyer@email.com', 'Pérez', '+1 809-555-0100']);

  const back = await follow(res);
  assert.equal(back.status, 303);
  assert.equal(back.headers.get('location'), 'https://soulset.test/es/order?status=paid&number=SA-000001');
  const paid = await orderRow(1);
  assert.equal(paid.status, 'paid');
  assert.ok(paid.paid_at);
  assert.equal(paid.provider_reference, 'TEST-SA-000001');
});

test('a forged or late callback cannot change a paid order', { skip }, async () => {
  const forged = await callback.GET(new Request('https://soulset.test/api/payment-callback?order=1&status=declined&ref=x&sig=nope'));
  assert.equal(forged.headers.get('location'), 'https://soulset.test/order?status=error');
  assert.equal((await orderRow(1)).status, 'paid');
  const events = await sql`select verified, status, sales_order_id from payment_event order by id`;
  assert.deepEqual(events.map(e => [e.verified, e.status, e.sales_order_id]), [[true, 'paid', '1'], [false, 'unverified', null]]);
});

test('declined payments are recorded as declined', { skip }, async () => {
  const back = await follow(await post(order({ siteLanguage: 'en' }), '?simulate=declined'));
  assert.equal(back.headers.get('location'), 'https://soulset.test/order?status=declined&number=SA-000002');
  const row = await orderRow(2);
  assert.deepEqual([row.status, row.paid_at, row.shipping_cents, row.total_cents], ['declined', null, 500, 3300]);
});

test('rejects bad carts and delivery details without creating anything', { skip }, async () => {
  assert.equal((await post(order({ cart: [{ id: 'sodium', opts: { strength: '9000-mg' }, qty: 1 }] }))).status, 400);
  assert.equal((await post(order({ cart: [] }))).status, 400);
  assert.equal((await post(order({ cart: [{ id: 'sodium', opts: { strength: '500-mg' }, qty: 1 }, { id: 'sodium', opts: { strength: '500-mg' }, qty: 2 }] }))).status, 400, 'duplicate lines');
  assert.equal((await post(order({ customer: { ...order().customer, phone: 'call me' } }))).status, 400);
  assert.equal((await post(order({ customer: { ...order().customer, province: 'Florida' } }))).status, 400);
  const [{ n }] = await sql`select count(*)::int as n from sales_order`;
  assert.equal(n, 2);
});

test('refuses to charge when the database price differs from the code (catalogue not synced)', { skip }, async () => {
  await sql`update variant_price set valid_to = now() where valid_to is null and variant_id = (select id from variant where sku = 'NA-MIX-1000-MG')`;
  await sql`insert into variant_price (variant_id, currency, amount_cents) select id, 'USD', 9900 from variant where sku = 'NA-MIX-1000-MG'`;
  assert.equal((await post(order())).status, 503);
  await syncCatalog(sql, () => {});   // what the next deploy does: back to the code price, history kept
  const prices = await sql`select amount_cents, valid_to is null as current from variant_price vp join variant v on v.id = vp.variant_id where v.sku = 'NA-MIX-1000-MG' order by vp.id`;
  assert.deepEqual(prices.map(p => [p.amount_cents, p.current]), [[2800, false], [9900, false], [2800, true]]);
  assert.equal((await post(order())).status, 200);
});

test('a provider that is not connected yet fails cleanly', { skip }, async () => {
  process.env.PAYMENT_PROVIDER = 'azul';
  const res = await post(order());
  assert.equal(res.status, 502);
  const [{ status }] = await sql`select status from sales_order order by id desc limit 1`;
  assert.equal(status, 'error');
  process.env.PAYMENT_PROVIDER = 'test';
});

test('the test provider is refused in production', { skip }, async () => {
  process.env.VERCEL_ENV = 'production';
  assert.equal((await post(order())).status, 503);
  delete process.env.VERCEL_ENV;
});

test('the database refuses tampering with orders, items, payments and prices', { skip }, async () => {
  const fails = (q: Promise<unknown>, re = /order|append-only|price|violates/) => assert.rejects(q, re);
  await fails(sql`update sales_order set total_cents = 1, subtotal_cents = 1 where id = 1`);
  await fails(sql`update sales_order set shipping_address = 'elsewhere' where id = 1`);
  await fails(sql`update sales_order set status = 'pending' where id = 1`);
  await fails(sql`update sales_order set provider_reference = 'other' where id = 1`);
  await fails(sql`delete from sales_order where id = 1`);
  await fails(sql`update sales_order_item set unit_price_cents = 1 where sales_order_id = 1`);
  await fails(sql`delete from sales_order_item where sales_order_id = 1`);
  await fails(sql`update payment_event set status = 'paid' where sales_order_id = 2`);
  await fails(sql`delete from payment_event`);
  await fails(sql`update variant_price set amount_cents = 1 where valid_to is null`);
  await fails(sql`delete from variant_price`);
  /* an order whose subtotal doesn't match its items, or with no items, can't be committed */
  await fails(sql.begin(async tx => {
    const [o] = await tx`insert into sales_order (customer_id, currency, subtotal_cents, shipping_cents, total_cents, site_language, shipping_first_name, shipping_last_name, shipping_phone, shipping_address, shipping_city, shipping_province_id, payment_provider)
      values (1, 'USD', 100, 0, 100, 'en', 'A', 'B', '8095550100', 'x', 'y', 1, 'test') returning id`;
    await tx`insert into sales_order_item (sales_order_id, variant_id, quantity, unit_price_cents) values (${o.id}, 1, 1, 5)`;
  }), /subtotal/);
  /* a variant can only take values of its own product's options */
  await fails(sql`insert into variant_option_value (variant_id, product_id, product_option_id, option_value_id)
    select v.id, v.product_id, po.id, ov.id from variant v, product_option po join option_value ov on ov.product_option_id = po.id
    where v.sku = 'NA-MIX-500-MG' and po.key = 'flavour' limit 1`);
  /* refunds are the one allowed change after payment */
  await sql`update sales_order set status = 'refunded' where id = 1`;
  const row = await orderRow(1);
  assert.deepEqual([row.status, row.total_cents], ['refunded', 7900]);
});
