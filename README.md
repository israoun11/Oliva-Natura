# OLIVA NATURA — full-stack e-commerce (final stabilization release)

```
apps/api         Express + TypeScript + Prisma/PostgreSQL REST API (auth, catalog, orders, CMS, Cloudinary uploads)
apps/storefront  Next.js 14: storefront (EN/FR/AR, RTL) + Admin Dashboard at /admin
scripts/         homepage smoke test (stubbed WebGL)
documentation/   STATUS.md · API.md · ADMIN_GUIDE.md · PAYMENTS.md
FINAL-SETUP.md   ← exact first-run instructions (start here)
```
**Start with [FINAL-SETUP.md](FINAL-SETUP.md).** Then read [documentation/STATUS.md](documentation/STATUS.md) for what has and has not been verified at runtime.

Quick start (details in FINAL-SETUP.md):
```bash
npm install
cp apps/api/.env.example apps/api/.env && cp apps/storefront/.env.example apps/storefront/.env.local   # edit JWT_SECRET + admin seed credentials
docker compose up -d db
npm run db:generate && npm run db:init && npm run db:seed
npm run dev:api        # terminal 1  → http://localhost:4000/health
npm run dev:store      # terminal 2  → http://localhost:3000  (admin: /admin)
```
Needs your credentials/decisions: Cloudinary (images), an online payment provider (none chosen; COD works), real shipping fees, WhatsApp number, legal texts, product data/photography. All are entered in the Admin Dashboard or `.env`.
