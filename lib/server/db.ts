import postgres from 'postgres';

/* One connection per function instance. prepare:false keeps it compatible with poolers
   (Neon's -pooler host, PgBouncer); idle_timeout lets frozen instances let go of it.
   Returns null when no database is configured. */
let client: postgres.Sql | null = null;

export function db() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) return null;
  client ??= postgres(url, { max: 1, prepare: false, idle_timeout: 20, connect_timeout: 10 });
  return client;
}
