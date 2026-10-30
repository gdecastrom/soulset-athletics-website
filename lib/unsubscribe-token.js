import { createHmac, timingSafeEqual } from 'node:crypto';

/* Unsubscribe links carry the sign-up id plus an HMAC of it, so nobody can unsubscribe someone else by guessing ids. */
const secret = () => process.env.APP_SECRET || '';

export function signId(id) {
  return createHmac('sha256', secret()).update('unsubscribe:' + id).digest('base64url');
}

export function verifyId(id, token) {
  if (!secret() || !/^\d{1,18}$/.test(String(id)) || typeof token !== 'string') return false;
  const want = Buffer.from(signId(id)), got = Buffer.from(token);
  return want.length === got.length && timingSafeEqual(want, got);
}
