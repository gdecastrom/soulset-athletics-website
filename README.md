# Soulset Athletics — website

Pre-launch website for **Soulset Athletics**, sports nutrition for people who put their whole soul into it. *Mentality > Everything.*

The storefront is a static single-page site (HTML, CSS and vanilla JavaScript, hash-routed) with no build step. A few serverless functions in `api/` run on Vercel: the waitlist (saved to Postgres, confirmed by email through Resend) and, for launch, checkout with a payment gateway.

## Pre-launch mode: waitlist instead of checkout

Orders aren’t open yet, so the site has no checkout page (the server side is ready, see *Payments*). Visitors can still browse the line-up, use the Fuel Planner and build a cart, which works as a wishlist. Every purchase path leads to the waitlist:

- **Cart drawer** → "Join the waitlist" (`#waitlist`)
- **Waitlist page** (`#waitlist`): email (required), first name (optional), Dominican province (optional), plus the cart contents as "your picks"
- **Confirmation** (`#waitlist-confirmed`)
- **Home page sign-up** posts to the same waitlist
- Old links to `#checkout` and `#order-confirmed` redirect to the waitlist

### How sign-ups are stored

The form `POST`s to `/api/waitlist` (`api/waitlist.js`, set in `assets/js/config.js`), which:

1. validates everything again on the server (email, known province, cart picks, size limits) and rate-limits each IP to 5 requests per 10 minutes;
2. saves the sign-up in the `waitlist_signups` table. Signing up again with the same email updates the row (new picks replace old ones) instead of creating a duplicate;
3. emails a confirmation in the visitor's language through Resend, with an unsubscribe link, and optionally a short notice to the team (`NOTIFY_EMAIL`).

If email isn't configured yet, sign-ups are still saved. Payload sent by the site:

```json
{
  "email": "athlete@email.com",
  "firstName": "Gabo",
  "province": "Santiago",
  "picks": [{ "id": "sodium", "name": "Sodium", "options": "1000 mg", "qty": 1, "subscribe": false }],
  "picksSummary": "1 × Sodium (1000 mg)",
  "source": "waitlist-page",
  "language": "es-DO",
  "siteLanguage": "es",
  "submittedAt": "2026-10-30T13:50:14.279Z"
}
```

`source` is `waitlist-page` or `home`. `province` is one of the 31 provinces or Distrito Nacional, or empty. A hidden honeypot field filters out simple bots.

Useful queries (Neon / Railway SQL editor):

```sql
select email, first_name, province, site_language, created_at from waitlist_signups where unsubscribed_at is null order by created_at desc;
select * from waitlist_pick_demand;   -- which products people want most
```

## Spanish site

A Spanish version lives at `/es/` (`es/index.html` + `assets/js/app.es.js`), with an EN/ES switch in the header that keeps the current page. Routes (`#shop`, `#p-<id>`, …) are the same in both.

`app.es.js` is a translated copy of `app.js`: same logic, Spanish copy and catalogue text. **When you change behaviour or prices in one, make the same change in the other.** Spanish copy always addresses the visitor as *tú* (te, tu, tus; imperatives like "Únete", "Elige"), never *usted*. Each language keeps its own cart and waitlist state in the browser (storage keys `ss_` and `ss_es_`), because cart lines store option names in their own language.

## Run locally

Just the pages (sign-ups will show an error because there's no API):

```bash
python3 -m http.server 8000
```

With the API, against any Postgres (a free Neon branch works):

```bash
npm install
DATABASE_URL=postgres://… npm run db:migrate
DATABASE_URL=postgres://… APP_SECRET=dev npm run dev   # http://localhost:3000
```

Tests (`test/`) run the API against a real database, which they empty, so point them at a throwaway one:

```bash
TEST_DATABASE_URL=postgres://… npm test
```

## Deploy on Vercel

1. **Project.** Import the GitHub repository in Vercel. No framework, no build command: `vercel.json` sets the headers and Vercel serves the folder plus the functions in `api/`.
2. **Database.** In the project, open *Storage* → *Create database* → **Neon** (Postgres). It adds `DATABASE_URL` to the project. Then create the tables once, from your machine, with that URL: `DATABASE_URL=… npm run db:migrate` (safe to run again after schema changes). The code is plain Postgres, so moving to Railway later means changing `DATABASE_URL` and running the migration there.
3. **Secret.** Add `APP_SECRET` (any long random string, e.g. `openssl rand -base64 32`). Don't change it later: it signs the unsubscribe links already sent.
4. **Resend.** In Resend, add and verify the domain (DNS records at your registrar), create an API key, then set `RESEND_API_KEY`, `EMAIL_FROM` (e.g. `Soulset Athletics <hola@soulsetathletics.com>`), and optionally `EMAIL_REPLY_TO` and `NOTIFY_EMAIL`.
5. **Domain.** Add the custom domain in Vercel → *Domains*, and set `SITE_URL` to it so email links use it.

All variables are listed in `.env.example`. Redeploy after changing them.

## Payments (ready for launch, off for now)

Checkout is built but switched off (`CHECKOUT_ENABLED` unset), and the site still sends every cart to the waitlist. What's in place:

- **Server-side prices.** `lib/catalog.js` prices every order; whatever price the browser sends is ignored. `test/catalog.test.js` fails if it ever disagrees with the prices shown in `app.js` / `app.es.js`, so change prices in all three.
- **Orders.** `orders` and `payment_events` tables. Order numbers look like `SA-000123`. An order moves out of `pending` once, so a repeated or forged callback can't flip a paid order.
- **`POST /api/checkout`** validates delivery details, prices the cart, creates a pending order and returns where to send the customer (a redirect URL or a form to auto-submit to the gateway's hosted page). Card details never touch this site.
- **`/api/payment-callback`** verifies the result with the provider, records it and sends the customer to `#order-paid`, `#order-declined`, `#order-cancelled` or `#order-error`.
- **Providers** in `lib/payments/`: `test` (fake gateway for previews; refused in production), and `azul` / `cardnet` stubs that describe what each one needs. The interface is documented in `lib/payments/index.js`.

To open orders: get the merchant account and sandbox credentials from Azul or CardNet, implement that file against their docs, build the checkout page and the `#order-…` result pages on the site, and try it on a preview deployment with `PAYMENT_PROVIDER=test`, then with the real provider's sandbox. Finally set `CHECKOUT_ENABLED=true`, `PAYMENT_PROVIDER` and `SHIPPING_FEE_USD` in production.

## Structure

```
index.html              Page shell, header, footer, cart drawer (English)
es/index.html           Spanish page shell
assets/css/site.css     Design tokens and all styles
assets/js/config.js     Waitlist endpoint (shared)
assets/js/app.js        Catalogue data, routing, cart, fuel planner, waitlist (English)
assets/js/app.es.js     Spanish copy of app.js
assets/fonts/           Saira Extra Condensed, Barlow, IBM Plex Mono (subset woff2)
assets/img/             Product renders (webp)
assets/favicon.svg      Double-chevron mark
api/waitlist.js         POST: save a sign-up, send the confirmation email
api/unsubscribe.js      Unsubscribe link in emails
api/checkout.js         POST: create an order and start payment (off until launch)
api/payment-callback.js Result from the payment gateway
lib/                    Shared server code: database, validation, emails, catalogue prices, payment providers
db/schema.sql           Tables and views (npm run db:migrate)
scripts/                db:migrate and the local dev server
test/                   API and catalogue tests (npm test)
```

Routes: `#home`, `#shop`, `#shop-fuel` / `-hydrate` / `-build` / `-ignite` / `-stacks`, `#p-<product-id>`, `#fuel-planner`, `#manifesto`, `#help`, `#waitlist`, `#waitlist-confirmed`.

The product catalogue (names, options, prices, nutrition) lives in the `P` array at the top of `assets/js/app.js`.

## Brand system

- **Colours:** Soulset Black `#0A0A0A`, Bone `#F2F0EB`, Ignite `#FF5A1F` (actions and the ">" only; text on Ignite is always black)
- **Type:** Saira Extra Condensed 800/900 (display, uppercase), Barlow 400–600 (body), IBM Plex Mono (nutrition data)
- **Mark:** SA level-up mark, a squared S with stacked chevrons (Believe → Act → Results)

## Before launch

- [ ] Deploy on Vercel with Neon and Resend (see *Deploy on Vercel*)
- [ ] Absolute URLs for `og:image` and `hreflang` once the domain is live (social previews need them)
- [ ] Real formulations and nutrition panels from the manufacturer
- [ ] Final prices and currency (USD vs RD$)
- [ ] Real product photography (current images are 3D renders)
- [ ] Legal pages (privacy policy, terms), and a privacy note on the waitlist form
- [ ] Standard shipping fee below US$75 (needed for `SHIPPING_FEE_USD`)
- [ ] When orders open: Azul or CardNet merchant account, then finish *Payments* above

## Licences

Fonts are licensed under the [SIL Open Font License 1.1](https://openfontlicense.org): Saira (Omnibus-Type), Barlow (Jeremy Tribby), IBM Plex Mono (IBM).

Code, copy, product renders and the Soulset Athletics name and marks: © 2026 Soulset Athletics. All rights reserved.
