/* Waitlist and unsubscribe API against a real Postgres (see test/db.ts), with Resend mocked. */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type postgres from 'postgres';
import { freshDatabase, skipReason as skip, TEST_DB } from './db.ts';

type Sent = { to: string[]; subject: string; html: string; headers: Record<string, string>; idempotencyKey?: string };
let waitlist: typeof import('../app/api/waitlist/route.ts');
let unsubscribe: typeof import('../app/api/unsubscribe/route.ts');
let sql: postgres.Sql;
let sent: Sent[] = [];
const realFetch = globalThis.fetch;

before(async () => {
  if (skip) return;
  Object.assign(process.env, { DATABASE_URL: TEST_DB, APP_SECRET: 'test-secret', RESEND_API_KEY: 're_test', EMAIL_FROM: 'Soulset <hola@example.com>', NOTIFY_EMAIL: 'team@example.com', SITE_URL: 'https://soulset.test' });
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    assert.equal(url, 'https://api.resend.com/emails');
    sent.push({ ...JSON.parse(String(init.body)), idempotencyKey: (init.headers as Record<string, string>)['Idempotency-Key'] });
    return Response.json({ id: 'email_' + sent.length });
  }) as typeof fetch;
  sql = await freshDatabase();
  waitlist = await import('../app/api/waitlist/route.ts');
  unsubscribe = await import('../app/api/unsubscribe/route.ts');
});
after(async () => {
  await (await import('../lib/server/db.ts')).db()?.end();
  globalThis.fetch = realFetch;
  if (sql) await sql.end();
});

let ipN = 0;
const post = (body: unknown, { ip = `10.0.0.${++ipN}`, origin = 'https://soulset.test' as string | null } = {}) => waitlist.POST(new Request('https://soulset.test/api/waitlist', {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip, ...(origin ? { origin } : {}) }, body: typeof body === 'string' ? body : JSON.stringify(body),
}));
const signup = (extra: Record<string, unknown> = {}) => ({
  email: 'Athlete@Email.com', firstName: 'Gabo', province: 'Santiago', source: 'waitlist-page', language: 'es-DO', siteLanguage: 'es',
  picks: [{ id: 'sodium', opts: { strength: '1000-mg' }, qty: 2, sub: false }, { id: 'carb-gel-30', opts: { flavour: 'citrus', pack: 'box-of-24' }, qty: 1, sub: true }],
  ...extra,
});
const signupRow = (email: string) => sql`
  select c.email, c.first_name, p.name as province, ws.*
  from customer c join waitlist_signup ws on ws.customer_id = c.id left join province p on p.id = c.province_id
  where c.email = ${email}`.then(r => r[0]);
const picksOf = (email: string) => sql`
  select v.sku, wp.quantity, wp.is_subscription
  from waitlist_pick wp join waitlist_signup ws on ws.id = wp.waitlist_signup_id join customer c on c.id = ws.customer_id
  join variant v on v.id = wp.variant_id where c.email = ${email} order by v.sku`;

test('saves a sign-up as customer + sign-up + picks, and sends one confirmation plus a team notice', { skip }, async () => {
  const res = await post(signup());
  assert.equal(res.status, 200);
  const row = await signupRow('athlete@email.com');
  assert.equal(row.first_name, 'Gabo');
  assert.equal(row.province, 'Santiago');
  assert.equal(row.site_language, 'es');
  assert.equal(row.source, 'waitlist_page');
  assert.ok(row.confirmation_sent_at);
  assert.deepEqual((await picksOf('athlete@email.com')).map(p => [p.sku, p.quantity, p.is_subscription]),
    [['GEL-030-CITRUS-BOX-OF-24', 1, true], ['NA-MIX-1000-MG', 2, false]]);
  assert.equal(sent.length, 2);
  assert.equal(sent[0].subject, 'Ya estás en la lista de Soulset');
  assert.deepEqual(sent[0].to, ['athlete@email.com']);
  assert.match(sent[0].html, /2 × Sodium \(1000 mg\)/);
  assert.match(sent[0].html, /1 × Carb Gel 30 \(Cítrico · Caja de 24\)/);
  assert.match(sent[0].headers['List-Unsubscribe'], /^<https:\/\/soulset\.test\/api\/unsubscribe\?id=1&t=/);
  assert.equal(sent[0].idempotencyKey, 'waitlist-confirmation/1');
  assert.deepEqual(sent[1].to, ['team@example.com']);
});

test('signing up again updates the same rows, replaces the picks and sends no second email', { skip }, async () => {
  sent = [];
  const res = await post(signup({ email: 'athlete@email.com', firstName: '', province: '', picks: [{ id: 'creatine', opts: { size: '300-g-60-servings' }, qty: 1 }], source: 'home', siteLanguage: 'en' }));
  assert.equal(res.status, 200);
  const [{ n }] = await sql`select count(*)::int as n from customer`;
  assert.equal(n, 1);
  const row = await signupRow('athlete@email.com');
  assert.equal(row.first_name, 'Gabo', 'blank name keeps the old one');
  assert.equal(row.province, 'Santiago');
  assert.equal(row.source, 'home');
  assert.deepEqual((await picksOf('athlete@email.com')).map(p => p.sku), ['CRE-005-300-G-60-SERVINGS']);
  assert.equal(sent.length, 0);
  await post(signup({ email: 'athlete@email.com', picks: [] }));
  assert.equal((await picksOf('athlete@email.com')).length, 1, 'no picks keeps the saved ones');
});

test('rejects bad input and other origins', { skip }, async () => {
  assert.equal((await post(signup({ email: 'not-an-email' }))).status, 400);
  assert.equal((await post('{nope')).status, 400);
  assert.equal((await post(signup(), { origin: 'https://evil.example' })).status, 403);
  assert.equal((await post('x'.repeat(30_000))).status, 413);
  assert.equal((await post(signup({ email: 'noorigin@email.com' }), { origin: null })).status, 200);
});

test('cleans up fields it does not trust and drops picks that are not real variants', { skip }, async () => {
  await post(signup({
    email: 'clean@email.com', province: 'Narnia', firstName: 'A\u0000b', source: 'evil', siteLanguage: 'fr',
    picks: [{ id: '../x', qty: 5 }, { id: 'sodium', opts: { strength: '9000-mg' }, qty: 1 }, { id: 'race-day-stack', opts: {}, qty: 500, sub: true }],
  }));
  const row = await signupRow('clean@email.com');
  assert.equal(row.province, null);
  assert.equal(row.first_name, 'A b');
  assert.equal(row.source, 'waitlist_page');
  assert.equal(row.site_language, 'en');
  assert.deepEqual((await picksOf('clean@email.com')).map(p => [p.sku, p.quantity, p.is_subscription]), [['STK-RACE', 99, false]], 'stacks cannot be subscribed');
});

test('rate-limits one IP to 5 requests per 10 minutes', { skip }, async () => {
  const codes: number[] = [];
  for (let i = 0; i < 6; i++) codes.push((await post(signup({ email: `burst${i}@email.com` }), { ip: '192.0.2.1' })).status);
  assert.deepEqual(codes, [200, 200, 200, 200, 200, 429]);
});

test('unsubscribe link: GET asks, POST unsubscribes, bad tokens are refused', { skip }, async () => {
  const { signId } = await import('../lib/server/unsubscribe-token.ts');
  const url = `https://soulset.test/api/unsubscribe?id=1&t=${signId(1)}`;
  const get = await unsubscribe.GET(new Request(url));
  assert.equal(get.status, 200);
  assert.match(await get.text(), /<form method="post"/);
  assert.equal((await signupRow('athlete@email.com')).unsubscribed_at, null);

  assert.equal((await unsubscribe.POST(new Request('https://soulset.test/api/unsubscribe?id=1&t=wrong', { method: 'POST' }))).status, 400);
  assert.equal((await unsubscribe.POST(new Request(url, { method: 'POST', body: 'List-Unsubscribe=One-Click' }))).status, 200);
  assert.ok((await signupRow('athlete@email.com')).unsubscribed_at);

  const [demand] = await sql`select count(*)::int as n from waitlist_pick_demand where product = 'creatine'`;
  assert.equal(demand.n, 0, 'unsubscribed people drop out of the demand view');
});
