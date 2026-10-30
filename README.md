# Soulset Athletics — website

Pre-launch website for **Soulset Athletics**, sports nutrition for people who put their whole soul into it. *Mentality > Everything.*

It's a static, dependency-free single-page site (HTML, CSS and vanilla JavaScript, hash-routed). There's no build step: open `index.html` or serve the folder from any static host.

## Pre-launch mode: waitlist instead of checkout

Orders aren't open yet, so there is no checkout or payment flow. Visitors can still browse the line-up, use the Fuel Planner and build a cart, which works as a wishlist. Every purchase path leads to the waitlist:

- **Cart drawer** → "Join the waitlist" (`#waitlist`)
- **Waitlist page** (`#waitlist`): email (required), first name (optional), Dominican province (optional), plus the cart contents as "your picks"
- **Confirmation** (`#waitlist-confirmed`)
- **Home page sign-up** posts to the same waitlist
- Old links to `#checkout` and `#order-confirmed` redirect to the waitlist

### Connecting the waitlist (required before going live)

Out of the box the site runs in **demo mode**: sign-ups are only kept in the visitor's browser and nothing is sent anywhere (a warning is logged to the console). To collect emails, set the endpoint in `assets/js/config.js` (shared by the English and Spanish sites):

```js
window.SOULSET_CONFIG = { waitlistEndpoint: 'https://formspree.io/f/your-form-id' };
```

The site sends a `POST` with a JSON body and treats any 2xx response as success. Any service that accepts JSON from the browser (with CORS) works. The quickest option is [Formspree](https://formspree.io): create a form, copy its endpoint URL, paste it above, and sign-ups arrive in your inbox and the Formspree dashboard, exportable as CSV.

Payload sent for each sign-up:

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

`source` is `waitlist-page` or `home`. `province` is one of the 31 provinces or Distrito Nacional, or empty if the visitor didn't choose (and always empty from the home sign-up). `siteLanguage` is `en` or `es`, depending on which version of the site the visitor used. `picks` tells you which products people want most before launch. A hidden honeypot field filters out simple bots.

## Spanish site

A Spanish version lives at `/es/` (`es/index.html` + `assets/js/app.es.js`), with an EN/ES switch in the header that keeps the current page. Routes (`#shop`, `#p-<id>`, …) are the same in both.

`app.es.js` is a translated copy of `app.js`: same logic, Spanish copy and catalogue text. **When you change behaviour or prices in one, make the same change in the other.** Spanish copy always addresses the visitor as *tú* (te, tu, tus; imperatives like "Únete", "Elige"), never *usted*. Each language keeps its own cart and waitlist state in the browser (storage keys `ss_` and `ss_es_`), because cart lines store option names in their own language.

## Run locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

(Opening `index.html` directly from disk also works, though some browsers block local font loading that way.)

## Deploy with GitHub Pages

1. In the repository, go to **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`, and save.
3. The site is published at `https://<your-username>.github.io/soulset-athletics-website/` after a minute or two. A custom domain (e.g. `soulsetathletics.com`) can be added on the same page.

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
```

Routes: `#home`, `#shop`, `#shop-fuel` / `-hydrate` / `-build` / `-ignite` / `-stacks`, `#p-<product-id>`, `#fuel-planner`, `#manifesto`, `#help`, `#waitlist`, `#waitlist-confirmed`.

The product catalogue (names, options, prices, nutrition) lives in the `P` array at the top of `assets/js/app.js`.

## Cinematic footage

Full-bleed athlete imagery sits behind four sections:

- **Home hero:** still photo in full colour (`.cine-color`)
- **Home waitlist sign-up:** still photo, black-and-white grade (`.cine-bw`)
- **Manifesto mid-page line:** looping clip
- **Manifesto closer:** still photo, black-and-white grade, mirrored so the face sits clear of the copy (`.cine-flip`)

Everything lives in `assets/media/`. A clip is a pair, `<name>.mp4` plus a `<name>.jpg` poster, used as `cineMedia('<name>')`. A still is `<name>.webp`, used as `cineStill('<name>')`. Both helpers are in `app.js` / `app.es.js`. The grade is applied in CSS, so footage can be shot in colour.

- A clip's poster shows first. The video loads only when its section nears the viewport and pauses when it scrolls away.
- Visitors with reduced motion or Data Saver turned on only see the poster.
- To swap in your own shoot, replace the files and keep the names, or add new ones and change the name in both scripts. Aim for 720p, 6–15 s seamless loops, muted, under ~5 MB each, and stills about 2400 px wide.
- **No visible brands:** clothing, shoes and gear in any image must show no logos.

The current media are placeholders:

- [Mixkit](https://mixkit.co/license/#videoFree) clip, free for commercial use with no attribution required: sweat-bw 50964
- [Unsplash](https://unsplash.com/license) stills, free for commercial use: run-track (photo-1766970096346), gym-barbell (photo-1639653816698), gym-sweat (photo-1570095354203)

## Brand system

- **Colours:** Soulset Black `#0A0A0A`, Bone `#F2F0EB`, Ignite `#FF5A1F` (actions and the ">" only; text on Ignite is always black)
- **Type:** Saira Extra Condensed 800/900 (display, uppercase), Barlow 400–600 (body), IBM Plex Mono (nutrition data)
- **Mark:** SA level-up mark, a squared S with stacked chevrons (Believe → Act → Results)

## Before launch

- [ ] Connect the waitlist endpoint (see above)
- [ ] Real formulations and nutrition panels from the manufacturer
- [ ] Final prices and currency (USD vs RD$)
- [ ] Real product photography (current images are 3D renders)
- [ ] Own athlete footage to replace the Mixkit placeholders in `assets/media/`, ideally with Soulset product in shot
- [ ] Legal pages (privacy policy, terms), and a privacy note on the waitlist form
- [ ] When orders open: payment processor (e.g. Azul, CardNet or Stripe) and a real checkout

## Licences

Fonts are licensed under the [SIL Open Font License 1.1](https://openfontlicense.org): Saira (Omnibus-Type), Barlow (Jeremy Tribby), IBM Plex Mono (IBM).

Code, copy, product renders and the Soulset Athletics name and marks: © 2026 Soulset Athletics. All rights reserved.
