import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { db } from "./db";

const secret = () => { const s = process.env.JWT_SECRET; if (!s || s.length < 16) throw new Error("JWT_SECRET missing or shorter than 16 characters"); return s; };
export type Claims = { sub: string; kind: "admin" | "customer"; role?: Role };

export function sign(c: Claims) { return jwt.sign(c, secret(), { expiresIn: "7d" }); }
export function setCookie(res: Response, name: string, token: string) {
  res.cookie(name, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 7 * 864e5, path: "/" });
}
export function read(req: Request, name: string): Claims | null {
  const t = req.cookies?.[name]; if (!t) return null;
  try { return jwt.verify(t, secret()) as Claims; } catch { return null; }
}
declare global { namespace Express { interface Request { admin?: Claims; customer?: Claims } } }

export type Perm = "catalog" | "orders" | "content" | "settings" | "users" | "customers";
const matrix: Record<Role, Perm[]> = {
  SUPER_ADMIN: ["catalog", "orders", "content", "settings", "users", "customers"],
  STORE_MANAGER: ["catalog", "orders", "customers", "settings"],
  CONTENT_EDITOR: ["content"],
  ORDER_MANAGER: ["orders", "customers"],
};
export const can = (role: Role, perm: Perm) => matrix[role].includes(perm);

// Admin and customer sessions are re-checked against the database on EVERY request, so disabling an
// account or changing a role takes effect immediately (a still-valid JWT is not enough).
async function loadAdmin(req: Request) {
  const c = read(req, "oliva_admin");
  if (!c || c.kind !== "admin") return null;
  const u = await db.adminUser.findUnique({ where: { id: c.sub }, select: { id: true, role: true, active: true } });
  return u && u.active ? u : null;
}
export const requireAdminAny = (...perms: Perm[]) => (req: Request, res: Response, next: NextFunction) => {
  loadAdmin(req).then(u => {
    if (!u) return res.status(401).json({ error: "Unauthorized" });
    if (!perms.some(p => can(u.role, p))) return res.status(403).json({ error: "Forbidden" });
    req.admin = { sub: u.id, kind: "admin", role: u.role }; next();
  }).catch(next);
};
export const requireAdmin = (perm: Perm) => requireAdminAny(perm);

export const readCustomer = (req: Request): Claims | null => { const c = read(req, "oliva_customer"); return c && c.kind === "customer" ? c : null; };
export const requireCustomer = (req: Request, res: Response, next: NextFunction) => {
  const c = readCustomer(req); if (!c) return res.status(401).json({ error: "Unauthorized" });
  db.customer.findUnique({ where: { id: c.sub }, select: { id: true } }).then(u => {
    if (!u) return res.status(401).json({ error: "Unauthorized" });
    req.customer = c; next();
  }).catch(next);
};
