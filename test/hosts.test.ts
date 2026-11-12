/* Which address shows the coming-soon cover and which the full site. No database needed. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coverRoute, isLandingHost, isWebHost, prefersSpanish } from '../lib/hosts.ts';

const WEB = 'https://web.soulsetathletics.com';

test('the cover is only on soulsetathletics.com and www; the shop is everywhere else', () => {
  for (const h of ['soulsetathletics.com', 'www.soulsetathletics.com', 'SoulsetAthletics.com', 'soulsetathletics.localhost:3000']) assert.equal(isLandingHost(h), true, h);
  for (const h of ['web.soulsetathletics.com', 'soulset-athletics.vercel.app', 'localhost:3000', 'soulsetathletics.com.evil.example', '', null]) assert.equal(isLandingHost(h), false, String(h));
  assert.equal(isWebHost('web.soulsetathletics.com'), true);
  assert.equal(isWebHost('soulsetathletics.com'), false);
});

test('the cover speaks the browser’s preferred language, Spanish or English', () => {
  assert.equal(prefersSpanish('es-DO,es;q=0.9,en;q=0.8'), true);
  assert.equal(prefersSpanish('es'), true);
  assert.equal(prefersSpanish('en-US,en;q=0.9,es;q=0.8'), false);
  assert.equal(prefersSpanish('en;q=0.5, es;q=0.9'), true);
  assert.equal(prefersSpanish('fr-FR'), false);
  assert.equal(prefersSpanish('estonian'), false);
  assert.equal(prefersSpanish(''), false);
  assert.equal(prefersSpanish(null), false);
});

test('on the cover address, / /es /en show the cover and every other path goes to the full site', () => {
  assert.deepEqual(coverRoute('/', '', 'es-DO', WEB), { kind: 'rewrite', path: '/landing/es' });
  assert.deepEqual(coverRoute('/', '', 'en-US', WEB), { kind: 'rewrite', path: '/landing/en' });
  assert.deepEqual(coverRoute('/es', '', 'en-US', WEB), { kind: 'rewrite', path: '/landing/es' });
  assert.deepEqual(coverRoute('/en', '', 'es-DO', WEB), { kind: 'rewrite', path: '/landing/en' });
  assert.deepEqual(coverRoute('/shop', '?sort=low', null, WEB), { kind: 'redirect', url: WEB + '/shop?sort=low' });
  assert.deepEqual(coverRoute('/es/products/carb-gel-30', '', null, WEB), { kind: 'redirect', url: WEB + '/es/products/carb-gel-30' });
  assert.deepEqual(coverRoute('/landing/es', '', null, WEB), { kind: 'redirect', url: WEB + '/landing/es' });
});
