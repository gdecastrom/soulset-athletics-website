/* /api/payment-callback: where the payment provider sends the customer (and/or its server) after payment.
   Verifies the result with the provider, records it, moves the order out of 'pending' once, then redirects the
   customer to the order page: /order?number=SA-000123&status=paid (/es/order for Spanish orders). */
import { href, type Lang } from '../../../lib/i18n.ts';
import { db } from '../../../lib/server/db.ts';
import { siteUrl } from '../../../lib/server/http.ts';
import { getProvider, type PaymentResult, type Provider } from '../../../lib/server/payments/index.ts';

const STATUSES = new Set(['paid', 'declined', 'cancelled', 'error']);
const back = (request: Request, lang: Lang, status: string, number?: string) =>
  Response.redirect(`${siteUrl(request)}${href(lang, '/order')}?${new URLSearchParams({ status, ...(number ? { number } : {}) })}`, 303);

async function handle(request: Request) {
  let provider: Provider;
  try { provider = getProvider(); } catch (err) { console.error('[payment-callback]', (err as Error).message); return back(request, 'en', 'error'); }
  const sql = db();
  if (!sql) { console.error('[payment-callback] DATABASE_URL is not set'); return back(request, 'en', 'error'); }

  let result: PaymentResult;
  try {
    result = await provider.verifyCallback(request);
    if (!STATUSES.has(result.status) || !Number.isInteger(result.orderId)) throw new Error('Provider returned an unknown result');
  } catch (err) {
    console.error('[payment-callback] could not verify', (err as Error).message);
    const payload = Object.fromEntries(new URL(request.url).searchParams);
    await sql`insert into payment_events (provider, status, verified, payload) values (${provider.name}, 'unverified', false, ${sql.json(payload)})`.catch(() => {});
    return back(request, 'en', 'error');
  }

  try {
    await sql`insert into payment_events (order_id, provider, status, verified, payload)
              values (${result.orderId}, ${provider.name}, ${result.status}, true, ${sql.json(JSON.parse(JSON.stringify(result.payload || {})))})`;
    /* Only a pending order changes, so a repeated or late callback can't turn a paid order into a declined one.
       The database enforces the same rule (orders_guard trigger in db/schema.sql). */
    await sql`
      update orders set status = ${result.status}, provider_reference = ${result.reference || null},
             paid_at = case when ${result.status} = 'paid' then now() else paid_at end, updated_at = now()
      where id = ${result.orderId} and status = 'pending' and provider = ${provider.name}`;
    const [order] = await sql<{ number: string; status: string; site_language: Lang }[]>`select number, status, site_language from orders where id = ${result.orderId}`;
    if (!order) return back(request, 'en', 'error');
    return back(request, order.site_language, order.status === 'pending' ? 'error' : order.status, order.number);
  } catch (err) {
    console.error('[payment-callback] database error', (err as Error).message);
    return back(request, 'en', 'error');
  }
}

export const GET = handle;
export const POST = handle;
