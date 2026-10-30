-- 0001: initial schema. Design, business rules and ERD: docs/database.md.
-- Conventions: English snake_case, singular table names, bigint identity ids, money as integer cents with its
-- currency, instants as timestamptz (UTC). Every table has created_at; tables whose rows change have updated_at,
-- kept by set_updated_at(). Applied once by scripts/release.ts; never edit it after it has run, add 0002 instead.

create extension if not exists btree_gist;   -- for the no-overlap rule on variant_price

create function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;
comment on function set_updated_at() is 'Keeps updated_at current on every update.';

-- ---------------------------------------------------------------- reference data

create table province (
  id         bigint generated always as identity primary key,
  name       text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table province is 'The 31 provinces of the Dominican Republic plus Distrito Nacional. Closed list, loaded here.';
comment on column province.name is 'Official name, with accents (e.g. "Santiago Rodríguez").';

insert into province (name) values
  ('Azua'), ('Bahoruco'), ('Barahona'), ('Dajabón'), ('Distrito Nacional'), ('Duarte'), ('El Seibo'), ('Elías Piña'),
  ('Espaillat'), ('Hato Mayor'), ('Hermanas Mirabal'), ('Independencia'), ('La Altagracia'), ('La Romana'), ('La Vega'),
  ('María Trinidad Sánchez'), ('Monseñor Nouel'), ('Monte Cristi'), ('Monte Plata'), ('Pedernales'), ('Peravia'),
  ('Puerto Plata'), ('Samaná'), ('San Cristóbal'), ('San José de Ocoa'), ('San Juan'), ('San Pedro de Macorís'),
  ('Sánchez Ramírez'), ('Santiago'), ('Santiago Rodríguez'), ('Santo Domingo'), ('Valverde');

-- ---------------------------------------------------------------- catalogue
-- The catalogue is edited in lib/catalog-data.ts and copied here on every deploy by lib/server/catalog-sync.ts.
-- Rows are never deleted: anything removed from the code is marked active = false, so old orders keep their references.

create table category (
  id         bigint generated always as identity primary key,
  slug       text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name       text not null,
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table category is 'Shop category (fuel, hydrate, build, ignite, stacks).';
comment on column category.slug is 'Stable key used in URLs (/shop/<slug>) and in the code catalogue.';
comment on column category.name is 'English name, for reports. Customer-facing names in both languages live in the code catalogue.';
comment on column category.active is 'False once the category is no longer in the code catalogue.';

create table product (
  id          bigint generated always as identity primary key,
  category_id bigint not null references category (id) on delete restrict,
  slug        text not null unique check (slug ~ '^[a-z0-9-]+$'),
  code        text not null unique check (code ~ '^[A-Z0-9-]+$'),
  name        text not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index product_category_id on product (category_id);
comment on table product is 'A product as sold on the site (Carb Gel 30, Sodium, …). What is actually bought is one of its variants.';
comment on column product.slug is 'Stable key used in URLs (/products/<slug>) and in the code catalogue.';
comment on column product.code is 'Product code printed on the pack (GEL-030). Base of every variant SKU.';
comment on column product.name is 'Brand name of the product; the same in both languages.';
comment on column product.category_id is 'Shop category the product is listed under.';
comment on column product.active is 'False once the product is no longer in the code catalogue. Kept for old orders.';

create table product_option (
  id         bigint generated always as identity primary key,
  product_id bigint not null references product (id) on delete restrict,
  key        text not null check (key ~ '^[a-z0-9-]+$'),
  name       text not null,
  position   smallint not null check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, key),
  unique (product_id, id)      -- target of the composite FK in variant_option_value
);
comment on table product_option is 'A choice the customer makes for a product: flavour, pack, size, strength, caffeine.';
comment on column product_option.key is 'Stable key from the code catalogue (flavour, pack, …).';
comment on column product_option.product_id is 'The product this option belongs to.';
comment on column product_option.name is 'English label, for reports.';
comment on column product_option.position is 'Order in which the option is shown and in which it appears in the SKU.';

create table option_value (
  id                bigint generated always as identity primary key,
  product_option_id bigint not null references product_option (id) on delete restrict,
  key               text not null check (key ~ '^[a-z0-9-]+$'),
  name              text not null,
  position          smallint not null check (position >= 0),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (product_option_id, key),
  unique (product_option_id, id)   -- target of the composite FK in variant_option_value
);
comment on table option_value is 'One possible value of a product option: Citrus, Box of 24, 1000 mg.';
comment on column option_value.key is 'Stable key from the code catalogue (citrus, box-of-24, 1000-mg).';
comment on column option_value.name is 'English label, for reports.';
comment on column option_value.product_option_id is 'The option this value belongs to.';
comment on column option_value.position is 'Order in which the value is shown.';

create table variant (
  id         bigint generated always as identity primary key,
  product_id bigint not null references product (id) on delete restrict,
  sku        text not null unique check (sku ~ '^[A-Z0-9-]+$'),
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, id)     -- target of the composite FK in variant_option_value; also indexes product_id
);
comment on table variant is 'What is actually sold and shipped (SKU): a product with one value chosen for each of its options.';
comment on column variant.sku is 'Product code plus the option value keys, e.g. GEL-030-CITRUS-BOX-OF-12. Never reused.';
comment on column variant.product_id is 'The product this variant is a version of.';
comment on column variant.active is 'False once this combination is no longer sold. Kept for old orders and wishlists.';

create table variant_option_value (
  id                bigint generated always as identity primary key,
  variant_id        bigint not null,
  product_id        bigint not null,
  product_option_id bigint not null,
  option_value_id   bigint not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  foreign key (product_id, variant_id) references variant (product_id, id) on delete restrict,
  foreign key (product_id, product_option_id) references product_option (product_id, id) on delete restrict,
  foreign key (product_option_id, option_value_id) references option_value (product_option_id, id) on delete restrict,
  unique (variant_id, product_option_id)
);
create index variant_option_value_variant on variant_option_value (product_id, variant_id);
create index variant_option_value_option on variant_option_value (product_id, product_option_id);
create index variant_option_value_value on variant_option_value (product_option_id, option_value_id);
comment on table variant_option_value is 'Which value a variant has for each option of its product (N:M between variant and option_value).';
comment on column variant_option_value.product_id is 'Repeats the product on purpose: the composite foreign keys use it so a variant can only take values of its own product''s options.';
comment on column variant_option_value.product_option_id is 'Repeated on purpose, like product_id: guarantees one value per option per variant.';
comment on column variant_option_value.variant_id is 'The variant.';
comment on column variant_option_value.option_value_id is 'The value the variant has for that option.';

create table variant_price (
  id           bigint generated always as identity primary key,
  variant_id   bigint not null references variant (id) on delete restrict,
  currency     text not null check (currency in ('USD', 'DOP')),
  amount_cents integer not null check (amount_cents >= 0),
  valid_from   timestamptz not null default now(),
  valid_to     timestamptz check (valid_to > valid_from),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  exclude using gist (variant_id with =, currency with =, tstzrange(valid_from, valid_to) with &&)
);
create index variant_price_variant on variant_price (variant_id);
create unique index variant_price_current on variant_price (variant_id, currency) where valid_to is null;
comment on table variant_price is 'List price of a variant over time. A price change closes the current row (valid_to) and opens a new one; rows are never edited or deleted.';
comment on column variant_price.amount_cents is 'List price in cents, taxes included, before any Subscribe & save discount.';
comment on column variant_price.variant_id is 'The variant this price is for.';
comment on column variant_price.currency is 'ISO 4217 code. Prices are in USD for now; DOP is allowed for when the business decides.';
comment on column variant_price.valid_from is 'When this price started to apply.';
comment on column variant_price.valid_to is 'When it stopped applying; NULL means it is the current price. Periods of one variant and currency never overlap.';

-- ---------------------------------------------------------------- customers and the waitlist

create table customer (
  id          bigint generated always as identity primary key,
  email       text not null unique
              check (email = lower(email) and length(email) <= 254 and email ~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$'),
  first_name  text check (length(first_name) between 1 and 60),
  last_name   text check (length(last_name) between 1 and 60),
  phone       text check (phone ~ '^\+?[0-9 ().-]{7,20}$'),
  province_id bigint references province (id) on delete restrict,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index customer_province_id on customer (province_id);
comment on table customer is 'A person who joined the waitlist or placed an order, identified by email.';
comment on column customer.email is 'Lowercased. One customer per email.';
comment on column customer.first_name is 'NULL until the person gives it.';
comment on column customer.last_name is 'NULL until the person gives it (asked at checkout).';
comment on column customer.phone is 'Latest phone given at checkout. Each order keeps its own copy.';
comment on column customer.province_id is 'Where the person trains or lives, as last given. Each order keeps its own shipping province.';

create table waitlist_signup (
  id                   bigint generated always as identity primary key,
  customer_id          bigint not null unique references customer (id) on delete restrict,
  source               text not null check (source in ('home', 'waitlist_page')),
  site_language        text not null check (site_language in ('en', 'es')),
  browser_language     text check (length(browser_language) <= 35),
  confirmation_sent_at timestamptz,
  unsubscribed_at      timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
comment on table waitlist_signup is 'A customer''s place on the pre-launch waitlist. One per customer; signing up again updates it.';
comment on column waitlist_signup.source is 'Form used for the latest sign-up: home page box or waitlist page.';
comment on column waitlist_signup.customer_id is 'Who signed up. One sign-up per customer.';
comment on column waitlist_signup.site_language is 'Language of the site at sign-up; emails are sent in it.';
comment on column waitlist_signup.browser_language is 'navigator.language, e.g. es-DO. For analytics only.';
comment on column waitlist_signup.confirmation_sent_at is 'When the confirmation email was accepted by Resend. NULL: not sent yet.';
comment on column waitlist_signup.unsubscribed_at is 'When the person unsubscribed. The row is kept; signing up again clears it.';

create table waitlist_pick (
  id                 bigint generated always as identity primary key,
  waitlist_signup_id bigint not null references waitlist_signup (id) on delete restrict,
  variant_id         bigint not null references variant (id) on delete restrict,
  quantity           integer not null check (quantity between 1 and 99),
  is_subscription    boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (waitlist_signup_id, variant_id, is_subscription)
);
create index waitlist_pick_variant_id on waitlist_pick (variant_id);
comment on table waitlist_pick is 'Products in the cart when the person signed up: what they want at launch. Replaced on each new sign-up (a wishlist, not history).';
comment on column waitlist_pick.is_subscription is 'True if they chose Subscribe & save for this product.';
comment on column waitlist_pick.waitlist_signup_id is 'The sign-up this pick belongs to.';
comment on column waitlist_pick.variant_id is 'The exact product choice (flavour, size…) they want.';
comment on column waitlist_pick.quantity is 'How many they had in the cart, 1 to 99.';

-- ---------------------------------------------------------------- orders and payments (unused until checkout opens)

create table sales_order (
  id                   bigint generated always as identity primary key,
  order_number         text generated always as ('SA-' || lpad(id::text, 6, '0')) stored unique,
  customer_id          bigint not null references customer (id) on delete restrict,
  status               text not null default 'pending'
                       check (status in ('pending', 'paid', 'declined', 'cancelled', 'error', 'refunded')),
  currency             text not null check (currency in ('USD', 'DOP')),
  subtotal_cents       integer not null check (subtotal_cents >= 0),
  shipping_cents       integer not null check (shipping_cents >= 0),
  total_cents          integer not null check (total_cents = subtotal_cents + shipping_cents),
  site_language        text not null check (site_language in ('en', 'es')),
  shipping_first_name  text not null check (length(shipping_first_name) between 1 and 60),
  shipping_last_name   text not null check (length(shipping_last_name) between 1 and 60),
  shipping_phone       text not null check (shipping_phone ~ '^\+?[0-9 ().-]{7,20}$'),
  shipping_address     text not null check (length(shipping_address) between 1 and 200),
  shipping_city        text not null check (length(shipping_city) between 1 and 80),
  shipping_province_id bigint not null references province (id) on delete restrict,
  delivery_notes       text check (length(delivery_notes) <= 500),
  payment_provider     text not null check (payment_provider in ('azul', 'cardnet', 'test')),
  provider_reference   text,
  paid_at              timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  check ((status in ('paid', 'refunded')) = (paid_at is not null))
);
create index sales_order_customer_id on sales_order (customer_id);
create index sales_order_shipping_province_id on sales_order (shipping_province_id);
create index sales_order_status_created on sales_order (status, created_at);
comment on table sales_order is 'An order placed at checkout. A commercial document: after creation only its payment fields change.';
comment on column sales_order.order_number is 'Number shown to the customer and the payment provider (SA-000123).';
comment on column sales_order.status is 'pending → paid | declined | cancelled | error; paid → refunded. Enforced by sales_order_guard.';
comment on column sales_order.customer_id is 'Who placed the order.';
comment on column sales_order.currency is 'Currency of every amount in the order (ISO 4217).';
comment on column sales_order.subtotal_cents is 'Stored on purpose (document total): sum of quantity × unit_price_cents of its items, checked by sales_order_totals.';
comment on column sales_order.shipping_cents is 'Shipping charged, 0 from the free-shipping threshold.';
comment on column sales_order.total_cents is 'Amount charged: subtotal + shipping.';
comment on column sales_order.site_language is 'Language of the site at checkout; emails and the result page use it.';
comment on column sales_order.shipping_first_name is 'Copy of the delivery details as given for this order, so later changes to the customer don''t rewrite where it was sent.';
comment on column sales_order.shipping_province_id is 'Province the order ships to.';
comment on column sales_order.shipping_last_name is 'Recipient''s last name, as given for this order.';
comment on column sales_order.shipping_phone is 'Phone for the delivery, as given for this order.';
comment on column sales_order.shipping_address is 'Street address for the delivery, as given for this order.';
comment on column sales_order.shipping_city is 'City or sector for the delivery, as given for this order.';
comment on column sales_order.delivery_notes is 'Optional instructions for the courier.';
comment on column sales_order.payment_provider is 'Gateway used: azul, cardnet, or test (refused in production by the app).';
comment on column sales_order.provider_reference is 'The gateway''s transaction or authorization id, once known.';
comment on column sales_order.paid_at is 'When the payment was confirmed. Set if and only if the order is paid or refunded.';

create table sales_order_item (
  id               bigint generated always as identity primary key,
  sales_order_id   bigint not null references sales_order (id) on delete restrict,
  variant_id       bigint not null references variant (id) on delete restrict,
  quantity         integer not null check (quantity between 1 and 99),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  is_subscription  boolean not null default false,
  created_at       timestamptz not null default now(),
  unique (sales_order_id, variant_id, is_subscription)
);
create index sales_order_item_variant_id on sales_order_item (variant_id);
comment on table sales_order_item is 'A line of an order. Written once with the order and never changed (no updated_at).';
comment on column sales_order_item.unit_price_cents is 'Price charged per unit at the time of the order, after any Subscribe & save discount. A copy on purpose: later price changes must not change past orders.';
comment on column sales_order_item.is_subscription is 'True if bought with Subscribe & save.';
comment on column sales_order_item.sales_order_id is 'The order this line belongs to.';
comment on column sales_order_item.variant_id is 'The exact product choice bought.';
comment on column sales_order_item.quantity is 'Units bought, 1 to 99.';

create table payment_event (
  id               bigint generated always as identity primary key,
  sales_order_id   bigint references sales_order (id) on delete restrict,
  payment_provider text not null check (payment_provider in ('azul', 'cardnet', 'test')),
  status           text not null check (status in ('paid', 'declined', 'cancelled', 'error', 'unverified')),
  verified         boolean not null,
  payload          jsonb not null,
  created_at       timestamptz not null default now(),
  check (verified = (status <> 'unverified')),
  check (verified = (sales_order_id is not null))
);
create index payment_event_sales_order_id on payment_event (sales_order_id);
comment on table payment_event is 'Every callback from a payment gateway, verified or not, for support and reconciliation. Append-only (no updated_at).';
comment on column payment_event.sales_order_id is 'NULL when the callback could not be verified: its order id can''t be trusted.';
comment on column payment_event.payload is 'Raw data sent by the gateway. JSON on purpose: it has no fixed structure and is never filtered on.';
comment on column payment_event.payment_provider is 'Gateway that sent the callback.';
comment on column payment_event.status is 'Result reported by the gateway, or unverified when its signature or lookup failed.';
comment on column payment_event.verified is 'True if the result was confirmed with the gateway.';

-- ---------------------------------------------------------------- operations

create table rate_limit_hit (
  id         bigint generated always as identity primary key,
  bucket     text not null check (bucket in ('waitlist', 'checkout')),
  ip_hash    text not null check (ip_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now()
);
create index rate_limit_hit_lookup on rate_limit_hit (bucket, ip_hash, created_at);
comment on table rate_limit_hit is 'One row per request to a rate-limited endpoint. Rows older than a day are deleted. Never updated (no updated_at).';
comment on column rate_limit_hit.ip_hash is 'SHA-256 of the client IP salted with APP_SECRET. Raw IPs are never stored.';
comment on column rate_limit_hit.bucket is 'Endpoint the request was for.';

-- ---------------------------------------------------------------- reports

create view waitlist_pick_demand as
select p.slug                         as product,
       v.sku,
       sum(wp.quantity)               as units,
       count(distinct ws.id)          as signups
from waitlist_pick wp
join waitlist_signup ws on ws.id = wp.waitlist_signup_id
join variant v on v.id = wp.variant_id
join product p on p.id = v.product_id
where ws.unsubscribed_at is null
group by p.slug, v.sku
order by units desc;
comment on view waitlist_pick_demand is 'Which variants people on the waitlist want most (excludes unsubscribed people).';

-- ---------------------------------------------------------------- rules the database enforces

create trigger set_updated_at before update on province for each row execute function set_updated_at();
create trigger set_updated_at before update on category for each row execute function set_updated_at();
create trigger set_updated_at before update on product for each row execute function set_updated_at();
create trigger set_updated_at before update on product_option for each row execute function set_updated_at();
create trigger set_updated_at before update on option_value for each row execute function set_updated_at();
create trigger set_updated_at before update on variant for each row execute function set_updated_at();
create trigger set_updated_at before update on variant_option_value for each row execute function set_updated_at();
create trigger set_updated_at before update on variant_price for each row execute function set_updated_at();
create trigger set_updated_at before update on customer for each row execute function set_updated_at();
create trigger set_updated_at before update on waitlist_signup for each row execute function set_updated_at();
create trigger set_updated_at before update on waitlist_pick for each row execute function set_updated_at();
create trigger set_updated_at before update on sales_order for each row execute function set_updated_at();

-- A price is history: only closing it (setting valid_to once) is allowed.
create function variant_price_guard() returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'variant_price rows are never deleted';
  end if;
  if (new.variant_id, new.currency, new.amount_cents, new.valid_from) is distinct from (old.variant_id, old.currency, old.amount_cents, old.valid_from)
     or old.valid_to is not null then
    raise exception 'variant_price %: a price can only be closed, never changed', old.id;
  end if;
  return new;
end $$;
create trigger variant_price_guard before update or delete on variant_price for each row execute function variant_price_guard();

-- Orders can't be tampered with, even through a bug in the app or with the app's own login: after creation only the
-- payment fields change, the status only moves forward, and orders are never deleted.
create function sales_order_guard() returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'orders are never deleted (order %)', old.order_number;
  end if;
  if (new.customer_id, new.currency, new.subtotal_cents, new.shipping_cents, new.total_cents, new.site_language,
      new.shipping_first_name, new.shipping_last_name, new.shipping_phone, new.shipping_address, new.shipping_city,
      new.shipping_province_id, new.delivery_notes, new.payment_provider, new.created_at)
     is distinct from
     (old.customer_id, old.currency, old.subtotal_cents, old.shipping_cents, old.total_cents, old.site_language,
      old.shipping_first_name, old.shipping_last_name, old.shipping_phone, old.shipping_address, old.shipping_city,
      old.shipping_province_id, old.delivery_notes, old.payment_provider, old.created_at) then
    raise exception 'order %: only the status and payment fields can change', old.order_number;
  end if;
  if new.status <> old.status and not (
       (old.status = 'pending' and new.status in ('paid', 'declined', 'cancelled', 'error'))
    or (old.status = 'paid' and new.status = 'refunded')) then
    raise exception 'order %: status cannot go from % to %', old.order_number, old.status, new.status;
  end if;
  if old.status <> 'pending' and (new.provider_reference, new.paid_at) is distinct from (old.provider_reference, old.paid_at) then
    raise exception 'order %: payment details are fixed once the payment is settled', old.order_number;
  end if;
  return new;
end $$;
create trigger sales_order_guard before update or delete on sales_order for each row execute function sales_order_guard();

-- An order has at least one item and its subtotal matches them. Checked at commit, after the items are inserted.
create function sales_order_totals() returns trigger language plpgsql as $$
declare
  order_id bigint;
  items integer;
  item_sum bigint;
begin
  if tg_table_name = 'sales_order' then order_id := new.id; else order_id := new.sales_order_id; end if;
  select count(*), coalesce(sum(quantity::bigint * unit_price_cents), 0) into items, item_sum
  from sales_order_item where sales_order_id = order_id;
  if items = 0 then
    raise exception 'order % has no items', order_id;
  end if;
  if item_sum <> (select subtotal_cents from sales_order where id = order_id) then
    raise exception 'order %: subtotal does not match its items', order_id;
  end if;
  return null;
end $$;
create constraint trigger sales_order_totals after insert on sales_order deferrable initially deferred
  for each row execute function sales_order_totals();
create constraint trigger sales_order_totals after insert on sales_order_item deferrable initially deferred
  for each row execute function sales_order_totals();

create function append_only() returns trigger language plpgsql as $$
begin
  raise exception '% is append-only', tg_table_name;
end $$;
create trigger append_only before update or delete on sales_order_item for each row execute function append_only();
create trigger append_only before update or delete on payment_event for each row execute function append_only();

-- Standard columns, documented once for every table.
do $$
declare t text;
begin
  for t in select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE' and table_name <> 'schema_migration' loop
    execute format('comment on column %I.id is %L', t, 'Surrogate key. Carries no business meaning.');
    execute format('comment on column %I.created_at is %L', t, 'When the row was created (UTC).');
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = t and column_name = 'updated_at') then
      execute format('comment on column %I.updated_at is %L', t, 'When the row last changed (UTC). Set by set_updated_at().');
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------- the site's own login
-- soulset_app can add rows and change only the columns the site needs: no deletes outside the wishlist and the
-- rate-limit log, no schema changes, and it can't switch the triggers above off. It is created without a password;
-- give it one once per environment: alter role soulset_app login password '…'; (see README).

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'soulset_app') then
    create role soulset_app nologin;
  end if;
end $$;

grant usage on schema public to soulset_app;
grant select on province, category, product, product_option, option_value, variant, variant_option_value, variant_price to soulset_app;
grant select, insert on customer to soulset_app;
grant update (first_name, last_name, phone, province_id) on customer to soulset_app;
grant select, insert on waitlist_signup to soulset_app;
grant update (source, site_language, browser_language, confirmation_sent_at, unsubscribed_at) on waitlist_signup to soulset_app;
grant select, insert, delete on waitlist_pick to soulset_app;
grant select, insert on sales_order to soulset_app;
grant update (status, provider_reference, paid_at) on sales_order to soulset_app;
grant select, insert on sales_order_item, payment_event to soulset_app;
grant select, insert, delete on rate_limit_hit to soulset_app;
