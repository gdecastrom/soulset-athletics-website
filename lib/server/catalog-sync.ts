/* Copies the code catalogue (lib/catalog-data.ts) into the database: categories, products, options, values,
   variants and current prices. Runs on every deploy (scripts/release.ts), as the database owner, in one transaction.
   Nothing is deleted: what left the code is marked inactive, and a changed price closes the old one and opens a new one. */
import type postgres from 'postgres';
import { allVariants, CATEGORIES, CATS, CURRENCY, PRODUCTS, unitPrice, variantSku } from '../catalog.ts';

export async function syncCatalog(sql: postgres.Sql, log: (msg: string) => void = console.log) {
  let priceChanges = 0;
  await sql.begin(async tx => {
    const catId = new Map<string, number>();
    for (const slug of CATEGORIES) {
      const [row] = await tx<{ id: number }[]>`
        insert into category (slug, name) values (${slug}, ${CATS[slug].name.en})
        on conflict (slug) do update set name = excluded.name, active = true
        returning id`;
      catId.set(slug, row.id);
    }
    await tx`update category set active = false where active and slug <> all(${CATEGORIES})`;

    for (const p of PRODUCTS) {
      const [prod] = await tx<{ id: number }[]>`
        insert into product (category_id, slug, code, name) values (${catId.get(p.cat)!}, ${p.id}, ${p.code}, ${p.name})
        on conflict (slug) do update set category_id = excluded.category_id, code = excluded.code, name = excluded.name, active = true
        returning id`;

      const valueId = new Map<string, number>();   // "<option key>/<value id>" → option_value.id
      const optionId = new Map<string, number>();
      for (const [i, op] of p.options.entries()) {
        const [o] = await tx<{ id: number }[]>`
          insert into product_option (product_id, key, name, position) values (${prod.id}, ${op.key}, ${typeof op.label === 'string' ? op.label : op.label.en}, ${i})
          on conflict (product_id, key) do update set name = excluded.name, position = excluded.position
          returning id`;
        optionId.set(op.key, o.id);
        for (const [j, v] of op.values.entries()) {
          const [val] = await tx<{ id: number }[]>`
            insert into option_value (product_option_id, key, name, position) values (${o.id}, ${v.id}, ${typeof v.label === 'string' ? v.label : v.label.en}, ${j})
            on conflict (product_option_id, key) do update set name = excluded.name, position = excluded.position
            returning id`;
          valueId.set(`${op.key}/${v.id}`, val.id);
        }
      }

      const skus: string[] = [];
      for (const opts of allVariants(p)) {
        const sku = variantSku(p, opts);
        skus.push(sku);
        const [variant] = await tx<{ id: number }[]>`
          insert into variant (product_id, sku) values (${prod.id}, ${sku})
          on conflict (sku) do update set active = true
          returning id`;
        for (const op of p.options) {
          await tx`
            insert into variant_option_value (variant_id, product_id, product_option_id, option_value_id)
            values (${variant.id}, ${prod.id}, ${optionId.get(op.key)!}, ${valueId.get(`${op.key}/${opts[op.key]}`)!})
            on conflict (variant_id, product_option_id) do nothing`;
        }
        const cents = Math.round(unitPrice(p, opts)! * 100);
        const [current] = await tx<{ id: number; amount_cents: number }[]>`
          select id, amount_cents from variant_price where variant_id = ${variant.id} and currency = ${CURRENCY} and valid_to is null`;
        if (current?.amount_cents === cents) continue;
        if (current) await tx`update variant_price set valid_to = now() where id = ${current.id}`;
        await tx`insert into variant_price (variant_id, currency, amount_cents, valid_from) values (${variant.id}, ${CURRENCY}, ${cents}, now())`;
        priceChanges++;
      }
      await tx`update variant set active = false where product_id = ${prod.id} and active and sku <> all(${skus})`;
    }
    await tx`update product set active = false where active and slug <> all(${PRODUCTS.map(p => p.id)})`;
  });
  log(`catalog: ${PRODUCTS.length} products in sync, ${priceChanges} price${priceChanges === 1 ? '' : 's'} set`);
}
