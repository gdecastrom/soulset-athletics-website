/* Where waitlist sign-ups are sent: the /api/waitlist function in api/waitlist.js, which saves them to Postgres
   and emails a confirmation through Resend (see README). Set to '' to run in demo mode (sign-ups stay in the browser).
   Shared by the English (index.html) and Spanish (es/index.html) sites. */
window.SOULSET_CONFIG = { waitlistEndpoint: '/api/waitlist' };
