"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cart, fmt, img, Item } from "@/lib/api";
import { tr } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";
export default function Cart() {
  const lang = useLang(), [items, setItems] = useState<Item[]>([]);
  useEffect(() => { const s = () => setItems(cart.read()); s(); window.addEventListener("cart", s); return () => window.removeEventListener("cart", s); }, []);
  const set = (it: Item, q: number) => cart.write(items.map(i => (i === it || (i.productId === it.productId && i.variantId === it.variantId) ? { ...i, quantity: q } : i)).filter(i => i.quantity > 0));
  const sub = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  return (<main><h1>{tr("cart", lang)}</h1>{!items.length && <p className="muted">{tr("emptyCart", lang)}</p>}
    {items.map(i => <div key={i.productId + (i.variantId || "")} style={{ display: "flex", gap: 16, alignItems: "center", borderTop: "1px solid var(--sand)", padding: "14px 0", flexWrap: "wrap" }}>
      {i.image && <img src={img(i.image, 120)} alt="" style={{ width: 64, height: 64, objectFit: "cover" }} />}<Link href={`/products/${i.slug}`} style={{ flex: 1 }}>{i.name}</Link><span>{fmt(i.unitPrice)}</span>
      <input type="number" min={0} value={i.quantity} onChange={e => set(i, Math.max(0, +e.target.value || 0))} style={{ width: 80, margin: 0 }} aria-label={`${tr("quantity", lang)} ${i.name}`} /><button className="btn alt" onClick={() => set(i, 0)}>{tr("remove", lang)}</button></div>)}
    {items.length > 0 && <><p>{tr("subtotal", lang)}: <b>{fmt(sub)}</b> <span className="muted">{tr("shippingCalc", lang)}</span></p><Link className="btn" href="/checkout">{tr("checkout", lang)}</Link></>}</main>);
}
