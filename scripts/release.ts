/* Runs before every build (npm run build): applies pending migrations and copies the code catalogue into the
   database, so the database is always in step with the code being deployed.
   Needs MIGRATION_DATABASE_URL, the database owner's login (the site itself uses the restricted DATABASE_URL).
   Without it (local builds), it does nothing. */
import postgres from 'postgres';
import { syncCatalog } from '../lib/server/catalog-sync.ts';
import { migrate } from '../lib/server/migrations.ts';

const url = process.env.MIGRATION_DATABASE_URL;
if (!url) {
  console.log('release: MIGRATION_DATABASE_URL is not set, skipping migrations and catalogue sync');
} else {
  const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
  try {
    await migrate(sql);
    await syncCatalog(sql);
  } finally {
    await sql.end();
  }
}
