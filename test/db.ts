/* Test database helpers. TEST_DATABASE_URL is a throwaway database: its public schema is dropped and rebuilt
   from db/migrations, then the catalogue is synced, exactly as a deploy does.
   The API connects as TEST_DATABASE_URL; setup runs as TEST_ADMIN_DATABASE_URL (defaults to the same URL).
   If TEST_DATABASE_URL logs in as soulset_app, its password is set from that URL, so the tests prove the
   restricted role's permissions are enough. */
import postgres from 'postgres';
import { syncCatalog } from '../lib/server/catalog-sync.ts';
import { migrate } from '../lib/server/migrations.ts';

export const TEST_DB = process.env.TEST_DATABASE_URL;
export const skipReason = !TEST_DB && 'set TEST_DATABASE_URL to run the database tests';

export async function freshDatabase() {
  const admin = postgres(process.env.TEST_ADMIN_DATABASE_URL || TEST_DB!, { max: 1, onnotice: () => {} });
  await admin.unsafe('drop schema public cascade; create schema public;');
  await migrate(admin, () => {});
  await syncCatalog(admin, () => {});
  const app = new URL(TEST_DB!);
  if (app.username === 'soulset_app') await admin.unsafe(`alter role soulset_app login password '${decodeURIComponent(app.password).replace(/'/g, "''")}'`);
  return admin;
}
