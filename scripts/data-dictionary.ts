/* Writes docs/data-dictionary.md from the live schema and its comments, so the dictionary can't drift from the database.
   Usage: DATABASE_URL=postgres://… node scripts/data-dictionary.ts   (any database with the migrations applied) */
import { writeFile } from 'node:fs/promises';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
try {
  const tables = await sql<{ name: string; comment: string | null }[]>`
    select c.relname as name, obj_description(c.oid) as comment
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and c.relname <> 'schema_migration'
    order by c.relname`;
  const cols = await sql<{ table_name: string; column_name: string; type: string; nullable: string; default: string | null; comment: string | null }[]>`
    select c.table_name, c.column_name, format_type(a.atttypid, a.atttypmod) as type, c.is_nullable as nullable,
           coalesce(c.column_default, case when c.is_identity = 'YES' then 'identity' when c.is_generated = 'ALWAYS' then 'generated: ' || c.generation_expression end) as default,
           col_description(format('public.%I', c.table_name)::regclass, c.ordinal_position) as comment
    from information_schema.columns c
    join pg_attribute a on a.attrelid = format('public.%I', c.table_name)::regclass and a.attname = c.column_name
    where c.table_schema = 'public' and c.table_name <> 'schema_migration'
    order by c.table_name, c.ordinal_position`;
  const cons = await sql<{ table_name: string; column_name: string; kind: string; def: string }[]>`
    select rel.relname as table_name, att.attname as column_name, con.contype as kind, pg_get_constraintdef(con.oid) as def
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace n on n.oid = rel.relnamespace
    join lateral unnest(con.conkey) k(attnum) on true
    join pg_attribute att on att.attrelid = rel.oid and att.attnum = k.attnum
    where n.nspname = 'public'`;
  const keyOf = (t: string, c: string) => {
    const k = cons.filter(x => x.table_name === t && x.column_name === c);
    const out: string[] = [];
    if (k.some(x => x.kind === 'p')) out.push('PK');
    for (const f of k.filter(x => x.kind === 'f')) out.push('FK → ' + f.def.match(/REFERENCES (\w+)/)![1]);
    if (k.some(x => x.kind === 'u' && !/,/.test(x.def))) out.push('UNIQUE');
    if (k.some(x => x.kind === 'c')) out.push('CHECK');
    return out.join(', ');
  };
  const esc = (s: string | null) => (s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
  let md = '# Data dictionary\n\nGenerated from the database by `scripts/data-dictionary.ts`; edit the comments in the migrations, not this file.\n';
  for (const t of tables) {
    md += `\n## ${t.name}\n\n${esc(t.comment)}\n\n| Column | Type | Null | Default | Keys / rules | Meaning |\n|---|---|---|---|---|---|\n`;
    for (const c of cols.filter(c => c.table_name === t.name)) {
      md += `| \`${c.column_name}\` | ${c.type} | ${c.nullable === 'YES' ? 'yes' : 'no'} | ${esc(c.default)} | ${keyOf(t.name, c.column_name)} | ${esc(c.comment)} |\n`;
    }
  }
  await writeFile(new URL('../docs/data-dictionary.md', import.meta.url), md);
  console.log(`docs/data-dictionary.md: ${tables.length} tables`);
} finally {
  await sql.end();
}
