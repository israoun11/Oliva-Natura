import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { get, img } from "@/lib/api";
import { safeHref } from "@/lib/safe";
import { getLang } from "@/lib/lang";
import { tr, pick } from "@/lib/i18n";
export const dynamic = "force-dynamic";
const ALLOWED = ["our-story", "from-our-land", "our-philosophy", "privacy", "terms", "shipping", "returns", "cookies"];
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const lang = getLang(), p = await get<any>("/api/pages/" + params.slug);
  return p ? { title: pick(p.seo?.title, lang) || pick(p.title, lang), description: pick(p.seo?.description, lang) } : {};
}
// Renders CMS sections (hero, text, image-text, quote, cta) edited in Admin > Pages. No built-in invented copy.
export default async function CmsPage({ params }: { params: { slug: string } }) {
  if (!ALLOWED.includes(params.slug)) notFound();
  const lang = getLang(), p = await get<any>("/api/pages/" + params.slug);
  if (!p) return <main><h1>{params.slug.replace(/-/g, " ")}</h1><p className="muted">{tr("notPublished", lang)}</p></main>;
  return (<main><h1>{pick(p.title, lang)}</h1>{p.sections.map((s: any) => { const c = s.content, h = pick(c.heading, lang), b = pick(c.body, lang);
    return <section key={s.id} className={"sec " + (s.kind === "hero" ? "hero-s" : "")} style={{ margin: "40px 0" }}>
      {s.kind === "quote" ? <blockquote className="quote">{b || h}</blockquote> : <div className={s.kind === "image-text" && c.image ? "two-col" : ""}>
        {s.kind === "image-text" && c.image && <img src={img(c.image, 900)} alt={h} loading="lazy" />}<div>{h && (s.kind === "hero" ? <h2>{h}</h2> : <h3 style={{ fontSize: 32 }}>{h}</h3>)}{b && <p style={{ whiteSpace: "pre-wrap" }}>{b}</p>}
          {s.kind !== "image-text" && c.image && <img src={img(c.image, 1200)} alt={h} loading="lazy" />}{safeHref(c.buttonLink) && pick(c.buttonLabel, lang) && <a className="btn" href={safeHref(c.buttonLink)}>{pick(c.buttonLabel, lang)}</a>}</div></div>}</section>; })}</main>);
}
