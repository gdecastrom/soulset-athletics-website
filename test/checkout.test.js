/* Checkout and payment callback against a real Postgres, with the fake 'test' payment provider.
   TEST_DATABASE_URL=postgres://… npm test   (the tables in that database are emptied) */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const DB = process.env.TEST_DATABASE_URL;
const skip = !DB && 'set TEST_DATABASE_URL to run the API tests';
let checkout, callback, sql;

before(async () => {
  if (skip) return;
  Object.assign(process.env, { DATABASE_URL: DB, APP_SECRET: 'test-secret', SITE_URL: 'https://soulset.test', CHECKOUT_ENABLED: 'true', SHIPPING_FEE_USD: '5', PAYMENT_PROVIDER: 'test' });
  ({ sql } = await import('../lib/db.js'));
  checkout = await import('../api/checkout.js');
  callback = await import('../api/payment-callback.js');
  await sql.unsafe(await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8'));
  await sql`truncate payment_events, orders, rate_limit_hits restart identity cascade`;
});
after(async () => { if (sql) await sql.end(); });

let ipN = 0;
const order = extra => ({
  email: 'Buyer@Email.com', siteLanguage: 'es',
  customer: { firstName: 'Ana', lastName: 'Pérez', phone: '+1 809-555-0100', address: 'Calle 1 #2', city: 'Santiago', province: 'Santiago' },
  cart: [{ id: 'sodium', opts: { strength: '1000 mg' }, qty: 1, sub: false, price: 0.01 }],
  ...extra,
});
const post = (body, query = '') => checkout.POST(new Request('https://soulset.test/api/checkout' + query, {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'x-forwarded-for': `10.1.0.${++ipN}` }, body: JSON.stringify(body),
}));
const follow = async res => callback.GET(new Request((await res.json()).redirectUrl));

test('is closed unless CHECKOUT_ENABLED=true', { skip }, async () => {
  process.env.CHECKOUT_ENABLED = 'false';
  assert.equal((await post(order())).status, 404);
  process.env.CHECKOUT_ENABLED = 'true';
});

test('charges catalogue prices, not what the browser sends, and marks the order paid', { skip }, async () => {
  const res = await post(order());
  assert.equal(res.status, 200);
  const [row] = await sql`select * from orders where id = 1`;
  assert.equal(row.number, 'SA-000001');
  assert.equal(row.status, 'pending');
  assert.deepEqual([row.subtotal_cents, row.shipping_cents, row.total_cents, row.currency], [2800, 500, 3300, 'USD']);
  assert.equal(row.email, 'buyer@email.com');

  const back = await follow(res);
  assert.equal(back.status, 303);
  assert.equal(back.headers.get('location'), 'https://soulset.test/es/?order=SA-000001#order-paid');
  const [paid] = await sql`select status, paid_at, provider_reference from orders where id = 1`;
  assert.equal(paid.status, 'paid');
  assert.ok(paid.paid_at);
  assert.equal(paid.provider_reference, 'TEST-SA-000001');
});

test('a forged or late callback cannot change a paid order', { skip }, async () => {
  const forged = await callback.GET(new Request('https://soulset.test/api/payment-callback?order=1&status=declined&ref=x&sig=nope'));
  assert.match(forged.headers.get('location'), /#order-error$/);
  const [{ status }] = await sql`select status from orders where id = 1`;
  assert.equal(status, 'paid');
  const events = await sql`select verified, status from payment_events order by id`;
  assert.deepEqual(events.map(e => [e.verified, e.status]), [[true, 'paid'], [false, 'unverified']]);
});

test('declined payments are recorded as declined', { skip }, async () => {
  const back = await follow(await post(order({ siteLanguage: 'en' }), '?simulate=declined'));
  assert.equal(back.headers.get('location'), 'https://soulset.test/?order=SA-000002#order-declined');
  const [{ status, paid_at }] = await sql`select status, paid_at from orders where id = 2`;
  assert.deepEqual([status, paid_at], ['declined', null]);
});

test('rejects bad carts and delivery details', { skip }, async () => {
  assert.equal((await post(order({ cart: [{ id: 'sodium', opts: { strength: '9000 mg' }, qty: 1 }] }))).status, 400);
  assert.equal((await post(order({ cart: [] }))).status, 400);
  assert.equal((await post(order({ customer: { ...order().customer, phone: 'call me' } }))).status, 400);
  assert.equal((await post(order({ customer: { ...order().customer, province: 'Florida' } }))).status, 400);
  const [{ n }] = await sql`select count(*)::int as n from orders`;
  assert.equal(n, 2, 'no order rows for rejected requests');
});

test('a provider that is not connected yet fails cleanly', { skip }, async () => {
  process.env.PAYMENT_PROVIDER = 'azul';
  const res = await post(order());
  assert.equal(res.status, 502);
  const [{ status }] = await sql`select status from orders order by id desc limit 1`;
  assert.equal(status, 'error');
  process.env.PAYMENT_PROVIDER = 'test';
});

test('the test provider is refused in production', { skip }, async () => {
  process.env.VERCEL_ENV = 'production';
  assert.equal((await post(order())).status, 503);
  delete process.env.VERCEL_ENV;
});
