"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { call, fmt, img } from "@/lib/api";
import { tr, pick } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";
export default function Wishlist() {
  const lang = useLang(), [items, setItems] = useState<any[] | null>(null);
  const load = () => call("GET", "/api/me/wishlist").then(setItems).catch(() => { location.href = "/login?next=/wishlist"; });
  useEffect(() => { load(); }, []);
  return (<main><h1>{tr("wishlist", lang)}</h1>{items && !items.length && <p className="muted">{tr("nothingSaved", lang)}</p>}
    <div className="grid">{items?.map(p => <div key={p.id} className="card"><Link href={`/products/${p.slug}`}>{p.images[0] && <img src={img(p.images[0].url, 400)} alt="" style={{ width: "100%", aspectRatio: "4/5", objectFit: "cover" }} />}<h3>{pick(p.name, lang)}</h3></Link><div>{fmt(p.priceTnd)}</div>
      <button className="btn alt" onClick={async () => { await call("DELETE", `/api/me/wishlist/${p.id}`); load(); }}>{tr("remove", lang)}</button></div>)}</div></main>);
}
