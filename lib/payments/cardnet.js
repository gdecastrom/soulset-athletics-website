/* CardNet — to be implemented when the merchant account is approved.

   Plan: CardNet's hosted payment page. createPayment opens a payment session server-side with the merchant
   credentials, amount, currency, order number and our return URL, then returns { redirectUrl } (or { form }) to send
   the customer to CardNet. verifyCallback must not trust the redirect alone: it asks CardNet for the session or
   transaction result server-side and maps it to 'paid' | 'declined' | 'cancelled' | 'error'.

   CardNet gives these with the merchant account, along with the API reference for sessions and results:
     CARDNET_MERCHANT_NUMBER, CARDNET_TERMINAL, CARDNET_MERCHANT_NAME, CARDNET_API_URL (sandbox, then live)
   Build against their sandbox and test every outcome with PAYMENT_PROVIDER=cardnet on a preview deployment first. */

export const name = 'cardnet';

const notReady = () => { throw new Error('CardNet is not connected yet: implement lib/payments/cardnet.js with the merchant credentials and CardNet’s API docs'); };

export function createPayment() { notReady(); }
export function verifyCallback() { notReady(); }
