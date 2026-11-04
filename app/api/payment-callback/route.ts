/* /api/payment-callback: where the payment provider sends the customer (and/or its server) after payment.
   Verifies the result with the provider, records it, moves the order out of 'pending' once, then redirects the
   customer to the order page: /order?number=SA-000123&status=paid (/es/order for Spanish orders).
   The one POST route without sameOrigin: the provider's page posts here from its own domain, so the signature check
   in verifyCallback is what keeps forged results out. It is rate-limited like the others. */
import type postgres from 'postgres';
import { href, type Lang } from '../../../lib/i18n.ts';
import { db } from '../../../lib/server/db.ts';
import { siteUrl } from '../../../lib/server/http.ts';
import { getProvider, type PaymentResult, type Provider } from '../../../lib/server/payments/index.ts';
import { overLimit } from '../../../lib/server/rate-limit.ts';

const STATUSES = new Set(['paid', 'declined', 'cancelled', 'error']);
const back = (request: Request, lang: Lang, status: string, number?: string) =>
  Response.redirect(`${siteUrl(request)}${href(lang, '/order')}?${new URLSearchParams({ status, ...(number ? { number } : {}) })}`, 303);

/* What gets stored from a callback: at most 20 fields of bounded size, so payment_event (append-only, never
   cleaned) stays under its 8 kB per row whatever is sent. */
const payloadOf = (data: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(data).slice(0, 20).map(([k, v]) => [k.slice(0, 64), String(v ?? '').slice(0, 300)]));

const recordUnverified = (sql: postgres.Sql, provider: Provider, payload: Record<string, string>) =>
  sql`insert into payment_event (payment_provider, status, verified, payload) values (${provider.name}, 'unverified', false, ${sql.json(payload)})`
    .catch(err => console.error('[payment-callback] could not record the callback', (err as Error).message));

type Order = { id: number; number: string; status: string; site_language: Lang; total_cents: number; currency: string };

async function handle(request: Request) {
  let provider: Provider;
  try { provider = getProvider(); } catch (err) { console.error('[payment-callback]', (err as Error).message); return back(request, 'en', 'error'); }
  const sql = db();
  if (!sql) { console.error('[payment-callback] DATABASE_URL is not set'); return back(request, 'en', 'error'); }

  try {
    if (await overLimit(sql, request, 'payment_callback', { limit: 30, window: '10 minutes' })) return back(request, 'en', 'error');
  } catch (err) { console.error('[payment-callback] database error', (err as Error).message); return back(request, 'en', 'error'); }

  let result: PaymentResult;
  try {
    result = await provider.verifyCallback(request);
    if (!STATUSES.has(result.status) || !Number.isInteger(result.orderId)) throw new Error('Provider returned an unknown result');
  } catch (err) {
    console.error('[payment-callback] could not verify', (err as Error).message);
    await recordUnverified(sql, provider, payloadOf(Object.fromEntries(new URL(request.url).searchParams)));
    return back(request, 'en', 'error');
  }

  const payload = payloadOf(result.payload || {});
  try {
    /* Event and status change commit together. Only a pending order changes, so a repeated or late callback can't turn
       a paid order into a declined one; the database enforces the same rule (sales_order_guard). */
    const order = await sql.begin(async tx => {
      const [o] = await tx<Order[]>`
        select id, order_number as number, status, site_language, total_cents, currency from sales_order
        where id = ${result.orderId} and payment_provider = ${provider.name} for update`;
      if (!o) return null;
      /* A payment for a different amount than the order's total is not a payment for this order. */
      const wrongAmount = result.status === 'paid' && (result.amountCents !== o.total_cents || result.currency !== o.currency);
      if (wrongAmount) console.error('[payment-callback] paid amount does not match order', o.number, result.amountCents, result.currency);
      const status = wrongAmount ? 'error' : result.status;
      await tx`
        insert into payment_event (sales_order_id, payment_provider, status, verified, payload)
        select ${o.id}, ${provider.name}, ${result.status}, true, ${tx.json(payload)}
        where not exists (select 1 from payment_event where sales_order_id = ${o.id} and status = ${result.status} and payload = ${tx.json(payload)})`;
      if (o.status !== 'pending') return o;
      await tx`
        update sales_order set status = ${status}, provider_reference = ${result.reference || null},
               paid_at = case when ${status} = 'paid' then now() else paid_at end
        where id = ${o.id}`;
      return { ...o, status };
    });
    if (!order) {
      console.error('[payment-callback] verified result for an unknown order', result.orderId);
      await recordUnverified(sql, provider, payload);
      return back(request, 'en', 'error');
    }
    return back(request, order.site_language, order.status === 'pending' ? 'error' : order.status, order.number);
  } catch (err) {
    console.error('[payment-callback] database error', (err as Error).message);
    return back(request, 'en', 'error');
  }
}

export const GET = handle;
export const POST = handle;
