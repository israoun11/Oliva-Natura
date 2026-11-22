"use client";
import { useEffect, useState } from "react";
import { call } from "@/lib/api";
import { useLoad, Msg, Field, LocInput, ImageField, emptyLoc } from "../_c/ui";

const PAGES: [string, string][] = [["home", "Homepage"], ["our-story", "Our Story"], ["from-our-land", "From Our Land"], ["our-philosophy", "Our Philosophy"], ["privacy", "Privacy Policy"], ["terms", "Terms & Conditions"], ["shipping", "Shipping Policy"], ["returns", "Returns Policy"], ["cookies", "Cookie Policy"]];
const KINDS = [["hero", "Hero (large heading)"], ["text", "Text"], ["image-text", "Image + text"], ["quote", "Quote"], ["cta", "Call to action"]];
const newSection = () => ({ kind: "text", visible: true, content: { heading: emptyLoc(), body: emptyLoc(), image: "", buttonLabel: emptyLoc(), buttonLink: "" } });

export default function Content() {
  const { data, err, reload } = useLoad<any[]>("/api/admin/pages");
  const [slug, setSlug] = useState("our-story"), [f, setF] = useState<any>(null), [msg, setMsg] = useState(""), [e2, setE2] = useState("");
  useEffect(() => { if (!data) return; const p = data.find(x => x.slug === slug);
    setF(p ? { title: p.title, published: p.published, seo: { title: p.seo?.title || emptyLoc(), description: p.seo?.description || emptyLoc() }, sections: p.sections.map((s: any) => ({ kind: s.kind, visible: s.visible, content: { ...newSection().content, ...s.content } })) }
      : { title: emptyLoc(), published: false, seo: { title: emptyLoc(), description: emptyLoc() }, sections: [] }); setMsg(""); setE2(""); }, [data, slug]);
  if (!f) return <div><h1>Pages & homepage</h1><Msg err={err} /></div>;
  const upd = (i: number, fn: (s: any) => any) => setF({ ...f, sections: f.sections.map((s: any, j: number) => (j === i ? fn(s) : s)) });
  const move = (i: number, d: number) => { const a = [...f.sections], j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; setF({ ...f, sections: a }); };
  async function save() { setMsg(""); setE2(""); try { await call("PUT", `/api/admin/pages/${slug}`, f); setMsg("Saved — live on the storefront" + (f.published ? "" : " once Published is ticked")); reload(); } catch (e: any) { setE2(e.message); } }
  return (<div><h1>Pages & homepage</h1>{slug === "home" && <p className="panel">The immersive homepage uses the <b>first Hero section</b>: its heading becomes the circling text, its text becomes the footer note, and its button appears bottom-right (a "Call to action" section works too if there is no hero button). Products on the homepage are your <b>published products</b> (first 12). Other homepage sections are not displayed.</p>}<p className="sub">Edit text, images, buttons, order and visibility. Pages must be Published to appear. Arabic text is shown right-to-left automatically.</p><Msg err={err} />
    <div className="bar"><select value={slug} onChange={e => setSlug(e.target.value)}>{PAGES.map(([s, l]) => <option key={s} value={s}>{l}</option>)}</select><span className="sp" />
      <a className="btn alt" target="_blank" href={slug === "home" ? "/" : `/${slug}`}>View live ↗</a><button onClick={save}>Save page</button></div><Msg err={e2} ok={msg} />
    <div className="two"><div><LocInput label="Page title" value={f.title} onChange={v => setF({ ...f, title: v })} /><Field label="Published"><input type="checkbox" style={{ width: "auto" }} checked={f.published} onChange={e => setF({ ...f, published: e.target.checked })} /></Field></div>
      <div><LocInput label="SEO title" value={f.seo.title} onChange={v => setF({ ...f, seo: { ...f.seo, title: v } })} /><LocInput label="SEO description" value={f.seo.description} onChange={v => setF({ ...f, seo: { ...f.seo, description: v } })} area rows={2} /></div></div>
    <h2>Sections</h2>{f.sections.map((s: any, i: number) => <div className="panel" key={i}>
      <div className="bar"><b>#{i + 1}</b><select value={s.kind} onChange={e => upd(i, x => ({ ...x, kind: e.target.value }))}>{KINDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        <label><input type="checkbox" style={{ width: "auto" }} checked={s.visible} onChange={e => upd(i, x => ({ ...x, visible: e.target.checked }))} /> Visible</label><span className="sp" />
        <button className="alt" onClick={() => move(i, -1)} disabled={!i}>↑</button><button className="alt" onClick={() => move(i, 1)} disabled={i === f.sections.length - 1}>↓</button><button className="danger" onClick={() => confirm("Remove section?") && setF({ ...f, sections: f.sections.filter((_: any, j: number) => j !== i) })}>Remove</button></div>
      <LocInput label="Heading" value={s.content.heading} onChange={v => upd(i, x => ({ ...x, content: { ...x.content, heading: v } }))} />
      <LocInput label="Text" value={s.content.body} onChange={v => upd(i, x => ({ ...x, content: { ...x.content, body: v } }))} area rows={5} />
      <div className="two"><ImageField label="Image" value={s.content.image} folder={slug === "home" ? "home" : "cms"} onChange={v => upd(i, x => ({ ...x, content: { ...x.content, image: v } }))} />
        <div><LocInput label="Button label" value={s.content.buttonLabel} onChange={v => upd(i, x => ({ ...x, content: { ...x.content, buttonLabel: v } }))} /><Field label="Button link"><input value={s.content.buttonLink || ""} placeholder="/products" onChange={e => upd(i, x => ({ ...x, content: { ...x.content, buttonLink: e.target.value } }))} /></Field></div></div></div>)}
    <div className="bar"><button className="alt" onClick={() => setF({ ...f, sections: [...f.sections, newSection()] })}>+ Add section</button><span className="sp" /><button onClick={save}>Save page</button></div></div>);
}
