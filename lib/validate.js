/* Server-side checks for a waitlist sign-up. The browser validates too, but anything can POST here. */

export const PROVINCES = new Set(['Azua', 'Bahoruco', 'Barahona', 'Dajabón', 'Distrito Nacional', 'Duarte', 'El Seibo', 'Elías Piña', 'Espaillat', 'Hato Mayor', 'Hermanas Mirabal', 'Independencia', 'La Altagracia', 'La Romana', 'La Vega', 'María Trinidad Sánchez', 'Monseñor Nouel', 'Monte Cristi', 'Monte Plata', 'Pedernales', 'Peravia', 'Puerto Plata', 'Samaná', 'San Cristóbal', 'San José de Ocoa', 'San Juan', 'San Pedro de Macorís', 'Sánchez Ramírez', 'Santiago', 'Santiago Rodríguez', 'Santo Domingo', 'Valverde']);
const SOURCES = new Set(['home', 'waitlist-page']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const text = (v, max) => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);

/* Returns { ok: true, value } or { ok: false, error }. */
export function parseSignup(body) {
  if (!body || typeof body !== 'object') return { ok: false, error: 'invalid_body' };
  const email = text(body.email, 254).toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'invalid_email' };
  const province = text(body.province, 60);
  const picks = (Array.isArray(body.picks) ? body.picks : []).slice(0, 30)
    .filter(p => p && typeof p === 'object' && /^[a-z0-9-]{1,40}$/.test(String(p.id)))
    .map(p => ({
      id: String(p.id),
      name: text(p.name, 80),
      options: text(p.options, 200),
      qty: Math.max(1, Math.min(99, parseInt(p.qty, 10) || 1)),
      subscribe: p.subscribe === true,
    }));
  return { ok: true, value: {
    email,
    firstName: text(body.firstName, 60),
    province: PROVINCES.has(province) ? province : '',
    picks,
    source: SOURCES.has(body.source) ? body.source : 'website',
    siteLanguage: body.siteLanguage === 'es' ? 'es' : 'en',
    browserLanguage: text(body.language, 35),
  } };
}

const PHONE_RE = /^\+?[\d\s().-]{7,20}$/;

/* Delivery details for an order. Returns { ok: true, value } or { ok: false, error }. */
export function parseCustomer(body) {
  const c = body && typeof body.customer === 'object' && body.customer ? body.customer : {};
  const email = text(body?.email, 254).toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'invalid_email' };
  const value = {
    firstName: text(c.firstName, 60), lastName: text(c.lastName, 60), phone: text(c.phone, 20),
    address: text(c.address, 200), city: text(c.city, 80), province: text(c.province, 60), notes: text(c.notes, 500),
  };
  for (const k of ['firstName', 'lastName', 'address', 'city']) if (!value[k]) return { ok: false, error: 'missing_' + k };
  if (!PHONE_RE.test(value.phone)) return { ok: false, error: 'invalid_phone' };
  if (!PROVINCES.has(value.province)) return { ok: false, error: 'invalid_province' };
  return { ok: true, value: { email, customer: value, siteLanguage: body.siteLanguage === 'es' ? 'es' : 'en' } };
}
