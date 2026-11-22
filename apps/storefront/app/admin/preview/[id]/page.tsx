"use client";
import { useParams } from "next/navigation";
import { img, fmt } from "@/lib/api";
import { useLoad, Msg, locText } from "../../_c/ui";
// Admin-only preview of any product (including drafts) using the admin API.
export default function Preview() {
  const { id } = useParams<{ id: string }>(), { data: p, err } = useLoad<any>(`/api/admin/products/${id}`);
  if (!p) return <div className="main"><Msg err={err} /></div>;
  return (<div className="main" style={{ maxWidth: 1000, margin: "0 auto" }}><p className="pill warn">Preview — {p.published ? "published" : "DRAFT, not visible to customers"}</p>
    <div className="two"><div>{p.images.map((i: any) => <img key={i.id} src={img(i.url, 900)} alt="" style={{ width: "100%", marginBottom: 10 }} />)}{!p.images.length && <p className="sub">No images yet.</p>}</div>
      <div><h1>{locText(p.name)}</h1><p>{p.volumeMl && p.volumeMl + " ml · "}{p.salePriceTnd ? <><s>{fmt(p.priceTnd)}</s> {fmt(p.salePriceTnd)}</> : fmt(p.priceTnd)}</p><p style={{ whiteSpace: "pre-wrap" }}>{locText(p.description)}</p>
        {Object.entries(p.specs || {}).map(([k, v]) => <p key={k} className="sub"><b>{k}:</b> {String(v)}</p>)}<p className="sub">Stock: {p.stock}</p></div></div></div>);
}
