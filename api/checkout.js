/* POST /api/checkout — creates a pending order and hands the customer to the payment provider.
   Off until launch: returns 404 unless CHECKOUT_ENABLED=true. See README → Payments.

   Body: { email, siteLanguage, customer: { firstName, lastName, phone, address, city, province, notes },
           cart: [{ id, opts, qty, sub }] }   (cart lines exactly as the site stores them)
   Reply: { orderNumber, redirectUrl } or { orderNumber, form: { action, fields } } */
import { sql } from '../lib/db.js';
import { json, readJson, sameOrigin, siteUrl } from '../lib/http.js';
import { overLimit } from '../lib/rate-limit.js';
import { parseCustomer } from '../lib/validate.js';
import { priceCart } from '../lib/catalog.js';
import { getProvider } from '../lib/payments/index.js';

export async function POST(request) {
  if (process.env.CHECKOUT_ENABLED !== 'true') return json(404, { error: 'checkout_closed' });
  if (!sameOrigin(request)) return json(403, { error: 'forbidden' });
  const shipping = Number(process.env.SHIPPING_FEE_USD);
  let provider;
  try {
    if (!sql) throw new Error('DATABASE_URL is not set');
    if (!process.env.SHIPPING_FEE_USD || !(shipping >= 0)) throw new Error('SHIPPING_FEE_USD is not set');
    provider = getProvider();
  } catch (err) { console.error('[checkout] not configured:', err.message); return json(503, { error: 'not_configured' }); }

  const { body, error } = await readJson(request);
  if (error) return error;
  const parsed = parseCustomer(body);
  if (!parsed.ok) return json(400, { error: parsed.error });
  const priced = priceCart(body.cart, { shippingCents: Math.round(shipping * 100) });
  if (!priced) return json(400, { error: 'invalid_cart' });
  const { email, customer, siteLanguage } = parsed.value;

  let order;
  try {
    if (await overLimit(request, 'checkout', { limit: 10, window: '10 minutes' })) return json(429, { error: 'rate_limited' });
    [order] = await sql`
      insert into orders (email, customer, items, subtotal_cents, shipping_cents, total_cents, currency, site_language, provider)
      values (${email}, ${sql.json(customer)}, ${sql.json(priced.items)}, ${priced.subtotalCents}, ${priced.shippingCents},
              ${priced.totalCents}, ${priced.currency}, ${siteLanguage}, ${provider.name})
      returning *`;
  } catch (err) { console.error('[checkout] database error', err.message); return json(500, { error: 'server_error' }); }

  try {
    const simulate = new URL(request.url).searchParams.get('simulate') || undefined;
    const payment = await provider.createPayment({ order, returnUrl: `${siteUrl(request)}/api/payment-callback`, simulate });
    return json(200, { orderNumber: order.number, ...payment });
  } catch (err) {
    console.error('[checkout] provider error', order.number, err.message);
    await sql`update orders set status = 'error', updated_at = now() where id = ${order.id}`.catch(() => {});
    return json(502, { error: 'payment_unavailable' });
  }
}
