/* Applies db/migrations/NNNN_*.sql in order, each in its own transaction, and records them in schema_migration.
   An applied migration must never change: if its file no longer matches the recorded checksum, nothing runs. */
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import type postgres from 'postgres';

const DIR = new URL('../../db/migrations/', import.meta.url);
const LOCK = 7_340_221; // pg_advisory_lock key, so two deploys can't migrate at the same time

/* Holds the lock for a whole release (migrations, then catalogue sync), so two deploys can't interleave.
   The lock is per connection and re-entrant, so migrate() taking it again inside is fine; sql must have max: 1. */
export async function withReleaseLock<T>(sql: postgres.Sql, fn: () => Promise<T>) {
  await sql`select pg_advisory_lock(${LOCK})`;
  try {
    return await fn();
  } finally {
    await sql`select pg_advisory_unlock(${LOCK})`;
  }
}

export async function migrate(sql: postgres.Sql, log: (msg: string) => void = console.log) {
  await sql`select pg_advisory_lock(${LOCK})`;
  try {
    await sql.unsafe(`
      create table if not exists schema_migration (
        id         bigint generated always as identity primary key,
        name       text not null unique,
        checksum   text not null,
        applied_at timestamptz not null default now()
      );
      comment on table schema_migration is 'Migrations applied from db/migrations, in order. Written by lib/server/migrations.ts only.';
      comment on column schema_migration.id is 'Surrogate key. Carries no business meaning.';
      comment on column schema_migration.name is 'File name of the migration, e.g. 0001_initial.sql.';
      comment on column schema_migration.checksum is 'SHA-256 of the file as applied. A different checksum later means the file was edited, and the deploy stops.';
      comment on column schema_migration.applied_at is 'When the migration ran (UTC).';`);
    const applied = new Map((await sql<{ name: string; checksum: string }[]>`select name, checksum from schema_migration`).map(r => [r.name, r.checksum]));
    const files = (await readdir(DIR)).filter(f => f.endsWith('.sql')).sort();
    /* A misnamed file would otherwise be skipped without a word, and a deleted one would go unnoticed. */
    const misnamed = files.filter(f => !/^\d{4}_[a-z0-9_]+\.sql$/.test(f));
    if (misnamed.length) throw new Error(`Migration file names must look like 0002_add_something.sql: ${misnamed.join(', ')}`);
    const missing = [...applied.keys()].filter(name => !files.includes(name));
    if (missing.length) throw new Error(`Applied migrations are missing from db/migrations: ${missing.join(', ')}. Restore them.`);

    const pending: { name: string; text: string; checksum: string }[] = [];
    for (const name of files) {
      const text = await readFile(new URL(name, DIR), 'utf8');
      const checksum = createHash('sha256').update(text).digest('hex');
      if (applied.has(name)) {
        if (applied.get(name) !== checksum) throw new Error(`Migration ${name} was edited after it was applied. Revert the edit and put the change in a new migration.`);
      } else pending.push({ name, text, checksum });
    }
    for (const m of pending) {
      await sql.begin(async tx => {
        await tx.unsafe(m.text);
        await tx`insert into schema_migration (name, checksum) values (${m.name}, ${m.checksum})`;
      });
      log(`applied ${m.name}`);
    }
    if (!pending.length) log('migrations: up to date');
  } finally {
    await sql`select pg_advisory_unlock(${LOCK})`;
  }
}
