/* POST /api/checkout: creates a pending order and hands the customer to the payment provider.
   Off until launch: returns 404 unless CHECKOUT_ENABLED=true. See README → Payments.

   It can only create new orders. Totals come from lib/catalog.ts, never from the request,
   and nothing here can read or change an existing order.

   Body: { email, siteLanguage, customer: { firstName, lastName, phone, address, city, province, notes },
           cart: [{ id, opts, qty, sub }] }   (cart lines exactly as the site stores them)
   Reply: { orderNumber, redirectUrl } or { orderNumber, form: { action, fields } } */
import { priceCart } from '../../../lib/catalog.ts';
import { db } from '../../../lib/server/db.ts';
import { json, readJson, sameOrigin, siteUrl } from '../../../lib/server/http.ts';
import { getProvider, type OrderRow, type Provider } from '../../../lib/server/payments/index.ts';
import { overLimit } from '../../../lib/server/rate-limit.ts';
import { parseCustomer } from '../../../lib/server/validate.ts';

export async function POST(request: Request) {
  if (process.env.CHECKOUT_ENABLED !== 'true') return json(404, { error: 'checkout_closed' });
  if (!sameOrigin(request)) return json(403, { error: 'forbidden' });
  const sql = db();
  const shipping = Number(process.env.SHIPPING_FEE_USD);
  let provider: Provider;
  try {
    if (!sql) throw new Error('DATABASE_URL is not set');
    if (!process.env.SHIPPING_FEE_USD || !(shipping >= 0)) throw new Error('SHIPPING_FEE_USD is not set');
    provider = getProvider();
  } catch (err) { console.error('[checkout] not configured:', (err as Error).message); return json(503, { error: 'not_configured' }); }

  const { body, error } = await readJson(request);
  if (error) return error;
  const parsed = parseCustomer(body);
  if (!parsed.ok) return json(400, { error: parsed.error });
  const priced = priceCart((body as { cart?: unknown }).cart, { shippingCents: Math.round(shipping * 100) });
  if (!priced) return json(400, { error: 'invalid_cart' });
  const { email, customer, siteLanguage } = parsed.value;

  let order: OrderRow;
  try {
    if (await overLimit(sql!, request, 'checkout', { limit: 10, window: '10 minutes' })) return json(429, { error: 'rate_limited' });
    [order] = await sql!<OrderRow[]>`
      insert into orders (email, customer, items, subtotal_cents, shipping_cents, total_cents, currency, site_language, provider)
      values (${email}, ${sql!.json(customer)}, ${sql!.json(priced.items)}, ${priced.subtotalCents}, ${priced.shippingCents},
              ${priced.totalCents}, ${priced.currency}, ${siteLanguage}, ${provider.name})
      returning id, number, total_cents, currency, email, site_language`;
  } catch (err) { console.error('[checkout] database error', (err as Error).message); return json(500, { error: 'server_error' }); }

  try {
    const simulate = new URL(request.url).searchParams.get('simulate') || undefined;
    const payment = await provider.createPayment({ order, returnUrl: `${siteUrl(request)}/api/payment-callback`, simulate });
    return json(200, { orderNumber: order.number, ...payment });
  } catch (err) {
    console.error('[checkout] provider error', order.number, (err as Error).message);
    await sql!`update orders set status = 'error', updated_at = now() where id = ${order.id} and status = 'pending'`.catch(() => {});
    return json(502, { error: 'payment_unavailable' });
  }
}
