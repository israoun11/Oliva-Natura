import Link from "next/link";
import type { Metadata } from "next";
import { get, fmt, img } from "@/lib/api";
import { getLang } from "@/lib/lang";
import { tr, pick } from "@/lib/i18n";
import Gallery from "@/components/Gallery";
import Buy from "./Buy";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const lang = getLang(), p = await get<any>("/api/products/" + params.slug);
  return p ? { title: pick(p.seo?.title, lang) || pick(p.name, lang), description: pick(p.seo?.description, lang) || pick(p.description, lang).slice(0, 160) } : {};
}
export default async function Product({ params }: { params: { slug: string } }) {
  const lang = getLang();
  const [p, related] = await Promise.all([get<any>("/api/products/" + params.slug), get<any[]>(`/api/products/${params.slug}/related`)]);
  if (!p) return <main><h1>{tr("notFound", lang)}</h1></main>;
  const sale = p.salePriceTnd && p.salePriceTnd < p.priceTnd ? p.salePriceTnd : null, unit = sale ?? p.priceTnd;
  const totalStock = p.variants.length ? p.variants.reduce((a: number, v: any) => a + v.stock, 0) : p.stock;
  return (<main><div className="two-col"><Gallery images={p.images} glb={p.models?.[0]?.glbUrl} labels={{ photos: tr("photos", lang), view3d: tr("view3d", lang) }} />
    <div><p className="muted">{pick(p.collection?.name, lang)}</p><h1 style={{ fontSize: "clamp(36px,5vw,60px)" }}>{pick(p.name, lang)}</h1>
      <p style={{ fontSize: 22 }}>{p.volumeMl ? `${p.volumeMl} ml · ` : ""}{sale ? <><s className="muted">{fmt(p.priceTnd)}</s> <span className="sale">{fmt(sale)}</span></> : fmt(p.priceTnd)}</p>
      <p style={{ whiteSpace: "pre-wrap" }}>{pick(p.description, lang)}</p>
      {p.specs && Object.keys(p.specs).length > 0 && <ul>{Object.entries(p.specs).map(([k, v]) => <li key={k}><b>{k}:</b> {String(v)}</li>)}</ul>}
      {p.batches?.[0] && <p className="muted">{tr("verifiedBatch", lang)}: {p.batches[0].batchNumber}</p>}
      <p className="muted">{totalStock < 1 ? tr("outOfStock", lang) : totalStock <= p.lowStockAt ? tr("lowStock", lang) : tr("inStock", lang)}</p>
      <Buy product={{ id: p.id, slug: p.slug, name: pick(p.name, lang), unitPrice: unit, image: p.images[0]?.url, stock: p.stock, shippable: p.shippingEligible }}
        variants={p.variants.map((v: any) => ({ id: v.id, label: pick(v.label, lang), price: v.priceTnd ?? unit, stock: v.stock }))} />
      <p className="muted" style={{ fontSize: 13 }}>{tr("shippingInfo", lang)}</p></div></div>
    {related && related.length > 0 && <><h2 style={{ marginTop: 80 }}>{tr("related", lang)}</h2><div className="grid">{related.map(r => <Link key={r.id} className="card" href={`/products/${r.slug}`}>{r.images[0] && <img src={img(r.images[0].url, 400)} alt="" loading="lazy" style={{ width: "100%", aspectRatio: "4/5", objectFit: "cover" }} />}<h3>{pick(r.name, lang)}</h3><div>{fmt(r.salePriceTnd && r.salePriceTnd < r.priceTnd ? r.salePriceTnd : r.priceTnd)}</div></Link>)}</div></>}</main>);
}
