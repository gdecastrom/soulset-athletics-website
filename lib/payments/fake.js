/* Fake provider for local and preview testing: "pays" instantly by redirecting straight back with a signed result.
   Add ?simulate=declined (or cancelled) to the checkout request to try the other outcomes. Refused in production. */
import { createHmac, timingSafeEqual } from 'node:crypto';

export const name = 'test';

const sign = (orderId, status, ref) => createHmac('sha256', process.env.APP_SECRET || '').update(`test-payment:${orderId}:${status}:${ref}`).digest('base64url');

export function createPayment({ order, returnUrl, simulate = 'paid' }) {
  const status = ['paid', 'declined', 'cancelled'].includes(simulate) ? simulate : 'paid';
  const ref = `TEST-${order.number}`;
  const q = new URLSearchParams({ order: order.id, status, ref, sig: sign(order.id, status, ref) });
  return { redirectUrl: `${returnUrl}?${q}` };
}

export function verifyCallback(request) {
  const q = new URL(request.url).searchParams;
  const [orderId, status, ref, sig] = ['order', 'status', 'ref', 'sig'].map(k => q.get(k) || '');
  const want = Buffer.from(sign(orderId, status, ref)), got = Buffer.from(sig);
  if (!process.env.APP_SECRET || want.length !== got.length || !timingSafeEqual(want, got)) throw new Error('Invalid test payment signature');
  return { orderId: Number(orderId), status, reference: ref, payload: Object.fromEntries(q) };
}
