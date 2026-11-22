import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { requireAdmin } from "../auth";
import { audit } from "../lib/audit";
export const catalogRoutes = Router();
const wrap = (f: any) => (q: any, r: any, n: any) => Promise.resolve(f(q, r, n)).catch(n);
const loc = z.object({ en: z.string().default(""), fr: z.string().default(""), ar: z.string().default("") });
const date = z.string().nullable().optional().transform(v => (v ? new Date(v) : null));

// Generic admin CRUD for simple catalog entities.
function crud(path: string, model: string, schema: z.ZodObject<any>, orderBy: any, include?: any) {
  const m = () => (db as any)[model];
  catalogRoutes.get(path, requireAdmin("catalog"), wrap(async (_q: any, r: any) => r.json(await m().findMany({ orderBy, include }))));
  catalogRoutes.post(path, requireAdmin("catalog"), wrap(async (q: any, r: any) => {
    const row = await m().create({ data: schema.parse(q.body) }); await audit(q.admin.sub, "create", model, row.id); r.status(201).json(row);
  }));
  catalogRoutes.put(`${path}/:id`, requireAdmin("catalog"), wrap(async (q: any, r: any) => {
    const row = await m().update({ where: { id: q.params.id }, data: schema.partial().parse(q.body) }); await audit(q.admin.sub, "update", model, row.id); r.json(row);
  }));
  catalogRoutes.delete(`${path}/:id`, requireAdmin("catalog"), wrap(async (q: any, r: any) => {
    try { await m().delete({ where: { id: q.params.id } }); } catch (e: any) {
      if (e.code === "P2003" || e.code === "P2014") return r.status(409).json({ error: "Still in use — remove or reassign linked records first" }); throw e; }
    await audit(q.admin.sub, "delete", model, q.params.id); r.json({ deleted: true });
  }));
}
const slug = z.string().regex(/^[a-z0-9-]+$/, "lowercase letters, numbers and hyphens only");
crud("/collections", "collection", z.object({ slug, name: loc, description: loc.nullable().optional(), imageUrl: z.string().url().nullable().optional().or(z.literal("")), sort: z.number().int().default(0), published: z.boolean().default(true) }), { sort: "asc" });
crud("/categories", "category", z.object({ slug, name: loc, sort: z.number().int().default(0) }), { sort: "asc" });
crud("/suppliers", "supplier", z.object({ name: z.string().min(1), contact: z.string().nullable().optional(), region: z.string().nullable().optional(), notes: z.string().nullable().optional() }), { name: "asc" });
crud("/batches", "productBatch", z.object({ productId: z.string(), supplierId: z.string().nullable().optional(), batchNumber: z.string().min(1), producer: z.string().nullable().optional(), origin: z.string().nullable().optional(), region: z.string().nullable().optional(), harvestDate: date, packagingDate: date, quantity: z.number().int().nullable().optional(), documents: z.array(z.string().url()).optional(), verified: z.boolean().default(false) }), { batchNumber: "asc" }, { product: { select: { slug: true, name: true } }, supplier: true });

// ---- Single product (full) + images + variants
catalogRoutes.get("/products/:id", requireAdmin("catalog"), wrap(async (q: any, r: any) => {
  const p = await db.product.findUnique({ where: { id: q.params.id }, include: { images: { orderBy: { sort: "asc" } }, variants: true, collection: true, category: true, batches: true, models: true } });
  p ? r.json(p) : r.status(404).json({ error: "Not found" });
}));
catalogRoutes.post("/products/:id/images", requireAdmin("catalog"), wrap(async (q: any, r: any) => {
  const { mediaId } = z.object({ mediaId: z.string() }).parse(q.body);
  const m = await db.mediaAsset.findUniqueOrThrow({ where: { id: mediaId } });
  const n = await db.productImage.count({ where: { productId: q.params.id } });
  r.status(201).json(await db.productImage.create({ data: { productId: q.params.id, mediaId: m.id, url: m.url, alt: (m.alt as any) ?? undefined, sort: n } }));
}));
catalogRoutes.put("/products/:id/images/order", requireAdmin("catalog"), wrap(async (q: any, r: any) => {
  const { ids } = z.object({ ids: z.array(z.string()) }).parse(q.body);
  await db.$transaction(ids.map((id, i) => db.productImage.updateMany({ where: { id, productId: q.params.id }, data: { sort: i } })));
  r.json({ ok: true });
}));
catalogRoutes.delete("/products/:id/images/:imageId", requireAdmin("catalog"), wrap(async (q: any, r: any) => {
  await db.productImage.deleteMany({ where: { id: q.params.imageId, productId: q.params.id } }); r.json({ deleted: true }); // detaches only; the media file stays in the library
}));
const variantBody = z.object({ label: loc, priceTnd: z.number().int().min(0).nullable().optional(), stock: z.number().int().min(0).default(0) });
catalogRoutes.post("/products/:id/variants", requireAdmin("catalog"), wrap(async (q: any, r: any) =>
  r.status(201).json(await db.productVariant.create({ data: { ...variantBody.parse(q.body), productId: q.params.id } as any }))));
catalogRoutes.put("/variants/:vid", requireAdmin("catalog"), wrap(async (q: any, r: any) => {
  const { stock, ...rest } = variantBody.partial().parse(q.body); // stock is changed through the audited stock endpoint
  r.json(await db.productVariant.update({ where: { id: q.params.vid }, data: rest as any }));
}));
catalogRoutes.delete("/variants/:vid", requireAdmin("catalog"), wrap(async (q: any, r: any) => {
  if (await db.orderItem.count({ where: { variantId: q.params.vid } })) return r.status(409).json({ error: "Variant has orders; set stock to 0 instead" });
  await db.productVariant.delete({ where: { id: q.params.vid } }); r.json({ deleted: true });
}));
catalogRoutes.post("/variants/:vid/stock", requireAdmin("catalog"), wrap(async (q: any, r: any) => {
  const { delta, reason } = z.object({ delta: z.number().int().refine(n => n !== 0), reason: z.string().min(1) }).parse(q.body);
  const out = await db.$transaction(async tx => {
    const v = await tx.productVariant.findUniqueOrThrow({ where: { id: q.params.vid } });
    const res = await tx.productVariant.updateMany({ where: { id: v.id, stock: { gte: delta < 0 ? -delta : 0 } }, data: { stock: { increment: delta } } });
    if (!res.count) throw Object.assign(new Error("Stock cannot go negative"), { status: 409 });
    await tx.inventoryMovement.create({ data: { productId: v.productId, variantId: v.id, delta, reason, adminId: q.admin.sub } });
    return tx.productVariant.findUnique({ where: { id: v.id } });
  });
  r.json(out);
}));
