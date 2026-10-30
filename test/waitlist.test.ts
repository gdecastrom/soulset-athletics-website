/* Runs the API handlers against a real Postgres with Resend mocked.
   TEST_DATABASE_URL=postgres://… npm test   (the tables in that database are emptied) */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import postgres from 'postgres';

const DB = process.env.TEST_DATABASE_URL;
const skip = !DB && 'set TEST_DATABASE_URL to run the API tests';

type Sent = { to: string[]; subject: string; html: string; headers: Record<string, string>; idempotencyKey?: string };
let waitlist: typeof import('../app/api/waitlist/route.ts');
let unsubscribe: typeof import('../app/api/unsubscribe/route.ts');
let sql: postgres.Sql;
let sent: Sent[] = [];
const realFetch = globalThis.fetch;

before(async () => {
  if (skip) return;
  Object.assign(process.env, { DATABASE_URL: DB, APP_SECRET: 'test-secret', RESEND_API_KEY: 're_test', EMAIL_FROM: 'Soulset <hola@example.com>', NOTIFY_EMAIL: 'team@example.com', SITE_URL: 'https://soulset.test' });
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    assert.equal(url, 'https://api.resend.com/emails');
    sent.push({ ...JSON.parse(String(init.body)), idempotencyKey: (init.headers as Record<string, string>)['Idempotency-Key'] });
    return Response.json({ id: 'email_' + sent.length });
  }) as typeof fetch;
  /* Tables are set up and inspected as the owner (TEST_ADMIN_DATABASE_URL); the API itself connects as TEST_DATABASE_URL,
     which can be the restricted app role from db/app-role.sql to prove its permissions are enough. */
  sql = postgres(process.env.TEST_ADMIN_DATABASE_URL || DB!, { max: 1, onnotice: () => {} });
  waitlist = await import('../app/api/waitlist/route.ts');
  unsubscribe = await import('../app/api/unsubscribe/route.ts');
  await sql.unsafe(await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8'));
  await sql`truncate waitlist_signups, rate_limit_hits restart identity`;
});
after(async () => {
  await (await import('../lib/server/db.ts')).db()?.end(); globalThis.fetch = realFetch; if (sql) await sql.end(); });

let ipN = 0;
const post = (body: unknown, { ip = `10.0.0.${++ipN}`, origin = 'https://soulset.test' as string | null } = {}) => waitlist.POST(new Request('https://soulset.test/api/waitlist', {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip, ...(origin ? { origin } : {}) }, body: typeof body === 'string' ? body : JSON.stringify(body),
}));
const signup = (extra: Record<string, unknown> = {}) => ({ email: 'Athlete@Email.com', firstName: 'Gabo', province: 'Santiago', picks: [{ id: 'sodium', name: 'Sodium', options: '1000 mg', qty: 2, subscribe: false }], source: 'waitlist-page', language: 'es-DO', siteLanguage: 'es', ...extra });

test('saves a sign-up and sends one confirmation plus a team notice', { skip }, async () => {
  const res = await post(signup());
  assert.equal(res.status, 200);
  const [row] = await sql`select * from waitlist_signups`;
  assert.equal(row.email, 'athlete@email.com');
  assert.equal(row.province, 'Santiago');
  assert.equal(row.site_language, 'es');
  assert.deepEqual(row.picks, [{ id: 'sodium', name: 'Sodium', options: '1000 mg', qty: 2, subscribe: false }]);
  assert.ok(row.confirmation_sent_at);
  assert.equal(sent.length, 2);
  assert.equal(sent[0].subject, 'Ya estás en la lista de Soulset');
  assert.deepEqual(sent[0].to, ['athlete@email.com']);
  assert.match(sent[0].html, /2 × Sodium \(1000 mg\)/);
  assert.match(sent[0].headers['List-Unsubscribe'], /^<https:\/\/soulset\.test\/api\/unsubscribe\?id=1&t=/);
  assert.equal(sent[0].idempotencyKey, 'waitlist-confirmation/1');
  assert.deepEqual(sent[1].to, ['team@example.com']);
});

test('signing up again updates the row without a second email', { skip }, async () => {
  sent = [];
  const res = await post(signup({ email: 'athlete@email.com', firstName: '', province: '', picks: [{ id: 'creatine', name: 'Creatine Monohydrate', options: '300 g', qty: 1 }], source: 'home', siteLanguage: 'en' }));
  assert.equal(res.status, 200);
  const rows = await sql`select * from waitlist_signups`;
  assert.equal(rows.length, 1);
  assert.equal(rows[0].first_name, 'Gabo');
  assert.equal(rows[0].province, 'Santiago');
  assert.equal(rows[0].picks[0].id, 'creatine');
  assert.equal(sent.length, 0);
});

test('rejects bad input and other origins', { skip }, async () => {
  assert.equal((await post(signup({ email: 'not-an-email' }))).status, 400);
  assert.equal((await post('{nope')).status, 400);
  assert.equal((await post(signup(), { origin: 'https://evil.example' })).status, 403);
  assert.equal((await post('x'.repeat(30_000))).status, 413);
  assert.equal((await post(signup({ email: 'noorigin@email.com' }), { origin: null })).status, 200);
});

test('cleans up fields it does not trust', { skip }, async () => {
  await post(signup({ email: 'clean@email.com', province: 'Narnia', firstName: 'A\u0000b', source: 'evil', siteLanguage: 'fr', picks: [{ id: '../x', qty: 5 }, { id: 'carb-gel-30', name: 'Carb Gel 30', qty: 500 }] }));
  const [row] = await sql`select * from waitlist_signups where email = 'clean@email.com'`;
  assert.equal(row.province, '');
  assert.equal(row.first_name, 'A b');
  assert.equal(row.source, 'website');
  assert.equal(row.site_language, 'en');
  assert.deepEqual(row.picks.map((p: { id: string; qty: number }) => [p.id, p.qty]), [['carb-gel-30', 99]]);
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
  let [row] = await sql`select unsubscribed_at from waitlist_signups where id = 1`;
  assert.equal(row.unsubscribed_at, null);

  assert.equal((await unsubscribe.POST(new Request('https://soulset.test/api/unsubscribe?id=1&t=wrong', { method: 'POST' }))).status, 400);
  assert.equal((await unsubscribe.POST(new Request(url, { method: 'POST', body: 'List-Unsubscribe=One-Click' }))).status, 200);
  [row] = await sql`select unsubscribed_at from waitlist_signups where id = 1`;
  assert.ok(row.unsubscribed_at);

  const [demand] = await sql`select count(*)::int as n from waitlist_pick_demand where product_id = 'creatine'`;
  assert.equal(demand.n, 0, 'unsubscribed people drop out of the demand view');
});
