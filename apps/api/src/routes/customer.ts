import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "../db";
import { requireCustomer } from "../auth";
export const customerRoutes = Router();
customerRoutes.use(requireCustomer);
const wrap = (f: any) => (q: any, r: any, n: any) => Promise.resolve(f(q, r, n)).catch(n);
const me = (q: any) => q.customer.sub as string;

customerRoutes.get("/", wrap(async (q: any, r: any) => r.json(await db.customer.findUniqueOrThrow({ where: { id: me(q) }, select: { id: true, email: true, name: true, phone: true, locale: true, createdAt: true } }))));
customerRoutes.put("/", wrap(async (q: any, r: any) => {
  const d = z.object({ name: z.string().min(1).max(120), phone: z.string().max(40).nullable().optional(), locale: z.enum(["en", "fr", "ar"]) }).partial().parse(q.body);
  r.json(await db.customer.update({ where: { id: me(q) }, data: d, select: { id: true, email: true, name: true, phone: true, locale: true } }));
}));
customerRoutes.put("/password", wrap(async (q: any, r: any) => {
  const d = z.object({ current: z.string(), next: z.string().min(8).max(200) }).parse(q.body);
  const c = await db.customer.findUniqueOrThrow({ where: { id: me(q) } });
  if (!c.passwordHash || !(await bcrypt.compare(d.current, c.passwordHash))) return r.status(400).json({ error: "Current password is incorrect" });
  await db.customer.update({ where: { id: c.id }, data: { passwordHash: await bcrypt.hash(d.next, 12) } }); r.json({ ok: true });
}));
const addr = z.object({ name: z.string().max(120).optional(), phone: z.string().max(40).optional(), line1: z.string().min(1).max(200), line2: z.string().max(200).optional(), city: z.string().min(1).max(100), region: z.string().max(100).optional(), postalCode: z.string().max(20).optional(), country: z.string().length(2).transform(s => s.toUpperCase()), isDefault: z.boolean().default(false) });
customerRoutes.get("/addresses", wrap(async (q: any, r: any) => r.json(await db.address.findMany({ where: { customerId: me(q) }, orderBy: { isDefault: "desc" } }))));
customerRoutes.post("/addresses", wrap(async (q: any, r: any) => {
  const d = addr.parse(q.body);
  r.status(201).json(await db.$transaction(async tx => { if (d.isDefault) await tx.address.updateMany({ where: { customerId: me(q) }, data: { isDefault: false } }); return tx.address.create({ data: { ...d, customerId: me(q) } }); }));
}));
customerRoutes.put("/addresses/:id", wrap(async (q: any, r: any) => {
  const d = addr.parse(q.body);
  const out = await db.$transaction(async tx => {
    if (!(await tx.address.count({ where: { id: q.params.id, customerId: me(q) } }))) return null;
    if (d.isDefault) await tx.address.updateMany({ where: { customerId: me(q) }, data: { isDefault: false } });
    return tx.address.update({ where: { id: q.params.id }, data: d });
  });
  out ? r.json(out) : r.status(404).json({ error: "Not found" });
}));
customerRoutes.delete("/addresses/:id", wrap(async (q: any, r: any) => { await db.address.deleteMany({ where: { id: q.params.id, customerId: me(q) } }); r.json({ deleted: true }); }));
customerRoutes.get("/wishlist", wrap(async (q: any, r: any) =>
  r.json((await db.wishlistItem.findMany({ where: { customerId: me(q) }, include: { product: { include: { images: { orderBy: { sort: "asc" }, take: 1 } } } } })).filter(w => w.product.published).map(w => w.product))));
customerRoutes.put("/wishlist/:productId", wrap(async (q: any, r: any) => {
  if (!(await db.product.count({ where: { id: q.params.productId, published: true } }))) return r.status(404).json({ error: "Product not found" });
  await db.wishlistItem.upsert({ where: { customerId_productId: { customerId: me(q), productId: q.params.productId } }, update: {}, create: { customerId: me(q), productId: q.params.productId } }); r.json({ ok: true });
}));
customerRoutes.delete("/wishlist/:productId", wrap(async (q: any, r: any) => { await db.wishlistItem.deleteMany({ where: { customerId: me(q), productId: q.params.productId } }); r.json({ ok: true }); }));
customerRoutes.get("/orders", wrap(async (q: any, r: any) => r.json(await db.order.findMany({ where: { customerId: me(q) }, include: { items: true, shipments: true }, orderBy: { createdAt: "desc" } }))));
customerRoutes.get("/orders/:number", wrap(async (q: any, r: any) => {
  const o = await db.order.findFirst({ where: { number: q.params.number, customerId: me(q) }, include: { items: true, shipments: true, payments: { select: { provider: true, status: true } } } });
  o ? r.json(o) : r.status(404).json({ error: "Not found" });
}));
