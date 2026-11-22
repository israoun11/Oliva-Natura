"use client";
import Link from "next/link";
import { useState } from "react";
import { call } from "@/lib/api";
import { useLoad, Msg, money, locText } from "../_c/ui";
export default function Products() {
  const { data, err, reload } = useLoad<any[]>("/api/admin/products");
  const [q, setQ] = useState(""), [f, setF] = useState(""), [msg, setMsg] = useState("");
  const rows = (data || []).filter(p => (!q || (locText(p.name) + p.sku + p.slug).toLowerCase().includes(q.toLowerCase())) && (!f || (f === "pub" ? p.published : !p.published)));
  async function del(p: any) { if (!confirm(`Delete ${p.slug}? Products with orders are archived (unpublished) instead.`)) return; try { const r = await call("DELETE", `/api/admin/products/${p.id}`); setMsg(r.archived ? "Product has orders, so it was unpublished instead." : "Deleted"); reload(); } catch (e: any) { setMsg(e.message); } }
  return (<div><h1>Products</h1><p className="sub">Provisional products stay drafts until you add real prices, descriptions, photos and stock.</p><Msg err={err} ok={msg} />
    <div className="bar"><input placeholder="Search name, SKU…" value={q} onChange={e => setQ(e.target.value)} /><select value={f} onChange={e => setF(e.target.value)}><option value="">All</option><option value="pub">Published</option><option value="draft">Draft</option></select><span className="sp" /><Link className="btn" href="/admin/products/new">+ New product</Link></div>
    <div className="scroll"><table><thead><tr><th /><th>Name</th><th>SKU</th><th>Price</th><th>Stock</th><th>Status</th><th /></tr></thead><tbody>{rows.map(p => <tr key={p.id}>
      <td style={{ width: 54 }}>{p.images[0] && <img src={p.images[0].url} alt="" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 4 }} />}</td>
      <td><Link href={`/admin/products/${p.id}`}>{locText(p.name)}</Link><div className="sub">{p.collection ? locText(p.collection.name) : "—"}</div></td><td>{p.sku}</td>
      <td>{p.salePriceTnd ? <><s>{money(p.priceTnd, "TND")}</s> {money(p.salePriceTnd, "TND")}</> : money(p.priceTnd, "TND")}</td><td>{p.stock}</td><td><span className={"pill " + (p.published ? "ok" : "warn")}>{p.published ? "Published" : "Draft"}</span></td>
      <td style={{ whiteSpace: "nowrap" }}><Link className="btn alt" href={`/admin/products/${p.id}`}>Edit</Link> <button className="danger" onClick={() => del(p)}>Delete</button></td></tr>)}</tbody></table></div></div>);
}
