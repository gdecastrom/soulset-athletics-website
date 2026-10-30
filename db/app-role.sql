-- Least-privilege login for the website. Run once as the database owner (Neon: SQL editor), after db:migrate,
-- with a strong password in place of CHANGE-ME. Then put this role's connection string in Vercel as DATABASE_URL
-- and keep the owner's connection string for migrations only.
--
-- The site can add sign-ups and orders and change only the columns it needs. It can't delete anything,
-- change table structure, or edit an order's items or amounts (the orders_guard trigger blocks that for everyone).

create role soulset_app login password 'CHANGE-ME';

grant usage on schema public to soulset_app;

grant select, insert on waitlist_signups to soulset_app;
grant update (first_name, province, picks, site_language, browser_language, updated_at, confirmation_sent_at, unsubscribed_at)
  on waitlist_signups to soulset_app;

grant select, insert, delete on rate_limit_hits to soulset_app;

grant select, insert on orders to soulset_app;
grant update (status, provider_reference, paid_at, updated_at) on orders to soulset_app;

grant select, insert on payment_events to soulset_app;
