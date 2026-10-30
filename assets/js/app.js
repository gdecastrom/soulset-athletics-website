/* ============================================================ Soulset Athletics storefront */
(() => {
'use strict';
const IMG = n => `assets/img/${n}.webp`;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => 'US$' + (Math.round(n * 100) / 100).toFixed(2).replace(/\.00$/, '');
const money2 = n => 'US$' + (Math.round(n * 100) / 100).toFixed(2);
const tpl = id => document.getElementById(id).innerHTML;
const MEDIA = n => `assets/media/${n}`;
/* cinematic athlete footage: the poster shows first, the video streams in near the viewport (bindCine) */
function cineMedia(clip, eager) { return `<div class="cine-media" aria-hidden="true"><img src="${MEDIA(clip)}.jpg" alt=""${eager ? ' fetchpriority="high"' : ' loading="lazy"'}><video muted loop playsinline preload="none" data-src="${MEDIA(clip)}.mp4"></video></div>`; }
function cineStill(photo, eager) { return `<div class="cine-media" aria-hidden="true"><img src="${MEDIA(photo)}.webp" alt=""${eager ? ' fetchpriority="high"' : ' loading="lazy"'}></div>`; }
const SUB_OFF = 0.15, FREE_SHIP = 75;

/* ------------------------------------------------------------ catalogue */
const CATS = {
  fuel: { name: 'Fuel', line: 'Carb gels and carb + sodium drink mix for long, hard sessions.' },
  hydrate: { name: 'Hydrate', line: 'Sodium you can dose to your sweat, with zero sugar.' },
  build: { name: 'Build', line: 'Creatine monohydrate. One ingredient, every day.' },
  ignite: { name: 'Ignite', line: 'Pre-workout for focus, endurance and pump.' },
  stacks: { name: 'Stacks', line: 'The right products together, for less.' },
};
const GEL_USE = ['Take 1 gel every 20–30 minutes in sessions longer than 60 minutes.', 'Aim for 60–90 g of carbohydrate per hour: that is 2–3 gels.', 'Take with a few sips of water. Practise your fuelling in training before race day.'];
const GEL_ING = 'Water, maltodextrin, fructose, sodium citrate, sodium chloride, natural flavouring, citric acid, preservative (potassium sorbate).';
const P = [
  { id: 'carb-gel-30', code: 'GEL-030', cat: 'fuel', name: 'Carb Gel 30', tag: 'Core', level: 0,
    short: '30 g carbs · 200 mg sodium · no caffeine',
    blurb: 'Fast fuel for long sessions. 30 g of carbohydrate in a 2:1 glucose-to-fructose blend, plus 200 mg of sodium in every gel to replace what you sweat out. Thin, easy to swallow, no caffeine.',
    stats: [['30', 'g carbs'], ['200', 'mg sodium'], ['0', 'mg caffeine']],
    options: [{ key: 'flavour', label: 'Flavour', values: [{ v: 'Neutral', img: 'gel-neutral' }, { v: 'Citrus', img: 'gel-citrus' }, { v: 'Salted Berry', img: 'gel-salted-berry' }] },
              { key: 'pack', label: 'Pack', values: [{ v: 'Box of 12', price: 30 }, { v: 'Box of 24', price: 56, note: 'Save 7%' }] }],
    gallery: ['gel-trio', 'gel-back'],
    nutrition: { serving: 'Per 40 ml gel', rows: [['Energy', '120 kcal'], ['Carbohydrate', '30 g', 'key'], ['of which sugars', '10 g', 'sub'], ['Sodium', '200 mg', 'key'], ['Caffeine', '0 mg']] },
    use: GEL_USE, ingredients: GEL_ING, pairs: ['carb-gel-30-caffeine', 'sodium'], sub: true },
  { id: 'carb-gel-30-caffeine', code: 'GEL-030C', cat: 'fuel', name: 'Carb Gel 30 Caffeine', tag: 'Level up', level: 1,
    short: '30 g carbs · 200 mg sodium · 50 or 100 mg caffeine',
    blurb: 'The same 30 g carbs and 200 mg sodium, with caffeine for the hours when your head needs it more than your legs. Choose Level 1 (50 mg) or Level 2 (100 mg). The chevrons on the pack tell you which is which.',
    stats: [['30', 'g carbs'], ['200', 'mg sodium'], ['50–100', 'mg caffeine']],
    options: [{ key: 'caffeine', label: 'Caffeine', values: [{ v: 'Level 1 · 50 mg · Citrus', img: 'gel-caf50', level: 1 }, { v: 'Level 2 · 100 mg · Cola', img: 'gel-caf100', level: 2 }] },
              { key: 'pack', label: 'Pack', values: [{ v: 'Box of 12', price: 34 }, { v: 'Box of 24', price: 64, note: 'Save 6%' }] }],
    gallery: ['gel-caf-duo', 'gel-back'],
    nutrition: { serving: 'Per 40 ml gel', rows: [['Energy', '120 kcal'], ['Carbohydrate', '30 g', 'key'], ['of which sugars', '10 g', 'sub'], ['Sodium', '200 mg', 'key'], ['Caffeine', '50 or 100 mg', 'key']] },
    use: ['Use in the second half of long sessions or races, when focus starts to fade.', 'Do not exceed 400 mg of caffeine from all sources in a day.', 'Swap with Carb Gel 30 so your carbs per hour stay the same.'],
    ingredients: GEL_ING.replace('natural flavouring', 'natural flavouring, caffeine'), warn: 'Contains caffeine. Not suitable for children, pregnant or breastfeeding women.', pairs: ['carb-gel-30', 'fuel-mix-60'], sub: true },
  { id: 'fuel-mix-60', code: 'MIX-060', cat: 'fuel', name: 'Fuel Mix 60', tag: 'Carb + sodium', level: 0,
    short: '60 g carbs · 500 mg sodium per bottle',
    blurb: 'Carbs and sodium in one bottle. 60 g of carbohydrate and 500 mg of sodium per 500 ml, so one bottle an hour covers most of what you need. Light taste that stays drinkable at hour four.',
    stats: [['60', 'g carbs'], ['500', 'mg sodium'], ['500', 'ml water']],
    options: [{ key: 'flavour', label: 'Flavour', values: [{ v: 'Neutral', img: 'mix-neutral' }, { v: 'Citrus', img: 'mix-citrus' }] },
              { key: 'size', label: 'Size', values: [{ v: 'Tub · 15 servings', price: 42 }, { v: 'Tub · 30 servings', price: 76, note: 'Save 10%' }] }],
    gallery: ['mix-side'],
    nutrition: { serving: 'Per 65 g scoop in 500 ml', rows: [['Energy', '240 kcal'], ['Carbohydrate', '60 g', 'key'], ['of which sugars', '20 g', 'sub'], ['Sodium', '500 mg', 'key'], ['Potassium', '100 mg'], ['Caffeine', '0 mg']] },
    use: ['Mix 1 scoop (65 g) into 500 ml of cold water.', 'Drink one bottle per hour for 60 g carbs and 500 mg sodium.', 'Add gels on top for intakes above 60 g per hour.'],
    ingredients: 'Maltodextrin, fructose, sodium citrate, sodium chloride, potassium chloride, natural flavouring, citric acid.', pairs: ['carb-gel-30', 'sodium'], sub: true },
  { id: 'sodium', code: 'NA-MIX', cat: 'hydrate', name: 'Sodium', tag: 'Zero sugar', level: 0,
    short: '500 · 1000 · 1500 mg sodium per serving',
    blurb: 'Sodium-only electrolyte mix in three strengths, with zero sugar. Pick the strength that matches how much and how salty you sweat, then add carbs separately when you need them.',
    stats: [['1000', 'mg sodium'], ['0', 'g sugar'], ['5', 'kcal']],
    options: [{ key: 'strength', label: 'Strength', values: [{ v: '500 mg', img: 'na-500', price: 28, hint: 'Light sweaters, cool days' }, { v: '1000 mg', img: 'na-1000', price: 28, hint: 'Most athletes, warm days' }, { v: '1500 mg', img: 'na-1500', price: 28, hint: 'Salty sweaters, heat, Caribbean summer' }] }],
    gallery: ['na-side'],
    nutrition: { serving: 'Per scoop in 500 ml', rows: [['Energy', '5 kcal'], ['Sugars', '0 g'], ['Sodium', '500 / 1000 / 1500 mg', 'key'], ['Potassium', '150 mg'], ['Magnesium', '50 mg']] },
    use: ['Mix 1 scoop into 500 ml of water.', 'Drink one serving before long or hot sessions, then one per hour during.', 'White salt marks on your kit after training mean you are a salty sweater: go stronger.'],
    ingredients: 'Sodium citrate, sodium chloride, potassium citrate, magnesium citrate, natural flavouring, citric acid, stevia leaf extract.', pairs: ['fuel-mix-60', 'carb-gel-30'], sub: true },
  { id: 'creatine', code: 'CRE-005', cat: 'build', name: 'Creatine Monohydrate', tag: 'Pure', level: 0,
    short: '5 g per scoop · one ingredient',
    blurb: 'One ingredient: creatine monohydrate, the most researched supplement in sport. 5 g a day supports strength, power and repeated sprint work. Unflavoured, mixes into anything.',
    stats: [['5', 'g per scoop'], ['1', 'ingredient'], ['60', 'servings']],
    options: [{ key: 'size', label: 'Size', values: [{ v: '300 g · 60 servings', img: 'cre-300', price: 32 }, { v: '600 g · 120 servings', img: 'cre-600', price: 55, note: 'Save 14%' }] }],
    gallery: ['cre-side'],
    nutrition: { serving: 'Per 5 g scoop', rows: [['Creatine monohydrate', '5 g', 'key'], ['Other ingredients', 'None']] },
    use: ['Mix 1 scoop (5 g) into water, a shake or coffee.', 'Take it every day, training day or not. Timing matters less than consistency.', 'No loading phase needed.'],
    ingredients: 'Creatine monohydrate.', pairs: ['pre-workout', 'strength-stack'], sub: true },
  { id: 'pre-workout', code: 'PRE-200', cat: 'ignite', name: 'Pre-Workout', tag: 'Level 2', level: 2,
    short: '200 mg caffeine · 3.2 g beta-alanine · 6 g citrulline',
    blurb: 'Switch on before you start. 200 mg of caffeine for focus, 3.2 g of beta-alanine for endurance in hard efforts, and 6 g of L-citrulline malate for blood flow and pump. Clean label, every dose printed.',
    stats: [['200', 'mg caffeine'], ['3.2', 'g beta-alanine'], ['6', 'g citrulline']],
    options: [{ key: 'flavour', label: 'Flavour', values: [{ v: 'Sour Apple', img: 'pre-sour-apple' }, { v: 'Blood Orange', img: 'pre-blood-orange' }, { v: 'Mango', img: 'pre-mango' }] }],
    basePrice: 45, gallery: ['pre-side', 'pre-top'],
    nutrition: { serving: 'Per 14 g scoop', rows: [['Caffeine', '200 mg', 'key'], ['Beta-alanine', '3.2 g', 'key'], ['L-citrulline malate 2:1', '6 g', 'key'], ['L-tyrosine', '1 g'], ['Sodium', '150 mg']] },
    use: ['Mix 1 scoop (14 g) into 300 ml of water.', 'Drink 20–30 minutes before training.', 'Beta-alanine can cause a harmless tingle. Max 1 scoop per day; avoid within 6 hours of sleep.'],
    ingredients: 'L-citrulline malate, beta-alanine, L-tyrosine, citric acid, natural flavouring, caffeine anhydrous, sodium chloride, sucralose, beetroot powder (colour).',
    warn: 'Contains 200 mg caffeine per serving. Not suitable for children, pregnant or breastfeeding women, or people sensitive to caffeine.', pairs: ['creatine', 'strength-stack'], sub: true },
  { id: 'race-day-stack', code: 'STK-RACE', cat: 'stacks', name: 'Race Day Stack', tag: 'Save US$15', level: 0,
    short: 'Carb Gel 30 ×12 · Fuel Mix 60 · Sodium 1000',
    blurb: 'Everything for a long race in one box: a box of 12 Carb Gel 30 (Citrus), a 15-serving tub of Fuel Mix 60 (Citrus) and a tub of Sodium 1000. Build your plan with the Fuel Planner, then show up ready.',
    stats: [['12', 'gels'], ['15', 'bottles of mix'], ['30', 'sodium servings']],
    options: [], basePrice: 85, compare: 100, gallery: [], main: 'bundle',
    contents: ['Carb Gel 30 · Citrus · Box of 12', 'Fuel Mix 60 · Citrus · Tub · 15 servings', 'Sodium · 1000 mg · 30 servings'],
    use: ['Night before: mix your bottles of Fuel Mix 60.', 'Race: 1 bottle per hour plus 1 gel every 30–40 minutes.', 'Hot day: add a Sodium 1000 bottle in the first hour.'], pairs: ['carb-gel-30-caffeine', 'sodium'], sub: false },
  { id: 'strength-stack', code: 'STK-STR', cat: 'stacks', name: 'Strength Stack', tag: 'Save US$9', level: 2,
    short: 'Pre-Workout · Creatine 300 g',
    blurb: 'Pre-Workout (Blood Orange) and Creatine Monohydrate 300 g. One gets you switched on for today; the other builds for the months ahead.',
    stats: [['200', 'mg caffeine'], ['5', 'g creatine'], ['30', 'sessions']],
    options: [], basePrice: 68, compare: 77, gallery: [], main: 'stack-strength',
    contents: ['Pre-Workout · Blood Orange · 30 servings', 'Creatine Monohydrate · 300 g · 60 servings'],
    use: ['Pre-Workout 20–30 minutes before training.', 'Creatine 5 g every day, any time.'], pairs: ['pre-workout', 'creatine'], sub: false },
];
const byId = Object.fromEntries(P.map(p => [p.id, p]));

function defaults(p) { const o = {}; p.options.forEach(op => { o[op.key] = op.values[0].v; }); return o; }
function optVal(p, opts, key) { const op = p.options.find(o => o.key === key); return op && op.values.find(v => v.v === opts[key]); }
function unitPrice(p, opts) {
  let price = p.basePrice || 0;
  p.options.forEach(op => { const v = op.values.find(x => x.v === opts[op.key]); if (v && v.price != null) price = v.price; });
  return price;
}
function fromPrice(p) {
  if (p.basePrice) return p.basePrice;
  let min = Infinity; p.options.forEach(op => op.values.forEach(v => { if (v.price != null) min = Math.min(min, v.price); }));
  return min;
}
function mainImg(p, opts) {
  for (const op of p.options) { const v = op.values.find(x => x.v === opts[op.key]); if (v && v.img) return v.img; }
  return p.main || (p.options[0] && p.options[0].values[0].img);
}
function levelOf(p, opts) { for (const op of p.options) { const v = op.values.find(x => x.v === opts[op.key]); if (v && v.level != null) return v.level; } return p.level || 0; }
function levelsHTML(n) { return `<span class="levels" aria-hidden="true">${[0, 1, 2].map(i => `<i class="${i < n ? '' : 'off'}"></i>`).join('')}</span>`; }

/* ------------------------------------------------------------ storage */
const store = {
  get(k, d) { try { const v = localStorage.getItem('ss_' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('ss_' + k, JSON.stringify(v)); } catch (e) { /* private mode: keep in memory */ } },
};
let cart = store.get('cart', []).filter(l => byId[l.id]);

function lineKey(l) { return l.id + '|' + JSON.stringify(l.opts) + '|' + (l.sub ? 1 : 0); }
function linePrice(l) { const p = byId[l.id]; const u = unitPrice(p, l.opts); return l.sub ? u * (1 - SUB_OFF) : u; }
function saveCart() { store.set('cart', cart); renderCart(); }
function addToCart(id, opts, qty = 1, sub = false, open = true) {
  const l = { id, opts: { ...opts }, qty, sub };
  const ex = cart.find(c => lineKey(c) === lineKey(l));
  if (ex) ex.qty = Math.min(99, ex.qty + qty); else cart.push(l);
  saveCart();
  if (open) openCart(); else toast(`Added ${byId[id].name}`);
}
function cartCount() { return cart.reduce((a, l) => a + l.qty, 0); }
function subtotal() { return cart.reduce((a, l) => a + linePrice(l) * l.qty, 0); }

/* ------------------------------------------------------------ toast */
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2200); }

/* ------------------------------------------------------------ cart drawer */
const drawer = $('#drawer'), scrim = $('#scrim');
let lastFocus = null;
function openCart() { lastFocus = document.activeElement; drawer.classList.add('open'); scrim.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); setTimeout(() => $('#closeCart').focus(), 50); }
function closeCart() { drawer.classList.remove('open'); scrim.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); if (lastFocus) lastFocus.focus(); }
$('#cartBtn').addEventListener('click', openCart);
$('#closeCart').addEventListener('click', closeCart);
scrim.addEventListener('click', closeCart);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && drawer.classList.contains('open')) closeCart(); });

function optSummary(l) { const parts = Object.values(l.opts); if (l.sub) parts.push('Subscribe · every 4 weeks'); return parts.join(' · '); }
function thumb(p, opts, cls = 'th') { const im = mainImg(p, opts); return `<div class="${cls}"><img src="${IMG(im)}" alt="" loading="lazy"></div>`; }
function qtyHTML(i, q, small = true) {
  return `<div class="qty ${small ? 'qty-s' : ''}" data-line="${i}"><button type="button" data-q="-1" aria-label="Decrease quantity">−</button><input type="number" min="1" max="99" value="${q}" aria-label="Quantity" inputmode="numeric"><button type="button" data-q="1" aria-label="Increase quantity">+</button></div>`;
}
function renderCart() {
  const n = cartCount(); const cc = $('#cartCount'); cc.textContent = n; cc.dataset.n = n;
  $('#cartBtn').setAttribute('aria-label', `Open cart, ${n} item${n === 1 ? '' : 's'}`);
  const sub = subtotal();
  $('#shipBar').innerHTML = `<span><b>Pre-launch.</b> We’re not taking orders yet. Save your picks and join the waitlist for first access.</span>`;
  if (!cart.length) {
    $('#drawerItems').innerHTML = `<div class="empty"><span class="d-m">Nothing in here yet.</span><p>Stop wishing. Start doing. Pick your fuel.</p><a class="btn btn-primary" href="#shop" data-close>Shop all</a></div>`;
    $('#drawerFoot').innerHTML = '';
  } else {
    $('#drawerItems').innerHTML = cart.map((l, i) => { const p = byId[l.id]; return `
      <div class="li">${thumb(p, l.opts)}
        <div style="min-width:0"><a class="li-name" href="#p-${p.id}" data-close>${esc(p.name)}</a><div class="li-opts">${esc(optSummary(l))}</div>${qtyHTML(i, l.qty)}</div>
        <div class="li-right"><span class="price">${money2(linePrice(l) * l.qty)}</span>${l.sub ? `<span class="save">−15%</span>` : ''}<button class="li-rm" data-rm="${i}">Remove</button></div>
      </div>`; }).join('') + upsellHTML();
    $('#drawerFoot').innerHTML = `
      <div class="row-b"><span>Subtotal</span><span class="price">${money2(sub)}</span></div>
      <p style="font-size:13px;color:var(--muted)">Launch prices, taxes included. Join the waitlist and we’ll keep these picks for you.</p>
      <a class="btn btn-primary btn-l btn-block" href="#waitlist" data-close>Join the waitlist <span class="edge">›</span></a>
      <button class="btn-ghost" data-closebtn style="justify-self:center;font-weight:600;font-size:13px;letter-spacing:.12em;text-transform:uppercase">Keep shopping</button>`;
  }
}
function upsellHTML() {
  const ids = new Set(cart.map(l => l.id));
  const cand = ['sodium', 'carb-gel-30', 'creatine', 'fuel-mix-60'].find(id => !ids.has(id));
  if (!cand) return '';
  const p = byId[cand], o = defaults(p);
  return `<div style="padding:18px 0;display:grid;gap:10px"><span class="eyebrow">Pairs well</span>
    <div class="li" style="border:0;padding:0">${thumb(p, o)}<div><b style="font-weight:600">${esc(p.name)}</b><div class="li-opts">${esc(p.short)}</div></div>
    <div class="li-right"><span class="price">${money(unitPrice(p, o))}</span><button class="btn btn-secondary" style="min-height:36px;padding:6px 12px;font-size:12px" data-quick="${p.id}">Add</button></div></div></div>`;
}
drawer.addEventListener('click', e => {
  const t = e.target;
  if (t.closest('[data-close]')) { closeCart(); return; }
  if (t.closest('[data-closebtn]')) { closeCart(); return; }
  const rm = t.closest('[data-rm]'); if (rm) { cart.splice(+rm.dataset.rm, 1); saveCart(); return; }
  const q = t.closest('[data-q]'); if (q) { const i = +q.closest('[data-line]').dataset.line; cart[i].qty = Math.max(0, Math.min(99, cart[i].qty + +q.dataset.q)); if (!cart[i].qty) cart.splice(i, 1); saveCart(); return; }
  const qa = t.closest('[data-quick]'); if (qa) { const p = byId[qa.dataset.quick]; addToCart(p.id, defaults(p), 1, false, false); }
});
drawer.addEventListener('change', e => { const inp = e.target.closest('[data-line] input'); if (!inp) return; const i = +inp.closest('[data-line]').dataset.line; const v = Math.max(1, Math.min(99, parseInt(inp.value, 10) || 1)); cart[i].qty = v; saveCart(); });

/* ------------------------------------------------------------ shared pieces */
function card(p) {
  const o = defaults(p); const lvl = levelOf(p, o);
  return `<article class="card">
    <a class="card-media" href="#p-${p.id}" tabindex="-1" aria-hidden="true"><img class="pack" src="${IMG(mainImg(p, o))}" alt="" loading="lazy"></a>
    <div class="card-tags">${p.tag ? `<span class="tag ${p.cat === 'stacks' ? 'tag-ignite' : ''}">${esc(p.tag)}</span>` : ''}</div>
    <div class="card-body">
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><span class="card-code">${p.code} · ${CATS[p.cat].name.toUpperCase()}</span>${lvl ? `<span class="lv-label">${levelsHTML(lvl)}</span>` : ''}</div>
      <h3 class="card-name"><a href="#p-${p.id}">${esc(p.name)}</a></h3>
      <p class="card-spec">${esc(p.short)}</p>
      <div class="card-foot"><span class="price">${p.options.some(op => op.values.some(v => v.price != null)) && new Set(p.options.flatMap(op => op.values.map(v => v.price)).filter(x => x != null)).size > 1 ? 'From ' : ''}${money(fromPrice(p))}${p.compare ? `<s>${money(p.compare)}</s>` : ''}</span>
        <button class="btn btn-secondary" style="min-height:40px;padding:8px 14px;font-size:12px" data-add="${p.id}" aria-label="Add ${esc(p.name)} to cart">Add <span aria-hidden="true">+</span></button></div>
    </div></article>`;
}
function bindCardAdds(root) { root.addEventListener('click', e => { const b = e.target.closest('[data-add]'); if (!b) return; const p = byId[b.dataset.add]; addToCart(p.id, defaults(p), 1, false, true); }); }

/* ------------------------------------------------------------ home */
function viewHome() {
  const cats = [['fuel', 'Fuel', 'Carb gels and carb + sodium mix', '01', 'gel-citrus'], ['hydrate', 'Hydrate', 'Sodium, dosed to your sweat', '02', 'na-1000'], ['build', 'Build', 'Creatine monohydrate', '03', 'cre-300'], ['ignite', 'Ignite', 'Pre-workout', '04', 'pre-mango']];
  const featured = ['carb-gel-30', 'fuel-mix-60', 'sodium', 'carb-gel-30-caffeine', 'pre-workout', 'creatine'];
  return `
  <section class="cine cine-color cine-hero" style="--pos:50% 25%">${cineStill('run-track', true)}<div class="wrap cine-in">
      <span class="eyebrow">Soulset Athletics · Sports nutrition</span>
      <h1 class="d-xxl">Mentality <span class="gt">&gt;</span> everything</h1>
      <p class="lead">Fuel, hydration and strength products for athletes who put their whole soul into it. Clear doses, no filler, built for heat and long hours.</p>
      <div class="hero-cta"><a class="btn btn-primary btn-l" href="#shop">Shop the fuel <span class="edge">›</span></a><a class="btn btn-secondary btn-l" href="#manifesto">Read the manifesto</a></div>
      <div class="hero-facts"><span>Every dose printed on the front</span><span>Built for Caribbean heat</span><span>Subscribe &amp; save 15%</span></div>
  </div></section>
  <div class="ticker" aria-hidden="true"><div class="ticker-track">${Array(2).fill('<span>Believe</span><span class="gt">›</span><span>Act</span><span class="gt">›</span><span>Results</span><span class="gt">›</span><span>Believe</span><span class="gt">›</span><span>Stay relentless</span><span class="gt">›</span><span>Mentality <i>&gt;</i> everything</span><span class="gt">›</span>').join('')}</div></div>

  <section class="section wrap">
    <div class="sec-head"><div><span class="eyebrow">Shop by goal</span><h2 class="d-l">Set yourself up to win</h2></div><a class="btn-ghost btn" href="#shop">Shop all <span class="edge">›</span></a></div>
    <div class="cats">${cats.map(([k, n, d, num, im]) => `<a class="cat" href="#shop-${k}"><img class="cat-img" src="${IMG(im)}" alt="" loading="lazy"><span class="num">${num}</span><div style="display:grid;gap:8px"><span class="d-m">${n}</span><p>${d}</p></div><span class="go">Shop ${n.toLowerCase()} ›</span></a>`).join('')}</div>
  </section>

  <section class="section-tight wrap" style="padding-top:0">
    <div class="sec-head"><div><span class="eyebrow">The line-up</span><h2 class="d-l">Your passion, our fuel</h2></div><a class="btn-ghost btn" href="#shop">View all 8 <span class="edge">›</span></a></div>
    <div class="grid" id="homeGrid">${featured.map(id => card(byId[id])).join('')}</div>
  </section>

  <section class="band"><div class="wrap section" style="display:grid;gap:28px">
    <span class="eyebrow">Our manifesto</span>
    <h2 class="d-xl" style="max-width:14ch">Put your whole soul into it</h2>
    <p class="lead" style="color:#3A3936;max-width:60ch">Your mind is the first thing you have to convince. Soulset is a constant reminder to stop wishing and start doing: believe in your potential, take action, earn the results, and believe again.</p>
    <div><a class="btn btn-primary btn-l" href="#manifesto" style="background:var(--void);color:var(--bone)">Read the manifesto <span class="edge">›</span></a></div>
  </div></section>

  <section class="section wrap">
    <div class="sec-head"><div><span class="eyebrow">Fuel planner</span><h2 class="d-l">Know your numbers before race day</h2><p class="lead">Tell us how long and how hard. We'll work out carbs, sodium and fluid per hour, and build the basket.</p></div></div>
    ${plannerHTML()}
  </section>

  <section class="section wrap" style="padding-top:0">
    <div class="sec-head"><div><span class="eyebrow">How the stack works</span><h2 class="d-l">Fuel. Hydrate. Build. Ignite.</h2></div></div>
    <div class="loop">
      <div><span class="mono">01 · DURING</span><span class="d-s">Carb Gel 30</span><p>30 g carbs and 200 mg sodium per gel. 2–3 an hour.</p></div>
      <div><span class="mono">02 · IN THE BOTTLE</span><span class="d-s">Fuel Mix 60</span><p>60 g carbs and 500 mg sodium per bottle.</p></div>
      <div><span class="mono">03 · IN THE HEAT</span><span class="d-s">Sodium</span><p>500, 1000 or 1500 mg. Zero sugar.</p></div>
      <div><span class="mono">04 · EVERY DAY</span><span class="d-s">Creatine</span><p>5 g. One ingredient. Consistency wins.</p></div>
      <div><span class="mono">05 · BEFORE</span><span class="d-s">Pre-Workout</span><p>Caffeine, beta-alanine, citrulline. Switch on.</p></div>
    </div>
  </section>

  <section class="cine cine-color" style="--pos:60% 50%">${cineMedia('train-ropes')}<div class="wrap cine-in" style="--h:clamp(440px,64vh,640px)"><div class="news">
    <div style="display:grid;gap:12px"><span class="eyebrow">Join the waitlist</span><h2 class="d-l">Stay relentless</h2><p class="lead">Be first to know when Soulset launches, and get 10% off your first order.</p></div>
    <div><form id="newsForm" novalidate><label class="sr" for="newsEmail">Email address</label><input id="newsEmail" type="email" placeholder="you@email.com" autocomplete="email" required><button class="btn btn-primary" type="submit">Join the waitlist</button></form><p class="news-msg" id="newsMsg"></p></div>
  </div></div></section>`;
}
function bindHome(root) {
  bindCardAdds(root); bindPlanner(root);
  $('#newsForm', root).addEventListener('submit', async e => {
    e.preventDefault(); const form = e.target; const v = $('#newsEmail', root).value.trim(); const m = $('#newsMsg', root); const btn = $('button', form);
    if (!EMAIL_RE.test(v)) { m.style.color = 'var(--danger)'; m.textContent = 'Enter a valid email address, like you@email.com.'; return; }
    btn.disabled = true; m.style.color = 'var(--muted)'; m.textContent = 'Saving your spot…';
    try { await joinWaitlist({ email: v, source: 'home' }); m.style.color = 'var(--success)'; m.textContent = `You’re on the list. We’ll email you at launch with 10% off your first order.`; form.reset(); }
    catch (err) { m.style.color = 'var(--danger)'; m.textContent = `We couldn’t save your spot. Check your connection and try again.`; }
    finally { btn.disabled = false; }
  });
}

/* ------------------------------------------------------------ shop */
let sortBy = 'featured';
function viewShop(cat) {
  const list = P.filter(p => !cat || p.cat === cat);
  const sorted = [...list];
  if (sortBy === 'low') sorted.sort((a, b) => fromPrice(a) - fromPrice(b));
  if (sortBy === 'high') sorted.sort((a, b) => fromPrice(b) - fromPrice(a));
  const chips = [['', 'All'], ...Object.entries(CATS).map(([k, v]) => [k, v.name])];
  return `<div class="wrap">
    <div class="shop-top"><span class="eyebrow">Shop${cat ? ' · ' + CATS[cat].name : ''}</span><h1 class="d-xl">${cat ? CATS[cat].name : 'All products'}</h1><p class="lead">${cat ? CATS[cat].line : 'Fuel, hydration and strength. Every dose printed on the front of the pack.'}</p></div>
    <div class="filters"><div class="chips" role="group" aria-label="Filter by category">${chips.map(([k, n]) => `<a class="chip" href="#shop${k ? '-' + k : ''}" aria-pressed="${(cat || '') === k}">${n}</a>`).join('')}</div>
      <label style="display:flex;gap:10px;align-items:center;font-size:14px;color:var(--muted)"><span>Sort</span><select class="select" id="sortSel"><option value="featured">Featured</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></label></div>
    <p class="mono" style="color:var(--dim);font-size:13px;margin-bottom:20px">${sorted.length} product${sorted.length === 1 ? '' : 's'}</p>
    <div class="grid" style="padding-bottom:96px">${sorted.map(card).join('')}</div></div>`;
}
function bindShop(root, cat) {
  bindCardAdds(root);
  const s = $('#sortSel', root); s.value = sortBy;
  s.addEventListener('change', () => { sortBy = s.value; render(); });
}

/* ------------------------------------------------------------ product */
function nutritionHTML(n) {
  return `<div class="nutri"><div class="nutri-head"><span>Nutrition</span><span>${esc(n.serving)}</span></div>${n.rows.map(r => `<div class="nutri-row ${r[2] || ''}"><span>${esc(r[0])}</span><span>${esc(r[1])}</span></div>`).join('')}</div>`;
}
function viewProduct(p) {
  const st = { opts: defaults(p), sub: false, qty: 1, img: null };
  const gal = [null, ...p.gallery];
  return { html: `<div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="#home">Home</a><span>/</span><a href="#shop-${p.cat}">${CATS[p.cat].name}</a><span>/</span><span aria-current="page">${esc(p.name)}</span></nav>
    <div class="pdp">
      <div class="pdp-media">
        <div class="pdp-stage"><div class="bigchev">${tpl('t-chev')}</div><img class="pack" id="pdpImg" alt="${esc(p.name)}" src="${IMG(mainImg(p, st.opts))}"></div>
        ${gal.length > 1 ? `<div class="thumbs" role="group" aria-label="Product images">${gal.map((g, i) => `<button class="thumb" data-g="${i}" aria-label="Image ${i + 1}" aria-pressed="${i === 0}"><img src="${IMG(g || mainImg(p, st.opts))}" alt=""></button>`).join('')}</div>` : ''}
      </div>
      <div class="pdp-info">
        <div class="pdp-title"><span class="eyebrow">${p.code} · ${CATS[p.cat].name}</span><h1 class="d-l">${esc(p.name)}</h1><p class="mono" style="color:var(--muted);font-size:14px">${esc(p.short)}</p></div>
        <div class="pdp-price"><span class="price" id="pdpPrice"></span>${p.compare ? `<s class="mono" style="color:var(--dim)">${money(p.compare)}</s>` : ''}<span class="lv-label" id="pdpLevel"></span></div>
        <p style="color:#D6D3CC;font-size:17px">${esc(p.blurb)}</p>
        <div class="stats">${p.stats.map(([b, s]) => `<div class="stat"><b>${b}</b><span>${s}</span></div>`).join('')}</div>
        <form id="buyForm" style="display:grid;gap:22px">
          ${p.options.map(op => `<fieldset class="opt"><legend>${op.label}<b data-sel="${op.key}">${esc(st.opts[op.key])}</b></legend><div class="seg">${op.values.map((v, i) => `<label><input type="radio" name="${op.key}" value="${esc(v.v)}" ${i === 0 ? 'checked' : ''}><span>${esc(v.v)}${v.note ? ` <small class="save">${v.note}</small>` : ''}</span></label>`).join('')}</div>${op.values.some(v => v.hint) ? `<p class="hint" data-hint="${op.key}" style="font-size:14px;color:var(--muted)"></p>` : ''}</fieldset>`).join('')}
          ${p.contents ? `<div class="opt"><span class="eyebrow">In the box</span><ul style="margin:0;padding-left:18px;color:#D6D3CC">${p.contents.map(c => `<li>${esc(c)}</li>`).join('')}</ul></div>` : ''}
          ${p.sub ? `<div class="buy-type" role="radiogroup" aria-label="Purchase type">
            <label><input type="radio" name="bt" value="once" checked><span class="bt"><b>One-time purchase</b></span><span class="bt-price" data-bt="once"></span></label>
            <label><input type="radio" name="bt" value="sub"><span class="bt"><b>Subscribe &amp; save 15%</b><small>Delivered every 4 weeks. Skip or cancel any time.</small></span><span class="bt-price" data-bt="sub"></span></label></div>` : ''}
          <div class="buy-row"><div class="qty"><button type="button" data-pq="-1" aria-label="Decrease quantity">−</button><input type="number" id="pdpQty" min="1" max="99" value="1" aria-label="Quantity"><button type="button" data-pq="1" aria-label="Increase quantity">+</button></div>
            <button class="btn btn-primary btn-l" type="submit" id="addBtn">Add to cart</button></div>
        </form>
        <div class="assure"><div><b>Free shipping</b>Orders over US$75</div><div><b>Every dose printed</b>On the front of every pack</div><div><b>30-day guarantee</b>Unopened, unhappy? Send it back</div></div>
        <div class="acc">
          ${p.nutrition ? `<details open><summary>What's inside</summary><div class="acc-body">${nutritionHTML(p.nutrition)}</div></details>` : ''}
          <details ${p.nutrition ? '' : 'open'}><summary>How to use</summary><div class="acc-body"><ul style="margin:0;padding-left:18px;display:grid;gap:6px">${p.use.map(u => `<li>${esc(u)}</li>`).join('')}</ul></div></details>
          ${p.ingredients ? `<details><summary>Ingredients</summary><div class="acc-body"><p>${esc(p.ingredients)}</p>${p.warn ? `<p style="color:var(--bone)">${esc(p.warn)}</p>` : ''}</div></details>` : ''}
          <details><summary>Shipping &amp; returns</summary><div class="acc-body"><p>We ship across the Dominican Republic: 2–4 business days, or next day in Santo Domingo and Santiago with Express. No international shipping yet. Free standard shipping over US$75. Unopened products can be returned within 30 days.</p></div></details>
        </div>
      </div>
    </div>
    <section class="section-tight" style="border-top:1px solid var(--line)"><div class="sec-head"><div><span class="eyebrow">Pairs well with</span><h2 class="d-m">Complete the stack</h2></div></div>
      <div class="grid">${[...p.pairs, P.find(x => x.id !== p.id && !p.pairs.includes(x.id) && x.cat !== p.cat).id].slice(0, 3).map(id => card(byId[id])).join('')}</div></section>
  </div>`, bind(root) {
    const upd = () => {
      const u = unitPrice(p, st.opts);
      $('#pdpPrice', root).textContent = st.sub ? money2(u * (1 - SUB_OFF)) : money(u);
      $$('[data-bt="once"]', root).forEach(e => e.textContent = money(u));
      $$('[data-bt="sub"]', root).forEach(e => e.textContent = money2(u * (1 - SUB_OFF)));
      const lvl = levelOf(p, st.opts);
      $('#pdpLevel', root).innerHTML = lvl ? `${levelsHTML(lvl)} Caffeine level ${lvl}` : (p.cat === 'fuel' || p.cat === 'hydrate' ? `${levelsHTML(0)} No caffeine` : '');
      p.options.forEach(op => { const s = $(`[data-sel="${op.key}"]`, root); if (s) s.textContent = st.opts[op.key]; const h = $(`[data-hint="${op.key}"]`, root); if (h) { const v = optVal(p, st.opts, op.key); h.textContent = v && v.hint ? v.hint : ''; } });
      if (st.img == null) $('#pdpImg', root).src = IMG(mainImg(p, st.opts));
      const t0 = $('.thumb[data-g="0"] img', root); if (t0) t0.src = IMG(mainImg(p, st.opts));
      $('#addBtn', root).innerHTML = `Add to cart · ${money2((st.sub ? u * (1 - SUB_OFF) : u) * st.qty)}`;
    };
    $('#buyForm', root).addEventListener('change', e => {
      const t = e.target;
      if (t.name === 'bt') st.sub = t.value === 'sub';
      else if (t.id === 'pdpQty') st.qty = Math.max(1, Math.min(99, parseInt(t.value, 10) || 1)), t.value = st.qty;
      else if (t.name) { st.opts[t.name] = t.value; st.img = null; $$('.thumb', root).forEach((b, i) => b.setAttribute('aria-pressed', i === 0)); }
      upd();
    });
    root.addEventListener('click', e => {
      const q = e.target.closest('[data-pq]'); if (q) { st.qty = Math.max(1, Math.min(99, st.qty + +q.dataset.pq)); $('#pdpQty', root).value = st.qty; upd(); }
      const g = e.target.closest('[data-g]'); if (g) { const i = +g.dataset.g; st.img = i ? gal[i] : null; $('#pdpImg', root).src = IMG(i ? gal[i] : mainImg(p, st.opts)); $$('.thumb', root).forEach(b => b.setAttribute('aria-pressed', b === g)); }
    });
    $('#buyForm', root).addEventListener('submit', e => { e.preventDefault(); addToCart(p.id, st.opts, st.qty, st.sub, true); });
    bindCardAdds($('.section-tight .grid', root));
    upd();
  } };
}

/* ------------------------------------------------------------ fuel planner */
function plannerHTML() {
  return `<form class="planner" id="planner" onsubmit="return false">
    <div>
      <div class="field"><label for="plDur">Session length <output id="plDurOut">3 h</output></label><input type="range" id="plDur" min="0.5" max="8" step="0.5" value="3"></div>
      <div class="field"><span class="lbl">Intensity</span><div class="seg">${['Easy', 'Steady', 'Race'].map((v, i) => `<label><input type="radio" name="plInt" value="${v}" ${i === 1 ? 'checked' : ''}><span>${v}</span></label>`).join('')}</div></div>
      <div class="field"><span class="lbl">How do you sweat?</span><div class="seg">${['Light', 'Average', 'Salty'].map((v, i) => `<label><input type="radio" name="plSweat" value="${v}" ${i === 1 ? 'checked' : ''}><span>${v}</span></label>`).join('')}</div><p style="font-size:13px;color:var(--dim)">White salt marks on your kit or cap after training mean salty.</p></div>
      <label class="check"><input type="checkbox" id="plHeat" checked> Hot or humid conditions</label>
      <label class="check"><input type="checkbox" id="plCaf"> Use caffeine in the second half</label>
    </div>
    <div class="plan-out" id="planOut" aria-live="polite"></div>
  </form>`;
}
function computePlan(d, int, sweat, heat, caf) {
  let carbs = d < 1 ? 30 : d < 1.5 ? 45 : d < 2.5 ? 60 : d < 4 ? 75 : 90;
  if (d >= 1) carbs = Math.max(30, Math.min(90, carbs + (int === 'Easy' ? -15 : int === 'Race' ? 10 : 0)));
  const sodium = ({ Light: 400, Average: 700, Salty: 1000 })[sweat] + (heat ? 300 : 0);
  const fluid = 500 + (heat ? 250 : 0) + (int === 'Race' ? 50 : 0);
  const useMix = carbs >= 60 && d >= 1.5;
  const mix = useMix ? Math.ceil(d) : 0;
  const gels = Math.max(d < 1 ? 1 : 0, Math.ceil(((carbs - (useMix ? 60 : 0)) * d) / 30));
  const cafGels = caf && d >= 1.5 ? Math.min(Math.floor(gels / 2), 6) : 0;
  const covered = gels * 200 + mix * 500;
  const naTotal = sodium * d;
  const strength = sweat === 'Light' ? '500 mg' : sweat === 'Average' ? '1000 mg' : '1500 mg';
  const naServ = Math.max(0, Math.ceil((naTotal - covered) / parseInt(strength, 10)));
  return { carbs, sodium, fluid, mix, gels, cafGels, plainGels: gels - cafGels, naServ, strength, d };
}
function bindPlanner(root) {
  const f = $('#planner', root); if (!f) return;
  let plan;
  const run = () => {
    const d = parseFloat($('#plDur', f).value);
    $('#plDurOut', f).textContent = (d % 1 ? Math.floor(d) + ' h 30' : d + ' h');
    plan = computePlan(d, f.plInt.value, f.plSweat.value, $('#plHeat', f).checked, $('#plCaf', f).checked);
    const every = plan.gels ? Math.max(15, Math.round((d * 60) / plan.gels / 5) * 5) : 0;
    const items = [];
    if (plan.plainGels) items.push(['carb-gel-30', { flavour: 'Citrus', pack: plan.plainGels > 12 ? 'Box of 24' : 'Box of 12' }, `${plan.plainGels} × Carb Gel 30`, `1 every ${every} min`]);
    if (plan.cafGels) items.push(['carb-gel-30-caffeine', { caffeine: 'Level 1 · 50 mg · Citrus', pack: 'Box of 12' }, `${plan.cafGels} × Carb Gel 30 Caffeine`, 'Second half, in place of a regular gel']);
    if (plan.mix) items.push(['fuel-mix-60', { flavour: 'Citrus', size: 'Tub · 15 servings' }, `${plan.mix} × bottle of Fuel Mix 60`, '1 bottle (500 ml) per hour']);
    if (plan.naServ) items.push(['sodium', { strength: plan.strength }, `${plan.naServ} × Sodium ${plan.strength}`, 'Before the start and in the first hours']);
    const slots = plan.gels;
    $('#planOut', f).innerHTML = `
      <span class="eyebrow">Your plan · ${$('#plDurOut', f).textContent} · ${f.plInt.value.toLowerCase()}</span>
      <div class="plan-nums"><div><b>${plan.carbs}</b><span>g carbs / hour</span></div><div><b>${plan.sodium}</b><span>mg sodium / hour</span></div><div><b>${plan.fluid}</b><span>ml fluid / hour</span></div></div>
      ${slots ? `<div style="display:grid;gap:8px"><div class="plan-tl" aria-hidden="true">${Array.from({ length: slots }, (_, i) => `<i class="${i >= slots - plan.cafGels ? 'c' : 'g'}"></i>`).join('')}</div><div class="plan-legend"><span style="--k:var(--bone)">Carb Gel 30</span>${plan.cafGels ? '<span style="--k:var(--ignite)">Caffeine gel</span>' : ''}${plan.mix ? `<span style="--k:var(--raised-2)">+ ${plan.mix} bottle${plan.mix > 1 ? 's' : ''} of Fuel Mix</span>` : ''}</div></div>` : ''}
      <div class="plan-list">${items.map(([id, o, t, s]) => `<div class="plan-item">${thumb(byId[id], o)}<div><b>${t}</b><small>${s}</small></div><span class="mono" style="font-size:13px;color:var(--muted)">${money(unitPrice(byId[id], o))}</span></div>`).join('') || '<p style="color:var(--muted)">Under an hour at an easy pace, water is enough. Fuel the session before with a proper meal.</p>'}</div>
      ${items.length ? `<button class="btn btn-primary btn-l btn-block" type="button" id="planAdd">Add plan to cart</button>` : ''}
      <p class="plan-note">General guidance for healthy adults, not medical advice. Practise any fuelling plan in training first.</p>`;
    const b = $('#planAdd', f); if (b) b.onclick = () => { items.forEach(([id, o]) => addToCart(id, o, 1, false, false)); openCart(); };
  };
  f.addEventListener('input', run); f.addEventListener('change', run); run();
}
function viewPlanner() {
  return `<div class="wrap"><div class="shop-top"><span class="eyebrow">Fuel planner</span><h1 class="d-xl">Set yourself up for success</h1><p class="lead">The best tools only work with a plan. Enter your session and we'll work out carbs, sodium and fluid per hour, then build the basket for you.</p></div>
    <div class="section-tight">${plannerHTML()}</div>
    <div class="section-tight" style="padding-top:0;display:grid;gap:20px;max-width:70ch;color:var(--muted)">
      <h2 class="d-m" style="color:var(--bone)">How the numbers work</h2>
      <p><b style="color:var(--bone)">Carbs.</b> Under an hour you rarely need fuel. From 1–2.5 hours, 30–60 g per hour. Longer and harder, 60–90 g per hour, using a mix of glucose and fructose so your gut can absorb more. Every Soulset carb product uses a 2:1 ratio.</p>
      <p><b style="color:var(--bone)">Sodium.</b> Sweat losses vary widely, from about 300 to over 1,500 mg per litre. Heat and humidity raise them. If you finish sessions with salt on your skin, start with more.</p>
      <p><b style="color:var(--bone)">Fluid.</b> Drink to thirst, roughly 500–750 ml per hour, more in the heat. Weigh yourself before and after a long session to learn your own rate.</p>
    </div></div>`;
}

/* ------------------------------------------------------------ manifesto */
function viewManifesto() {
  const pillars = [
    ['Mindset over everything', 'The head goes first and the body follows. Without the right winning mindset, the challenges between you and your aspirations stay where they are.'],
    ['Invest in yourself', 'Your goals and ambitions deserve real investment: time, effort, money, sleep, discipline. You are the project.'],
    ['Set yourself up to win', 'Use the best tools available. Our nutrition is one of them. A plan beats hope every time.'],
    ['Empowerment, passion, winning mentality', 'We speak to people who expect to win, and who act like it long before the result shows up.'],
    ['Whole soul', 'Half effort is not an option. Whatever you are doing, put all of yourself into it.'],
    ['Stay relentless', 'Keep going when it stops being fun. That is where the work actually starts.'],
  ];
  return `<div class="wrap">
    <section class="mf-hero">
      <span class="eyebrow">Our manifesto</span>
      <div class="def"><div class="def-word">Soul<br>set</div>
        <div class="def-body"><span class="pos">soul·set /ˈsōlˌset/ · noun</span>
          <p style="font-size:22px;color:var(--bone)">The empowered attitude of putting your whole soul into something.</p>
          <blockquote>"Her soulset showed up long before race day. It lived in the early starts, the quiet miles, and the work no one saw."</blockquote>
          <p style="color:var(--muted)">The name is two words pressed into one: <b style="color:var(--bone)">soul</b> and <b style="color:var(--bone)">mindset</b>. It means putting your whole soul into whatever you are doing.</p></div></div>
    </section>

    <section class="section statement">
      <h2 class="d-xl">Put your whole soul into it</h2>
      <div class="copy">
        <p>Soulset exists to push one belief: mentality is the greater factor in reaching any goal. Talent, genetics and gear matter. They come second.</p>
        <p>The empowered attitude of putting your whole soul into something gives you a sense of control in difficult situations. When the session hurts, when the race goes wrong, when life gets loud, the decision to keep going is still yours.</p>
        <p>Without the right winning mindset, it isn't possible to overcome the challenges that lie between us and our aspirations. <b style="color:var(--bone)">Your mind is the first thing you have to convince.</b></p>
      </div>
    </section>
  </div>

  <section class="cine cine-center">${cineMedia('sweat-bw')}<div class="wrap cine-in" style="--h:clamp(460px,72vh,760px)">
    <h2 class="d-xl" style="max-width:15ch">Early starts. Quiet miles. Work no one saw.</h2>
  </div></section>

  <section class="band"><div class="wrap section" style="display:grid;gap:20px;justify-items:start">
    <span class="eyebrow">The rule</span>
    <h2 class="d-xxl">Mentality <span class="gt">&gt;</span> everything</h2>
    <p class="lead" style="color:#3A3936">Everything we make, write and print is a reminder of it, from the front of a gel to the lid of a tub.</p>
  </div></section>

  <div class="wrap">
    <section class="section" style="display:grid;gap:32px">
      <div class="sec-head" style="margin:0"><div><span class="eyebrow">The Soulset loop</span><h2 class="d-l">Stop wishing. Start doing.</h2><p class="lead">We want this brand to be a constant reminder to act. Results don't come from wanting them. They come from a loop you repeat until it becomes who you are.</p></div></div>
      <div class="loop">
        <div><span class="mono">01</span><span class="d-s">Believe potential</span><p>See what you could become before anyone else does.</p></div>
        <div><span class="mono">02</span><span class="d-s">Take action</span><p>Stop wishing. Start doing. Today, not Monday.</p></div>
        <div><span class="mono">03</span><span class="d-s">Results</span><p>Proof, earned one session at a time.</p></div>
        <div><span class="mono">04</span><span class="d-s">Believe</span><p>Results feed belief. Belief starts the next round.</p></div>
        <div><span class="mono">05</span><span class="d-s">Success</span><p>Not a finish line. The loop, repeated until it's who you are.</p></div>
      </div>
    </section>

    <section class="section" style="padding-top:0">
      <div class="sec-head"><div><span class="eyebrow">What we stand for</span><h2 class="d-l">Six pillars</h2></div></div>
      <div class="pillars">${pillars.map(([t, d], i) => `<div class="pillar"><span class="mono">0${i + 1}</span><span class="d-s" style="font-size:30px">${t}</span><p>${d}</p></div>`).join('')}</div>
    </section>

    <section class="section mark-story" style="padding-top:0">
      <div>${tpl('t-mark')}</div>
      <div style="display:grid;gap:24px"><div style="display:grid;gap:12px"><span class="eyebrow">The mark</span><h2 class="d-l">Level up, three times</h2><p class="lead">Our S leans forward. Our A is built from three rising chevrons, one for each step of the loop. Together they read SA: Soulset Athletics.</p></div>
        <ol><li><span class="mono">01</span><div><b>Believe</b><p>The first chevron. Convince your mind.</p></div></li><li><span class="mono">02</span><div><b>Act</b><p>The second. Do the work, especially when you don't feel like it.</p></div></li><li><span class="mono">03</span><div><b>Results</b><p>The third. Earned, then used to believe again.</p></div></li></ol></div>
    </section>
  </div>

  <section class="cine cine-bw cine-flip" style="--pos:62% 50%">${cineStill('run-street')}<div class="wrap cine-in">
      <h2 class="d-xxl">Stay relentless</h2>
      <p class="lead">Set yourself up for success with the best tools possible. Then put your whole soul into it.</p>
      <div class="hero-cta"><a class="btn btn-primary btn-l" href="#shop">Shop the fuel <span class="edge">›</span></a><a class="btn btn-secondary btn-l" href="#fuel-planner">Build a fuel plan</a></div>
  </div></section>`;
}

/* ------------------------------------------------------------ help */
function viewHelp() {
  const faq = [
    ['When can I order?', 'Soulset is in pre-launch. Join the waitlist and we will email you the day orders open, with 10% off your first order. Prices and formulas shown here may still change before launch.'],
    ['Where do you ship?', 'At launch we will ship across the Dominican Republic, with free standard shipping on orders over US$75. We don’t ship internationally yet.'],
    ['How long does delivery take?', 'Dominican Republic: 2–4 business days, or next business day in Santo Domingo and Santiago with Express. Pickup in Santo Domingo is free.'],
    ['How does Subscribe & save work?', 'You save 15% on every subscribed product, delivered every 4 weeks. Skip, change or cancel any time before your next order ships.'],
    ['What is your return policy?', 'Unopened products can be returned within 30 days for a full refund. If something arrives damaged, email us a photo and we will replace it.'],
    ['Which gel should I use?', 'Carb Gel 30 for most of your fuelling. Swap in Carb Gel 30 Caffeine (Level 1 or 2) in the second half of long sessions. The chevrons on the pack show the caffeine level.'],
    ['How do I pick a Sodium strength?', 'Start with 1000 mg. Go to 1500 mg if you sweat heavily, train in heat or see salt marks on your kit; drop to 500 mg in cool weather or short sessions.'],
    ['What happens when I join the waitlist?', 'We save your email and any products in your cart so we know what to make first. You only get launch news from us, and you can unsubscribe at any time.'],
  ];
  return `<div class="wrap"><div class="shop-top"><span class="eyebrow">Help</span><h1 class="d-xl">Shipping, returns &amp; FAQ</h1></div>
    <div class="acc section-tight" style="max-width:820px;border:0">${faq.map(([q, a], i) => `<details ${i < 2 ? 'open' : ''}><summary>${q}</summary><div class="acc-body"><p>${a}</p></div></details>`).join('')}</div></div>`;
}

/* ------------------------------------------------------------ waitlist
   Pre-launch: there is no checkout. The cart is a wishlist and every purchase path ends here.
   Sign-ups are POSTed as JSON to window.SOULSET_CONFIG.waitlistEndpoint (see README).
   With no endpoint set, the site runs in demo mode and keeps the sign-up in this browser only. */
const WAITLIST_URL = String((window.SOULSET_CONFIG || {}).waitlistEndpoint || '').trim();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PROVINCES = ['Azua', 'Bahoruco', 'Barahona', 'Dajabón', 'Distrito Nacional', 'Duarte', 'El Seibo', 'Elías Piña', 'Espaillat', 'Hato Mayor', 'Hermanas Mirabal', 'Independencia', 'La Altagracia', 'La Romana', 'La Vega', 'María Trinidad Sánchez', 'Monseñor Nouel', 'Monte Cristi', 'Monte Plata', 'Pedernales', 'Peravia', 'Puerto Plata', 'Samaná', 'San Cristóbal', 'San José de Ocoa', 'San Juan', 'San Pedro de Macorís', 'Sánchez Ramírez', 'Santiago', 'Santiago Rodríguez', 'Santo Domingo', 'Valverde'];
function picks() { return cart.map(l => ({ id: l.id, name: byId[l.id].name, options: optSummary(l), qty: l.qty, subscribe: !!l.sub })); }
async function joinWaitlist(data) {
  const list = picks();
  const payload = {
    email: data.email, firstName: data.firstName || '', province: data.province || '',
    picks: list, picksSummary: list.map(p => `${p.qty} × ${p.name} (${p.options})`).join('; '),
    source: data.source || 'website', language: navigator.language || '', siteLanguage: 'en', submittedAt: new Date().toISOString(),
  };
  if (WAITLIST_URL) {
    const res = await fetch(WAITLIST_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error('Waitlist endpoint returned ' + res.status);
  } else {
    console.warn('[Soulset] Demo mode: no waitlistEndpoint is set, so this sign-up was not sent anywhere.', payload);
  }
  store.set('waitlist', { email: payload.email, firstName: payload.firstName, province: payload.province, at: payload.submittedAt });
  return payload;
}

function picksHTML() {
  if (!cart.length) return `<span class="eyebrow">Your picks</span>
    <p style="color:var(--muted);margin:0">Nothing saved yet. Add products to your cart and we’ll keep them with your spot on the list.</p>
    <div><a class="btn btn-secondary" href="#shop">Browse the line-up</a></div>`;
  return `<span class="eyebrow">Your picks · ${cartCount()} item${cartCount() === 1 ? '' : 's'}</span>
    <div style="display:grid;gap:14px">${cart.map(l => { const p = byId[l.id]; return `<div class="sum-item"><div class="th"><img src="${IMG(mainImg(p, l.opts))}" alt=""><em>${l.qty}</em></div><div><b>${esc(p.name)}</b><small>${esc(optSummary(l))}</small></div><span class="mono">${money2(linePrice(l) * l.qty)}</span></div>`; }).join('')}</div>
    <div class="sum-total"><span>At launch</span><span style="display:flex;gap:8px;align-items:baseline"><span class="mono" style="color:var(--muted);font-size:13px">USD</span><b>${money2(subtotal())}</b></span></div>
    <p style="font-size:13px;color:var(--muted);margin:0">Estimated launch prices, taxes included. Nothing is charged today.</p>`;
}

function viewWaitlist() {
  const saved = store.get('waitlist', null);
  const f = (id, label, attrs = '') => `<div class="f"><label for="${id}">${label}</label><input class="input" id="${id}" name="${id}" ${attrs}><span class="err" id="${id}-err"></span></div>`;
  return `<div class="wrap"><div class="co wl">
    <form class="co-main" id="wlForm" novalidate>
      <div style="display:grid;gap:16px"><span class="eyebrow">Pre-launch</span><h1 class="d-xl">Get first access</h1>
        <p class="lead" style="margin:0">We’re not taking orders yet. Leave your email and we’ll tell you the moment Soulset launches, with 10% off your first order.</p></div>
      ${saved ? `<div class="testmode" role="note"><b>You’re already on the list</b> as ${esc(saved.email)}. Sign up again to update your picks.</div>` : ''}
      <fieldset class="fs"><legend class="sr">Your details</legend>
        ${f('wlEmail', 'Email', `type="email" autocomplete="email" required placeholder="you@email.com" value="${esc(saved ? saved.email : '')}"`)}
        <div class="row2">${f('wlFirst', 'First name (optional)', `autocomplete="given-name" value="${esc(saved ? saved.firstName : '')}"`)}
          <div class="f"><label for="wlProvince">Which province do you train in?</label><select class="select" id="wlProvince" name="wlProvince" autocomplete="address-level1"><option value="">Choose your province</option>${PROVINCES.map(v => `<option${saved && saved.province === v ? ' selected' : ''}>${v}</option>`).join('')}</select></div></div>
        <div class="hp" aria-hidden="true"><label for="wlCompany">Company</label><input id="wlCompany" name="company" tabindex="-1" autocomplete="off"></div>
      </fieldset>
      <div style="display:grid;gap:10px">
        <button class="btn btn-primary btn-l btn-block" type="submit" id="wlBtn">Join the waitlist <span class="edge">›</span></button>
        <span class="err" id="wl-err" role="alert"></span>
        <p style="font-size:13px;color:var(--dim);margin:0">We only email you about the launch. Unsubscribe any time.</p>
      </div>
    </form>
    <aside class="co-side" aria-label="Your picks">${picksHTML()}</aside>
  </div></div>`;
}
function bindWaitlist(root) {
  const form = $('#wlForm', root); if (!form) return;
  const setErr = (id, msg) => { const el = $('#' + id + '-err', root); if (el) el.textContent = msg; const inp = $('#' + id, root); if (inp) inp.setAttribute('aria-invalid', msg ? 'true' : 'false'); };
  form.addEventListener('input', e => { if (e.target.getAttribute('aria-invalid') === 'true') setErr(e.target.id, ''); setErr('wl', ''); });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const email = $('#wlEmail', root).value.trim();
    if (!EMAIL_RE.test(email)) { setErr('wlEmail', 'Enter a valid email, like you@email.com.'); $('#wlEmail', root).focus(); return; }
    if ($('#wlCompany', root).value) { location.hash = 'waitlist-confirmed'; return; } /* honeypot: bots fill hidden fields */
    const btn = $('#wlBtn', root); btn.disabled = true;
    $('#processing').classList.add('on');
    try {
      await joinWaitlist({ email, firstName: $('#wlFirst', root).value.trim(), province: $('#wlProvince', root).value, source: 'waitlist-page' });
      location.hash = 'waitlist-confirmed';
    } catch (err) {
      setErr('wl', `We couldn’t save your spot. Check your connection and try again.`);
      btn.disabled = false;
    } finally { $('#processing').classList.remove('on'); }
  });
}

function viewWaitlistDone() {
  const w = store.get('waitlist', null);
  if (!w) return viewWaitlist();
  return `<div class="wrap conf">
    <div style="display:grid;gap:16px"><span class="eyebrow">Waitlist · confirmed</span><h1 class="d-xxl">You’re on the list${w.firstName ? ', ' + esc(w.firstName) : ''}</h1>
      <p class="lead">We’ll email <b style="color:var(--bone)">${esc(w.email)}</b> the day Soulset launches, with 10% off your first order. Until then: stop wishing, start doing.</p></div>
    <div class="conf-grid">
      <div class="conf-box">${picksHTML()}</div>
      <div class="conf-box" style="background:var(--raised)"><h3>While you wait</h3><p>Work out your carbs, sodium and fluid per hour, or read what we stand for.</p><div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn btn-primary" href="#fuel-planner">Fuel planner</a><a class="btn btn-secondary" href="#manifesto">Read the manifesto</a></div></div>
    </div></div>`;
}

/* ------------------------------------------------------------ cinematic footage */
// Reduced motion and Save-Data keep the still poster; otherwise videos load near the viewport and pause off-screen.
const quietMotion = matchMedia('(prefers-reduced-motion: reduce)').matches || !!(navigator.connection && navigator.connection.saveData);
const cineObs = 'IntersectionObserver' in window && !quietMotion ? new IntersectionObserver(es => es.forEach(e => {
  const v = e.target;
  if (!e.isIntersecting) return v.pause();
  if (!v.src) { v.muted = true; v.src = v.dataset.src; v.addEventListener('playing', () => v.classList.add('on'), { once: true }); }
  v.play().catch(() => {});
}), { rootMargin: '200px 0px' }) : null;
function bindCine(root) { if (!cineObs) return; cineObs.disconnect(); $$('.cine-media video', root).forEach(v => cineObs.observe(v)); }

/* ------------------------------------------------------------ router */
const view = $('#view');
function setTitle(t) { document.title = t ? `${t} · Soulset Athletics` : 'Soulset Athletics'; }
function render() {
  const h = (location.hash || '#home').slice(1);
  let html, bind = () => {}, title = '', nav = h;
  if (h === 'home' || h === '') { html = viewHome(); bind = bindHome; nav = ''; }
  else if (h === 'shop' || h.startsWith('shop-')) { const cat = h.slice(5) || ''; html = viewShop(CATS[cat] ? cat : ''); bind = r => bindShop(r); title = cat && CATS[cat] ? CATS[cat].name : 'Shop'; }
  else if (h.startsWith('p-') && byId[h.slice(2)]) { const p = byId[h.slice(2)]; const v = viewProduct(p); html = v.html; bind = v.bind; title = p.name; nav = 'shop-' + p.cat; }
  else if (h === 'fuel-planner') { html = viewPlanner(); bind = bindPlanner; title = 'Fuel planner'; }
  else if (h === 'manifesto') { html = viewManifesto(); title = 'Our manifesto'; }
  else if (h === 'help') { html = viewHelp(); title = 'Help'; }
  else if (h === 'waitlist' || h === 'checkout') { html = viewWaitlist(); bind = bindWaitlist; title = 'Join the waitlist'; nav = 'waitlist'; }
  else if (h === 'waitlist-confirmed' || h === 'order-confirmed') { const done = !!store.get('waitlist', null); html = viewWaitlistDone(); bind = done ? () => {} : bindWaitlist; title = done ? 'You’re on the list' : 'Join the waitlist'; nav = 'waitlist'; }
  else { html = `<div class="wrap conf"><h1 class="d-xl">Page not found</h1><p class="lead">That page doesn't exist. Your next session does.</p><div><a class="btn btn-primary btn-l" href="#shop">Shop all</a></div></div>`; title = 'Not found'; }
  view.innerHTML = html; bind(view); bindCine(view); setTitle(title);
  $$('.nav a').forEach(a => a.toggleAttribute('aria-current', false));
  $$('.nav a').forEach(a => { if (a.dataset.nav === nav) a.setAttribute('aria-current', 'page'); });
  $('#shopBtn').classList.toggle('is-current', nav.startsWith('shop'));
  closeShop(shopDrop.matches(':hover'));
  $('#mnav').classList.remove('open'); $('#menuBtn').setAttribute('aria-expanded', 'false');
  $$('[data-lang-base]').forEach(a => { a.href = a.dataset.langBase + location.hash; });
  window.scrollTo(0, 0);
}
const shopDrop = $('#shopDrop'), shopBtn = $('#shopBtn');
function closeShop(shut) { shopDrop.classList.remove('open'); shopBtn.setAttribute('aria-expanded', 'false'); if (shut) shopDrop.classList.add('shut'); }
shopBtn.addEventListener('click', () => { if (shopDrop.classList.contains('open')) return closeShop(true); shopDrop.classList.add('open'); shopDrop.classList.remove('shut'); shopBtn.setAttribute('aria-expanded', 'true'); });
shopDrop.addEventListener('mouseleave', () => shopDrop.classList.remove('shut'));
document.addEventListener('click', e => { if (!shopDrop.contains(e.target)) closeShop(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && shopDrop.classList.contains('open')) { closeShop(); shopBtn.focus(); } });
$('#menuBtn').addEventListener('click', () => { const m = $('#mnav'); const o = m.classList.toggle('open'); $('#menuBtn').setAttribute('aria-expanded', o); });
$('#footStack').innerHTML = tpl('t-stack');
$('#spinChev').innerHTML = tpl('t-chev');
window.addEventListener('hashchange', render);
renderCart(); render();
})();
