import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "../db";
import { readCustomer } from "../auth";
import { computeTotals, effectivePrice, ShippingUnavailable } from "../lib/pricing";
export const orderRoutes = Router();
const wrap = (f: any) => (q: any, r: any, n: any) => Promise.resolve(f(q, r, n)).catch(n);
class HttpErr extends Error { constructor(public status: number, m: string) { super(m); } }

const schema = z.object({
  idempotencyKey: z.string().min(16).max(100),
  email: z.string().email(), phone: z.string().max(40).optional(), notes: z.string().max(1000).optional(),
  address: z.object({ name: z.string().min(1), line1: z.string().min(1), line2: z.string().optional(), city: z.string().min(1), region: z.string().optional(), postalCode: z.string().optional(), country: z.string().length(2).transform(s => s.toUpperCase()) }),
  paymentMethod: z.enum(["COD"]),  // online providers are added via lib/payments.ts once configured; WhatsApp orders go through /api/whatsapp/link
  items: z.array(z.object({ productId: z.string(), variantId: z.string().optional(), quantity: z.number().int().min(1).max(99) })).min(1).max(50),
});

// Public checkout config: which payment methods and countries are really available.
orderRoutes.get("/config", wrap(async (_q: any, r: any) => {
  const [ship, pay] = await Promise.all([db.siteSetting.findUnique({ where: { key: "shipping" } }), db.siteSetting.findUnique({ where: { key: "payments" } })]);
  const rules = (ship?.value as any) || {};
  r.json({ countries: Object.entries(rules).filter(([, v]: any) => v?.enabled).map(([k]) => k), cod: (pay?.value as any)?.cod?.enabled !== false });
}));

orderRoutes.post("/", wrap(async (q: any, r: any) => {
  const d = schema.parse(q.body);
  const existing = await db.order.findUnique({ where: { idempotencyKey: d.idempotencyKey }, include: { items: true } });
  if (existing) return r.status(200).json(existing);

  const country = d.address.country, currency: "TND" | "EUR" = country === "TN" ? "TND" : "EUR";
  const [shipping, pay] = await Promise.all([db.siteSetting.findUnique({ where: { key: "shipping" } }), db.siteSetting.findUnique({ where: { key: "payments" } })]);
  const rules = (shipping?.value as any) || {};
  const rule = rules[country] ?? rules["*"];
  if ((pay?.value as any)?.cod?.enabled === false) throw new HttpErr(400, "Cash on delivery is currently disabled");
  if (country !== "TN") throw new HttpErr(400, "Cash on delivery is only available in Tunisia");
  const customerId = readCustomer(q)?.sub;

  try {
    const order = await db.$transaction(async tx => {
      const products = await tx.product.findMany({ where: { id: { in: d.items.map(i => i.productId) }, published: true }, include: { variants: true } });
      const lines = d.items.map(i => {
        const p = products.find(x => x.id === i.productId); if (!p) throw new HttpErr(400, "Product unavailable");
        if (!p.shippingEligible) throw new HttpErr(400, `${p.slug} cannot be shipped`);
        const v = i.variantId ? p.variants.find(x => x.id === i.variantId) : undefined;
        if (i.variantId && !v) throw new HttpErr(400, "Variant unavailable");
        if (!v && p.variants.length) throw new HttpErr(400, `Select a variant for ${p.slug}`);
        const base = effectivePrice(p, currency);
        const unitPrice = v?.priceTnd != null && currency === "TND" ? v.priceTnd : base;
        if (unitPrice == null || unitPrice <= 0) throw new HttpErr(400, `No ${currency} price for ${p.slug}`);
        return { p, v, unitPrice, quantity: i.quantity };
      });
      const totals = computeTotals(lines, rule);
      for (const l of lines) { // atomic stock guard: stock can never go negative
        const res = l.v
          ? await tx.productVariant.updateMany({ where: { id: l.v.id, stock: { gte: l.quantity } }, data: { stock: { decrement: l.quantity } } })
          : await tx.product.updateMany({ where: { id: l.p.id, stock: { gte: l.quantity } }, data: { stock: { decrement: l.quantity } } });
        if (res.count === 0) throw new HttpErr(409, `Insufficient stock: ${l.p.slug}`);
      }
      const number = "ON-" + new Date().toISOString().slice(2, 10).replace(/-/g, "") + "-" + Math.random().toString(36).slice(2, 8).toUpperCase();
      const o = await tx.order.create({ data: {
        number, idempotencyKey: d.idempotencyKey, customerId, email: d.email, phone: d.phone, notes: d.notes,
        shippingAddress: d.address, country, currency, ...totals, paymentMethod: "COD",
        items: { create: lines.map(l => ({ productId: l.p.id, variantId: l.v?.id, nameSnapshot: (l.p.name as any).en + (l.v ? " — " + (l.v.label as any).en : ""), unitPrice: l.unitPrice, quantity: l.quantity })) },
        payments: { create: [{ provider: "cod", status: "PENDING", amount: totals.total, currency }] },
        shipments: { create: [{}] },
      }, include: { items: true } });
      await tx.inventoryMovement.createMany({ data: lines.map(l => ({ productId: l.p.id, variantId: l.v?.id, delta: -l.quantity, reason: "ORDER", ref: o.number })) });
      return o;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    r.status(201).json(order);
  } catch (e: any) {
    if (e instanceof ShippingUnavailable) throw new HttpErr(400, e.message);
    if (e?.code === "P2002") { const o = await db.order.findUnique({ where: { idempotencyKey: d.idempotencyKey }, include: { items: true } }); if (o) return r.json(o); }
    throw e;
  }
}));
orderRoutes.get("/:number", wrap(async (q: any, r: any) => { // guest confirmation: order number + matching email
  const o = await db.order.findUnique({ where: { number: q.params.number }, include: { items: true } });
  if (!o || o.email.toLowerCase() !== String(q.query.email || "").toLowerCase()) return r.status(404).json({ error: "Not found" });
  r.json(o);
}));
