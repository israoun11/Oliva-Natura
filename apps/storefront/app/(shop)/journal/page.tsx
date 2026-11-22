import Link from "next/link";
import { get, img } from "@/lib/api";
import { getLang } from "@/lib/lang";
import { tr, pick } from "@/lib/i18n";
export const dynamic = "force-dynamic";
export default async function Journal() {
  const lang = getLang(), a = await get<any[]>("/api/articles");
  return (<main><h1>{tr("journal", lang)}</h1>{!a?.length && <p className="muted">{tr("noArticles", lang)}</p>}
    <div className="grid">{a?.map(x => <Link className="card" key={x.id} href={`/journal/${x.slug}`}>{x.coverUrl && <img src={img(x.coverUrl, 600)} alt="" loading="lazy" style={{ width: "100%", aspectRatio: "3/2", objectFit: "cover" }} />}
      <span className="muted">{x.category} {x.publishedAt?.slice(0, 10)}</span><h3>{pick(x.title, lang)}</h3><p className="muted">{pick(x.excerpt, lang)}</p></Link>)}</div></main>);
}
