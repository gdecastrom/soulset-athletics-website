# Data dictionary

Generated from the database by `scripts/data-dictionary.ts`; edit the comments in the migrations, not this file.

## category

Shop category (fuel, hydrate, build, ignite, stacks).

| Column | Type | Null | Default | Keys / rules | Meaning |
|---|---|---|---|---|---|
| `id` | bigint | no | identity | PK | Surrogate key. Carries no business meaning. |
| `slug` | text | no |  | UNIQUE, CHECK | Stable key used in URLs (/shop/<slug>) and in the code catalogue. |
| `name` | text | no |  |  | English name, for reports. Customer-facing names in both languages live in the code catalogue. |
| `active` | boolean | no | true |  | False once the category is no longer in the code catalogue. |
| `created_at` | timestamp with time zone | no | now() |  | When the row was created (UTC). |
| `updated_at` | timestamp with time zone | no | now() |  | When the row last changed (UTC). Set by set_updated_at(). |

## customer

A person who joined the waitlist or placed an order, identified by email.

| Column | Type | Null | Default | Keys / rules | Meaning |
|---|---|---|---|---|---|
| `id` | bigint | no | identity | PK | Surrogate key. Carries no business meaning. |
| `email` | text | no |  | UNIQUE, CHECK | Lowercased. One customer per email. |
| `first_name` | text | yes |  | CHECK | NULL until the person gives it. |
| `last_name` | text | yes |  | CHECK | NULL until the person gives it (asked at checkout). |
| `phone` | text | yes |  | CHECK | Latest phone given at checkout. Each order keeps its own copy. |
| `province_id` | bigint | yes |  | FK → province | Where the person trains or lives, as last given. Each order keeps its own shipping province. |
| `created_at` | timestamp with time zone | no | now() |  | When the row was created (UTC). |
| `updated_at` | timestamp with time zone | no | now() |  | When the row last changed (UTC). Set by set_updated_at(). |

## option_value

One possible value of a product option: Citrus, Box of 24, 1000 mg.

| Column | Type | Null | Default | Keys / rules | Meaning |
|---|---|---|---|---|---|
| `id` | bigint | no | identity | PK | Surrogate key. Carries no business meaning. |
| `product_option_id` | bigint | no |  | FK → product_option | The option this value belongs to. |
| `key` | text | no |  | CHECK | Stable key from the code catalogue (citrus, box-of-24, 1000-mg). |
| `name` | text | no |  |  | English label, for reports. |
| `position` | smallint | no |  | CHECK | Order in which the value is shown. |
| `created_at` | timestamp with time zone | no | now() |  | When the row was created (UTC). |
| `updated_at` | timestamp with time zone | no | now() |  | When the row last changed (UTC). Set by set_updated_at(). |

## payment_event

Every callback from a payment gateway, verified or not, for support and reconciliation. Append-only (no updated_at).

| Column | Type | Null | Default | Keys / rules | Meaning |
|---|---|---|---|---|---|
| `id` | bigint | no | identity | PK | Surrogate key. Carries no business meaning. |
| `sales_order_id` | bigint | yes |  | FK → sales_order, CHECK | NULL when the callback could not be verified: its order id can't be trusted. |
| `payment_provider` | text | no |  | CHECK | Gateway that sent the callback. |
| `status` | text | no |  | CHECK | Result reported by the gateway, or unverified when its signature or lookup failed. |
| `verified` | boolean | no |  | CHECK | True if the result was confirmed with the gateway. |
| `payload` | jsonb | no |  |  | Raw data sent by the gateway. JSON on purpose: it has no fixed structure and is never filtered on. |
| `created_at` | timestamp with time zone | no | now() |  | When the row was created (UTC). |

## product

A product as sold on the site (Carb Gel 30, Sodium, …). What is actually bought is one of its variants.

| Column | Type | Null | Default | Keys / rules | Meaning |
|---|---|---|---|---|---|
| `id` | bigint | no | identity | PK | Surrogate key. Carries no business meaning. |
| `category_id` | bigint | no |  | FK → category | Shop category the product is listed under. |
| `slug` | text | no |  | UNIQUE, CHECK | Stable key used in URLs (/products/<slug>) and in the code catalogue. |
| `code` | text | no |  | UNIQUE, CHECK | Product code printed on the pack (GEL-030). Base of every variant SKU. |
| `name` | text | no |  |  | Brand name of the product; the same in both languages. |
| `active` | boolean | no | true |  | False once the product is no longer in the code catalogue. Kept for old orders. |
| `created_at` | timestamp with time zone | no | now() |  | When the row was created (UTC). |
| `updated_at` | timestamp with time zone | no | now() |  | When the row last changed (UTC). Set by set_updated_at(). |

## product_option

A choice the customer makes for a product: flavour, pack, size, strength, caffeine.

| Column | Type | Null | Default | Keys / rules | Meaning |
|---|---|---|---|---|---|
| `id` | bigint | no | identity | PK | Surrogate key. Carries no business meaning. |
| `product_id` | bigint | no |  | FK → product | The product this option belongs to. |
| `key` | text | no |  | CHECK | Stable key from the code catalogue (flavour, pack, …). |
| `name` | text | no |  |  | English label, for reports. |
| `position` | smallint | no |  | CHECK | Order in which the option is shown and in which it appears in the SKU. |
| `created_at` | timestamp with time zone | no | now() |  | When the row was created (UTC). |
| `updated_at` | timestamp with time zone | no | now() |  | When the row last changed (UTC). Set by set_updated_at(). |

## province

The 31 provinces of the Dominican Republic plus Distrito Nacional. Closed list, loaded here.

| Column | Type | Null | Default | Keys / rules | Meaning |
|---|---|---|---|---|---|
| `id` | bigint | no | identity | PK | Surrogate key. Carries no business meaning. |
| `name` | text | no |  | UNIQUE | Official name, with accents (e.g. "Santiago Rodríguez"). |
| `created_at` | timestamp with time zone | no | now() |  | When the row was created (UTC). |
| `updated_at` | timestamp with time zone | no | now() |  | When the row last changed (UTC). Set by set_updated_at(). |

## rate_limit_hit

One row per request to a rate-limited endpoint. Rows older than a day are deleted. Never updated (no updated_at).

| Column | Type | Null | Default | Keys / rules | Meaning |
|---|---|---|---|---|---|
| `id` | bigint | no | identity | PK | Surrogate key. Carries no business meaning. |
| `bucket` | text | no |  | CHECK | Endpoint the request was for. |
| `ip_hash` | text | no |  | CHECK | SHA-256 of the client IP salted with APP_SECRET. Raw IPs are never stored. |
| `created_at` | timestamp with time zone | no | now() |  | When the row was created (UTC). |

## sales_order

An order placed at checkout. A commercial document: after creation only its payment fields change.

| Column | Type | Null | Default | Keys / rules | Meaning |
|---|---|---|---|---|---|
| `id` | bigint | no | identity | PK | Surrogate key. Carries no business meaning. |
| `order_number` | text | yes | generated: ('SA-'::text \|\| lpad((id)::text, 6, '0'::text)) | UNIQUE | Number shown to the customer and the payment provider (SA-000123). |
| `customer_id` | bigint | no |  | FK → customer | Who placed the order. |
| `status` | text | no | 'pending'::text | CHECK | pending → paid \| declined \| cancelled \| error; paid → refunded. Enforced by sales_order_guard. |
| `currency` | text | no |  | CHECK | Currency of every amount in the order (ISO 4217). |
| `subtotal_cents` | integer | no |  | CHECK | Stored on purpose (document total): sum of quantity × unit_price_cents of its items, checked by sales_order_totals. |
| `shipping_cents` | integer | no |  | CHECK | Shipping charged, 0 from the free-shipping threshold. |
| `total_cents` | integer | no |  | CHECK | Amount charged: subtotal + shipping. |
| `site_language` | text | no |  | CHECK | Language of the site at checkout; emails and the result page use it. |
| `shipping_first_name` | text | no |  | CHECK | Copy of the delivery details as given for this order, so later changes to the customer don't rewrite where it was sent. |
| `shipping_last_name` | text | no |  | CHECK | Recipient's last name, as given for this order. |
| `shipping_phone` | text | no |  | CHECK | Phone for the delivery, as given for this order. |
| `shipping_address` | text | no |  | CHECK | Street address for the delivery, as given for this order. |
| `shipping_city` | text | no |  | CHECK | City or sector for the delivery, as given for this order. |
| `shipping_province_id` | bigint | no |  | FK → province | Province the order ships to. |
| `delivery_notes` | text | yes |  | CHECK | Optional instructions for the courier. |
| `payment_provider` | text | no |  | CHECK | Gateway used: azul, cardnet, or test (refused in production by the app). |
| `provider_reference` | text | yes |  |  | The gateway's transaction or authorization id, once known. |
| `paid_at` | timestamp with time zone | yes |  | CHECK | When the payment was confirmed. Set if and only if the order is paid or refunded. |
| `created_at` | timestamp with time zone | no | now() |  | When the row was created (UTC). |
| `updated_at` | timestamp with time zone | no | now() |  | When the row last changed (UTC). Set by set_updated_at(). |

## sales_order_item

A line of an order. Written once with the order and never changed (no updated_at).

| Column | Type | Null | Default | Keys / rules | Meaning |
|---|---|---|---|---|---|
| `id` | bigint | no | identity | PK | Surrogate key. Carries no business meaning. |
| `sales_order_id` | bigint | no |  | FK → sales_order | The order this line belongs to. |
| `variant_id` | bigint | no |  | FK → variant | The exact product choice bought. |
| `quantity` | integer | no |  | CHECK | Units bought, 1 to 99. |
| `unit_price_cents` | integer | no |  | CHECK | Price charged per unit at the time of the order, after any Subscribe & save discount. A copy on purpose: later price changes must not change past orders. |
| `is_subscription` | boolean | no | false |  | True if bought with Subscribe & save. |
| `created_at` | timestamp with time zone | no | now() |  | When the row was created (UTC). |

## variant

What is actually sold and shipped (SKU): a product with one value chosen for each of its options.

| Column | Type | Null | Default | Keys / rules | Meaning |
|---|---|---|---|---|---|
| `id` | bigint | no | identity | PK | Surrogate key. Carries no business meaning. |
| `product_id` | bigint | no |  | FK → product | The product this variant is a version of. |
| `sku` | text | no |  | UNIQUE, CHECK | Product code plus the option value keys, e.g. GEL-030-CITRUS-BOX-OF-12. Never reused. |
| `active` | boolean | no | true |  | False once this combination is no longer sold. Kept for old orders and wishlists. |
| `created_at` | timestamp with time zone | no | now() |  | When the row was created (UTC). |
| `updated_at` | timestamp with time zone | no | now() |  | When the row last changed (UTC). Set by set_updated_at(). |

## variant_option_value

Which value a variant has for each option of its product (N:M between variant and option_value).

| Column | Type | Null | Default | Keys / rules | Meaning |
|---|---|---|---|---|---|
| `id` | bigint | no | identity | PK | Surrogate key. Carries no business meaning. |
| `variant_id` | bigint | no |  | FK → variant | The variant. |
| `product_id` | bigint | no |  | FK → variant, FK → product_option | Repeats the product on purpose: the composite foreign keys use it so a variant can only take values of its own product's options. |
| `product_option_id` | bigint | no |  | FK → product_option, FK → option_value | Repeated on purpose, like product_id: guarantees one value per option per variant. |
| `option_value_id` | bigint | no |  | FK → option_value | The value the variant has for that option. |
| `created_at` | timestamp with time zone | no | now() |  | When the row was created (UTC). |
| `updated_at` | timestamp with time zone | no | now() |  | When the row last changed (UTC). Set by set_updated_at(). |

## variant_price

List price of a variant over time. A price change closes the current row (valid_to) and opens a new one; rows are never edited or deleted.

| Column | Type | Null | Default | Keys / rules | Meaning |
|---|---|---|---|---|---|
| `id` | bigint | no | identity | PK | Surrogate key. Carries no business meaning. |
| `variant_id` | bigint | no |  | FK → variant | The variant this price is for. |
| `currency` | text | no |  | CHECK | ISO 4217 code. Prices are in USD for now; DOP is allowed for when the business decides. |
| `amount_cents` | integer | no |  | CHECK | List price in cents, taxes included, before any Subscribe & save discount. |
| `valid_from` | timestamp with time zone | no | now() | CHECK | When this price started to apply. |
| `valid_to` | timestamp with time zone | yes |  | CHECK | When it stopped applying; NULL means it is the current price. Periods of one variant and currency never overlap. |
| `created_at` | timestamp with time zone | no | now() |  | When the row was created (UTC). |
| `updated_at` | timestamp with time zone | no | now() |  | When the row last changed (UTC). Set by set_updated_at(). |

## waitlist_pick

Products in the cart when the person signed up: what they want at launch. Replaced on each new sign-up (a wishlist, not history).

| Column | Type | Null | Default | Keys / rules | Meaning |
|---|---|---|---|---|---|
| `id` | bigint | no | identity | PK | Surrogate key. Carries no business meaning. |
| `waitlist_signup_id` | bigint | no |  | FK → waitlist_signup | The sign-up this pick belongs to. |
| `variant_id` | bigint | no |  | FK → variant | The exact product choice (flavour, size…) they want. |
| `quantity` | integer | no |  | CHECK | How many they had in the cart, 1 to 99. |
| `is_subscription` | boolean | no | false |  | True if they chose Subscribe & save for this product. |
| `created_at` | timestamp with time zone | no | now() |  | When the row was created (UTC). |
| `updated_at` | timestamp with time zone | no | now() |  | When the row last changed (UTC). Set by set_updated_at(). |

## waitlist_signup

A customer's place on the pre-launch waitlist. One per customer; signing up again updates it.

| Column | Type | Null | Default | Keys / rules | Meaning |
|---|---|---|---|---|---|
| `id` | bigint | no | identity | PK | Surrogate key. Carries no business meaning. |
| `customer_id` | bigint | no |  | FK → customer, UNIQUE | Who signed up. One sign-up per customer. |
| `source` | text | no |  | CHECK | Form used for the latest sign-up: home page box or waitlist page. |
| `site_language` | text | no |  | CHECK | Language of the site at sign-up; emails are sent in it. |
| `browser_language` | text | yes |  | CHECK | navigator.language, e.g. es-DO. For analytics only. |
| `confirmation_sent_at` | timestamp with time zone | yes |  |  | When the confirmation email was accepted by Resend. NULL: not sent yet. |
| `unsubscribed_at` | timestamp with time zone | yes |  |  | When the person unsubscribed. The row is kept; signing up again clears it. |
| `created_at` | timestamp with time zone | no | now() |  | When the row was created (UTC). |
| `updated_at` | timestamp with time zone | no | now() |  | When the row last changed (UTC). Set by set_updated_at(). |
