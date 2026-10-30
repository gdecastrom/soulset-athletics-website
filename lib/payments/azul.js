/* Azul (Banco Popular) — to be implemented when the merchant account is approved.

   Plan: Azul Payment Page (hosted). createPayment returns { form: { action, fields } }: the order number, amount and
   currency, our approved/declined/cancel return URLs and an AuthHash (HMAC-SHA512 keyed with the merchant's auth key).
   Azul sends the customer back to the return URL with the result and its own hash; verifyCallback recomputes that hash
   and maps Azul's response code to 'paid' | 'declined' | 'cancelled' | 'error'.

   Azul gives these with the merchant account, along with the exact field list and hash order for each:
     AZUL_MERCHANT_ID, AZUL_MERCHANT_NAME, AZUL_MERCHANT_TYPE, AZUL_AUTH_KEY, AZUL_PAYMENT_PAGE_URL (sandbox, then live)
   Build against their sandbox and test every outcome with PAYMENT_PROVIDER=azul on a preview deployment first. */

export const name = 'azul';

const notReady = () => { throw new Error('Azul is not connected yet: implement lib/payments/azul.js with the merchant credentials and Azul’s Payment Page docs'); };

export function createPayment() { notReady(); }
export function verifyCallback() { notReady(); }
