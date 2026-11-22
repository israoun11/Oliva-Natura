# API summary (base http://localhost:4000, also proxied at /api by the storefront)
Money = integers in minor units (TND millimes ×1000, EUR cents ×100). Bilingual fields = `{en, fr, ar}`.
**Public:** GET /api/products?collection=&sort=price_asc|price_desc&q= · /api/products/:slug · /api/products/:slug/related · /api/collections · /api/pages/:slug · /api/articles[/:slug] · /api/settings/public · POST /api/contact · /api/newsletter · /api/whatsapp/link
**Orders:** GET /api/orders/config · POST /api/orders (COD; idempotencyKey; items[{productId,variantId?,quantity}]; links to the customer when signed in) · GET /api/orders/:number?email=
**Auth:** POST /api/auth/admin/login · /api/auth/customer/register · /api/auth/customer/login · /api/auth/logout (httpOnly cookies)
**Customer (cookie):** /api/me (GET/PUT) · /me/password · /me/addresses (CRUD) · /me/wishlist (GET, PUT/DELETE :productId) · /me/orders[/:number]
**Admin (cookie + role):** /api/admin/me, dashboard, products (+ /:id, images, variants, stock, movements), collections, categories, suppliers, batches, orders (PATCH), customers (+/:id), messages, subscribers, pages/:slug (PUT), articles, settings/:key, users, audit, media (POST multipart, GET, PUT /:id/replace, PATCH /:id, DELETE /:id, GET /status)
