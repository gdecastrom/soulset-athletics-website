/* /api/payment-callback — where the payment provider sends the customer (and/or its server) after payment.
   Verifies the result with the provider, records it, moves the order out of 'pending' once, then redirects the
   customer back to the site: /#order-paid, /#order-declined, … (es/ for Spanish orders). */
import { sql } from '../lib/db.js';
import { siteUrl } from '../lib/http.js';
import { getProvider } from '../lib/payments/index.js';

const STATUSES = new Set(['paid', 'declined', 'cancelled', 'error']);
const back = (request, lang, status, number) =>
  Response.redirect(`${siteUrl(request)}/${lang === 'es' ? 'es/' : ''}${number ? '?order=' + encodeURIComponent(number) : ''}#order-${status}`, 303);

async function handle(request) {
  let provider;
  try { provider = getProvider(); } catch (err) { console.error('[payment-callback]', err.message); return back(request, 'en', 'error'); }
  if (!sql) { console.error('[payment-callback] DATABASE_URL is not set'); return back(request, 'en', 'error'); }

  let result;
  try {
    result = await provider.verifyCallback(request);
    if (!STATUSES.has(result.status) || !Number.isInteger(result.orderId)) throw new Error('Provider returned an unknown result');
  } catch (err) {
    console.error('[payment-callback] could not verify', err.message);
    const payload = Object.fromEntries(new URL(request.url).searchParams);
    await sql`insert into payment_events (provider, status, verified, payload) values (${provider.name}, 'unverified', false, ${sql.json(payload)})`.catch(() => {});
    return back(request, 'en', 'error');
  }

  try {
    await sql`insert into payment_events (order_id, provider, status, verified, payload)
              values (${result.orderId}, ${provider.name}, ${result.status}, true, ${sql.json(result.payload || {})})`;
    /* Only a pending order changes, so a repeated or late callback can't turn a paid order into a declined one. */
    await sql`
      update orders set status = ${result.status}, provider_reference = ${result.reference || null},
             paid_at = case when ${result.status} = 'paid' then now() else paid_at end, updated_at = now()
      where id = ${result.orderId} and status = 'pending' and provider = ${provider.name}`;
    const [order] = await sql`select number, status, site_language from orders where id = ${result.orderId}`;
    if (!order) return back(request, 'en', 'error');
    return back(request, order.site_language, order.status === 'pending' ? 'error' : order.status, order.number);
  } catch (err) {
    console.error('[payment-callback] database error', err.message);
    return back(request, 'en', 'error');
  }
}

export const GET = handle;
export const POST = handle;
