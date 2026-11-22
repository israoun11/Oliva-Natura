import Link from "next/link";
import { get, fmt, img } from "@/lib/api";
import { getLang } from "@/lib/lang";
import { tr, pick } from "@/lib/i18n";
export const dynamic = "force-dynamic";
export default async function Products({ searchParams }: { searchParams: { collection?: string; sort?: string } }) {
  const lang = getLang();
  const qs = new URLSearchParams(searchParams as any).toString();
  const [products, cols] = await Promise.all([get<any[]>("/api/products?" + qs), get<any[]>("/api/collections")]);
  const href = (o: any) => "/products?" + new URLSearchParams({ ...(searchParams.collection ? { collection: searchParams.collection } : {}), ...o });
  return (<main><h1>{tr("collections", lang)}</h1>
    <p style={{ display: "flex", gap: 20, flexWrap: "wrap" }}><Link href="/products">{tr("all", lang)}</Link>{cols?.map(c => <Link key={c.id} href={`/products?collection=${c.slug}`} style={searchParams.collection === c.slug ? { borderBottom: "1px solid var(--acc)" } : {}}>{pick(c.name, lang)}</Link>)}
      <span className="muted">{tr("sort", lang)}:</span><Link href={href({ sort: "price_asc" })}>{tr("priceAsc", lang)}</Link><Link href={href({ sort: "price_desc" })}>{tr("priceDesc", lang)}</Link></p>
    {!products?.length && <p className="muted">{tr("noProducts", lang)}</p>}
    <div className="grid">{products?.map(p => <Link key={p.id} className="card" href={`/products/${p.slug}`}>
      {p.images[0] && <img src={img(p.images[0].url, 600)} alt={p.images[0].alt?.[lang] || pick(p.name, lang)} loading="lazy" style={{ width: "100%", aspectRatio: "4/5", objectFit: "cover" }} />}
      <span className="muted">{p.volumeMl ? p.volumeMl + " ml" : ""}</span><h3>{pick(p.name, lang)}</h3>
      <div>{p.salePriceTnd && p.salePriceTnd < p.priceTnd ? <><s className="muted">{fmt(p.priceTnd)}</s> <span className="sale">{fmt(p.salePriceTnd)}</span></> : fmt(p.priceTnd)}</div>
      <div className="muted">{p.stock > 0 || p.variants?.some((v: any) => v.stock > 0) ? tr("inStock", lang) : tr("outOfStock", lang)}</div></Link>)}</div></main>);
}
