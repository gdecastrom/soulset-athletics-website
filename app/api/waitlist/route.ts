/* POST /api/waitlist: saves a pre-launch sign-up and sends the confirmation email.
   Body: the JSON payload built by joinWaitlist() in lib/waitlist-client.ts (see README). */
import { db } from '../../../lib/server/db.ts';
import { emailEnabled, sendConfirmation, sendTeamNotice } from '../../../lib/server/email.ts';
import { json, readJson, sameOrigin, siteUrl } from '../../../lib/server/http.ts';
import { overLimit } from '../../../lib/server/rate-limit.ts';
import { signId } from '../../../lib/server/unsubscribe-token.ts';
import { parseSignup, type WaitlistPick } from '../../../lib/server/validate.ts';

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

    /* Signing up again updates the row: new picks replace old ones, blank fields keep what we had,
       and someone who had unsubscribed is subscribed again. */
    const [row] = await sql<{ id: number; first_name: string; picks: WaitlistPick[]; inserted: boolean; confirmation_sent_at: Date | null }[]>`
      insert into waitlist_signups (email, first_name, province, picks, source, site_language, browser_language)
      values (${s.email}, ${s.firstName}, ${s.province}, ${sql.json(s.picks)}, ${s.source}, ${s.siteLanguage}, ${s.browserLanguage})
      on conflict (email) do update set
        first_name       = coalesce(nullif(excluded.first_name, ''), waitlist_signups.first_name),
        province         = coalesce(nullif(excluded.province, ''), waitlist_signups.province),
        picks            = case when jsonb_array_length(excluded.picks) > 0 then excluded.picks else waitlist_signups.picks end,
        site_language    = excluded.site_language,
        browser_language = excluded.browser_language,
        unsubscribed_at  = null,
        updated_at       = now()
      returning id, first_name, picks, (xmax = 0) as inserted, confirmation_sent_at`;

    if (emailEnabled() && !row.confirmation_sent_at) {
      const unsubscribeUrl = `${siteUrl(request)}/api/unsubscribe?id=${row.id}&t=${signId(row.id)}`;
      const signup = { ...s, firstName: row.first_name, picks: row.picks };
      try {
        await sendConfirmation(signup, row.id, unsubscribeUrl);
        await sql`update waitlist_signups set confirmation_sent_at = now() where id = ${row.id}`;
      } catch (err) { console.error('[waitlist] confirmation email failed', row.id, (err as Error).message); }
      if (row.inserted) await sendTeamNotice(signup).catch(err => console.error('[waitlist] team notice failed', err.message));
    }
    return json(200, { ok: true });
  } catch (err) {
    console.error('[waitlist] database error', (err as Error).message);
    return json(500, { error: 'server_error' });
  }
}
