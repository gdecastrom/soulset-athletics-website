/* Fake provider for local and preview testing: "pays" instantly by redirecting straight back with a signed result.
   Add ?simulate=declined (or cancelled) to the checkout request to try the other outcomes. Refused in production. */
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { OrderRow, PaymentStatus } from './index.ts';

export const name = 'test';

const FIELDS = ['order', 'status', 'ref', 'amount', 'currency'] as const;
const sign = (values: string[]) =>
  createHmac('sha256', process.env.APP_SECRET || '').update(`test-payment:${values.join(':')}`).digest('base64url');

export function createPayment({ order, returnUrl, simulate = 'paid' }: { order: OrderRow; returnUrl: string; simulate?: string }) {
  const status: PaymentStatus = simulate === 'declined' || simulate === 'cancelled' ? simulate : 'paid';
  const values = [String(order.id), status, `TEST-${order.number}`, String(order.total_cents), order.currency];
  const q = new URLSearchParams([...FIELDS.map((k, i) => [k, values[i]]), ['sig', sign(values)]]);
  return { redirectUrl: `${returnUrl}?${q}` };
}

export function verifyCallback(request: Request) {
  const q = new URL(request.url).searchParams;
  const values = FIELDS.map(k => q.get(k) || '');
  const want = Buffer.from(sign(values)), got = Buffer.from(q.get('sig') || '');
  if (!process.env.APP_SECRET || want.length !== got.length || !timingSafeEqual(want, got)) throw new Error('Invalid test payment signature');
  const [orderId, status, ref, amount, currency] = values;
  return { orderId: Number(orderId), status: status as PaymentStatus, reference: ref, amountCents: Number(amount), currency, payload: Object.fromEntries(q) };
}
