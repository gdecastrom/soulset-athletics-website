import postgres from 'postgres';

/* One connection per function instance. prepare:false keeps it compatible with poolers
   (Neon's -pooler host, PgBouncer); idle_timeout lets frozen instances let go of it.
   Returns null when no database is configured. Only DATABASE_URL counts, never the POSTGRES_URL that Vercel's Neon
   integration sets: that one is the owner's login, and the site must run as the restricted soulset_app. */
let client: postgres.Sql | null = null;

export function db() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  client ??= postgres(url, { max: 1, prepare: false, idle_timeout: 20, connect_timeout: 10 });
  return client;
}
