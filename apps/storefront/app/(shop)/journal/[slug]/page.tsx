import type { Metadata } from "next";
import { get, img } from "@/lib/api";
import { getLang } from "@/lib/lang";
import { tr, pick } from "@/lib/i18n";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const lang = getLang(), a = await get<any>("/api/articles/" + params.slug);
  return a ? { title: pick(a.seo?.title, lang) || pick(a.title, lang), description: pick(a.seo?.description, lang) || pick(a.excerpt, lang) } : {};
}
export default async function Article({ params }: { params: { slug: string } }) {
  const lang = getLang(), a = await get<any>("/api/articles/" + params.slug);
  if (!a) return <main><h1>{tr("notFound", lang)}</h1></main>;
  return <main style={{ maxWidth: 760 }}><p className="muted">{a.category} · {a.publishedAt?.slice(0, 10)}</p><h1>{pick(a.title, lang)}</h1>{a.coverUrl && <img src={img(a.coverUrl, 1200)} alt="" style={{ width: "100%" }} />}<div style={{ whiteSpace: "pre-wrap", fontSize: 18 }}>{pick(a.body, lang)}</div></main>;
}
