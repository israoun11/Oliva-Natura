import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { whatsappLink, effectivePrice } from "../lib/pricing";
export const publicRoutes = Router();
const wrap = (f: any) => (q: any, r: any, n: any) => Promise.resolve(f(q, r, n)).catch(n);

const productSelect = { include: { images: { orderBy: { sort: "asc" as const } }, models: true, variants: true, collection: true, category: true } };
publicRoutes.get("/products", wrap(async (q: any, r: any) => {
  const where: any = { published: true };
  if (q.query.collection) where.collection = { slug: String(q.query.collection) };
  if (q.query.q) where.OR = [{ slug: { contains: String(q.query.q), mode: "insensitive" } }, { sku: { contains: String(q.query.q), mode: "insensitive" } }];
  const rows = await db.product.findMany({ where, orderBy: { createdAt: "desc" }, ...productSelect });
  const sort = q.query.sort;
  if (sort === "price_asc" || sort === "price_desc") { // sort by what the customer actually pays (sale price when valid)
    const price = (p: any) => effectivePrice(p, "TND") ?? 0, dir = sort === "price_asc" ? 1 : -1;
    rows.sort((a, b) => (price(a) - price(b)) * dir);
  }
  r.json(rows);
}));
publicRoutes.get("/products/:slug/related", wrap(async (q: any, r: any) => {
  const p = await db.product.findFirst({ where: { slug: q.params.slug }, select: { id: true, collectionId: true } });
  if (!p) return r.json([]);
  r.json(await db.product.findMany({ where: { published: true, id: { not: p.id }, ...(p.collectionId ? { collectionId: p.collectionId } : {}) }, take: 4, ...productSelect }));
publicRoutes.get("/products/:slug", wrap(async (q: any, r: any) => {
  const p = await db.product.findFirst({ where: { slug: q.params.slug, published: true }, include: { ...productSelect.include, batches: { where: { verified: true } } } });
  if (!p) return r.status(404).json({ error: "Not found" });
  r.json(p);
}));
publicRoutes.get("/collections", wrap(async (_q: any, r: any) => r.json(await db.collection.findMany({ where: { published: true }, orderBy: { sort: "asc" } }))));

}));
publicRoutes.get("/pages/:slug", wrap(async (q: any, r: any) => {
  const p = await db.page.findFirst({ where: { slug: q.params.slug, published: true }, include: { sections: { where: { visible: true }, orderBy: { sort: "asc" } } } });
  if (!p) return r.status(404).json({ error: "Not found" });
  r.json(p);
}));
publicRoutes.get("/articles", wrap(async (_q: any, r: any) => r.json(await db.article.findMany({ where: { published: true }, orderBy: { publishedAt: "desc" } }))));
publicRoutes.get("/articles/:slug", wrap(async (q: any, r: any) => {
  const a = await db.article.findFirst({ where: { slug: q.params.slug, published: true } });
  if (!a) return r.status(404).json({ error: "Not found" }); r.json(a);
}));
const PUBLIC_KEYS = ["site", "shipping", "navigation", "footer", "social", "languages", "payments"];
publicRoutes.get("/settings/public", wrap(async (_q: any, r: any) => {
  const rows = await db.siteSetting.findMany({ where: { key: { in: PUBLIC_KEYS } } });
  r.json(Object.fromEntries(rows.map(x => [x.key, x.value])));
}));
publicRoutes.post("/contact", wrap(async (q: any, r: any) => {
  const d = z.object({ name: z.string().min(1).max(120), email: z.string().email(), message: z.string().min(1).max(5000) }).parse(q.body);
  await db.contactMessage.create({ data: d }); r.status(201).json({ ok: true });
}));
publicRoutes.post("/newsletter", wrap(async (q: any, r: any) => {
  const d = z.object({ email: z.string().email(), locale: z.enum(["en", "fr", "ar"]).default("en") }).parse(q.body);
  await db.newsletterSubscriber.upsert({ where: { email: d.email }, update: {}, create: d }); r.status(201).json({ ok: true });
}));
// WhatsApp ordering: prices are taken from the DB, not the client.
publicRoutes.post("/whatsapp/link", wrap(async (q: any, r: any) => {
  const d = z.object({ locale: z.enum(["en", "fr", "ar"]).default("en"), currency: z.enum(["TND", "EUR"]).default("TND"), items: z.array(z.object({ productId: z.string(), quantity: z.number().int().min(1).max(99) })).min(1) }).parse(q.body);
  const setting = await db.siteSetting.findUnique({ where: { key: "site" } });
  const number = (setting?.value as any)?.whatsappNumber;
  if (!number) return r.status(409).json({ error: "WhatsApp number not configured (Admin > Settings > site.whatsappNumber)" });
  const ps = await db.product.findMany({ where: { id: { in: d.items.map(i => i.productId) }, published: true } });
  const div = d.currency === "TND" ? 1000 : 100; let total = 0;
  const lines = d.items.flatMap(i => { const p = ps.find(x => x.id === i.productId); if (!p) return [];
    const unit = effectivePrice(p, d.currency); if (unit == null) return [];
    total += unit * i.quantity; return [{ name: (p.name as any)[d.locale] ?? (p.name as any).en, quantity: i.quantity, price: (unit / div).toFixed(d.currency === "TND" ? 3 : 2) }]; });
  if (!lines.length) return r.status(400).json({ error: "No purchasable items" });
  r.json({ url: whatsappLink(number, lines, d.currency, (total / div).toFixed(d.currency === "TND" ? 3 : 2), d.locale) });
}));
