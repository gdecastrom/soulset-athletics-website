/* ============================================================ Soulset Athletics storefront · Español
   Spanish copy of app.js, loaded by es/index.html. Logic matches app.js line for line; only the copy,
   the image path and the storage prefix differ. Keep the two files in sync when changing behaviour. */
(() => {
'use strict';
const IMG = n => `../assets/img/${n}.webp`;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => 'US$' + (Math.round(n * 100) / 100).toFixed(2).replace(/\.00$/, '');
const money2 = n => 'US$' + (Math.round(n * 100) / 100).toFixed(2);
const tpl = id => document.getElementById(id).innerHTML;
const SUB_OFF = 0.15, FREE_SHIP = 75;

/* ------------------------------------------------------------ catálogo */
const CATS = {
  fuel: { name: 'Energía', line: 'Geles de carbohidratos y bebida de carbohidratos + sodio para sesiones largas y duras.' },
  hydrate: { name: 'Hidratación', line: 'Sodio que dosificas según tu sudor, sin azúcar.' },
  build: { name: 'Fuerza', line: 'Creatina monohidratada. Un solo ingrediente, todos los días.' },
  ignite: { name: 'Activación', line: 'Pre-entreno para enfoque, resistencia y bombeo.' },
  stacks: { name: 'Combos', line: 'Los productos correctos juntos, por menos.' },
};
const GEL_USE = ['Toma 1 gel cada 20–30 minutos en sesiones de más de 60 minutos.', 'Apunta a 60–90 g de carbohidratos por hora: eso son 2–3 geles.', 'Tómalo con unos sorbos de agua. Practica tu alimentación en los entrenamientos antes del día de la carrera.'];
const GEL_ING = 'Agua, maltodextrina, fructosa, citrato de sodio, cloruro de sodio, saborizante natural, ácido cítrico, conservante (sorbato de potasio).';
const P = [
  { id: 'carb-gel-30', code: 'GEL-030', cat: 'fuel', name: 'Carb Gel 30', tag: 'Esencial', level: 0,
    short: '30 g carbohidratos · 200 mg sodio · sin cafeína',
    blurb: 'Energía rápida para sesiones largas. 30 g de carbohidratos en una mezcla 2:1 de glucosa y fructosa, más 200 mg de sodio en cada gel para reponer lo que pierdes al sudar. Ligero, fácil de tragar, sin cafeína.',
    stats: [['30', 'g carbohidratos'], ['200', 'mg sodio'], ['0', 'mg cafeína']],
    options: [{ key: 'flavour', label: 'Sabor', values: [{ v: 'Neutro', img: 'gel-neutral' }, { v: 'Cítrico', img: 'gel-citrus' }, { v: 'Frutos rojos con sal', img: 'gel-salted-berry' }] },
              { key: 'pack', label: 'Presentación', values: [{ v: 'Caja de 12', price: 30 }, { v: 'Caja de 24', price: 56, note: 'Ahorra 7%' }] }],
    gallery: ['gel-trio', 'gel-back'],
    nutrition: { serving: 'Por gel de 40 ml', rows: [['Energía', '120 kcal'], ['Carbohidratos', '30 g', 'key'], ['de los cuales azúcares', '10 g', 'sub'], ['Sodio', '200 mg', 'key'], ['Cafeína', '0 mg']] },
    use: GEL_USE, ingredients: GEL_ING, pairs: ['carb-gel-30-caffeine', 'sodium'], sub: true },
  { id: 'carb-gel-30-caffeine', code: 'GEL-030C', cat: 'fuel', name: 'Carb Gel 30 Caffeine', tag: 'Sube de nivel', level: 1,
    short: '30 g carbohidratos · 200 mg sodio · 50 o 100 mg cafeína',
    blurb: 'Los mismos 30 g de carbohidratos y 200 mg de sodio, con cafeína para las horas en que tu cabeza lo necesita más que tus piernas. Elige Nivel 1 (50 mg) o Nivel 2 (100 mg). Los chevrones del empaque te dicen cuál es cuál.',
    stats: [['30', 'g carbohidratos'], ['200', 'mg sodio'], ['50–100', 'mg cafeína']],
    options: [{ key: 'caffeine', label: 'Cafeína', values: [{ v: 'Nivel 1 · 50 mg · Cítrico', img: 'gel-caf50', level: 1 }, { v: 'Nivel 2 · 100 mg · Cola', img: 'gel-caf100', level: 2 }] },
              { key: 'pack', label: 'Presentación', values: [{ v: 'Caja de 12', price: 34 }, { v: 'Caja de 24', price: 64, note: 'Ahorra 6%' }] }],
    gallery: ['gel-caf-duo', 'gel-back'],
    nutrition: { serving: 'Por gel de 40 ml', rows: [['Energía', '120 kcal'], ['Carbohidratos', '30 g', 'key'], ['de los cuales azúcares', '10 g', 'sub'], ['Sodio', '200 mg', 'key'], ['Cafeína', '50 o 100 mg', 'key']] },
    use: ['Úsalo en la segunda mitad de sesiones largas o carreras, cuando el enfoque empieza a bajar.', 'No pases de 400 mg de cafeína al día sumando todas las fuentes.', 'Cámbialo por un Carb Gel 30 para que tus carbohidratos por hora sigan iguales.'],
    ingredients: GEL_ING.replace('saborizante natural', 'saborizante natural, cafeína'), warn: 'Contiene cafeína. No apto para niños ni para mujeres embarazadas o en período de lactancia.', pairs: ['carb-gel-30', 'fuel-mix-60'], sub: true },
  { id: 'fuel-mix-60', code: 'MIX-060', cat: 'fuel', name: 'Fuel Mix 60', tag: 'Carbos + sodio', level: 0,
    short: '60 g carbohidratos · 500 mg sodio por botella',
    blurb: 'Carbohidratos y sodio en una sola botella. 60 g de carbohidratos y 500 mg de sodio por cada 500 ml, así que una botella por hora cubre casi todo lo que necesitas. Sabor ligero que se sigue tomando bien en la cuarta hora.',
    stats: [['60', 'g carbohidratos'], ['500', 'mg sodio'], ['500', 'ml agua']],
    options: [{ key: 'flavour', label: 'Sabor', values: [{ v: 'Neutro', img: 'mix-neutral' }, { v: 'Cítrico', img: 'mix-citrus' }] },
              { key: 'size', label: 'Tamaño', values: [{ v: 'Pote · 15 porciones', price: 42 }, { v: 'Pote · 30 porciones', price: 76, note: 'Ahorra 10%' }] }],
    gallery: ['mix-side'],
    nutrition: { serving: 'Por medida de 65 g en 500 ml', rows: [['Energía', '240 kcal'], ['Carbohidratos', '60 g', 'key'], ['de los cuales azúcares', '20 g', 'sub'], ['Sodio', '500 mg', 'key'], ['Potasio', '100 mg'], ['Cafeína', '0 mg']] },
    use: ['Mezcla 1 medida (65 g) en 500 ml de agua fría.', 'Toma una botella por hora para 60 g de carbohidratos y 500 mg de sodio.', 'Suma geles si necesitas más de 60 g por hora.'],
    ingredients: 'Maltodextrina, fructosa, citrato de sodio, cloruro de sodio, cloruro de potasio, saborizante natural, ácido cítrico.', pairs: ['carb-gel-30', 'sodium'], sub: true },
  { id: 'sodium', code: 'NA-MIX', cat: 'hydrate', name: 'Sodium', tag: 'Cero azúcar', level: 0,
    short: '500 · 1000 · 1500 mg de sodio por porción',
    blurb: 'Electrolitos solo de sodio en tres concentraciones, sin azúcar. Elige la que corresponde a cuánto y qué tan salado sudas, y añade los carbohidratos por separado cuando los necesites.',
    stats: [['1000', 'mg sodio'], ['0', 'g azúcar'], ['5', 'kcal']],
    options: [{ key: 'strength', label: 'Concentración', values: [{ v: '500 mg', img: 'na-500', price: 28, hint: 'Sudas poco, días frescos' }, { v: '1000 mg', img: 'na-1000', price: 28, hint: 'La mayoría de atletas, días cálidos' }, { v: '1500 mg', img: 'na-1500', price: 28, hint: 'Sudor salado, calor, verano caribeño' }] }],
    gallery: ['na-side'],
    nutrition: { serving: 'Por medida en 500 ml', rows: [['Energía', '5 kcal'], ['Azúcares', '0 g'], ['Sodio', '500 / 1000 / 1500 mg', 'key'], ['Potasio', '150 mg'], ['Magnesio', '50 mg']] },
    use: ['Mezcla 1 medida en 500 ml de agua.', 'Toma una porción antes de sesiones largas o con calor, y luego una por hora durante.', 'Si después de entrenar te quedan marcas blancas de sal en la ropa, sudas salado: sube la concentración.'],
    ingredients: 'Citrato de sodio, cloruro de sodio, citrato de potasio, citrato de magnesio, saborizante natural, ácido cítrico, extracto de hoja de stevia.', pairs: ['fuel-mix-60', 'carb-gel-30'], sub: true },
  { id: 'creatine', code: 'CRE-005', cat: 'build', name: 'Creatine Monohydrate', tag: 'Pura', level: 0,
    short: '5 g por medida · un ingrediente',
    blurb: 'Un solo ingrediente: creatina monohidratada, el suplemento más investigado del deporte. 5 g al día apoyan la fuerza, la potencia y los esfuerzos repetidos. Sin sabor, se mezcla con lo que sea.',
    stats: [['5', 'g por medida'], ['1', 'ingrediente'], ['60', 'porciones']],
    options: [{ key: 'size', label: 'Tamaño', values: [{ v: '300 g · 60 porciones', img: 'cre-300', price: 32 }, { v: '600 g · 120 porciones', img: 'cre-600', price: 55, note: 'Ahorra 14%' }] }],
    gallery: ['cre-side'],
    nutrition: { serving: 'Por medida de 5 g', rows: [['Creatina monohidratada', '5 g', 'key'], ['Otros ingredientes', 'Ninguno']] },
    use: ['Mezcla 1 medida (5 g) en agua, un batido o café.', 'Tómala todos los días, entrenes o no. La constancia importa más que el momento.', 'No necesitas fase de carga.'],
    ingredients: 'Creatina monohidratada.', pairs: ['pre-workout', 'strength-stack'], sub: true },
  { id: 'pre-workout', code: 'PRE-200', cat: 'ignite', name: 'Pre-Workout', tag: 'Nivel 2', level: 2,
    short: '200 mg cafeína · 3.2 g beta-alanina · 6 g citrulina',
    blurb: 'Enciéndete antes de empezar. 200 mg de cafeína para el enfoque, 3.2 g de beta-alanina para aguantar los esfuerzos duros y 6 g de L-citrulina malato para el flujo sanguíneo y el bombeo. Etiqueta limpia, cada dosis impresa.',
    stats: [['200', 'mg cafeína'], ['3.2', 'g beta-alanina'], ['6', 'g citrulina']],
    options: [{ key: 'flavour', label: 'Sabor', values: [{ v: 'Manzana ácida', img: 'pre-sour-apple' }, { v: 'Naranja sanguina', img: 'pre-blood-orange' }, { v: 'Mango', img: 'pre-mango' }] }],
    basePrice: 45, gallery: ['pre-side', 'pre-top'],
    nutrition: { serving: 'Por medida de 14 g', rows: [['Cafeína', '200 mg', 'key'], ['Beta-alanina', '3.2 g', 'key'], ['L-citrulina malato 2:1', '6 g', 'key'], ['L-tirosina', '1 g'], ['Sodio', '150 mg']] },
    use: ['Mezcla 1 medida (14 g) en 300 ml de agua.', 'Tómalo 20–30 minutos antes de entrenar.', 'La beta-alanina puede causar un cosquilleo inofensivo. Máximo 1 medida al día; evítalo en las 6 horas antes de dormir.'],
    ingredients: 'L-citrulina malato, beta-alanina, L-tirosina, ácido cítrico, saborizante natural, cafeína anhidra, cloruro de sodio, sucralosa, polvo de remolacha (color).',
    warn: 'Contiene 200 mg de cafeína por porción. No apto para niños, mujeres embarazadas o en período de lactancia, ni personas sensibles a la cafeína.', pairs: ['creatine', 'strength-stack'], sub: true },
  { id: 'race-day-stack', code: 'STK-RACE', cat: 'stacks', name: 'Race Day Stack', tag: 'Ahorra US$15', level: 0,
    short: 'Carb Gel 30 ×12 · Fuel Mix 60 · Sodium 1000',
    blurb: 'Todo para una carrera larga en una caja: una caja de 12 Carb Gel 30 (Cítrico), un pote de 15 porciones de Fuel Mix 60 (Cítrico) y un pote de Sodium 1000. Arma tu plan con el Planificador y llega listo.',
    stats: [['12', 'geles'], ['15', 'botellas de mezcla'], ['30', 'porciones de sodio']],
    options: [], basePrice: 85, compare: 100, gallery: [], main: 'bundle',
    contents: ['Carb Gel 30 · Cítrico · Caja de 12', 'Fuel Mix 60 · Cítrico · Pote · 15 porciones', 'Sodium · 1000 mg · 30 porciones'],
    use: ['La noche antes: prepara tus botellas de Fuel Mix 60.', 'Carrera: 1 botella por hora más 1 gel cada 30–40 minutos.', 'Día caluroso: añade una botella de Sodium 1000 en la primera hora.'], pairs: ['carb-gel-30-caffeine', 'sodium'], sub: false },
  { id: 'strength-stack', code: 'STK-STR', cat: 'stacks', name: 'Strength Stack', tag: 'Ahorra US$9', level: 2,
    short: 'Pre-Workout · Creatine 300 g',
    blurb: 'Pre-Workout (Naranja sanguina) y Creatine Monohydrate 300 g. Uno te enciende para hoy; el otro construye para los meses que vienen.',
    stats: [['200', 'mg cafeína'], ['5', 'g creatina'], ['30', 'sesiones']],
    options: [], basePrice: 68, compare: 77, gallery: [], main: 'stack-strength',
    contents: ['Pre-Workout · Naranja sanguina · 30 porciones', 'Creatine Monohydrate · 300 g · 60 porciones'],
    use: ['Pre-Workout 20–30 minutos antes de entrenar.', 'Creatina 5 g todos los días, a cualquier hora.'], pairs: ['pre-workout', 'creatine'], sub: false },
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

/* ------------------------------------------------------------ almacenamiento
   Prefijo propio: las opciones del carrito se guardan con sus nombres en español, que no coinciden con los de app.js. */
const store = {
  get(k, d) { try { const v = localStorage.getItem('ss_es_' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('ss_es_' + k, JSON.stringify(v)); } catch (e) { /* modo privado: queda en memoria */ } },
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
  if (open) openCart(); else toast(`Añadiste ${byId[id].name}`);
}
function cartCount() { return cart.reduce((a, l) => a + l.qty, 0); }
function subtotal() { return cart.reduce((a, l) => a + linePrice(l) * l.qty, 0); }

/* ------------------------------------------------------------ toast */
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2200); }

/* ------------------------------------------------------------ carrito */
const drawer = $('#drawer'), scrim = $('#scrim');
let lastFocus = null;
function openCart() { lastFocus = document.activeElement; drawer.classList.add('open'); scrim.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); setTimeout(() => $('#closeCart').focus(), 50); }
function closeCart() { drawer.classList.remove('open'); scrim.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); if (lastFocus) lastFocus.focus(); }
$('#cartBtn').addEventListener('click', openCart);
$('#closeCart').addEventListener('click', closeCart);
scrim.addEventListener('click', closeCart);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && drawer.classList.contains('open')) closeCart(); });

function optSummary(l) { const parts = Object.values(l.opts); if (l.sub) parts.push('Suscripción · cada 4 semanas'); return parts.join(' · '); }
function thumb(p, opts, cls = 'th') { const im = mainImg(p, opts); return `<div class="${cls}"><img src="${IMG(im)}" alt="" loading="lazy"></div>`; }
function qtyHTML(i, q, small = true) {
  return `<div class="qty ${small ? 'qty-s' : ''}" data-line="${i}"><button type="button" data-q="-1" aria-label="Reducir cantidad">−</button><input type="number" min="1" max="99" value="${q}" aria-label="Cantidad" inputmode="numeric"><button type="button" data-q="1" aria-label="Aumentar cantidad">+</button></div>`;
}
function renderCart() {
  const n = cartCount(); const cc = $('#cartCount'); cc.textContent = n; cc.dataset.n = n;
  $('#cartBtn').setAttribute('aria-label', `Abrir carrito, ${n} artículo${n === 1 ? '' : 's'}`);
  const sub = subtotal();
  $('#shipBar').innerHTML = `<span><b>Prelanzamiento.</b> Todavía no aceptamos pedidos. Guarda tus favoritos y únete a la lista de espera para tener acceso primero.</span>`;
  if (!cart.length) {
    $('#drawerItems').innerHTML = `<div class="empty"><span class="d-m">Aquí no hay nada todavía.</span><p>Deja de desear. Empieza a hacer. Elige tu energía.</p><a class="btn btn-primary" href="#shop" data-close>Ver todo</a></div>`;
    $('#drawerFoot').innerHTML = '';
  } else {
    $('#drawerItems').innerHTML = cart.map((l, i) => { const p = byId[l.id]; return `
      <div class="li">${thumb(p, l.opts)}
        <div style="min-width:0"><a class="li-name" href="#p-${p.id}" data-close>${esc(p.name)}</a><div class="li-opts">${esc(optSummary(l))}</div>${qtyHTML(i, l.qty)}</div>
        <div class="li-right"><span class="price">${money2(linePrice(l) * l.qty)}</span>${l.sub ? `<span class="save">−15%</span>` : ''}<button class="li-rm" data-rm="${i}">Quitar</button></div>
      </div>`; }).join('') + upsellHTML();
    $('#drawerFoot').innerHTML = `
      <div class="row-b"><span>Subtotal</span><span class="price">${money2(sub)}</span></div>
      <p style="font-size:13px;color:var(--muted)">Precios de lanzamiento, impuestos incluidos. Únete a la lista de espera y te guardamos estos productos.</p>
      <a class="btn btn-primary btn-l btn-block" href="#waitlist" data-close>Únete a la lista <span class="edge">›</span></a>
      <button class="btn-ghost" data-closebtn style="justify-self:center;font-weight:600;font-size:13px;letter-spacing:.12em;text-transform:uppercase">Seguir comprando</button>`;
  }
}
function upsellHTML() {
  const ids = new Set(cart.map(l => l.id));
  const cand = ['sodium', 'carb-gel-30', 'creatine', 'fuel-mix-60'].find(id => !ids.has(id));
  if (!cand) return '';
  const p = byId[cand], o = defaults(p);
  return `<div style="padding:18px 0;display:grid;gap:10px"><span class="eyebrow">Combina bien</span>
    <div class="li" style="border:0;padding:0">${thumb(p, o)}<div><b style="font-weight:600">${esc(p.name)}</b><div class="li-opts">${esc(p.short)}</div></div>
    <div class="li-right"><span class="price">${money(unitPrice(p, o))}</span><button class="btn btn-secondary" style="min-height:36px;padding:6px 12px;font-size:12px" data-quick="${p.id}">Añadir</button></div></div></div>`;
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

/* ------------------------------------------------------------ piezas compartidas */
function card(p) {
  const o = defaults(p); const lvl = levelOf(p, o);
  return `<article class="card">
    <a class="card-media" href="#p-${p.id}" tabindex="-1" aria-hidden="true"><img class="pack" src="${IMG(mainImg(p, o))}" alt="" loading="lazy"></a>
    <div class="card-tags">${p.tag ? `<span class="tag ${p.cat === 'stacks' ? 'tag-ignite' : ''}">${esc(p.tag)}</span>` : ''}</div>
    <div class="card-body">
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><span class="card-code">${p.code} · ${CATS[p.cat].name.toUpperCase()}</span>${lvl ? `<span class="lv-label">${levelsHTML(lvl)}</span>` : ''}</div>
      <h3 class="card-name"><a href="#p-${p.id}">${esc(p.name)}</a></h3>
      <p class="card-spec">${esc(p.short)}</p>
      <div class="card-foot"><span class="price">${p.options.some(op => op.values.some(v => v.price != null)) && new Set(p.options.flatMap(op => op.values.map(v => v.price)).filter(x => x != null)).size > 1 ? 'Desde ' : ''}${money(fromPrice(p))}${p.compare ? `<s>${money(p.compare)}</s>` : ''}</span>
        <button class="btn btn-secondary" style="min-height:40px;padding:8px 14px;font-size:12px" data-add="${p.id}" aria-label="Añadir ${esc(p.name)} al carrito">Añadir <span aria-hidden="true">+</span></button></div>
    </div></article>`;
}
function bindCardAdds(root) { root.addEventListener('click', e => { const b = e.target.closest('[data-add]'); if (!b) return; const p = byId[b.dataset.add]; addToCart(p.id, defaults(p), 1, false, true); }); }

/* ------------------------------------------------------------ inicio */
function viewHome() {
  const cats = [['fuel', 'Energía', 'Geles de carbohidratos y mezcla de carbos + sodio', '01', 'gel-citrus'], ['hydrate', 'Hidratación', 'Sodio, dosificado según tu sudor', '02', 'na-1000'], ['build', 'Fuerza', 'Creatina monohidratada', '03', 'cre-300'], ['ignite', 'Activación', 'Pre-entreno', '04', 'pre-mango']];
  const featured = ['carb-gel-30', 'fuel-mix-60', 'sodium', 'carb-gel-30-caffeine', 'pre-workout', 'creatine'];
  return `
  <section class="hero"><div class="wrap hero-in">
    <div class="hero-copy">
      <span class="eyebrow">Soulset Athletics · Nutrición deportiva</span>
      <h1 class="d-xxl">Mentalidad&nbsp;<span class="gt">&gt;</span> todo</h1>
      <p class="lead">Energía, hidratación y fuerza para atletas que le ponen toda el alma. Dosis claras, sin relleno, hechos para el calor y las horas largas.</p>
      <div class="hero-cta"><a class="btn btn-primary btn-l" href="#shop">Ver los productos <span class="edge">›</span></a><a class="btn btn-secondary btn-l" href="#manifesto">Lee el manifiesto</a></div>
      <div class="hero-facts"><span>Cada dosis impresa al frente</span><span>Diseñado para el calor caribeño</span><span>Suscríbete y ahorra 15%</span></div>
    </div>
    <div class="hero-art"><div class="hero-chev">${tpl('t-chev')}</div><img class="hero-img" src="${IMG('hero')}" alt="Potes de Pre-Workout, Fuel Mix 60 y Creatine de Soulset con tres sobres de Carb Gel 30" width="1500" height="1000"></div>
  </div></section>
  <div class="ticker" aria-hidden="true"><div class="ticker-track">${Array(2).fill('<span>Cree</span><span class="gt">›</span><span>Actúa</span><span class="gt">›</span><span>Resultados</span><span class="gt">›</span><span>Cree</span><span class="gt">›</span><span>Sin descanso</span><span class="gt">›</span><span>Mentalidad <i>&gt;</i> todo</span><span class="gt">›</span>').join('')}</div></div>

  <section class="section wrap">
    <div class="sec-head"><div><span class="eyebrow">Compra por objetivo</span><h2 class="d-l">Prepárate para ganar</h2></div><a class="btn-ghost btn" href="#shop">Ver todo <span class="edge">›</span></a></div>
    <div class="cats">${cats.map(([k, n, d, num, im]) => `<a class="cat" href="#shop-${k}"><img class="cat-img" src="${IMG(im)}" alt="" loading="lazy"><span class="num">${num}</span><div style="display:grid;gap:8px"><span class="d-m">${n}</span><p>${d}</p></div><span class="go">Ver ${n.toLowerCase()} ›</span></a>`).join('')}</div>
  </section>

  <section class="section-tight wrap" style="padding-top:0">
    <div class="sec-head"><div><span class="eyebrow">La línea</span><h2 class="d-l">Tu pasión, nuestro combustible</h2></div><a class="btn-ghost btn" href="#shop">Ver los 8 <span class="edge">›</span></a></div>
    <div class="grid" id="homeGrid">${featured.map(id => card(byId[id])).join('')}</div>
  </section>

  <section class="band"><div class="wrap section" style="display:grid;gap:28px">
    <span class="eyebrow">Nuestro manifiesto</span>
    <h2 class="d-xl" style="max-width:14ch">Ponle toda el alma</h2>
    <p class="lead" style="color:#3A3936;max-width:60ch">Tu mente es lo primero que tienes que convencer. Soulset es un recordatorio constante de dejar de desear y empezar a hacer: cree en tu potencial, actúa, gánate los resultados y vuelve a creer.</p>
    <div><a class="btn btn-primary btn-l" href="#manifesto" style="background:var(--void);color:var(--bone)">Lee el manifiesto <span class="edge">›</span></a></div>
  </div></section>

  <section class="section wrap">
    <div class="sec-head"><div><span class="eyebrow">Planificador</span><h2 class="d-l">Conoce tus números antes de la carrera</h2><p class="lead">Dinos cuánto dura y qué tan duro. Calculamos carbohidratos, sodio y líquido por hora, y armamos la canasta.</p></div></div>
    ${plannerHTML()}
  </section>

  <section class="section wrap" style="padding-top:0">
    <div class="sec-head"><div><span class="eyebrow">Cómo funciona el stack</span><h2 class="d-l">Energía. Hidratación. Fuerza. Activación.</h2></div></div>
    <div class="loop">
      <div><span class="mono">01 · DURANTE</span><span class="d-s">Carb Gel 30</span><p>30 g de carbohidratos y 200 mg de sodio por gel. 2–3 por hora.</p></div>
      <div><span class="mono">02 · EN LA BOTELLA</span><span class="d-s">Fuel Mix 60</span><p>60 g de carbohidratos y 500 mg de sodio por botella.</p></div>
      <div><span class="mono">03 · CON CALOR</span><span class="d-s">Sodium</span><p>500, 1000 o 1500 mg. Cero azúcar.</p></div>
      <div><span class="mono">04 · CADA DÍA</span><span class="d-s">Creatine</span><p>5 g. Un ingrediente. La constancia gana.</p></div>
      <div><span class="mono">05 · ANTES</span><span class="d-s">Pre-Workout</span><p>Cafeína, beta-alanina, citrulina. Enciéndete.</p></div>
    </div>
  </section>

  <section class="section-tight" style="border-top:1px solid var(--line)"><div class="wrap news">
    <div style="display:grid;gap:12px"><span class="eyebrow">Únete a la lista de espera</span><h2 class="d-l">Sin descanso</h2><p class="lead">Entérate primero cuando Soulset se lance y recibe 10% de descuento en tu primer pedido.</p></div>
    <div><form id="newsForm" novalidate><label class="sr" for="newsEmail">Correo electrónico</label><input id="newsEmail" type="email" placeholder="tu@correo.com" autocomplete="email" required><button class="btn btn-primary" type="submit">Únete a la lista</button></form><p class="news-msg" id="newsMsg"></p></div>
  </div></section>`;
}
function bindHome(root) {
  bindCardAdds(root); bindPlanner(root);
  $('#newsForm', root).addEventListener('submit', async e => {
    e.preventDefault(); const form = e.target; const v = $('#newsEmail', root).value.trim(); const m = $('#newsMsg', root); const btn = $('button', form);
    if (!EMAIL_RE.test(v)) { m.style.color = 'var(--danger)'; m.textContent = 'Escribe un correo válido, como tu@correo.com.'; return; }
    btn.disabled = true; m.style.color = 'var(--muted)'; m.textContent = 'Guardando tu lugar…';
    try { await joinWaitlist({ email: v, source: 'home' }); m.style.color = 'var(--success)'; m.textContent = `Ya estás en la lista. Te escribiremos en el lanzamiento con 10% de descuento en tu primer pedido.`; form.reset(); }
    catch (err) { m.style.color = 'var(--danger)'; m.textContent = `No pudimos guardar tu lugar. Revisa tu conexión e inténtalo de nuevo.`; }
    finally { btn.disabled = false; }
  });
}

/* ------------------------------------------------------------ tienda */
let sortBy = 'featured';
function viewShop(cat) {
  const list = P.filter(p => !cat || p.cat === cat);
  const sorted = [...list];
  if (sortBy === 'low') sorted.sort((a, b) => fromPrice(a) - fromPrice(b));
  if (sortBy === 'high') sorted.sort((a, b) => fromPrice(b) - fromPrice(a));
  const chips = [['', 'Todo'], ...Object.entries(CATS).map(([k, v]) => [k, v.name])];
  return `<div class="wrap">
    <div class="shop-top"><span class="eyebrow">Tienda${cat ? ' · ' + CATS[cat].name : ''}</span><h1 class="d-xl">${cat ? CATS[cat].name : 'Todos los productos'}</h1><p class="lead">${cat ? CATS[cat].line : 'Energía, hidratación y fuerza. Cada dosis impresa al frente del empaque.'}</p></div>
    <div class="filters"><div class="chips" role="group" aria-label="Filtrar por categoría">${chips.map(([k, n]) => `<a class="chip" href="#shop${k ? '-' + k : ''}" aria-pressed="${(cat || '') === k}">${n}</a>`).join('')}</div>
      <label style="display:flex;gap:10px;align-items:center;font-size:14px;color:var(--muted)"><span>Ordenar</span><select class="select" id="sortSel"><option value="featured">Destacados</option><option value="low">Precio: menor a mayor</option><option value="high">Precio: mayor a menor</option></select></label></div>
    <p class="mono" style="color:var(--dim);font-size:13px;margin-bottom:20px">${sorted.length} producto${sorted.length === 1 ? '' : 's'}</p>
    <div class="grid" style="padding-bottom:96px">${sorted.map(card).join('')}</div></div>`;
}
function bindShop(root, cat) {
  bindCardAdds(root);
  const s = $('#sortSel', root); s.value = sortBy;
  s.addEventListener('change', () => { sortBy = s.value; render(); });
}

/* ------------------------------------------------------------ producto */
function nutritionHTML(n) {
  return `<div class="nutri"><div class="nutri-head"><span>Nutrición</span><span>${esc(n.serving)}</span></div>${n.rows.map(r => `<div class="nutri-row ${r[2] || ''}"><span>${esc(r[0])}</span><span>${esc(r[1])}</span></div>`).join('')}</div>`;
}
function viewProduct(p) {
  const st = { opts: defaults(p), sub: false, qty: 1, img: null };
  const gal = [null, ...p.gallery];
  return { html: `<div class="wrap">
    <nav class="crumbs" aria-label="Ruta de navegación"><a href="#home">Inicio</a><span>/</span><a href="#shop-${p.cat}">${CATS[p.cat].name}</a><span>/</span><span aria-current="page">${esc(p.name)}</span></nav>
    <div class="pdp">
      <div class="pdp-media">
        <div class="pdp-stage"><div class="bigchev">${tpl('t-chev')}</div><img class="pack" id="pdpImg" alt="${esc(p.name)}" src="${IMG(mainImg(p, st.opts))}"></div>
        ${gal.length > 1 ? `<div class="thumbs" role="group" aria-label="Imágenes del producto">${gal.map((g, i) => `<button class="thumb" data-g="${i}" aria-label="Imagen ${i + 1}" aria-pressed="${i === 0}"><img src="${IMG(g || mainImg(p, st.opts))}" alt=""></button>`).join('')}</div>` : ''}
      </div>
      <div class="pdp-info">
        <div class="pdp-title"><span class="eyebrow">${p.code} · ${CATS[p.cat].name}</span><h1 class="d-l">${esc(p.name)}</h1><p class="mono" style="color:var(--muted);font-size:14px">${esc(p.short)}</p></div>
        <div class="pdp-price"><span class="price" id="pdpPrice"></span>${p.compare ? `<s class="mono" style="color:var(--dim)">${money(p.compare)}</s>` : ''}<span class="lv-label" id="pdpLevel"></span></div>
        <p style="color:#D6D3CC;font-size:17px">${esc(p.blurb)}</p>
        <div class="stats">${p.stats.map(([b, s]) => `<div class="stat"><b>${b}</b><span>${s}</span></div>`).join('')}</div>
        <form id="buyForm" style="display:grid;gap:22px">
          ${p.options.map(op => `<fieldset class="opt"><legend>${op.label}<b data-sel="${op.key}">${esc(st.opts[op.key])}</b></legend><div class="seg">${op.values.map((v, i) => `<label><input type="radio" name="${op.key}" value="${esc(v.v)}" ${i === 0 ? 'checked' : ''}><span>${esc(v.v)}${v.note ? ` <small class="save">${v.note}</small>` : ''}</span></label>`).join('')}</div>${op.values.some(v => v.hint) ? `<p class="hint" data-hint="${op.key}" style="font-size:14px;color:var(--muted)"></p>` : ''}</fieldset>`).join('')}
          ${p.contents ? `<div class="opt"><span class="eyebrow">En la caja</span><ul style="margin:0;padding-left:18px;color:#D6D3CC">${p.contents.map(c => `<li>${esc(c)}</li>`).join('')}</ul></div>` : ''}
          ${p.sub ? `<div class="buy-type" role="radiogroup" aria-label="Tipo de compra">
            <label><input type="radio" name="bt" value="once" checked><span class="bt"><b>Compra única</b></span><span class="bt-price" data-bt="once"></span></label>
            <label><input type="radio" name="bt" value="sub"><span class="bt"><b>Suscríbete y ahorra 15%</b><small>Entrega cada 4 semanas. Salta o cancela cuando quieras.</small></span><span class="bt-price" data-bt="sub"></span></label></div>` : ''}
          <div class="buy-row"><div class="qty"><button type="button" data-pq="-1" aria-label="Reducir cantidad">−</button><input type="number" id="pdpQty" min="1" max="99" value="1" aria-label="Cantidad"><button type="button" data-pq="1" aria-label="Aumentar cantidad">+</button></div>
            <button class="btn btn-primary btn-l" type="submit" id="addBtn">Añadir al carrito</button></div>
        </form>
        <div class="assure"><div><b>Envío gratis</b>En pedidos de más de US$75</div><div><b>Cada dosis impresa</b>Al frente de cada empaque</div><div><b>Garantía de 30 días</b>¿Sin abrir y no te convence? Devuélvelo</div></div>
        <div class="acc">
          ${p.nutrition ? `<details open><summary>Qué contiene</summary><div class="acc-body">${nutritionHTML(p.nutrition)}</div></details>` : ''}
          <details ${p.nutrition ? '' : 'open'}><summary>Modo de uso</summary><div class="acc-body"><ul style="margin:0;padding-left:18px;display:grid;gap:6px">${p.use.map(u => `<li>${esc(u)}</li>`).join('')}</ul></div></details>
          ${p.ingredients ? `<details><summary>Ingredientes</summary><div class="acc-body"><p>${esc(p.ingredients)}</p>${p.warn ? `<p style="color:var(--bone)">${esc(p.warn)}</p>` : ''}</div></details>` : ''}
          <details><summary>Envíos y devoluciones</summary><div class="acc-body"><p>Enviamos a toda la República Dominicana: 2–4 días laborables, o al día siguiente en Santo Domingo y Santiago con Express. Todavía no hacemos envíos internacionales. Envío estándar gratis en pedidos de más de US$75. Los productos sin abrir se pueden devolver dentro de 30 días.</p></div></details>
        </div>
      </div>
    </div>
    <section class="section-tight" style="border-top:1px solid var(--line)"><div class="sec-head"><div><span class="eyebrow">Combina bien con</span><h2 class="d-m">Completa el stack</h2></div></div>
      <div class="grid">${[...p.pairs, P.find(x => x.id !== p.id && !p.pairs.includes(x.id) && x.cat !== p.cat).id].slice(0, 3).map(id => card(byId[id])).join('')}</div></section>
  </div>`, bind(root) {
    const upd = () => {
      const u = unitPrice(p, st.opts);
      $('#pdpPrice', root).textContent = st.sub ? money2(u * (1 - SUB_OFF)) : money(u);
      $$('[data-bt="once"]', root).forEach(e => e.textContent = money(u));
      $$('[data-bt="sub"]', root).forEach(e => e.textContent = money2(u * (1 - SUB_OFF)));
      const lvl = levelOf(p, st.opts);
      $('#pdpLevel', root).innerHTML = lvl ? `${levelsHTML(lvl)} Cafeína nivel ${lvl}` : (p.cat === 'fuel' || p.cat === 'hydrate' ? `${levelsHTML(0)} Sin cafeína` : '');
      p.options.forEach(op => { const s = $(`[data-sel="${op.key}"]`, root); if (s) s.textContent = st.opts[op.key]; const h = $(`[data-hint="${op.key}"]`, root); if (h) { const v = optVal(p, st.opts, op.key); h.textContent = v && v.hint ? v.hint : ''; } });
      if (st.img == null) $('#pdpImg', root).src = IMG(mainImg(p, st.opts));
      const t0 = $('.thumb[data-g="0"] img', root); if (t0) t0.src = IMG(mainImg(p, st.opts));
      $('#addBtn', root).innerHTML = `Añadir al carrito · ${money2((st.sub ? u * (1 - SUB_OFF) : u) * st.qty)}`;
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

/* ------------------------------------------------------------ planificador */
function plannerHTML() {
  return `<form class="planner" id="planner" onsubmit="return false">
    <div>
      <div class="field"><label for="plDur">Duración de la sesión <output id="plDurOut">3 h</output></label><input type="range" id="plDur" min="0.5" max="8" step="0.5" value="3"></div>
      <div class="field"><span class="lbl">Intensidad</span><div class="seg">${['Suave', 'Constante', 'Carrera'].map((v, i) => `<label><input type="radio" name="plInt" value="${v}" ${i === 1 ? 'checked' : ''}><span>${v}</span></label>`).join('')}</div></div>
      <div class="field"><span class="lbl">¿Cómo sudas?</span><div class="seg">${['Poco', 'Normal', 'Salado'].map((v, i) => `<label><input type="radio" name="plSweat" value="${v}" ${i === 1 ? 'checked' : ''}><span>${v}</span></label>`).join('')}</div><p style="font-size:13px;color:var(--dim)">Si después de entrenar te quedan marcas blancas de sal en la ropa o la gorra, sudas salado.</p></div>
      <label class="check"><input type="checkbox" id="plHeat" checked> Calor o humedad</label>
      <label class="check"><input type="checkbox" id="plCaf"> Usar cafeína en la segunda mitad</label>
    </div>
    <div class="plan-out" id="planOut" aria-live="polite"></div>
  </form>`;
}
function computePlan(d, int, sweat, heat, caf) {
  let carbs = d < 1 ? 30 : d < 1.5 ? 45 : d < 2.5 ? 60 : d < 4 ? 75 : 90;
  if (d >= 1) carbs = Math.max(30, Math.min(90, carbs + (int === 'Suave' ? -15 : int === 'Carrera' ? 10 : 0)));
  const sodium = ({ Poco: 400, Normal: 700, Salado: 1000 })[sweat] + (heat ? 300 : 0);
  const fluid = 500 + (heat ? 250 : 0) + (int === 'Carrera' ? 50 : 0);
  const useMix = carbs >= 60 && d >= 1.5;
  const mix = useMix ? Math.ceil(d) : 0;
  const gels = Math.max(d < 1 ? 1 : 0, Math.ceil(((carbs - (useMix ? 60 : 0)) * d) / 30));
  const cafGels = caf && d >= 1.5 ? Math.min(Math.floor(gels / 2), 6) : 0;
  const covered = gels * 200 + mix * 500;
  const naTotal = sodium * d;
  const strength = sweat === 'Poco' ? '500 mg' : sweat === 'Normal' ? '1000 mg' : '1500 mg';
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
    if (plan.plainGels) items.push(['carb-gel-30', { flavour: 'Cítrico', pack: plan.plainGels > 12 ? 'Caja de 24' : 'Caja de 12' }, `${plan.plainGels} × Carb Gel 30`, `1 cada ${every} min`]);
    if (plan.cafGels) items.push(['carb-gel-30-caffeine', { caffeine: 'Nivel 1 · 50 mg · Cítrico', pack: 'Caja de 12' }, `${plan.cafGels} × Carb Gel 30 Caffeine`, 'Segunda mitad, en lugar de un gel normal']);
    if (plan.mix) items.push(['fuel-mix-60', { flavour: 'Cítrico', size: 'Pote · 15 porciones' }, `${plan.mix} × botella de Fuel Mix 60`, '1 botella (500 ml) por hora']);
    if (plan.naServ) items.push(['sodium', { strength: plan.strength }, `${plan.naServ} × Sodium ${plan.strength}`, 'Antes de la salida y en las primeras horas']);
    const slots = plan.gels;
    $('#planOut', f).innerHTML = `
      <span class="eyebrow">Tu plan · ${$('#plDurOut', f).textContent} · ${f.plInt.value.toLowerCase()}</span>
      <div class="plan-nums"><div><b>${plan.carbs}</b><span>g carbohidratos / hora</span></div><div><b>${plan.sodium}</b><span>mg sodio / hora</span></div><div><b>${plan.fluid}</b><span>ml líquido / hora</span></div></div>
      ${slots ? `<div style="display:grid;gap:8px"><div class="plan-tl" aria-hidden="true">${Array.from({ length: slots }, (_, i) => `<i class="${i >= slots - plan.cafGels ? 'c' : 'g'}"></i>`).join('')}</div><div class="plan-legend"><span style="--k:var(--bone)">Carb Gel 30</span>${plan.cafGels ? '<span style="--k:var(--ignite)">Gel con cafeína</span>' : ''}${plan.mix ? `<span style="--k:var(--raised-2)">+ ${plan.mix} botella${plan.mix > 1 ? 's' : ''} de Fuel Mix</span>` : ''}</div></div>` : ''}
      <div class="plan-list">${items.map(([id, o, t, s]) => `<div class="plan-item">${thumb(byId[id], o)}<div><b>${t}</b><small>${s}</small></div><span class="mono" style="font-size:13px;color:var(--muted)">${money(unitPrice(byId[id], o))}</span></div>`).join('') || '<p style="color:var(--muted)">Menos de una hora a ritmo suave: con agua basta. Llega a la sesión bien comido.</p>'}</div>
      ${items.length ? `<button class="btn btn-primary btn-l btn-block" type="button" id="planAdd">Añadir plan al carrito</button>` : ''}
      <p class="plan-note">Orientación general para adultos sanos, no es consejo médico. Prueba cualquier plan de alimentación en los entrenamientos primero.</p>`;
    const b = $('#planAdd', f); if (b) b.onclick = () => { items.forEach(([id, o]) => addToCart(id, o, 1, false, false)); openCart(); };
  };
  f.addEventListener('input', run); f.addEventListener('change', run); run();
}
function viewPlanner() {
  return `<div class="wrap"><div class="shop-top"><span class="eyebrow">Planificador</span><h1 class="d-xl">Prepárate para el éxito</h1><p class="lead">Las mejores herramientas solo funcionan con un plan. Indica tu sesión y calculamos carbohidratos, sodio y líquido por hora, y te armamos la canasta.</p></div>
    <div class="section-tight">${plannerHTML()}</div>
    <div class="section-tight" style="padding-top:0;display:grid;gap:20px;max-width:70ch;color:var(--muted)">
      <h2 class="d-m" style="color:var(--bone)">Cómo salen los números</h2>
      <p><b style="color:var(--bone)">Carbohidratos.</b> En menos de una hora casi nunca hace falta. De 1 a 2.5 horas, 30–60 g por hora. Más largo y más duro, 60–90 g por hora, con una mezcla de glucosa y fructosa para que el intestino absorba más. Todos los productos de carbohidratos de Soulset usan una proporción 2:1.</p>
      <p><b style="color:var(--bone)">Sodio.</b> Lo que se pierde al sudar varía mucho, de unos 300 a más de 1,500 mg por litro. El calor y la humedad lo aumentan. Si terminas las sesiones con sal en la piel, empieza con más.</p>
      <p><b style="color:var(--bone)">Líquido.</b> Bebe según la sed, unos 500–750 ml por hora, más con calor. Pésate antes y después de una sesión larga para conocer tu propio ritmo.</p>
    </div></div>`;
}

/* ------------------------------------------------------------ manifiesto */
function viewManifesto() {
  const pillars = [
    ['La mentalidad ante todo', 'Primero va la cabeza y el cuerpo la sigue. Sin la mentalidad ganadora correcta, los retos entre tú y tus aspiraciones se quedan donde están.'],
    ['Invierte en ti', 'Tus metas y ambiciones merecen inversión real: tiempo, esfuerzo, dinero, sueño, disciplina. Tú eres el proyecto.'],
    ['Prepárate para ganar', 'Usa las mejores herramientas disponibles. Nuestra nutrición es una de ellas. Un plan le gana a la esperanza siempre.'],
    ['Empoderamiento, pasión, mentalidad ganadora', 'Le hablamos a gente que espera ganar, y que actúa así mucho antes de que llegue el resultado.'],
    ['Toda el alma', 'El medio esfuerzo no es opción. Hagas lo que hagas, ponle todo de ti.'],
    ['Sin descanso', 'Sigue cuando deja de ser divertido. Ahí es donde de verdad empieza el trabajo.'],
  ];
  return `<div class="wrap">
    <section class="mf-hero">
      <span class="eyebrow">Nuestro manifiesto</span>
      <div class="def"><div class="def-word">Soul<br>set</div>
        <div class="def-body"><span class="pos">soul·set /ˈsōlˌset/ · sustantivo</span>
          <p style="font-size:22px;color:var(--bone)">La actitud empoderada de ponerle toda el alma a algo.</p>
          <blockquote>"Su soulset apareció mucho antes del día de la carrera. Vivía en las madrugadas, en los kilómetros en silencio y en el trabajo que nadie vio."</blockquote>
          <p style="color:var(--muted)">El nombre son dos palabras en inglés fundidas en una: <b style="color:var(--bone)">soul</b> (alma) y <b style="color:var(--bone)">mindset</b> (mentalidad). Significa ponerle toda el alma a lo que estés haciendo.</p></div></div>
    </section>

    <section class="section statement">
      <h2 class="d-xl">Ponle toda el alma</h2>
      <div class="copy">
        <p>Soulset existe para impulsar una creencia: la mentalidad es el factor más grande para alcanzar cualquier meta. El talento, la genética y el equipo importan. Pero van en segundo lugar.</p>
        <p>La actitud empoderada de ponerle toda el alma a algo te da una sensación de control en las situaciones difíciles. Cuando la sesión duele, cuando la carrera sale mal, cuando la vida se pone ruidosa, la decisión de seguir sigue siendo tuya.</p>
        <p>Sin la mentalidad ganadora correcta, no es posible superar los retos que hay entre nosotros y nuestras aspiraciones. <b style="color:var(--bone)">Tu mente es lo primero que tienes que convencer.</b></p>
      </div>
    </section>
  </div>

  <section class="band"><div class="wrap section" style="display:grid;gap:20px;justify-items:start">
    <span class="eyebrow">La regla</span>
    <h2 class="d-xxl">Mentalidad&nbsp;<span class="gt">&gt;</span> todo</h2>
    <p class="lead" style="color:#3A3936">Todo lo que hacemos, escribimos e imprimimos es un recordatorio de eso, desde el frente de un gel hasta la tapa de un pote.</p>
  </div></section>

  <div class="wrap">
    <section class="section" style="display:grid;gap:32px">
      <div class="sec-head" style="margin:0"><div><span class="eyebrow">El ciclo Soulset</span><h2 class="d-l">Deja de desear. Empieza a hacer.</h2><p class="lead">Queremos que esta marca sea un recordatorio constante de actuar. Los resultados no llegan por quererlos. Llegan de un ciclo que repites hasta que se convierte en quien eres.</p></div></div>
      <div class="loop">
        <div><span class="mono">01</span><span class="d-s">Cree en tu potencial</span><p>Ve lo que puedes llegar a ser antes que nadie.</p></div>
        <div><span class="mono">02</span><span class="d-s">Actúa</span><p>Deja de desear. Empieza a hacer. Hoy, no el lunes.</p></div>
        <div><span class="mono">03</span><span class="d-s">Resultados</span><p>Pruebas, ganadas una sesión a la vez.</p></div>
        <div><span class="mono">04</span><span class="d-s">Cree</span><p>Los resultados alimentan la fe. La fe arranca la siguiente vuelta.</p></div>
        <div><span class="mono">05</span><span class="d-s">Éxito</span><p>No es una meta final. Es el ciclo, repetido hasta que es quien eres.</p></div>
      </div>
    </section>

    <section class="section" style="padding-top:0">
      <div class="sec-head"><div><span class="eyebrow">Lo que defendemos</span><h2 class="d-l">Seis pilares</h2></div></div>
      <div class="pillars">${pillars.map(([t, d], i) => `<div class="pillar"><span class="mono">0${i + 1}</span><span class="d-s" style="font-size:30px">${t}</span><p>${d}</p></div>`).join('')}</div>
    </section>

    <section class="section mark-story" style="padding-top:0">
      <div>${tpl('t-mark')}</div>
      <div style="display:grid;gap:24px"><div style="display:grid;gap:12px"><span class="eyebrow">La marca</span><h2 class="d-l">Sube de nivel, tres veces</h2><p class="lead">Nuestra S se inclina hacia adelante. Nuestra A está hecha de tres chevrones ascendentes, uno por cada paso del ciclo. Juntas se leen SA: Soulset Athletics.</p></div>
        <ol><li><span class="mono">01</span><div><b>Cree</b><p>El primer chevrón. Convence a tu mente.</p></div></li><li><span class="mono">02</span><div><b>Actúa</b><p>El segundo. Haz el trabajo, sobre todo cuando no tienes ganas.</p></div></li><li><span class="mono">03</span><div><b>Resultados</b><p>El tercero. Ganados, y usados para volver a creer.</p></div></li></ol></div>
    </section>

    <section class="section" style="padding-top:0;display:grid;gap:28px;justify-items:start;border-top:1px solid var(--line);padding-top:clamp(72px,9vw,128px)">
      <h2 class="d-xxl">Sin descanso</h2>
      <p class="lead">Prepárate para el éxito con las mejores herramientas posibles. Después, ponle toda el alma.</p>
      <div class="hero-cta"><a class="btn btn-primary btn-l" href="#shop">Ver los productos <span class="edge">›</span></a><a class="btn btn-secondary btn-l" href="#fuel-planner">Arma tu plan</a></div>
    </section>
  </div>`;
}

/* ------------------------------------------------------------ ayuda */
function viewHelp() {
  const faq = [
    ['¿Cuándo puedo hacer un pedido?', 'Soulset está en prelanzamiento. Únete a la lista de espera y te escribiremos el día que abran los pedidos, con 10% de descuento en tu primer pedido. Los precios y fórmulas que ves aquí todavía pueden cambiar antes del lanzamiento.'],
    ['¿A dónde envían?', 'En el lanzamiento enviaremos a toda la República Dominicana, con envío estándar gratis en pedidos de más de US$75. Todavía no hacemos envíos internacionales.'],
    ['¿Cuánto tarda la entrega?', 'República Dominicana: 2–4 días laborables, o al siguiente día laborable en Santo Domingo y Santiago con Express. Recoger en Santo Domingo es gratis.'],
    ['¿Cómo funciona Suscríbete y ahorra?', 'Ahorras 15% en cada producto suscrito, entregado cada 4 semanas. Salta, cambia o cancela cuando quieras antes de que salga tu siguiente pedido.'],
    ['¿Cuál es la política de devoluciones?', 'Los productos sin abrir se pueden devolver dentro de 30 días con reembolso completo. Si algo llega dañado, envíanos una foto por correo y lo reemplazamos.'],
    ['¿Qué gel debo usar?', 'Carb Gel 30 para la mayor parte de tu alimentación. Cambia a Carb Gel 30 Caffeine (Nivel 1 o 2) en la segunda mitad de las sesiones largas. Los chevrones del empaque indican el nivel de cafeína.'],
    ['¿Cómo elijo la concentración de Sodium?', 'Empieza con 1000 mg. Sube a 1500 mg si sudas mucho, entrenas con calor o ves marcas de sal en la ropa; baja a 500 mg con clima fresco o en sesiones cortas.'],
    ['¿Qué pasa cuando me uno a la lista de espera?', 'Guardamos tu correo y los productos de tu carrito para saber qué fabricar primero. Solo te enviamos noticias del lanzamiento, y puedes darte de baja cuando quieras.'],
  ];
  return `<div class="wrap"><div class="shop-top"><span class="eyebrow">Ayuda</span><h1 class="d-xl">Envíos, devoluciones y preguntas frecuentes</h1></div>
    <div class="acc section-tight" style="max-width:820px;border:0">${faq.map(([q, a], i) => `<details ${i < 2 ? 'open' : ''}><summary>${q}</summary><div class="acc-body"><p>${a}</p></div></details>`).join('')}</div></div>`;
}

/* ------------------------------------------------------------ lista de espera
   Prelanzamiento: no hay checkout. El carrito es una lista de deseos y toda ruta de compra termina aquí.
   Los registros se envían por POST como JSON a window.SOULSET_CONFIG.waitlistEndpoint (ver README).
   Sin endpoint, el sitio corre en modo demo y guarda el registro solo en este navegador. */
const WAITLIST_URL = String((window.SOULSET_CONFIG || {}).waitlistEndpoint || '').trim();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PROVINCES = ['Azua', 'Bahoruco', 'Barahona', 'Dajabón', 'Distrito Nacional', 'Duarte', 'El Seibo', 'Elías Piña', 'Espaillat', 'Hato Mayor', 'Hermanas Mirabal', 'Independencia', 'La Altagracia', 'La Romana', 'La Vega', 'María Trinidad Sánchez', 'Monseñor Nouel', 'Monte Cristi', 'Monte Plata', 'Pedernales', 'Peravia', 'Puerto Plata', 'Samaná', 'San Cristóbal', 'San José de Ocoa', 'San Juan', 'San Pedro de Macorís', 'Sánchez Ramírez', 'Santiago', 'Santiago Rodríguez', 'Santo Domingo', 'Valverde'];
function picks() { return cart.map(l => ({ id: l.id, name: byId[l.id].name, options: optSummary(l), qty: l.qty, subscribe: !!l.sub })); }
async function joinWaitlist(data) {
  const list = picks();
  const payload = {
    email: data.email, firstName: data.firstName || '', province: data.province || '',
    picks: list, picksSummary: list.map(p => `${p.qty} × ${p.name} (${p.options})`).join('; '),
    source: data.source || 'website', language: navigator.language || '', siteLanguage: 'es', submittedAt: new Date().toISOString(),
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
  if (!cart.length) return `<span class="eyebrow">Tus favoritos</span>
    <p style="color:var(--muted);margin:0">Todavía no has guardado nada. Añade productos al carrito y los guardamos junto con tu lugar en la lista.</p>
    <div><a class="btn btn-secondary" href="#shop">Ver la línea</a></div>`;
  return `<span class="eyebrow">Tus favoritos · ${cartCount()} artículo${cartCount() === 1 ? '' : 's'}</span>
    <div style="display:grid;gap:14px">${cart.map(l => { const p = byId[l.id]; return `<div class="sum-item"><div class="th"><img src="${IMG(mainImg(p, l.opts))}" alt=""><em>${l.qty}</em></div><div><b>${esc(p.name)}</b><small>${esc(optSummary(l))}</small></div><span class="mono">${money2(linePrice(l) * l.qty)}</span></div>`; }).join('')}</div>
    <div class="sum-total"><span>En el lanzamiento</span><span style="display:flex;gap:8px;align-items:baseline"><span class="mono" style="color:var(--muted);font-size:13px">USD</span><b>${money2(subtotal())}</b></span></div>
    <p style="font-size:13px;color:var(--muted);margin:0">Precios estimados de lanzamiento, impuestos incluidos. Hoy no se cobra nada.</p>`;
}

function viewWaitlist() {
  const saved = store.get('waitlist', null);
  const f = (id, label, attrs = '') => `<div class="f"><label for="${id}">${label}</label><input class="input" id="${id}" name="${id}" ${attrs}><span class="err" id="${id}-err"></span></div>`;
  return `<div class="wrap"><div class="co wl">
    <form class="co-main" id="wlForm" novalidate>
      <div style="display:grid;gap:16px"><span class="eyebrow">Prelanzamiento</span><h1 class="d-xl">Ten acceso primero</h1>
        <p class="lead" style="margin:0">Todavía no aceptamos pedidos. Déjanos tu correo y te avisamos en cuanto Soulset se lance, con 10% de descuento en tu primer pedido.</p></div>
      ${saved ? `<div class="testmode" role="note"><b>Ya estás en la lista</b> como ${esc(saved.email)}. Regístrate de nuevo para actualizar tus favoritos.</div>` : ''}
      <fieldset class="fs"><legend class="sr">Tus datos</legend>
        ${f('wlEmail', 'Correo electrónico', `type="email" autocomplete="email" required placeholder="tu@correo.com" value="${esc(saved ? saved.email : '')}"`)}
        <div class="row2">${f('wlFirst', 'Nombre (opcional)', `autocomplete="given-name" value="${esc(saved ? saved.firstName : '')}"`)}
          <div class="f"><label for="wlProvince">¿En qué provincia entrenas?</label><select class="select" id="wlProvince" name="wlProvince" autocomplete="address-level1"><option value="">Elige tu provincia</option>${PROVINCES.map(v => `<option${saved && saved.province === v ? ' selected' : ''}>${v}</option>`).join('')}</select></div></div>
        <div class="hp" aria-hidden="true"><label for="wlCompany">Empresa</label><input id="wlCompany" name="company" tabindex="-1" autocomplete="off"></div>
      </fieldset>
      <div style="display:grid;gap:10px">
        <button class="btn btn-primary btn-l btn-block" type="submit" id="wlBtn">Únete a la lista <span class="edge">›</span></button>
        <span class="err" id="wl-err" role="alert"></span>
        <p style="font-size:13px;color:var(--dim);margin:0">Solo te escribimos sobre el lanzamiento. Date de baja cuando quieras.</p>
      </div>
    </form>
    <aside class="co-side" aria-label="Tus favoritos">${picksHTML()}</aside>
  </div></div>`;
}
function bindWaitlist(root) {
  const form = $('#wlForm', root); if (!form) return;
  const setErr = (id, msg) => { const el = $('#' + id + '-err', root); if (el) el.textContent = msg; const inp = $('#' + id, root); if (inp) inp.setAttribute('aria-invalid', msg ? 'true' : 'false'); };
  form.addEventListener('input', e => { if (e.target.getAttribute('aria-invalid') === 'true') setErr(e.target.id, ''); setErr('wl', ''); });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const email = $('#wlEmail', root).value.trim();
    if (!EMAIL_RE.test(email)) { setErr('wlEmail', 'Escribe un correo válido, como tu@correo.com.'); $('#wlEmail', root).focus(); return; }
    if ($('#wlCompany', root).value) { location.hash = 'waitlist-confirmed'; return; } /* honeypot: los bots llenan campos ocultos */
    const btn = $('#wlBtn', root); btn.disabled = true;
    $('#processing').classList.add('on');
    try {
      await joinWaitlist({ email, firstName: $('#wlFirst', root).value.trim(), province: $('#wlProvince', root).value, source: 'waitlist-page' });
      location.hash = 'waitlist-confirmed';
    } catch (err) {
      setErr('wl', `No pudimos guardar tu lugar. Revisa tu conexión e inténtalo de nuevo.`);
      btn.disabled = false;
    } finally { $('#processing').classList.remove('on'); }
  });
}

function viewWaitlistDone() {
  const w = store.get('waitlist', null);
  if (!w) return viewWaitlist();
  return `<div class="wrap conf">
    <div style="display:grid;gap:16px"><span class="eyebrow">Lista de espera · confirmado</span><h1 class="d-xxl">Ya estás en la lista${w.firstName ? ', ' + esc(w.firstName) : ''}</h1>
      <p class="lead">Te escribiremos a <b style="color:var(--bone)">${esc(w.email)}</b> el día que Soulset se lance, con 10% de descuento en tu primer pedido. Mientras tanto: deja de desear, empieza a hacer.</p></div>
    <div class="conf-grid">
      <div class="conf-box">${picksHTML()}</div>
      <div class="conf-box" style="background:var(--raised)"><h3>Mientras esperas</h3><p>Calcula tus carbohidratos, sodio y líquido por hora, o lee lo que defendemos.</p><div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn btn-primary" href="#fuel-planner">Planificador</a><a class="btn btn-secondary" href="#manifesto">Lee el manifiesto</a></div></div>
    </div></div>`;
}

/* ------------------------------------------------------------ router */
const view = $('#view');
function setTitle(t) { document.title = t ? `${t} · Soulset Athletics` : 'Soulset Athletics'; }
function render() {
  const h = (location.hash || '#home').slice(1);
  let html, bind = () => {}, title = '', nav = h;
  if (h === 'home' || h === '') { html = viewHome(); bind = bindHome; nav = ''; }
  else if (h === 'shop' || h.startsWith('shop-')) { const cat = h.slice(5) || ''; html = viewShop(CATS[cat] ? cat : ''); bind = r => bindShop(r); title = cat && CATS[cat] ? CATS[cat].name : 'Tienda'; }
  else if (h.startsWith('p-') && byId[h.slice(2)]) { const p = byId[h.slice(2)]; const v = viewProduct(p); html = v.html; bind = v.bind; title = p.name; nav = 'shop-' + p.cat; }
  else if (h === 'fuel-planner') { html = viewPlanner(); bind = bindPlanner; title = 'Planificador'; }
  else if (h === 'manifesto') { html = viewManifesto(); title = 'Nuestro manifiesto'; }
  else if (h === 'help') { html = viewHelp(); title = 'Ayuda'; }
  else if (h === 'waitlist' || h === 'checkout') { html = viewWaitlist(); bind = bindWaitlist; title = 'Únete a la lista de espera'; nav = 'waitlist'; }
  else if (h === 'waitlist-confirmed' || h === 'order-confirmed') { const done = !!store.get('waitlist', null); html = viewWaitlistDone(); bind = done ? () => {} : bindWaitlist; title = done ? 'Ya estás en la lista' : 'Únete a la lista de espera'; nav = 'waitlist'; }
  else { html = `<div class="wrap conf"><h1 class="d-xl">Página no encontrada</h1><p class="lead">Esa página no existe. Tu próxima sesión sí.</p><div><a class="btn btn-primary btn-l" href="#shop">Ver todo</a></div></div>`; title = 'No encontrada'; }
  view.innerHTML = html; bind(view); setTitle(title);
  $$('.nav a').forEach(a => a.toggleAttribute('aria-current', false));
  $$('.nav a').forEach(a => { if (a.dataset.nav === nav || (nav.startsWith('shop') && a.dataset.nav === 'shop' && nav === 'shop')) a.setAttribute('aria-current', 'page'); });
  $('#mnav').classList.remove('open'); $('#menuBtn').setAttribute('aria-expanded', 'false');
  $$('[data-lang-base]').forEach(a => { a.href = a.dataset.langBase + location.hash; });
  window.scrollTo(0, 0);
}
$('#menuBtn').addEventListener('click', () => { const m = $('#mnav'); const o = m.classList.toggle('open'); $('#menuBtn').setAttribute('aria-expanded', o); });
$('#footStack').innerHTML = tpl('t-stack');
$('#spinChev').innerHTML = tpl('t-chev');
window.addEventListener('hashchange', render);
renderCart(); render();
})();
