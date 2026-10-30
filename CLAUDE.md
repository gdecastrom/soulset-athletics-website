# Soulset Athletics website

Next.js 16 (App Router, React 19, TypeScript) on Vercel, Postgres on Neon, email through Resend. Read
`docs/guia-de-desarrollo.md` (team rules, in Spanish) before changing anything, and `docs/database.md` before touching
the database.

## Rules

- Every page exists in English (no prefix) and Spanish (`/es`) under `app/[lang]`. Build links with `href(lang, path)`
  from `lib/i18n.ts`; give each page `generateMetadata` with `alternates(lang, path)`.
- Interface copy lives in `lib/dict.ts` (same keys in `en` and `es`); product data in `lib/catalog-data.ts`. Never
  duplicate either per language. Spanish addresses the reader as tú. No filler copy.
- Never change an option value `id` in the catalogue once published: it is part of the SKU stored in the database.
- No divider lines between page sections.
- Database: follow `docs/database.md`. English `snake_case`, singular tables. Changes go in a new numbered file in
  `db/migrations/`; never edit an applied migration. Every table and column gets a `comment on`, every FK an index and a
  deliberate `ON DELETE` (no reflexive cascades), grants for `soulset_app` in the same migration. Regenerate
  `docs/data-dictionary.md` with `scripts/data-dictionary.ts`.
- API: validate on the server (`lib/server/validate.ts`), `sameOrigin` + `overLimit` on POST routes, prices only from
  the catalogue. Never add endpoints that read, edit or delete orders. Server code stays in `lib/server/`.
- Secrets only in environment variables; never in code or Git.

## Checks before a PR

```bash
npm run typecheck
```

```bash
TEST_DATABASE_URL=<throwaway database> npm test
```

```bash
npm run build
```

`npm test` drops and rebuilds the schema of the database it gets: never point it at production.
