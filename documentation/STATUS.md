# Project status — final stabilization (honest report)

Four categories are kept strictly apart: **Runtime-tested** (actually executed), **Statically checked** (inspected/analysed by tools, not run), **Implemented but unverified at runtime**, **Externally configured** (needs your accounts/credentials).

## 1. Runtime-tested (actually executed in the authoring sandbox)
| What | How | Result |
|---|---|---|
| Pricing logic: totals, free-shipping threshold, refusal when shipping not configured, sale-price rules, WhatsApp link | `tsx` script with `node:assert` | **all passed** |
| Homepage script flow (bottle building, live-product rebuild, CMS hero → ring text/note/button, language, menu) | `npm run check:homepage` — runs the real script in Node against stubbed DOM/THREE/gsap | **passed** (no errors, no swallowed rejections). *This does not render WebGL.* |
| Middleware route matcher | regex emulation over sample paths | correct |

## 2. Statically checked (no execution)
- TypeScript **syntax** scan of all API + storefront files: no errors. (A full type-check was not possible: dependencies could not be installed.)
- Prisma schema structural check (script): 26 models, 5 enums, all FK fields/back-relations/types consistent. `prisma validate` itself was **not** run.
- Import audit: 223 relative/alias imports resolve; every named import has a matching export.
- API contract audit: every explicit frontend API call (60) matches a backend route and HTTP method (89 routes).
- i18n audit: every translation key used exists with EN + FR + AR text.

## 3. NOT executed (needs your machine — exact commands in FINAL-SETUP.md)
`npm install`, `prisma generate/migrate/seed`, full `tsc`, ESLint, vitest (incl. DB integration tests `RUN_INTEGRATION=1 npm test`), `next build`, starting API/storefront, **all browser testing** (admin screens, uploads, checkout, language switching/RTL, responsive layouts, WebGL homepage). **No migration files exist** — generate with `npm run db:init` and commit them. Expect to fix small issues on first run; please report any error output.

## 4. Fixed in this stabilization pass
- **Auth:** admin and customer sessions are re-validated against the DB on every request (disabled admins lose access immediately; role changes apply immediately; deleted customers rejected); admin login limited to 10/15 min; Origin check on state-changing requests; startup refuses to run with missing/short `JWT_SECRET`.
- **Orders:** status changes use compare-and-set (no double cancel/double restock); cancelling closes pending payments; refunds mark payments refunded; "payment received" blocked on cancelled/refunded orders; guests no longer cause 401 console errors (`/api/auth/session`).
- **Catalog rules (server-side):** cannot publish without a name and price > 0; sale price must be below price; product delete archives if ever ordered, refuses if traceability batches exist; low-stock alerts ignore unpublished drafts.
- **Sorting:** price sort now uses the effective (sale) price.
- **Settings & CMS validation:** settings keys whitelisted and schema-validated; links limited to `/`, `http(s)`, `mailto:`, `tel:` (also enforced when rendering) — blocks `javascript:` links; CMS page slugs whitelisted.
- **Errors:** friendly 404/409/413 for missing records, duplicates (slug/SKU), oversized uploads.
- **Languages:** language resolved server-side and provided to client components (no English flash); default language from Admin settings applied on first visit; switcher shows only enabled languages; admin is always LTR; order statuses/payment labels/forms translated (EN/FR/AR); WhatsApp message localized; customer password-change UI added.
- **Homepage:** bottles are built from your published products (provisional demo bottles only when none are published; they link to the shop, not to missing pages); `home` CMS page drives circling text, footer note and button; crawlable HTML + SEO metadata for `/`.
- **SEO/security headers:** `robots.txt`, `sitemap.xml`, metadata base/title template, `noindex` on `/admin`, nosniff/frame/referrer headers.
- **Tooling:** separate `.env.example` per app, npm scripts (`db:init|push|generate|seed`, `typecheck`, `lint`, `build`), ESLint config, Dockerfiles (migrate-or-push on start), CI runs typecheck/lint/tests/build.

## 5. Implemented, awaiting runtime verification
Admin dashboard (all sections listed in ADMIN_GUIDE.md), products with variants/images/stock history, orders + COD workflow, customers, collections/categories, suppliers/batches, CMS pages + journal, media library, settings (site, social, navigation, footer, shipping, payments, WhatsApp, languages), admin users/roles, audit log; storefront (shop, product, cart, checkout, confirmation, account, addresses, wishlist, journal, contact, CMS pages, EN/FR/AR + RTL); customer accounts; idempotent stock-guarded checkout.

## 6. Externally configured (your accounts/decisions)
Cloudinary (3 env vars) · online payment provider (none integrated or chosen — see PAYMENTS.md) · real shipping fees/countries · WhatsApp number · transactional email (not implemented) · legal texts · product data, photography, GLB models · hosting (API host, managed PostgreSQL, Vercel/Docker).

## 7. Known limitations (not bugs in the sandbox)
- No online card/local payments (COD + WhatsApp only). Refunds are bookkeeping only (no stock return; no provider refund).
- No GLB upload UI (3D viewer works when a `ProductModel` row exists, e.g. via DB); homepage bottles are procedural; Three.js/GSAP/fonts load from CDNs.
- Admin UI is English-only. Page language is cookie-based (no `/fr` URLs, no hreflang).
- No email notifications, coupons, forgot-password, invoices, product import, Playwright E2E tests.
- Next.js `/api` proxy target is fixed at build time (`API_URL`).
