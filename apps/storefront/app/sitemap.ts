import type { MetadataRoute } from "next";
import { get } from "@/lib/api";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.SITE_URL || "http://localhost:3000";
  const [products, articles, cols] = await Promise.all([get<any[]>("/api/products"), get<any[]>("/api/articles"), get<any[]>("/api/collections")]);
  const fixed = ["", "/products", "/our-story", "/from-our-land", "/our-philosophy", "/journal", "/contact", "/privacy", "/terms", "/shipping", "/returns", "/cookies"];
  return [...fixed.map(p => ({ url: base + p })), ...(cols || []).map(c => ({ url: `${base}/products?collection=${c.slug}` })), ...(products || []).map(p => ({ url: `${base}/products/${p.slug}` })), ...(articles || []).map(a => ({ url: `${base}/journal/${a.slug}`, lastModified: a.publishedAt || undefined }))];
}
