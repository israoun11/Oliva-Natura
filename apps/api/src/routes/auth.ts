import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "../db";
import { sign, setCookie, readCustomer } from "../auth";
export const authRoutes = Router();
const wrap = (f: any) => (q: any, r: any, n: any) => Promise.resolve(f(q, r, n)).catch(n);
const creds = z.object({ email: z.string().email(), password: z.string().min(8).max(200) });

authRoutes.post("/admin/login", wrap(async (q: any, r: any) => {
  const { email, password } = creds.parse(q.body);
  const u = await db.adminUser.findUnique({ where: { email: email.toLowerCase() } });
  if (!u || !u.active || !(await bcrypt.compare(password, u.passwordHash))) return r.status(401).json({ error: "Invalid credentials" });
  setCookie(r, "oliva_admin", sign({ sub: u.id, kind: "admin", role: u.role })); r.json({ id: u.id, name: u.name, role: u.role });
}));
authRoutes.post("/customer/register", wrap(async (q: any, r: any) => {
  const d = creds.extend({ name: z.string().min(1).max(120) }).parse(q.body);
  const email = d.email.toLowerCase();
  if (await db.customer.findUnique({ where: { email } })) return r.status(409).json({ error: "Email already registered" });
  const c = await db.customer.create({ data: { email, name: d.name, passwordHash: await bcrypt.hash(d.password, 12) } });
  setCookie(r, "oliva_customer", sign({ sub: c.id, kind: "customer" })); r.status(201).json({ id: c.id, name: c.name });
}));
authRoutes.post("/customer/login", wrap(async (q: any, r: any) => {
  const { email, password } = creds.parse(q.body);
  const c = await db.customer.findUnique({ where: { email: email.toLowerCase() } });
  if (!c?.passwordHash || !(await bcrypt.compare(password, c.passwordHash))) return r.status(401).json({ error: "Invalid credentials" });
  setCookie(r, "oliva_customer", sign({ sub: c.id, kind: "customer" })); r.json({ id: c.id, name: c.name });
}));
// Always 200: lets the storefront ask "am I signed in?" without 401 errors in the browser console.
authRoutes.get("/session", wrap(async (q: any, r: any) => {
  const c = readCustomer(q); if (!c) return r.json({ customer: null });
  r.json({ customer: await db.customer.findUnique({ where: { id: c.sub }, select: { id: true, name: true, email: true, phone: true } }) });
}));
authRoutes.post("/logout", (_q, r) => { r.clearCookie("oliva_admin"); r.clearCookie("oliva_customer"); r.json({ ok: true }); });
