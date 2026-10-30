# Guía de desarrollo

Para todo el que trabaje en el sitio de Soulset Athletics. Resume cómo está hecho ahora y las reglas para cambiarlo sin
romper nada. Los detalles técnicos están en el [README](../README.md); el diseño de la base, en
[database.md](database.md).

## Qué cambió (octubre 2026)

| Antes | Ahora |
|---|---|
| HTML + JavaScript sin framework, rutas con `#` (`/#p-sodium`) | **Next.js 16** (App Router, React 19, TypeScript), URLs reales (`/products/sodium`, `/es/products/sodium`) |
| `index.html` + `assets/js/app.js` (inglés) y `es/index.html` + `assets/js/app.es.js` (español), copiados a mano | Una sola versión del código; los textos de los dos idiomas viven juntos |
| Catálogo copiado en `app.js` y `app.es.js` | Un solo catálogo bilingüe: `lib/catalog-data.ts` |
| Lista de espera solo en el navegador (modo demo) | Se guarda en **Postgres (Neon)** y manda correo de confirmación con **Resend** |
| Sin pagos | Checkout listo en el servidor y **apagado**; preparado para Azul o CardNet |
| GitHub Pages | **Vercel** |

Los enlaces viejos con `#` siguen funcionando: redirigen a la página nueva.

### Si tienes cambios hechos sobre la versión anterior

Los archivos viejos ya no existen. Pasa cada cambio a su lugar nuevo:

| Archivo viejo | Dónde va ahora |
|---|---|
| `index.html`, `es/index.html` (header, footer, carrito) | `components/Header.tsx`, `components/Footer.tsx`, `components/CartDrawer.tsx`, `app/[lang]/layout.tsx` |
| `assets/js/app.js` / `app.es.js`: array `P` (productos) | `lib/catalog-data.ts` |
| `app.js` / `app.es.js`: textos de cada página | `lib/dict.ts` (inglés y español en el mismo archivo) |
| `viewHome()`, `viewShop()`, `viewProduct()`… | `app/[lang]/page.tsx`, `app/[lang]/shop/…`, `app/[lang]/products/[id]/page.tsx`… |
| Planificador de energía (`computePlan`) | `lib/planner.ts` (cálculo) y `components/FuelPlanner.tsx` (pantalla) |
| Lista de espera (`joinWaitlist`) | `lib/waitlist-client.ts` y `components/WaitlistForms.tsx`; el servidor en `app/api/waitlist/route.ts` |
| `assets/css/site.css` | `app/globals.css` (mismo CSS) |
| `assets/img/` | `public/img/` |
| `assets/media/` (fotos y videos de fondo), `cineStill()` / `cineMedia()` | `public/media/`; las secciones están en `app/[lang]/page.tsx` y `manifesto/page.tsx` con el componente `CineMedia` |
| `assets/js/config.js` | Ya no existe: la URL de la API es fija (`/api/waitlist`) |

## Levantar el proyecto en tu computadora

Necesitas Git y **Node 22.18 o más nuevo**.

```bash
git clone https://github.com/gdecastrom/soulset-athletics-website.git
```

```bash
cd soulset-athletics-website
```

```bash
npm install
```

```bash
npm run dev
```

Abre http://localhost:3000 (inglés) y http://localhost:3000/es (español). Así ya ves y navegas todo el sitio. Para que la
lista de espera guarde de verdad necesitas una base de datos:

1. En Neon, crea una **rama propia** del proyecto `soulset-athletics` (nunca uses la de producción para probar).
2. Crea un archivo `.env.local` (nunca se sube a Git) con:
   ```
   MIGRATION_DATABASE_URL=<cadena del dueño de tu rama>
   DATABASE_URL=<la misma cadena, para desarrollo>
   APP_SECRET=dev
   ```
3. Prepara la base (migraciones + catálogo) y arranca:
   ```bash
   npm run db:release
   ```
   ```bash
   npm run dev
   ```

Sin `RESEND_API_KEY` no se mandan correos, pero los registros se guardan igual.

## Dónde se cambia cada cosa

### Textos de la interfaz
- En `lib/dict.ts`: primero el bloque en inglés y después el de español, con **las mismas claves**. Hay una prueba que
  falla si a un idioma le falta algo.
- El español siempre trata de **tú** (te, tu, tus; "Únete", "Elige"), nunca de usted.
- Copy sin relleno: frases concretas, con datos (dosis, gramos, precios) en vez de adjetivos. Los slogans de marca
  ("Mentality > Everything", "Stay relentless", el ciclo Believe → Act → Results) se usan con medida, no en cada sección.

### Productos y precios
- Todo en `lib/catalog-data.ts`: nombres, opciones, precios, nutrición y textos en los dos idiomas.
- Cada deploy copia el catálogo a la base de datos. Un cambio de precio **no borra el anterior**: queda como historia.
- **Nunca cambies el `id` de un valor de opción ya publicado** (por ejemplo `citrus`, `box-of-12`, `1000-mg`): forma
  parte del SKU (`GEL-030-CITRUS-BOX-OF-12`) y las órdenes y listas de espera lo referencian. Si cambia el nombre que ve
  el cliente, cambia solo el `label`.
- Para quitar un producto, sácalo del archivo: en la base queda marcado como inactivo, no se borra.
- Imágenes de producto: `public/img/<nombre>.webp`, cuadradas de 900×900.

### Páginas
- Todas viven en `app/[lang]/…` y existen en los dos idiomas. El inglés no lleva prefijo (`/shop`); el español va bajo
  `/es` (`/es/shop`). `proxy.ts` se encarga de eso.
- Los enlaces internos siempre con `href(lang, '/ruta')` de `lib/i18n.ts`, nunca escritos a mano.
- Cada página nueva exporta `generateMetadata` con su título, descripción y `alternates(lang, '/ruta')` (para Google).
- Si la página debe aparecer en Google, agrégala a `app/sitemap.ts`.

### Estilos y marca
- `app/globals.css`. Los colores y tamaños están como variables al inicio del archivo.
- Colores: negro `#0A0A0A`, hueso `#F2F0EB`, Ignite `#FF5A1F` (solo para acciones y el ">"; el texto sobre Ignite siempre negro).
- Tipografías: Saira Extra Condensed (títulos), Barlow (texto), IBM Plex Mono (datos de nutrición). No agregues otras.
- **Sin líneas divisorias entre secciones.** Las líneas solo van dentro de componentes (tablas, acordeones, tarjetas).
- En el inicio las secciones alternan negro y hueso (clase `band`). Sobre hueso, el naranja de texto se oscurece solo.
- Fotos y videos de fondo: en `public/media/`; cómo cambiarlos, en [media.md](media.md). Nada de marcas visibles en ropa o equipo.
- Revisa siempre en celular (390 px de ancho): nada debe hacer scroll horizontal.

## Base de datos

Seguimos la guía *Cómo diseñar una base de datos correcta*. El diseño completo, las reglas de negocio y el ERD están en
[database.md](database.md); cada tabla y columna, en [data-dictionary.md](data-dictionary.md).

- Nombres en **inglés**, `snake_case`, tablas en singular. `order` es palabra reservada: las órdenes son `sales_order`.
- **Primero el diseño, después la migración:** actualiza las reglas y el ERD de `database.md` antes de escribir SQL.
- Cada cambio es un archivo nuevo en `db/migrations/` con el siguiente número (`0002_…sql`). **Una migración ya aplicada
  no se edita nunca**: si el archivo cambia, el deploy se detiene. Para corregir, crea otra migración.
- Cambios sin romper producción: agregar primero, quitar después (columna nueva → copiar datos → cambiar el código →
  hacerla obligatoria → en otra entrega borrar la vieja).
- En cada tabla nueva: `id`, `created_at`, `updated_at` (con el trigger `set_updated_at`), FK con índice, `ON DELETE`
  decidido (nunca `CASCADE` por costumbre), `CHECK` para las reglas y un `comment on` en la tabla y en **cada** columna.
  Hay una prueba que falla si falta un comentario.
- El sitio se conecta con el usuario `soulset_app`, que tiene permisos mínimos. Si una tabla nueva la usa el sitio,
  dale los `grant` necesarios **en la misma migración**, y solo las columnas que de verdad cambia.
- Dinero en centavos (`integer`) con su moneda; fechas y horas en `timestamptz`.
- Después de cambiar el esquema, regenera el diccionario:
  ```bash
  DATABASE_URL=<tu rama> node scripts/data-dictionary.ts
  ```
- Las migraciones las corre el deploy (`scripts/release.ts`, antes del build), **nunca a mano en producción**.

## API y seguridad

- Todo lo que llega del navegador se valida otra vez en el servidor (`lib/server/validate.ts`).
- Las rutas `POST` rechazan peticiones de otros sitios (`sameOrigin`) y tienen límite por IP (`overLimit`).
- **Los precios nunca vienen del navegador.** El checkout los calcula con el catálogo y los compara con la base.
- **No hay ni debe haber endpoints que lean o modifiquen órdenes.** El estado de una orden solo cambia con la respuesta
  verificada del banco (`app/api/payment-callback`). La base además impide editar montos, retroceder estados o borrar
  órdenes.
- Las claves (base de datos, Resend, banco) van solo en las variables de entorno de Vercel o en tu `.env.local`.
  **Nunca en el código ni en Git.**
- El sitio solo carga scripts, fuentes e imágenes propios (Content Security Policy en `next.config.ts`). Si de verdad hace
  falta algo externo (por ejemplo, la página de pago del banco), se agrega ahí a propósito.
- Código del servidor en `lib/server/`. Nunca lo importes desde un componente con `'use client'`.

## Pagos

El checkout está apagado (`CHECKOUT_ENABLED` sin activar) y el carrito sigue llevando a la lista de espera. Para
abrirlo hace falta la cuenta de comercio de Azul o CardNet; los pasos están en el README, sección *Payments*. Nunca
actives el proveedor `test` en producción (el código lo bloquea igual).

## Antes de abrir un PR

1. Trabaja en una rama propia creada desde `main`; nunca subas directo a `main`.
2. Corre las revisiones:
   ```bash
   npm run typecheck
   ```
   ```bash
   TEST_DATABASE_URL=<una base desechable> npm test
   ```
   ```bash
   npm run build
   ```
   `npm test` **borra y reconstruye** la base que le pases: usa una rama de Neon de prueba o un Postgres local, nunca producción.
3. Revisa en el navegador: inglés y español, celular, carrito, lista de espera y el cambio de idioma.
4. En la descripción del PR explica qué cambió y por qué. Si tocaste la base, di qué migración agregaste.

## Lo que no se hace

- Duplicar textos o productos para cada idioma (todo va en un solo lugar con `en` y `es`).
- Escribir rutas a mano en vez de usar `href()`.
- Editar una migración ya aplicada, o cambiar la base a mano en producción.
- Guardar listas en una columna, texto libre para estados, o `float` para dinero.
- Subir claves, contraseñas o archivos `.env` a Git.
- Agregar endpoints que lean, editen o borren órdenes.
- Volver a poner líneas divisorias entre secciones.
