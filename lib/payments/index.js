/* Payment providers. Pick one with PAYMENT_PROVIDER=azul | cardnet | test.

   Every provider module exports:

   name
   createPayment({ order, returnUrl })
       order: the row just inserted into `orders` (id, number, total_cents, currency, email, customer, site_language…)
       returnUrl: where the provider must send the customer back (our /api/payment-callback)
       → { redirectUrl }                      send the browser to the provider's hosted page, or
       → { form: { action, fields } }         the browser auto-submits these fields to the hosted page
   verifyCallback(request)
       Checks the provider's signature / asks the provider for the result. Never trust query params alone.
       → { orderId, status: 'paid' | 'declined' | 'cancelled' | 'error', reference, payload }
       Throws if the request cannot be verified.

   Card data never touches this site: both Azul and CardNet offer hosted payment pages, which keeps us out of PCI scope. */
import * as azul from './azul.js';
import * as cardnet from './cardnet.js';
import * as fake from './fake.js';

const PROVIDERS = { azul, cardnet, test: fake };

export function getProvider() {
  const name = process.env.PAYMENT_PROVIDER || '';
  const provider = PROVIDERS[name];
  if (!provider) throw new Error(`PAYMENT_PROVIDER must be one of ${Object.keys(PROVIDERS).join(', ')} (got "${name}")`);
  if (name === 'test' && process.env.VERCEL_ENV === 'production') throw new Error('The test payment provider cannot run in production');
  return provider;
}
