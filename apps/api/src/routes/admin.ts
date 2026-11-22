import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "../db";
import { requireAdmin, requireAdminAny, can } from "../auth";
import { audit } from "../lib/audit";
export const adminRoutes = Router();
const wrap = (f: any) => (q: any, r: any, n: any) => Promise.resolve(f(q, r, n)).catch(n);
const loc = z.object({ en: z.string().default(""), fr: z.string().default(""), ar: z.string().default("") });
const safeLink = z.string().max(500).refine(v => v === "" || /^(\/|https?:\/\/|mailto:|tel:|#)/i.test(v), "Link must start with /, http(s)://, mailto: or tel:");

// ---- Session info for the admin UI (any admin role)
adminRoutes.get("/me", requireAdminAny("content", "catalog", "orders", "settings", "users", "customers"), wrap(async (q: any, r: any) => {
  const u = await db.adminUser.findUniqueOrThrow({ where: { id: q.admin.sub }, select: { id: true, name: true, email: true, role: true } });
  r.json({ ...u, perms: ["catalog", "orders", "content", "settings", "users", "customers"].filter(p => can(u.role, p as any)) });
}));

// ---- Dashboard
adminRoutes.get("/dashboard", requireAdmin("orders"), wrap(async (_q: any, r: any) => {
  const valid = { status: { notIn: ["CANCELLED", "REFUNDED"] as any } };
  const [orders, pending, completed, byCurrency, byCountry, low, customers, top, paid] = await Promise.all([
    db.order.count(), db.order.count({ where: { status: "PENDING" } }), db.order.count({ where: { status: "DELIVERED" } }),
    db.order.groupBy({ by: ["currency"], where: valid, _sum: { total: true } }),
    db.order.groupBy({ by: ["country"], where: valid, _sum: { total: true }, _count: true }),
    db.$queryRaw`SELECT id, slug, stock, "lowStockAt" FROM "Product" WHERE published = true AND stock <= "lowStockAt" ORDER BY stock ASC LIMIT 20`,
    db.customer.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, name: true, email: true, createdAt: true } }),
    db.orderItem.groupBy({ by: ["productId", "nameSnapshot"], _sum: { quantity: true }, orderBy: { _sum: { quantity: "desc" } }, take: 5 }),
    db.order.groupBy({ by: ["currency"], where: { paymentStatus: "PAID", status: { notIn: ["CANCELLED", "REFUNDED"] as any } }, _sum: { total: true } }),
  ]);
  const [products, recentOrders, series, recentAudit] = await Promise.all([
    db.product.count(),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 8, select: { id: true, number: true, email: true, total: true, currency: true, status: true, createdAt: true } }),
    db.$queryRaw`SELECT to_char(date_trunc('day',"createdAt"),'YYYY-MM-DD') AS day, currency, SUM(total)::int AS total, COUNT(*)::int AS orders FROM "Order" WHERE "createdAt" > now() - interval '30 days' AND status::text NOT IN ('CANCELLED','REFUNDED') GROUP BY 1,2 ORDER BY 1`,
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { admin: { select: { name: true } } } }),
  ]);
  r.json({ orders, pending, completed, products, revenueByCurrency: byCurrency, paidByCurrency: paid, salesByCountry: byCountry, lowStock: low, recentCustomers: customers, bestsellers: top, recentOrders, salesSeries: series, recentAudit });
}));

// ---- Products CRUD
const productBody = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/), sku: z.string().min(1), name: loc, description: loc, specs: z.record(z.any()).optional(),
  volumeMl: z.number().int().positive().nullable().optional(), salePriceTnd: z.number().int().min(0).nullable().optional(), salePriceEur: z.number().int().min(0).nullable().optional(), shippingEligible: z.boolean().default(true), priceTnd: z.number().int().min(0), priceEur: z.number().int().min(0).nullable().optional(),
  lowStockAt: z.number().int().min(0).default(5), published: z.boolean().default(false), seo: z.record(z.any()).optional(),
  categoryId: z.string().nullable().optional(), collectionId: z.string().nullable().optional(),
});
// Business rules enforced on the server: never publish a product without a real name and price; sale price must be a real discount.
function checkProduct(d: any, existing?: any) {
  const m = { ...(existing || {}), ...d };
  const bad = (msg: string) => Object.assign(new Error(msg), { status: 400 });
  if (m.salePriceTnd != null && m.salePriceTnd > 0 && m.salePriceTnd >= m.priceTnd) throw bad("Sale price (TND) must be lower than the regular price");
  if (m.salePriceEur != null && m.salePriceEur > 0 && m.priceEur != null && m.salePriceEur >= m.priceEur) throw bad("Sale price (EUR) must be lower than the regular price");
  if (m.published) {
    const n = m.name || {};
    if (!(n.en || n.fr || n.ar)) throw bad("Cannot publish: add a product name");
    if (!(m.priceTnd > 0)) throw bad("Cannot publish: set a price greater than 0");
  }
}
adminRoutes.get("/products", requireAdmin("catalog"), wrap(async (_q: any, r: any) => r.json(await db.product.findMany({ include: { images: { orderBy: { sort: "asc" } }, collection: true, variants: true }, orderBy: { createdAt: "desc" } }))));
adminRoutes.post("/products", requireAdmin("catalog"), wrap(async (q: any, r: any) => {
  const data = productBody.parse(q.body); checkProduct(data);
  const p = await db.product.create({ data: data as any }); await audit(q.admin.sub, "create", "Product", p.id); r.status(201).json(p);
}));
adminRoutes.put("/products/:id", requireAdmin("catalog"), wrap(async (q: any, r: any) => {
  const data = productBody.partial().parse(q.body);
  const cur = await db.product.findUniqueOrThrow({ where: { id: q.params.id } }); checkProduct(data, cur);
  const p = await db.product.update({ where: { id: q.params.id }, data: data as any }); await audit(q.admin.sub, "update", "Product", p.id); r.json(p);
}));
adminRoutes.delete("/products/:id", requireAdmin("catalog"), wrap(async (q: any, r: any) => {
  const used = await db.orderItem.count({ where: { productId: q.params.id } });
  if (used) { await db.product.update({ where: { id: q.params.id }, data: { published: false } }); return r.json({ archived: true }); } // keep order history intact
  if (await db.productBatch.count({ where: { productId: q.params.id } })) return r.status(409).json({ error: "Remove this product's traceability batches first" });
  await db.$transaction([db.inventoryMovement.deleteMany({ where: { productId: q.params.id } }), db.product.delete({ where: { id: q.params.id } })]);
  await audit(q.admin.sub, "delete", "Product", q.params.id); r.json({ deleted: true });
}));
adminRoutes.post("/products/:id/stock", requireAdmin("catalog"), wrap(async (q: any, r: any) => {
  const { delta, reason } = z.object({ delta: z.number().int().refine(n => n !== 0), reason: z.string().min(1) }).parse(q.body);
  const out = await db.$transaction(async tx => {
    const res = await tx.product.updateMany({ where: { id: q.params.id, stock: { gte: delta < 0 ? -delta : 0 } }, data: { stock: { increment: delta } } });
    if (!res.count) throw Object.assign(new Error("Stock cannot go negative"), { status: 409 });
    await tx.inventoryMovement.create({ data: { productId: q.params.id, delta, reason, adminId: q.admin.sub } });
    return tx.product.findUnique({ where: { id: q.params.id } });
  });
  await audit(q.admin.sub, "stock", "Product", q.params.id, { delta, reason }); r.json(out);
}));
adminRoutes.get("/products/:id/movements", requireAdmin("catalog"), wrap(async (q: any, r: any) => r.json(await db.inventoryMovement.findMany({ where: { productId: q.params.id }, orderBy: { createdAt: "desc" }, take: 200 }))));

// ---- Orders
adminRoutes.get("/orders", requireAdmin("orders"), wrap(async (q: any, r: any) => {
  const term = String(q.query.q || "").trim(), where: any = {};
  if (q.query.status) where.status = String(q.query.status);
  if (q.query.payment) where.paymentStatus = String(q.query.payment);
  if (term) where.OR = [{ number: { contains: term, mode: "insensitive" } }, { email: { contains: term, mode: "insensitive" } }, { phone: { contains: term } }];
  r.json(await db.order.findMany({ where, orderBy: { createdAt: "desc" }, take: 200, include: { items: true, shipments: true } }));
}));
adminRoutes.get("/orders/:id", requireAdmin("orders"), wrap(async (q: any, r: any) => r.json(await db.order.findUniqueOrThrow({ where: { id: q.params.id }, include: { items: true, payments: true, shipments: true, customer: true } }))));
const allowed: Record<string, string[]> = { PENDING: ["CONFIRMED", "CANCELLED"], CONFIRMED: ["PROCESSING", "CANCELLED"], PROCESSING: ["SHIPPED", "CANCELLED"], SHIPPED: ["DELIVERED"], DELIVERED: ["REFUNDED"], CANCELLED: [], REFUNDED: [] };
adminRoutes.patch("/orders/:id", requireAdmin("orders"), wrap(async (q: any, r: any) => {
  const d = z.object({ status: z.enum(["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]).optional(), internalNotes: z.string().max(5000).optional(), paymentStatus: z.enum(["UNPAID", "PENDING", "PAID", "FAILED", "REFUNDED"]).optional(), carrier: z.string().optional(), trackingNumber: z.string().optional() }).parse(q.body);
  const out = await db.$transaction(async tx => {
    const o = await tx.order.findUniqueOrThrow({ where: { id: q.params.id }, include: { items: true } });
    if (d.paymentStatus === "PAID" && ["CANCELLED", "REFUNDED"].includes(d.status ?? o.status)) throw Object.assign(new Error("Cannot mark payment received on a cancelled or refunded order"), { status: 409 });
    if (d.status) {
      if (!allowed[o.status].includes(d.status)) throw Object.assign(new Error(`Cannot move ${o.status} -> ${d.status}`), { status: 409 });
      // Compare-and-set on the current status: two admins (or a double click) can never both cancel/restock the same order.
      const claimed = await tx.order.updateMany({ where: { id: o.id, status: o.status }, data: { status: d.status } });
      if (claimed.count !== 1) throw Object.assign(new Error("Order was changed by someone else — reload and retry"), { status: 409 });
      if (d.status === "CANCELLED") for (const i of o.items) { // return stock (variant stock if the line had a variant)
        if (i.variantId) await tx.productVariant.update({ where: { id: i.variantId }, data: { stock: { increment: i.quantity } } });
        else await tx.product.update({ where: { id: i.productId }, data: { stock: { increment: i.quantity } } });
        await tx.inventoryMovement.create({ data: { productId: i.productId, variantId: i.variantId, delta: i.quantity, reason: "CANCEL", ref: o.number, adminId: q.admin.sub } });
      }
      if (d.status === "CANCELLED") await tx.payment.updateMany({ where: { orderId: o.id, status: "PENDING" }, data: { status: "FAILED" } });
      if (d.status === "REFUNDED") { // money returned: reflect it on the payment records
        d.paymentStatus = "REFUNDED";
        await tx.payment.updateMany({ where: { orderId: o.id, status: "PAID" }, data: { status: "REFUNDED" } });
      }
      if (d.status === "DELIVERED" && o.paymentMethod === "COD") { // cash collected on delivery
        d.paymentStatus = d.paymentStatus ?? "PAID";
        await tx.payment.updateMany({ where: { orderId: o.id, provider: "cod" }, data: { status: "PAID" } });
      }
    }
    if (d.carrier !== undefined || d.trackingNumber !== undefined || d.status === "SHIPPED" || d.status === "DELIVERED") {
      const s = await tx.shipment.findFirst({ where: { orderId: o.id } });
      const status = d.status === "SHIPPED" ? "IN_TRANSIT" : d.status === "DELIVERED" ? "DELIVERED" : undefined;
      if (s) await tx.shipment.update({ where: { id: s.id }, data: { carrier: d.carrier, trackingNumber: d.trackingNumber, status } as any });
    }
    if (d.paymentStatus === "PAID") await tx.payment.updateMany({ where: { orderId: o.id, status: "PENDING" }, data: { status: "PAID" } });
    return tx.order.update({ where: { id: o.id }, data: { internalNotes: d.internalNotes, paymentStatus: d.paymentStatus } });
  });
  await audit(q.admin.sub, "order.update", "Order", out.id, d); r.json(out);
}));

// ---- Customers, messages, subscribers
adminRoutes.get("/customers/:id", requireAdmin("customers"), wrap(async (q: any, r: any) => {
  const c = await db.customer.findUnique({ where: { id: q.params.id }, select: { id: true, name: true, email: true, phone: true, locale: true, createdAt: true, addresses: true, orders: { orderBy: { createdAt: "desc" }, include: { items: true } } } });
  c ? r.json(c) : r.status(404).json({ error: "Not found" });
}));
adminRoutes.get("/customers", requireAdmin("customers"), wrap(async (q: any, r: any) => r.json(await db.customer.findMany({ where: q.query.q ? { OR: [{ name: { contains: String(q.query.q), mode: "insensitive" } }, { email: { contains: String(q.query.q), mode: "insensitive" } }] } : {}, select: { id: true, name: true, email: true, phone: true, createdAt: true, _count: { select: { orders: true } } }, orderBy: { createdAt: "desc" }, take: 300 }))));
adminRoutes.get("/messages", requireAdmin("content"), wrap(async (_q: any, r: any) => r.json(await db.contactMessage.findMany({ orderBy: { createdAt: "desc" } }))));
adminRoutes.patch("/messages/:id", requireAdmin("content"), wrap(async (q: any, r: any) => r.json(await db.contactMessage.update({ where: { id: q.params.id }, data: { read: z.object({ read: z.boolean() }).parse(q.body).read } }))));
adminRoutes.get("/subscribers", requireAdmin("content"), wrap(async (_q: any, r: any) => r.json(await db.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" } }))));

// ---- CMS: pages + sections, articles, settings
adminRoutes.get("/pages", requireAdmin("content"), wrap(async (_q: any, r: any) => r.json(await db.page.findMany({ include: { sections: { orderBy: { sort: "asc" } } } }))));
const PAGE_SLUGS = ["home", "our-story", "from-our-land", "our-philosophy", "privacy", "terms", "shipping", "returns", "cookies"];
adminRoutes.put("/pages/:slug", requireAdmin("content"), wrap(async (q: any, r: any) => {
  if (!PAGE_SLUGS.includes(q.params.slug)) return r.status(400).json({ error: "Unknown page" });
  const d = z.object({ title: loc, published: z.boolean(), seo: z.record(z.any()).optional(),
    sections: z.array(z.object({ kind: z.enum(["hero", "text", "image-text", "quote", "cta"]), content: z.object({ heading: loc.optional(), body: loc.optional(), image: z.string().max(600).optional(), buttonLabel: loc.optional(), buttonLink: safeLink.optional() }), visible: z.boolean().default(true) })).max(40) }).parse(q.body);
  const page = await db.$transaction(async tx => {
    const p = await tx.page.upsert({ where: { slug: q.params.slug }, update: { title: d.title, published: d.published, seo: d.seo }, create: { slug: q.params.slug, title: d.title, published: d.published, seo: d.seo } });
    await tx.pageSection.deleteMany({ where: { pageId: p.id } }); // array order = display order
    await tx.pageSection.createMany({ data: d.sections.map((s, i) => ({ pageId: p.id, kind: s.kind, content: s.content, visible: s.visible, sort: i })) });
    return p;
  });
  await audit(q.admin.sub, "page.save", "Page", page.id); r.json(page);
}));
const articleBody = z.object({ slug: z.string().regex(/^[a-z0-9-]+$/), title: loc, excerpt: loc.optional(), body: loc, category: z.string().optional(), coverUrl: z.string().url().nullable().optional().or(z.literal("")), seo: z.record(z.any()).optional(), published: z.boolean().default(false) });
adminRoutes.get("/articles", requireAdmin("content"), wrap(async (_q: any, r: any) => r.json(await db.article.findMany({ orderBy: { publishedAt: "desc" } }))));
adminRoutes.post("/articles", requireAdmin("content"), wrap(async (q: any, r: any) => { const d = articleBody.parse(q.body); r.status(201).json(await db.article.create({ data: { ...d, publishedAt: d.published ? new Date() : null } as any })); }));
adminRoutes.put("/articles/:id", requireAdmin("content"), wrap(async (q: any, r: any) => { const d = articleBody.partial().parse(q.body); r.json(await db.article.update({ where: { id: q.params.id }, data: { ...d, ...(d.published ? { publishedAt: new Date() } : {}) } as any })); }));
adminRoutes.delete("/articles/:id", requireAdmin("content"), wrap(async (q: any, r: any) => { await db.article.delete({ where: { id: q.params.id } }); r.json({ deleted: true }); }));
adminRoutes.get("/settings", requireAdmin("settings"), wrap(async (_q: any, r: any) => r.json(await db.siteSetting.findMany())));
const settingSchemas: Record<string, z.ZodTypeAny> = {
  site: z.object({ brand: z.string().max(120).optional(), email: z.string().max(200).optional(), phone: z.string().max(60).optional(), address: z.string().max(500).optional(), businessInfo: z.string().max(1000).optional(), whatsappNumber: z.string().max(30).regex(/^(\+?[0-9 ()-]*)$/, "Digits, spaces and + only").optional() }).passthrough(),
  social: z.record(safeLink),
  navigation: z.object({ items: z.array(z.object({ label: loc, href: safeLink })).max(12) }),
  footer: z.object({ tagline: loc.optional(), copyright: loc.optional() }),
  shipping: z.record(z.object({ enabled: z.boolean(), fee: z.number().int().min(0), freeOver: z.number().int().min(0).nullable() })).refine(o => Object.keys(o).every(k => k === "*" || /^[A-Z]{2}$/.test(k)), "Country keys must be 2-letter ISO codes or *"),
  payments: z.object({ cod: z.object({ enabled: z.boolean() }) }).passthrough(),
  languages: z.object({ enabled: z.array(z.enum(["en", "fr", "ar"])).min(1), default: z.enum(["en", "fr", "ar"]) }).refine(v => v.enabled.includes(v.default), "Default language must be enabled"),
};
adminRoutes.put("/settings/:key", requireAdmin("settings"), wrap(async (q: any, r: any) => {
  const schema = settingSchemas[q.params.key];
  if (!schema) return r.status(400).json({ error: "Unknown setting" });
  const v = schema.parse(q.body);
  const s = await db.siteSetting.upsert({ where: { key: q.params.key }, update: { value: v }, create: { key: q.params.key, value: v } });
  await audit(q.admin.sub, "setting.save", "SiteSetting", s.key); r.json(s);
}));

// ---- Admin users (super admin only: "users" perm)
adminRoutes.get("/users", requireAdmin("users"), wrap(async (_q: any, r: any) => r.json(await db.adminUser.findMany({ select: { id: true, email: true, name: true, role: true, active: true } }))));
adminRoutes.post("/users", requireAdmin("users"), wrap(async (q: any, r: any) => {
  const d = z.object({ email: z.string().email(), name: z.string().min(1), password: z.string().min(12), role: z.enum(["SUPER_ADMIN", "STORE_MANAGER", "CONTENT_EDITOR", "ORDER_MANAGER"]) }).parse(q.body);
  const u = await db.adminUser.create({ data: { email: d.email.toLowerCase(), name: d.name, role: d.role, passwordHash: await bcrypt.hash(d.password, 12) } });
  await audit(q.admin.sub, "user.create", "AdminUser", u.id); r.status(201).json({ id: u.id, email: u.email, role: u.role });
}));
adminRoutes.put("/users/:id", requireAdmin("users"), wrap(async (q: any, r: any) => {
  const d = z.object({ name: z.string().min(1), role: z.enum(["SUPER_ADMIN", "STORE_MANAGER", "CONTENT_EDITOR", "ORDER_MANAGER"]), active: z.boolean(), password: z.string().min(12).optional() }).partial().parse(q.body);
  if (q.params.id === q.admin.sub && (d.active === false || (d.role && d.role !== "SUPER_ADMIN"))) return r.status(400).json({ error: "You cannot demote or disable your own account" });
  const { password, ...rest } = d;
  const u = await db.adminUser.update({ where: { id: q.params.id }, data: { ...rest, ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {}) } });
  await audit(q.admin.sub, "user.update", "AdminUser", u.id, { ...rest, passwordChanged: !!password }); r.json({ id: u.id, email: u.email, role: u.role, active: u.active });
}));
adminRoutes.get("/audit", requireAdmin("users"), wrap(async (_q: any, r: any) => r.json(await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 300, include: { admin: { select: { name: true, email: true } } } }))));
