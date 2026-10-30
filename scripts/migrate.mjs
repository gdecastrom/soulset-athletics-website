/* Creates or updates the tables, views and triggers in db/schema.sql. Run it with the database owner login. Usage: DATABASE_URL=postgres://… npm run db:migrate */
import { readFile } from 'node:fs/promises';
import postgres from 'postgres';

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) { console.error('Set DATABASE_URL first.'); process.exit(1); }

const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
try {
  await sql.unsafe(await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8'));
  const [{ n }] = await sql`select count(*)::int as n from waitlist_signups`;
  console.log(`Schema is up to date. waitlist_signups has ${n} row(s).`);
} finally {
  await sql.end();
}
