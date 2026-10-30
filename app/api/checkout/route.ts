/* POST /api/checkout: creates a pending order and hands the customer to the payment provider.
   Off until launch: returns 404 unless CHECKOUT_ENABLED=true. See README → Payments.

   It can only create new orders. Prices come from the catalogue, never from the request, and must match the
   current prices in the database (variant_price); nothing here can read or change an existing order.

   Body: { email, siteLanguage, customer: { firstName, lastName, phone, address, city, province, notes },
           cart: [{ id, opts, qty, sub }] }   (cart lines exactly as the site stores them)
   Reply: { orderNumber, redirectUrl } or { orderNumber, form: { action, fields } } */
import { priceCart } from '../../../lib/catalog.ts';
import { db } from '../../../lib/server/db.ts';
import { json, readJson, sameOrigin, siteUrl } from '../../../lib/server/http.ts';
import { getProvider, type OrderRow, type Provider } from '../../../lib/server/payments/index.ts';
import { overLimit } from '../../../lib/server/rate-limit.ts';
import { parseCustomer } from '../../../lib/server/validate.ts';

class CatalogOutOfSync extends Error {}

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
  if (new Set(priced.items.map(i => `${i.sku}/${i.subscribe}`)).size !== priced.items.length) return json(400, { error: 'invalid_cart' });
  const { email, customer: c, siteLanguage } = parsed.value;

  let order: OrderRow;
  try {
    if (await overLimit(sql!, request, 'checkout', { limit: 10, window: '10 minutes' })) return json(429, { error: 'rate_limited' });
    order = await sql!.begin(async tx => {
      /* The catalogue in the code and the prices in the database must agree, or nothing is charged. */
      const current = await tx<{ id: number; sku: string; amount_cents: number }[]>`
        select v.id, v.sku, vp.amount_cents
        from variant v join variant_price vp on vp.variant_id = v.id and vp.currency = ${priced.currency} and vp.valid_to is null
        where v.active and v.sku in ${tx(priced.items.map(i => i.sku))}`;
      const bySku = new Map(current.map(r => [r.sku, r]));
      for (const i of priced.items) if (bySku.get(i.sku)?.amount_cents !== i.listCents) throw new CatalogOutOfSync(i.sku);

      const [cust] = await tx<{ id: number }[]>`
        insert into customer (email, first_name, last_name, phone, province_id)
        values (${email}, ${c.firstName}, ${c.lastName}, ${c.phone}, (select id from province where name = ${c.province}))
        on conflict (email) do update set
          first_name = excluded.first_name, last_name = excluded.last_name, phone = excluded.phone, province_id = excluded.province_id
        returning id`;
      const [o] = await tx<OrderRow[]>`
        insert into sales_order (customer_id, currency, subtotal_cents, shipping_cents, total_cents, site_language,
          shipping_first_name, shipping_last_name, shipping_phone, shipping_address, shipping_city, shipping_province_id,
          delivery_notes, payment_provider)
        values (${cust.id}, ${priced.currency}, ${priced.subtotalCents}, ${priced.shippingCents}, ${priced.totalCents}, ${siteLanguage},
          ${c.firstName}, ${c.lastName}, ${c.phone}, ${c.address}, ${c.city}, (select id from province where name = ${c.province}),
          ${c.notes}, ${provider.name})
        returning id, order_number as number, total_cents, currency, site_language, ${email}::text as email`;
      for (const i of priced.items) {
        await tx`
          insert into sales_order_item (sales_order_id, variant_id, quantity, unit_price_cents, is_subscription)
          values (${o.id}, ${bySku.get(i.sku)!.id}, ${i.qty}, ${i.unitCents}, ${i.subscribe})`;
      }
      return o;
    });
  } catch (err) {
    if (err instanceof CatalogOutOfSync) { console.error('[checkout] price in code differs from the database for', err.message); return json(503, { error: 'catalog_out_of_sync' }); }
    console.error('[checkout] database error', (err as Error).message);
    return json(500, { error: 'server_error' });
  }

  try {
    const simulate = new URL(request.url).searchParams.get('simulate') || undefined;
    const payment = await provider.createPayment({ order, returnUrl: `${siteUrl(request)}/api/payment-callback`, simulate });
    return json(200, { orderNumber: order.number, ...payment });
  } catch (err) {
    console.error('[checkout] provider error', order.number, (err as Error).message);
    await sql!`update sales_order set status = 'error' where id = ${order.id} and status = 'pending'`.catch(() => {});
    return json(502, { error: 'payment_unavailable' });
  }
}
