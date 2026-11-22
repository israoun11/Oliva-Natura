// Server components call the API directly; browsers call the same-origin /api proxy (see next.config.js).
export const API = typeof window === "undefined" ? process.env.API_URL || "http://localhost:4000" : "";
export type L = { en: string; fr: string; ar?: string };
export type Lang = "en" | "fr" | "ar";
export const t = (v: any, lang: string = "en") => (v && (v[lang] || v.en)) || "";
export async function get<T>(path: string, init?: RequestInit): Promise<T | null> {
  try { const r = await fetch(API + path, { cache: "no-store", ...init }); return r.ok ? await r.json() : null; } catch { return null; }
}
export const fmt = (minor: number, cur = "TND") => (minor / (cur === "TND" ? 1000 : 100)).toFixed(cur === "TND" ? 3 : 2) + " " + cur;
// Cloudinary delivery transform (f_auto,q_auto, width). Non-Cloudinary URLs pass through unchanged.
export const img = (url: string | null | undefined, w = 900) => url && url.includes("/image/upload/") ? url.replace("/image/upload/", `/image/upload/f_auto,q_auto,w_${w}/`) : url || "";
export type Item = { productId: string; variantId?: string; slug: string; name: string; unitPrice: number; quantity: number; image?: string };
export const cart = {
  read(): Item[] { try { return JSON.parse(localStorage.getItem("oliva_cart") || "[]"); } catch { return []; } },
  write(i: Item[]) { localStorage.setItem("oliva_cart", JSON.stringify(i)); window.dispatchEvent(new Event("cart")); },
  add(it: Item) { const c = cart.read(), f = c.find(x => x.productId === it.productId && x.variantId === it.variantId); f ? (f.quantity += it.quantity) : c.push(it); cart.write(c); },
};
export async function call<T = any>(method: string, path: string, body?: any): Promise<T> {
  const r = await fetch(API + path, { method, credentials: "include", headers: body && !(body instanceof FormData) ? { "Content-Type": "application/json" } : undefined, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error(j?.issues ? j.issues.map((i: any) => `${i.path.join(".")}: ${i.message}`).join("; ") : j?.error || r.statusText);
  return j as T;
}
