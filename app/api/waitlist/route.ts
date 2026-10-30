/* POST /api/waitlist: saves a pre-launch sign-up and sends the confirmation email.
   Body: the JSON payload built by joinWaitlist() in lib/waitlist-client.ts (see README). */
import type postgres from 'postgres';
import { db } from '../../../lib/server/db.ts';
import { emailEnabled, sendConfirmation, sendTeamNotice, type EmailPick } from '../../../lib/server/email.ts';
import { json, readJson, sameOrigin, siteUrl } from '../../../lib/server/http.ts';
import { overLimit } from '../../../lib/server/rate-limit.ts';
import { signId } from '../../../lib/server/unsubscribe-token.ts';
import { parseSignup } from '../../../lib/server/validate.ts';

/* The picks saved for a sign-up, rebuilt as catalogue choices (product + option value keys). */
async function savedPicks(sql: postgres.Sql, signupId: number): Promise<EmailPick[]> {
  const rows = await sql<{ id: number; product: string; quantity: number; option_key: string | null; value_key: string | null }[]>`
    select wp.id, p.slug as product, wp.quantity, po.key as option_key, ov.key as value_key
    from waitlist_pick wp
    join variant v on v.id = wp.variant_id
    join product p on p.id = v.product_id
    left join variant_option_value vov on vov.variant_id = v.id
    left join product_option po on po.id = vov.product_option_id
    left join option_value ov on ov.id = vov.option_value_id
    where wp.waitlist_signup_id = ${signupId}
    order by wp.id, po.position`;
  const picks = new Map<number, EmailPick>();
  for (const r of rows) {
    const pick = picks.get(r.id) ?? { productId: r.product, opts: {}, qty: r.quantity };
    if (r.option_key && r.value_key) pick.opts[r.option_key] = r.value_key;
    picks.set(r.id, pick);
  }
  return [...picks.values()];
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json(403, { error: 'forbidden' });
  const sql = db();
  if (!sql) { console.error('[waitlist] DATABASE_URL is not set'); return json(503, { error: 'not_configured' }); }
  const { body, error } = await readJson(request);
  if (error) return error;
  const parsed = parseSignup(body);
  if (!parsed.ok) return json(400, { error: parsed.error });
  const s = parsed.value;

  try {
    if (await overLimit(sql, request, 'waitlist', { limit: 5, window: '10 minutes' })) return json(429, { error: 'rate_limited' });

    /* Signing up again updates the same customer and sign-up: blank fields keep what we had, new picks replace
       the old ones (no picks keeps them), and someone who had unsubscribed is subscribed again. */
    const signup = await sql.begin(async tx => {
      const [customer] = await tx<{ id: number; first_name: string | null }[]>`
        insert into customer (email, first_name, province_id)
        values (${s.email}, ${s.firstName}, (select id from province where name = ${s.province}))
        on conflict (email) do update set
          first_name  = coalesce(excluded.first_name, customer.first_name),
          province_id = coalesce(excluded.province_id, customer.province_id)
        returning id, first_name`;
      const [row] = await tx<{ id: number; inserted: boolean; confirmation_sent_at: Date | null }[]>`
        insert into waitlist_signup (customer_id, source, site_language, browser_language)
        values (${customer.id}, ${s.source}, ${s.siteLanguage}, ${s.browserLanguage})
        on conflict (customer_id) do update set
          source           = excluded.source,
          site_language    = excluded.site_language,
          browser_language = excluded.browser_language,
          unsubscribed_at  = null
        returning id, (xmax = 0) as inserted, confirmation_sent_at`;
      if (s.picks.length) {
        await tx`delete from waitlist_pick where waitlist_signup_id = ${row.id}`;
        const rows = s.picks.map(p => ({ sku: p.sku, quantity: p.qty, is_subscription: p.subscribe }));
        await tx`
          insert into waitlist_pick (waitlist_signup_id, variant_id, quantity, is_subscription)
          select ${row.id}, v.id, x.quantity, x.is_subscription
          from jsonb_to_recordset(${tx.json(rows)}) as x (sku text, quantity int, is_subscription boolean)
          join variant v on v.sku = x.sku`;
      }
      return { ...row, firstName: customer.first_name };
    });

    if (emailEnabled() && !signup.confirmation_sent_at) {
      const unsubscribeUrl = `${siteUrl(request)}/api/unsubscribe?id=${signup.id}&t=${signId(signup.id)}`;
      const mail = { email: s.email, firstName: signup.firstName, province: s.province, siteLanguage: s.siteLanguage, source: s.source, picks: await savedPicks(sql, signup.id) };
      try {
        await sendConfirmation(mail, signup.id, unsubscribeUrl);
        await sql`update waitlist_signup set confirmation_sent_at = now() where id = ${signup.id}`;
      } catch (err) { console.error('[waitlist] confirmation email failed', signup.id, (err as Error).message); }
      if (signup.inserted) await sendTeamNotice(mail).catch(err => console.error('[waitlist] team notice failed', err.message));
    }
    return json(200, { ok: true });
  } catch (err) {
    console.error('[waitlist] database error', (err as Error).message);
    return json(500, { error: 'server_error' });
  }
}
