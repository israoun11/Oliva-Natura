"use client";
import { useEffect, useState } from "react";
import { call, cart } from "@/lib/api";
import { tr } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";
export default function Buy({ product, variants }: { product: any; variants: { id: string; label: string; price: number; stock: number }[] }) {
  const lang = useLang(), [q, setQ] = useState(1), [v, setV] = useState(variants[0]?.id || ""), [msg, setMsg] = useState(""), [fav, setFav] = useState(false);
  const cur = variants.find(x => x.id === v), stock = cur ? cur.stock : product.stock, can = product.shippable && stock > 0;
  useEffect(() => { call("GET", "/api/auth/session").then(async (s: any) => { if (s.customer) setFav((await call("GET", "/api/me/wishlist")).some((x: any) => x.id === product.id)); }).catch(() => {}); }, [product.id]);
  async function wa() { try { const j = await call("POST", "/api/whatsapp/link", { locale: lang, items: [{ productId: product.id, quantity: q }] }); window.open(j.url, "_blank"); } catch (e: any) { setMsg(e.message); } }
  async function heart() { try { await call(fav ? "DELETE" : "PUT", `/api/me/wishlist/${product.id}`); setFav(!fav); } catch { location.href = "/login?next=" + encodeURIComponent(location.pathname); } }
  return (<div>{variants.length > 0 && <label>{tr("variant", lang)}<select value={v} onChange={e => setV(e.target.value)}>{variants.map(x => <option key={x.id} value={x.id} disabled={x.stock < 1}>{x.label}</option>)}</select></label>}
    <label>{tr("quantity", lang)}<input type="number" min={1} max={Math.max(1, stock)} value={q} onChange={e => setQ(Math.max(1, +e.target.value || 1))} style={{ width: 100 }} /></label>
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
      <button className="btn" disabled={!can} onClick={() => { cart.add({ productId: product.id, variantId: v || undefined, slug: product.slug, name: product.name + (cur ? " — " + cur.label : ""), unitPrice: cur?.price ?? product.unitPrice, quantity: q, image: product.image }); setMsg(tr("added", lang)); }}>{tr("addToCart", lang)}</button>
      <button className="btn alt" disabled={!can} onClick={wa}>{tr("whatsapp", lang)}</button><button className="heart" aria-label={tr("wishlist", lang)} onClick={heart}>{fav ? "♥" : "♡"}</button></div><p role="status">{msg}</p></div>);
}
