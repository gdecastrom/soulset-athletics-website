/* Runs before every build (npm run build): applies pending migrations and copies the code catalogue into the
   database, so the database is always in step with the code being deployed.
   Needs the database owner's login (the site itself uses the restricted DATABASE_URL):
   - production builds, and builds outside Vercel: MIGRATION_DATABASE_URL;
   - Vercel preview and development builds: PREVIEW_MIGRATION_DATABASE_URL only, pointing at a Neon branch. They never
     use MIGRATION_DATABASE_URL, so a branch's unfinished migration or prices can't reach production.
   Without it (local builds), it does nothing. */
import postgres from 'postgres';
import { syncCatalog } from '../lib/server/catalog-sync.ts';
import { migrate, withReleaseLock } from '../lib/server/migrations.ts';

const vercelEnv = process.env.VERCEL_ENV;
const preview = Boolean(vercelEnv) && vercelEnv !== 'production';
const name = preview ? 'PREVIEW_MIGRATION_DATABASE_URL' : 'MIGRATION_DATABASE_URL';
const url = process.env[name];

if (!url) {
  console.log(`release: ${name} is not set, skipping migrations and catalogue sync`);
} else {
  console.log(`release: migrating ${new URL(url).host}${new URL(url).pathname} (${name})`);
  const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
  try {
    await withReleaseLock(sql, async () => {
      await migrate(sql);
      await syncCatalog(sql);
    });
  } finally {
    await sql.end();
  }
}
