/* Migrations run once, in order, and an applied migration can't be edited. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { migrate } from '../lib/server/migrations.ts';
import { freshDatabase, skipReason as skip } from './db.ts';

test('re-running migrations is a no-op, and an edited migration stops the deploy', { skip }, async () => {
  const sql = await freshDatabase();
  try {
    const logs: string[] = [];
    await migrate(sql, m => logs.push(m));
    assert.deepEqual(logs, ['migrations: up to date']);
    await sql`update schema_migration set checksum = 'edited' where name = '0001_initial.sql'`;
    await assert.rejects(migrate(sql, () => {}), /was edited after it was applied/);
  } finally {
    await sql.end();
  }
});

test('every table and column is documented in the schema', { skip }, async () => {
  const sql = await freshDatabase();
  try {
    const missing = await sql`
      select c.relname || coalesce('.' || a.attname, '') as name
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      left join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
      where n.nspname = 'public' and c.relkind = 'r' and c.relname <> 'schema_migration'
        and (obj_description(c.oid) is null or col_description(c.oid, a.attnum) is null)`;
    assert.deepEqual(missing.map(m => m.name), []);
  } finally {
    await sql.end();
  }
});
