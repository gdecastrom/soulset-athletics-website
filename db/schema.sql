-- Soulset Athletics waitlist. Plain Postgres: runs on Neon, Railway or any Postgres 13+.
-- Safe to run more than once (npm run db:migrate).

create table if not exists waitlist_signups (
  id                   bigint generated always as identity primary key,
  email                text not null unique,            -- stored lowercased
  first_name           text not null default '',
  province             text not null default '',
  picks                jsonb not null default '[]',     -- cart contents at sign-up: [{id, name, options, qty, subscribe}]
  source               text not null default 'website', -- 'home' | 'waitlist-page'
  site_language        text not null default 'en' check (site_language in ('en', 'es')),
  browser_language     text not null default '',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  confirmation_sent_at timestamptz,
  unsubscribed_at      timestamptz
);

-- One row per request to a rate-limited endpoint (lib/rate-limit.js). IPs are stored only as salted hashes.
create table if not exists rate_limit_hits (
  bucket  text not null,   -- 'waitlist' | 'checkout'
  ip_hash text not null,
  at      timestamptz not null default now()
);
create index if not exists rate_limit_hits_lookup on rate_limit_hits (bucket, ip_hash, at);

-- Which products people want most before launch.
create or replace view waitlist_pick_demand as
select pick->>'id'                    as product_id,
       pick->>'name'                  as product,
       pick->>'options'               as options,
       sum((pick->>'qty')::int)       as units,
       count(distinct s.id)           as signups
from waitlist_signups s, jsonb_array_elements(s.picks) as pick
where s.unsubscribed_at is null
group by 1, 2, 3
order by units desc;

-- Orders and payments. Not used until checkout opens (CHECKOUT_ENABLED=true, see README → Payments).
create table if not exists orders (
  id                 bigint generated always as identity primary key,
  number             text generated always as ('SA-' || lpad(id::text, 6, '0')) stored unique,
  status             text not null default 'pending'
                     check (status in ('pending', 'paid', 'declined', 'cancelled', 'error', 'refunded')),
  email              text not null,
  customer           jsonb not null,              -- name, phone, address, province, notes
  items              jsonb not null,              -- lines priced by lib/catalog.js
  subtotal_cents     integer not null,
  shipping_cents     integer not null,
  total_cents        integer not null,
  currency           text not null,
  site_language      text not null default 'en' check (site_language in ('en', 'es')),
  provider           text not null,               -- 'azul' | 'cardnet' | 'test'
  provider_reference text,                        -- the gateway's transaction / authorization id
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  paid_at            timestamptz
);
create index if not exists orders_email on orders (email);

-- Every callback from the payment provider, verified or not, for support and reconciliation.
create table if not exists payment_events (
  id         bigint generated always as identity primary key,
  order_id   bigint references orders (id),
  provider   text not null,
  status     text not null,
  verified   boolean not null,
  payload    jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists payment_events_order on payment_events (order_id);
