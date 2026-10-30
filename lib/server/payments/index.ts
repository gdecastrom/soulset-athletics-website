/* Payment providers. Pick one with PAYMENT_PROVIDER=azul | cardnet | test.

   Card data never touches this site: both Azul and CardNet offer hosted payment pages, which keeps it out of PCI scope.
   A provider never edits orders itself: it only reports a result, and app/api/payment-callback decides what changes. */
import * as azul from './azul.ts';
import * as cardnet from './cardnet.ts';
import * as fake from './fake.ts';

export type PaymentStatus = 'paid' | 'declined' | 'cancelled' | 'error';
export type OrderRow = { id: number; number: string; total_cents: number; currency: string; email: string; site_language: 'en' | 'es' };

export type Provider = {
  name: string;
  /* Where to send the customer to pay: a redirect, or a form the browser auto-submits to the hosted payment page. */
  createPayment(args: { order: OrderRow; returnUrl: string; simulate?: string }): Promise<PaymentStart> | PaymentStart;
  /* Checks the provider's signature or asks the provider for the result. Never trusts query params alone.
     Throws if the request cannot be verified. */
  verifyCallback(request: Request): Promise<PaymentResult> | PaymentResult;
};
export type PaymentStart = { redirectUrl: string } | { form: { action: string; fields: Record<string, string> } };
export type PaymentResult = { orderId: number; status: PaymentStatus; reference: string; payload: Record<string, unknown> };

const PROVIDERS: Record<string, Provider> = { azul, cardnet, test: fake };

export function getProvider(): Provider {
  const name = process.env.PAYMENT_PROVIDER || '';
  const provider = PROVIDERS[name];
  if (!provider) throw new Error(`PAYMENT_PROVIDER must be one of ${Object.keys(PROVIDERS).join(', ')} (got "${name}")`);
  if (name === 'test' && process.env.VERCEL_ENV === 'production') throw new Error('The test payment provider cannot run in production');
  return provider;
}
