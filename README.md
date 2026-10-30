# Soulset Athletics — website

Pre-launch website for **Soulset Athletics**, sports nutrition for people who put their whole soul into it. *Mentality > Everything.*

Built with **Next.js 16** (App Router, React 19, TypeScript) and deployed on **Vercel**. Sign-ups are stored in **Postgres** (Neon) and confirmed by email through **Resend**. Checkout with a Dominican payment gateway (Azul or CardNet) is built on the server and switched off until launch.

Team rules for working on it (in Spanish): [docs/guia-de-desarrollo.md](docs/guia-de-desarrollo.md).

## Pages

English has no prefix, Spanish lives under `/es`, and every page exists in both:

| Page | URL |
| --- | --- |
| Home | `/`, `/es` |
| Shop, by category | `/shop`, `/shop/fuel` · `hydrate` · `build` · `ignite` · `stacks` |
| Product | `/products/<id>`, e.g. `/products/sodium` |
| Fuel planner | `/fuel-planner` |
| Manifesto, help | `/manifesto`, `/help` |
| Waitlist | `/waitlist` → `/waitlist/confirmed` |
| After paying (launch) | `/order?status=paid&number=SA-000123` |

Product, category and content pages are pre-rendered at build time, with their own titles, descriptions, social previews, `hreflang` links and a `sitemap.xml`. Links to the first version's hash routes (`/#p-sodium`, `/#shop-fuel`…) are sent to the new pages.

`proxy.ts` serves the English pages from `app/[lang]` (`/shop` is rendered as `[lang] = en`) and redirects any `/en/...` URL to its unprefixed address.

## Pre-launch: waitlist instead of checkout

Orders aren't open yet. Visitors browse the line-up, use the Fuel Planner and build a cart, which works as a wishlist; every purchase path leads to the waitlist. The cart is kept in the browser (`localStorage`), shared by both languages.

### How sign-ups are stored

The waitlist form and the home page box `POST` to `/api/waitlist` (`app/api/waitlist/route.ts`), which:

1. validates everything again on the server (email, known province, known products, size limits), refuses cross-site requests and rate-limits each IP to 5 requests per 10 minutes;
2. saves it as a `customer`, a `waitlist_signup` and the cart as `waitlist_pick` rows (one per product variant). Signing up again with the same email updates the same rows instead of creating duplicates;
3. emails a confirmation in the visitor's language through Resend, with an unsubscribe link (`/api/unsubscribe`, signed so nobody can unsubscribe someone else), and optionally a short notice to the team (`NOTIFY_EMAIL`).

If email isn't configured yet, sign-ups are still saved. Useful queries (Neon SQL editor):

```sql
select c.email, c.first_name, p.name as province, s.site_language, s.created_at
from waitlist_signup s join customer c on c.id = s.customer_id left join province p on p.id = c.province_id
where s.unsubscribed_at is null order by s.created_at desc;

select * from waitlist_pick_demand;   -- which variants people want most
```

## Editing content

- **Products** (names, options, prices, nutrition, copy in both languages): `lib/catalog-data.ts`. The pages read it, and every deploy copies products, variants and prices into the database (price changes are kept as history). Never change an existing option value id: it's part of the SKU.
- **Interface copy** (headings, buttons, FAQ, manifesto): `lib/dict.ts`, English first, then Spanish. Spanish always addresses the visitor as *tú*. A test fails if the two languages don't have the same entries.
- **Styles**: `app/globals.css` (design tokens at the top).
- **Images**: `public/img/*.webp`, square 900×900 for products.

## Security

- **No way to edit orders from the internet.** The only order endpoints are `/api/checkout`, which can only *create* a pending order, and `/api/payment-callback`, which only accepts results it can verify with the payment provider. Nothing reads or updates an order by id from the browser, and the order page never reads the database.
- **Prices come from the server.** Totals are computed from `lib/catalog-data.ts`; whatever price the browser sends is ignored.
- **The database enforces it too.** Triggers refuse any change to an order's amounts, customer or delivery details after it's created, allow status changes only forward (`pending` → `paid` / `declined` / `cancelled` / `error`, `paid` → `refunded`), check that an order's subtotal matches its items, and refuse deletes. Order items, payment events and prices are append-only. This holds even with a bug in the app.
- **Least-privilege database login.** The migrations create `soulset_app`, which can add rows and update only the columns the site needs: no deletes (except a wishlist's picks), no schema changes, can't disable the triggers. The site uses that role; the owner login is only for deploys and for the team in the Neon console.
- **Headers.** A strict Content Security Policy (own scripts, styles, fonts and images only), HSTS, `X-Frame-Options: DENY`, `nosniff`, and no indexing of `/api` or preview deployments.
- **Card data never touches the site**: Azul and CardNet both offer hosted payment pages.

## Run locally

```bash
npm install
MIGRATION_DATABASE_URL=postgres://… npm run db:release   # migrations + catalogue sync, as the owner
DATABASE_URL=postgres://… APP_SECRET=dev npm run dev     # http://localhost:3000
```

Checks:

```bash
npm run typecheck
npm run build
TEST_DATABASE_URL=postgres://… npm test   # drops and rebuilds that database's schema: use a throwaway one
```

`npm test` runs the catalogue, copy and planner checks, plus the API tests against a real Postgres when `TEST_DATABASE_URL` is set. To prove the restricted role is enough, set `TEST_ADMIN_DATABASE_URL` to the owner and `TEST_DATABASE_URL` to `soulset_app`. Tests need Node 22.18 or newer.

## Deploy on Vercel

1. **Project.** Import the GitHub repository in Vercel (framework: Next.js, defaults are fine).
2. **Database.** Create a Neon project (or *Storage* → *Create database* → **Neon** in Vercel).
   1. Set `MIGRATION_DATABASE_URL` to the owner's connection string. Every build runs `scripts/release.ts` first: pending migrations, then the catalogue sync.
   2. After the first deploy, give the site's login a password once, in the Neon SQL editor: `alter role soulset_app login password '…';`
   3. Set `DATABASE_URL` to the `soulset_app` connection string (use the `-pooler` host).
   4. Give preview deployments their own Neon branch so tests on previews never touch real sign-ups or orders.
3. **Secret.** Add `APP_SECRET` (`openssl rand -base64 32`). Don't change it later: it signs the unsubscribe links already sent.
4. **Resend.** Verify the domain in Resend (DNS records at your registrar), create an API key, then set `RESEND_API_KEY`, `EMAIL_FROM` (e.g. `Soulset Athletics <hola@soulsetathletics.com>`), and optionally `EMAIL_REPLY_TO` and `NOTIFY_EMAIL`.
5. **Domain.** Add the custom domain in Vercel → *Domains* and set `SITE_URL` to it, so canonical links, the sitemap, social previews and email links use it.

The code is plain Postgres: moving to Railway later means pointing both URLs there and redeploying. The design, business rules and ERD are in [docs/database.md](docs/database.md), the column-by-column dictionary in [docs/data-dictionary.md](docs/data-dictionary.md). All variables are listed in `.env.example`.

## Payments (ready for launch, off for now)

Checkout returns 404 until `CHECKOUT_ENABLED=true`. What's in place:

- `POST /api/checkout` validates delivery details, prices the cart on the server, creates a pending order (`SA-000123`) and returns where to send the customer: a redirect, or a form to auto-submit to the gateway's hosted page.
- `/api/payment-callback` verifies the result with the provider, records it in `payment_events`, moves the order out of `pending` once, and sends the customer to `/order`.
- Providers in `lib/server/payments/`: `test` (fake gateway for local and preview testing, refused in production), and `azul` / `cardnet` stubs that describe what each one needs. The interface is in `lib/server/payments/index.ts`.

To open orders: get the merchant account and sandbox credentials from Azul or CardNet, implement that provider file against their docs, build the checkout page, add the gateway's hosted-page origin to `PAYMENT_FORM_ORIGINS` (the security policy blocks posting forms anywhere else), and try it on a preview deployment, first with `PAYMENT_PROVIDER=test`, then with the provider's sandbox. Finally set `CHECKOUT_ENABLED=true`, `PAYMENT_PROVIDER` and `SHIPPING_FEE_USD` in production.

## Structure

```
app/[lang]/             Pages (layout, home, shop, products, fuel-planner, manifesto, help, waitlist, order)
app/api/                waitlist, unsubscribe, checkout, payment-callback
app/globals.css         Design tokens and all styles
app/fonts/              Saira Extra Condensed, Barlow, IBM Plex Mono (subset woff2, loaded with next/font)
components/             Header, footer, cart, product page, fuel planner, waitlist forms
lib/catalog-data.ts     Products in both languages
lib/catalog.ts          Product types, prices, server-side cart pricing
lib/dict.ts             Interface copy in both languages
lib/planner.ts          Fuel planner maths
lib/server/             Database, validation, emails, rate limiting, payment providers (server only)
db/migrations/          Numbered SQL migrations (never edited once applied)
docs/database.md        Database design: rules, entities, ERD, history
docs/data-dictionary.md Every table and column, generated from the schema
scripts/release.ts      Runs before each build: migrations + catalogue sync
proxy.ts                English / Spanish routing
test/                   Catalogue, copy, planner and API tests (npm test)
```

## Brand system

- **Colours:** Soulset Black `#0A0A0A`, Bone `#F2F0EB`, Ignite `#FF5A1F` (actions and the ">" only; text on Ignite is always black)
- **Type:** Saira Extra Condensed 800/900 (display, uppercase), Barlow 400–600 (body), IBM Plex Mono (nutrition data)
- **Mark:** SA level-up mark, a squared S with stacked chevrons (Believe → Act → Results)

## Before launch

- [ ] Deploy on Vercel with Neon and Resend (see *Deploy on Vercel*)
- [ ] Custom domain, and `SITE_URL` set to it
- [ ] Real formulations and nutrition panels from the manufacturer
- [ ] Final prices and currency (USD vs RD$)
- [ ] Real product photography (current images are 3D renders)
- [ ] Legal pages (privacy policy, terms), and a privacy note on the waitlist form
- [ ] Standard shipping fee below US$75 (needed for `SHIPPING_FEE_USD`)
- [ ] When orders open: Azul or CardNet merchant account, then finish *Payments* above

## Licences

Fonts are licensed under the [SIL Open Font License 1.1](https://openfontlicense.org): Saira (Omnibus-Type), Barlow (Jeremy Tribby), IBM Plex Mono (IBM).

Code, copy, product renders and the Soulset Athletics name and marks: © 2026 Soulset Athletics. All rights reserved.
