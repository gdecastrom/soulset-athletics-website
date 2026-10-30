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

-- Orders can't be tampered with, even through a bug in the app or with the app's own credentials:
-- after an order is created only its payment fields change, its status only moves forward
-- (pending → paid | declined | cancelled | error, paid → refunded), and orders and payment events are never deleted.
create or replace function orders_guard() returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'orders cannot be deleted (order %)', old.number;
  end if;
  if (new.email, new.customer, new.items, new.subtotal_cents, new.shipping_cents, new.total_cents,
      new.currency, new.site_language, new.provider, new.created_at)
     is distinct from
     (old.email, old.customer, old.items, old.subtotal_cents, old.shipping_cents, old.total_cents,
      old.currency, old.site_language, old.provider, old.created_at) then
    raise exception 'order %: only the status and payment fields can change', old.number;
  end if;
  if new.status <> old.status and not (
       (old.status = 'pending' and new.status in ('paid', 'declined', 'cancelled', 'error'))
    or (old.status = 'paid' and new.status = 'refunded')) then
    raise exception 'order %: status cannot go from % to %', old.number, old.status, new.status;
  end if;
  if old.status <> 'pending' and (new.provider_reference, new.paid_at) is distinct from (old.provider_reference, old.paid_at) then
    raise exception 'order %: payment details are fixed once the payment is settled', old.number;
  end if;
  return new;
end $$;
drop trigger if exists orders_guard on orders;
create trigger orders_guard before update or delete on orders for each row execute function orders_guard();

create or replace function payment_events_append_only() returns trigger language plpgsql as $$
begin
  raise exception 'payment events are append-only';
end $$;
drop trigger if exists payment_events_append_only on payment_events;
create trigger payment_events_append_only before update or delete on payment_events for each row execute function payment_events_append_only();
