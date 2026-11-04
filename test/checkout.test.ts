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
/* A correctly signed test-provider callback for an order, as if the provider had sent it. */
const signedCallback = async (id: number, simulate: string, change: Record<string, unknown> = {}) => {
  const { createPayment } = await import('../lib/server/payments/fake.ts');
  const row = await orderRow(id) ?? { id, order_number: 'SA-999999', total_cents: 100, currency: 'USD', site_language: 'en' };
  const { redirectUrl } = createPayment({
    order: { id, number: row.order_number, total_cents: row.total_cents, currency: row.currency, email: '', site_language: row.site_language, ...change },
    returnUrl: 'https://soulset.test/api/payment-callback', simulate,
  });
  return callback.GET(new Request(redirectUrl));
};

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
  const forged = await callback.GET(new Request('https://soulset.test/api/payment-callback?order=1&status=declined&ref=x&amount=7900&currency=USD&sig=nope'));
  assert.equal(forged.headers.get('location'), 'https://soulset.test/order?status=error');
  assert.equal((await orderRow(1)).status, 'paid');
  /* correctly signed, but late: the order is already paid */
  const late = await signedCallback(1, 'declined');
  assert.equal(late.headers.get('location'), 'https://soulset.test/es/order?status=paid&number=SA-000001');
  assert.equal((await orderRow(1)).status, 'paid');
  /* the same signed callback again is not recorded twice */
  await signedCallback(1, 'declined');
  const events = await sql`select verified, status, sales_order_id from payment_event order by id`;
  assert.deepEqual(events.map(e => [e.verified, e.status, e.sales_order_id]), [[true, 'paid', '1'], [false, 'unverified', null], [true, 'declined', '1']]);
});

test('a verified callback for an unknown order is kept as unverified and changes nothing', { skip }, async () => {
  const res = await signedCallback(999, 'paid');
  assert.equal(res.headers.get('location'), 'https://soulset.test/order?status=error');
  const [e] = await sql`select verified, status, sales_order_id from payment_event order by id desc limit 1`;
  assert.deepEqual([e.verified, e.status, e.sales_order_id], [false, 'unverified', null]);
});

test('declined payments are recorded as declined', { skip }, async () => {
  const back = await follow(await post(order({ siteLanguage: 'en' }), '?simulate=declined'));
  assert.equal(back.headers.get('location'), 'https://soulset.test/order?status=declined&number=SA-000002');
  const row = await orderRow(2);
  assert.deepEqual([row.status, row.paid_at, row.shipping_cents, row.total_cents], ['declined', null, 500, 3300]);
});

test('a payment for the wrong amount does not mark the order paid', { skip }, async () => {
  const res = await post(order());
  const { orderNumber } = await res.json();
  const [{ id }] = await sql`select id from sales_order where order_number = ${orderNumber}`;
  const back = await signedCallback(Number(id), 'paid', { total_cents: 1 });
  assert.equal(back.headers.get('location'), `https://soulset.test/es/order?status=error&number=${orderNumber}`);
  assert.deepEqual([(await orderRow(Number(id))).status, (await orderRow(Number(id))).paid_at], ['error', null]);
});

test('rejects bad carts and delivery details without creating anything', { skip }, async () => {
  assert.equal((await post(order({ cart: [{ id: 'sodium', opts: { strength: '9000-mg' }, qty: 1 }] }))).status, 400);
  assert.equal((await post(order({ cart: [] }))).status, 400);
  assert.equal((await post(order({ cart: [{ id: 'sodium', opts: { strength: '500-mg' }, qty: 1 }, { id: 'sodium', opts: { strength: '500-mg' }, qty: 2 }] }))).status, 400, 'duplicate lines');
  assert.equal((await post(order({ customer: { ...order().customer, phone: 'call me' } }))).status, 400);
  assert.equal((await post(order({ customer: { ...order().customer, province: 'Florida' } }))).status, 400);
  assert.equal((await post(order({ customer: { ...order().customer, phone: '809\u00a0555\u00a00100' } }))).status, 400, 'non-breaking spaces');
  assert.equal((await post(order({ customer: { ...order().customer, address: 'x'.repeat(201) } }))).status, 400, 'too long');
  assert.equal((await post(order({ email: 'a'.repeat(250) + '@email.com' }))).status, 400, 'email too long');
  const [{ n }] = await sql`select count(*)::int as n from sales_order`;
  assert.equal(n, 3);
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
  const newOrder = (tx: postgres.TransactionSql) => tx`insert into sales_order (customer_id, currency, subtotal_cents, shipping_cents, total_cents, site_language, shipping_first_name, shipping_last_name, shipping_phone, shipping_address, shipping_city, shipping_province_id, payment_provider)
      values (1, 'USD', 100, 0, 100, 'en', 'A', 'B', '8095550100', 'x', 'y', 1, 'test') returning id`;
  await fails(sql.begin(async tx => {
    const [o] = await newOrder(tx);
    await tx`insert into sales_order_item (sales_order_id, variant_id, quantity, unit_price_cents) values (${o.id}, 1, 1, 5)`;
  }), /subtotal/);
  await fails(sql.begin(tx => newOrder(tx)), /no items/);
  await fails(sql.begin(async tx => {
    const [o] = await newOrder(tx);
    await tx`insert into sales_order_item (sales_order_id, variant_id, quantity, unit_price_cents) values (${o.id}, 1, 1, 0)`;
  }), /violates/);
  /* items can't be added to an existing order later, not even at a price of zero */
  await fails(sql`insert into sales_order_item (sales_order_id, variant_id, quantity, unit_price_cents) values (1, 2, 99, 1)`, /transaction that creates/);
  await fails(sql`insert into sales_order_item (sales_order_id, variant_id, quantity, unit_price_cents) values (1, 2, 99, 0)`);
  /* an order can't be created already paid */
  await fails(sql`insert into sales_order (customer_id, currency, subtotal_cents, shipping_cents, total_cents, site_language, shipping_first_name, shipping_last_name, shipping_phone, shipping_address, shipping_city, shipping_province_id, payment_provider, status, paid_at)
    values (1, 'USD', 100, 0, 100, 'en', 'A', 'B', '8095550100', 'x', 'y', 1, 'test', 'paid', now())`, /must be pending/);
  /* a variant can only take values of its own product's options */
  await fails(sql`insert into variant_option_value (variant_id, product_id, product_option_id, option_value_id)
    select v.id, v.product_id, po.id, ov.id from variant v, product_option po join option_value ov on ov.product_option_id = po.id
    where v.sku = 'NA-MIX-500-MG' and po.key = 'flavour' limit 1`);
  /* the site's own login can't delete or rewrite orders, nor use a temporary table to shadow the real items */
  await sql.unsafe('grant soulset_app to current_user').catch(() => {});   // superusers can switch role without it
  const asApp = (q: (tx: postgres.TransactionSql) => Promise<unknown>) => sql.begin(async tx => { await tx`set local role soulset_app`; return q(tx); });
  await fails(asApp(tx => tx`delete from sales_order where id = 1`), /permission denied/);
  await fails(asApp(tx => tx`update sales_order set total_cents = 1 where id = 1`), /permission denied/);
  await fails(asApp(tx => tx`delete from payment_event`), /permission denied/);
  await fails(asApp(tx => tx`create temporary table sales_order_item (sales_order_id bigint, quantity int, unit_price_cents int)`), /permission denied/);
  /* refunds are the one allowed change after payment */
  await sql`update sales_order set status = 'refunded' where id = 1`;
  const row = await orderRow(1);
  assert.deepEqual([row.status, row.total_cents], ['refunded', 7900]);
});
