# FINAL-SETUP — first run, step by step

Requirements: **Node.js 20+**, **Docker** (for PostgreSQL; or install PostgreSQL 14+ yourself). Run every command from the project root (`oliva-natura/`) unless stated.

## 1. Install dependencies
```bash
npm install
```
## 2. Configure environment variables
```bash
cp apps/api/.env.example apps/api/.env
cp apps/storefront/.env.example apps/storefront/.env.local
```
Edit `apps/api/.env`:
- `JWT_SECRET` — generate one: `openssl rand -hex 32` (Windows PowerShell: `-join ((48..57)+(97..102) | Get-Random -Count 64 | % {[char]$_})`).
- `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` — your first admin login (password ≥ 12 characters).
- `DATABASE_URL` — leave the default if you use the provided Docker database.
- Cloudinary values can be filled in later (uploads simply return a clear error until then).

## 3. Start PostgreSQL
```bash
docker compose up -d db
```
## 4. Generate Prisma Client
```bash
npm run db:generate
```
## 5. Create the database tables (migrations)
No migration files could be generated in the authoring environment (no database was available), so create them once on your machine:
```bash
npm run db:init          # = prisma migrate dev --name init  → creates apps/api/prisma/migrations/ and applies it
```
**Commit the generated `apps/api/prisma/migrations/` folder.** For production servers use `npm -w apps/api run db:deploy`. (Quick throwaway alternative with no migration files: `npm run db:push`.)

## 6. Seed the database
```bash
npm run db:seed
```
Creates: your super admin (from `.env`), 3 collections, **9 provisional products as unpublished drafts (price 0, stock 0)**, empty CMS pages (unpublished), default settings (shipping *disabled*, cash on delivery enabled, languages EN/FR/AR). Safe to re-run (it never overwrites existing data).

## 7. Start the API (terminal 1)
```bash
npm run dev:api          # http://localhost:4000/health  → {"ok":true}
```
## 8. Start the storefront (terminal 2)
```bash
npm run dev:store        # http://localhost:3000
```
## 9. Open the Admin Dashboard
Go to **http://localhost:3000/admin** and sign in with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`. (You can then remove the seed password from `.env`; create further admins under *Admin users*.)

## 10. Enter your business information (all in /admin)
1. **Settings → Site & contact**: email, phone, address, business info; social links.
2. **Settings → Payments & WhatsApp**: WhatsApp number (international format) and cash-on-delivery on/off.
3. **Settings → Shipping**: add `TN`, tick *Enabled*, enter your real fee (TND). Checkout is refused for any country without an enabled rule.
4. **Settings → Languages**: choose enabled languages and the default.
5. **Media library**: needs Cloudinary — create a free account, then put `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` in `apps/api/.env` and restart the API.
6. **Collections & categories**, then **Products**: open each draft → names/descriptions (EN/FR/AR) → price (and optional sale price) → images → stock → tick *Published* → Save. Use *Preview* first. The server refuses to publish a product with no name or no price.
7. **Pages & homepage**: write Our Story, From Our Land, Philosophy and the legal pages; tick *Published*. The `home` page controls the homepage circling text, footer note and button.
8. **Suppliers / Product batches**: only batches marked *Verified* are shown publicly.

## Production build commands
```bash
npm run build                           # builds API (dist/) and storefront (.next/)
npm -w apps/api run start               # node dist/index.js   (needs migrations applied)
npm -w apps/storefront run start        # next start
```
Whole stack in Docker: `docker compose --profile full up --build` (API container applies migrations if present, otherwise `db push`; then run the seed once: `docker compose exec api npx tsx prisma/seed.ts`).

## Production checklist
- `NODE_ENV=production`, HTTPS on both apps, strong `JWT_SECRET`, `CORS_ORIGIN` = exact storefront URL (otherwise every POST is rejected with "Origin not allowed").
- Set `API_URL` **before** building the storefront (the `/api` proxy target is baked in at build time); set `SITE_URL`.
- Backups: `pg_dump -Fc "$DATABASE_URL" > backup.dump` (restore: `pg_restore -d <db> --clean backup.dump`). Test a restore.
- Replace placeholder legal pages with reviewed texts before launch.

## Run the checks yourself
```bash
npm run typecheck        # TypeScript, API + storefront
npm run lint             # ESLint (storefront)
npm test                 # unit tests (API)
RUN_INTEGRATION=1 npm test   # + database integration tests (needs the DB from step 3/5)
```
## Troubleshooting
- *Prisma: "Environment variable not found: DATABASE_URL"* → `apps/api/.env` missing, or run prisma through the npm scripts.
- *Admin login loops* → API not running, or `API_URL` wrong (check http://localhost:3000/api/settings/public returns JSON).
- *"Origin not allowed"* → `CORS_ORIGIN` does not match the address in your browser.
- *Upload says "Image storage is not configured"* → Cloudinary variables missing/typo; restart the API after editing `.env`.
