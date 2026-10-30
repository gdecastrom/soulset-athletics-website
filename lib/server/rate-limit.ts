import { createHash } from 'node:crypto';
import type postgres from 'postgres';

/* Counts requests per IP and bucket in Postgres (no extra service needed at this traffic).
   IPs are stored only as hashes salted with APP_SECRET. Returns true when the request is over the limit. */
export async function overLimit(sql: postgres.Sql, request: Request, bucket: 'waitlist' | 'checkout', { limit, window }: { limit: number; window: string }) {
  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown';
  const ipHash = createHash('sha256').update(`${process.env.APP_SECRET || ''}:${ip}`).digest('hex');
  const [{ recent }] = await sql<{ recent: number }[]>`
    with hit as (insert into rate_limit_hit (bucket, ip_hash) values (${bucket}, ${ipHash}))
    select count(*)::int as recent from rate_limit_hit
    where bucket = ${bucket} and ip_hash = ${ipHash} and created_at > now() - ${window}::interval`;
  if (Math.random() < 0.02) await sql`delete from rate_limit_hit where created_at < now() - interval '1 day'`;
  return recent >= limit;
}
