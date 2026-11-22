// Integration tests need a real PostgreSQL with migrations applied. Run with:
//   RUN_INTEGRATION=1 DATABASE_URL=... JWT_SECRET=... npm -w apps/api test
// NOT YET EXECUTED by the author (no database was available when written).
import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { db } from "../src/db";

const run = process.env.RUN_INTEGRATION ? describe : describe.skip;
run("checkout integration", () => {
  const app = createApp();
  let productId = "";
  beforeAll(async () => {
    await db.siteSetting.upsert({ where: { key: "shipping" }, update: { value: { TN: { enabled: true, fee: 7000, freeOver: null } } }, create: { key: "shipping", value: { TN: { enabled: true, fee: 7000, freeOver: null } } } });
    const p = await db.product.upsert({ where: { slug: "test-oil" }, update: { stock: 3, published: true, priceTnd: 20000 }, create: { slug: "test-oil", sku: "T-1", name: { en: "Test", fr: "Test", ar: "" }, description: { en: "", fr: "", ar: "" }, priceTnd: 20000, stock: 3, published: true } });
    productId = p.id;
  });
  const body = (key: string, qty: number) => ({ idempotencyKey: key, email: "a@b.co", paymentMethod: "COD", address: { name: "A", line1: "1 St", city: "Tunis", country: "TN" }, items: [{ productId, quantity: qty }] });
  it("creates an order with server-side prices and decrements stock", async () => {
    const r = await request(app).post("/api/orders").send({ ...body("k".repeat(20) + Date.now(), 2), total: 1 });
    expect(r.status).toBe(201); expect(r.body.subtotal).toBe(40000); expect(r.body.shippingFee).toBe(7000); expect(r.body.total).toBe(47000);
    expect((await db.product.findUnique({ where: { id: productId } }))!.stock).toBe(1);
  });
  it("is idempotent", async () => {
    const k = "idem".repeat(6) + Date.now();
    const a = await request(app).post("/api/orders").send(body(k, 1)); const b = await request(app).post("/api/orders").send(body(k, 1));
    expect(b.body.id).toBe(a.body.id);
  });
  it("refuses overselling", async () => { const r = await request(app).post("/api/orders").send(body("over".repeat(6) + Date.now(), 99)); expect(r.status).toBe(409); });
  it("blocks admin endpoints without admin cookie", async () => { expect((await request(app).get("/api/admin/orders")).status).toBe(401); });
});
