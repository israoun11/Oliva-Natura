import "./editorial.css";
import { img } from "@/lib/api";
import { safeHref } from "@/lib/safe";
import { pick, tr, Lang } from "@/lib/i18n";
import { Branch, Tree, Hills, Divider } from "./Ornaments";
import Reveal from "./Reveal";

// Page-local labels (kept here so shared dictionaries are untouched).
const T = { chapter: { en: "Chapter", fr: "Chapitre", ar: "الفصل" } } as const;
const paras = (t: string) => t.split(/\n{2,}/).map(x => x.trim()).filter(Boolean);
const Body = ({ text }: { text: string }) => <>{paras(text).map((x, i) => <p key={i} style={{ whiteSpace: "pre-wrap" }}>{x}</p>)}</>;

// Shared renderer for the two storytelling pages. Content comes ONLY from the CMS page (Admin > Pages & homepage);
// nothing is invented here — empty pages show a neutral message plus decoration.
export default function EditorialPage({ variant, lang, page }: { variant: "story" | "land"; lang: Lang; page: any | null }) {
  const land = variant === "land";
  const key = land ? "land" : "story";
  const sections: any[] = page?.sections || [];
  const hero = sections.find(s => s.kind === "hero");
  const rest = sections.filter(s => s !== hero);
  const title = pick(page?.title, lang) || tr(key, lang);
  const heroBody = hero ? pick(hero.content.body, lang) : "";
  const heroHeading = hero ? pick(hero.content.heading, lang) : "";
  let n = 0, rows = 0; // n numbers chapters; rows counts image rows so they alternate left/right regardless of text-only chapters
  return (<main className={"ed " + (land ? "ed-land" : "ed-story")}><Reveal>
    <header className="ed-hero">
      <div className="ed-r">
        {land && <Tree className="ed-tree" />}
        <span className="ed-eyebrow">OLIVA NATURA</span>
        <h1>{title}</h1>
        {(heroHeading || heroBody) && <p className="ed-lede" style={{ marginTop: 22 }}>{heroHeading || heroBody}</p>}
        {heroHeading && heroBody && <div className="ed-lede" style={{ fontSize: 18, marginTop: 10 }}><Body text={heroBody} /></div>}
        {!land && <Branch className="ed-branch" />}
      </div>
      {!land && <div className="ed-r"><div className="ed-frame">{hero?.content.image
        ? <img src={img(hero.content.image, 760)} alt={heroHeading || title} />
        : <div className="ed-panel"><Tree /></div>}</div></div>}
      {land && <Hills className="ed-hills" />}
    </header>
    {!page && <div className="ed-empty ed-r"><Branch className="ed-branch" /><p className="muted">{tr("notPublished", lang)}</p></div>}
    <div className="ed-rows">{rest.map((s, i) => {
      const c = s.content, h = pick(c.heading, lang), b = pick(c.body, lang), image = c.image ? img(c.image, 720) : "";
      if (s.kind === "quote") return <div className="ed-quote ed-r" key={s.id}><Branch className="ed-branch" /><blockquote>{b || h}</blockquote></div>;
      const link = safeHref(c.buttonLink), label = pick(c.buttonLabel, lang);
      const btn = link && label ? <p><a className="btn" href={link}>{label}</a></p> : null;
      if (s.kind === "cta") return <div className="ed-cta ed-r" key={s.id}>{h && <h2>{h}</h2>}{b && <Body text={b} />}{btn}</div>;
      n += 1;
      const num = String(n).padStart(2, "0"), no = <div className="ed-no"><b>{num}</b><span>{T.chapter[lang]}</span></div>;
      if (image) { rows += 1; return (<div className={"ed-row" + (rows % 2 === 0 ? " flip" : "")} key={s.id}>
        <div className="ed-frame sm ed-r"><img src={image} alt={h} loading="lazy" /></div>
        <div className="ed-r">{no}{h && <h2>{h}</h2>}{b && <Body text={b} />}{btn}</div></div>); }
      return (<div className="ed-text ed-r" key={s.id}>{no}{h && <h2>{h}</h2>}{b && <Body text={b} />}{btn}{i < rest.length - 1 && <Divider />}</div>);
    })}</div>
  </Reveal></main>);
}
