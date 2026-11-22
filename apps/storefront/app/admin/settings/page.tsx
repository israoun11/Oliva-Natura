"use client";
import { useEffect, useState } from "react";
import { call } from "@/lib/api";
import { useLoad, Msg, Field, LocInput, emptyLoc, toMinor, fromMinor } from "../_c/ui";

const TABS = ["Site & contact", "Navigation & footer", "Shipping", "Payments & WhatsApp", "Languages"];
export default function Settings() {
  const { data, err, reload } = useLoad<any[]>("/api/admin/settings");
  const [tab, setTab] = useState(TABS[0]), [msg, setMsg] = useState(""), [e2, setE2] = useState("");
  const S = (k: string) => data?.find(x => x.key === k)?.value || {};
  async function save(key: string, value: any) { setMsg(""); setE2(""); try { await call("PUT", `/api/admin/settings/${key}`, value); setMsg("Saved"); reload(); } catch (e: any) { setE2(e.message); } }
  if (!data) return <div><h1>Settings</h1><Msg err={err} /></div>;
  return (<div><h1>Settings</h1><Msg err={e2} ok={msg} /><div className="tabs">{TABS.map(t => <button key={t} className={tab === t ? "on" : ""} onClick={() => { setTab(t); setMsg(""); }}>{t}</button>)}</div>
    {tab === TABS[0] && <Site s={S("site")} social={S("social")} save={save} />}
    {tab === TABS[1] && <NavFooter nav={S("navigation")} footer={S("footer")} save={save} />}
    {tab === TABS[2] && <Shipping s={S("shipping")} save={save} />}
    {tab === TABS[3] && <Payments pay={S("payments")} site={S("site")} save={save} />}
    {tab === TABS[4] && <Languages s={S("languages")} save={save} />}</div>);
}
function Site({ s, social, save }: any) {
  const [f, setF] = useState<any>({}), [so, setSo] = useState<any>({}); useEffect(() => { setF(s); setSo(social); }, [JSON.stringify(s), JSON.stringify(social)]);
  const k = (o: any, set: any, name: string, label: string, help?: string) => <Field label={label} help={help}><input value={o[name] || ""} onChange={e => set({ ...o, [name]: e.target.value })} /></Field>;
  return (<div className="two"><div className="panel"><h2 style={{ marginTop: 0 }}>Business & contact</h2>{k(f, setF, "brand", "Brand name")}{k(f, setF, "email", "Contact email")}{k(f, setF, "phone", "Phone")}{k(f, setF, "address", "Address", "Only fill in once confirmed.")}{k(f, setF, "businessInfo", "Business info (registration no., etc.)")}
    <button onClick={() => save("site", f)}>Save</button></div><div className="panel"><h2 style={{ marginTop: 0 }}>Social links</h2>{["instagram", "facebook", "tiktok", "youtube"].map(n => k(so, setSo, n, n[0].toUpperCase() + n.slice(1) + " URL"))}<button onClick={() => save("social", so)}>Save</button></div></div>);
}
function NavFooter({ nav, footer, save }: any) {
  const [n, setN] = useState<any[]>([]), [ft, setFt] = useState<any>({ tagline: emptyLoc(), copyright: emptyLoc() });
  useEffect(() => { setN(nav.items || []); setFt({ tagline: emptyLoc(), copyright: emptyLoc(), ...footer }); }, [JSON.stringify(nav), JSON.stringify(footer)]);
  return (<div className="two"><div className="panel"><h2 style={{ marginTop: 0 }}>Navigation labels</h2><p className="sub">Leave empty to use the built-in menu.</p>
    {n.map((it, i) => <div key={i} className="panel"><LocInput label="Label" value={it.label} onChange={v => setN(n.map((x, j) => j === i ? { ...x, label: v } : x))} /><Field label="Link"><input value={it.href} onChange={e => setN(n.map((x, j) => j === i ? { ...x, href: e.target.value } : x))} /></Field><button className="danger" onClick={() => setN(n.filter((_, j) => j !== i))}>Remove</button></div>)}
    <div className="bar"><button className="alt" onClick={() => setN([...n, { label: emptyLoc(), href: "/" }])}>+ Add link</button><button onClick={() => save("navigation", { items: n })}>Save navigation</button></div></div>
    <div className="panel"><h2 style={{ marginTop: 0 }}>Footer</h2><LocInput label="Tagline" value={ft.tagline} onChange={v => setFt({ ...ft, tagline: v })} /><LocInput label="Copyright line" value={ft.copyright} onChange={v => setFt({ ...ft, copyright: v })} /><button onClick={() => save("footer", ft)}>Save footer</button></div></div>);
}
function Shipping({ s, save }: any) {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => setRows(Object.entries(s).map(([c, v]: any) => ({ country: c, enabled: !!v.enabled, fee: fromMinor(v.fee, c === "TN" ? "TND" : "EUR"), free: fromMinor(v.freeOver, c === "TN" ? "TND" : "EUR") }))), [JSON.stringify(s)]);
  const out = () => Object.fromEntries(rows.filter(r => r.country.trim()).map(r => { const cur = r.country.toUpperCase() === "TN" ? "TND" : "EUR"; return [r.country.toUpperCase(), { enabled: r.enabled, fee: toMinor(r.fee, cur) ?? 0, freeOver: toMinor(r.free, cur) }]; }));
  return (<div className="panel"><h2 style={{ marginTop: 0 }}>Shipping rules</h2><p className="sub">Countries not listed (and not covered by a "*" rule) cannot check out. Fees are in TND for TN and EUR elsewhere. Use "*" as the country for a default international rule. Only enable countries you really ship to.</p>
    <table><thead><tr><th>Country (ISO, or *)</th><th>Enabled</th><th>Fee</th><th>Free over</th><th /></tr></thead><tbody>{rows.map((r, i) => <tr key={i}><td><input value={r.country} maxLength={2} onChange={e => setRows(rows.map((x, j) => j === i ? { ...x, country: e.target.value } : x))} /></td>
      <td><input type="checkbox" style={{ width: "auto" }} checked={r.enabled} onChange={e => setRows(rows.map((x, j) => j === i ? { ...x, enabled: e.target.checked } : x))} /></td>
      <td><input type="number" step="0.001" value={r.fee} onChange={e => setRows(rows.map((x, j) => j === i ? { ...x, fee: e.target.value } : x))} /></td><td><input type="number" step="0.001" value={r.free} onChange={e => setRows(rows.map((x, j) => j === i ? { ...x, free: e.target.value } : x))} /></td>
      <td><button className="danger" onClick={() => setRows(rows.filter((_, j) => j !== i))}>×</button></td></tr>)}</tbody></table>
    <div className="bar" style={{ marginTop: 12 }}><button className="alt" onClick={() => setRows([...rows, { country: "", enabled: false, fee: "", free: "" }])}>+ Add country</button><button onClick={() => save("shipping", out())}>Save shipping</button></div></div>);
}
function Payments({ pay, site, save }: any) {
  const [cod, setCod] = useState(true), [wa, setWa] = useState(""), [f, setF] = useState<any>({});
  useEffect(() => { setCod(pay?.cod?.enabled !== false); setWa(site.whatsappNumber || ""); setF(site); }, [JSON.stringify(pay), JSON.stringify(site)]);
  return (<div className="two"><div className="panel"><h2 style={{ marginTop: 0 }}>Payment methods</h2><label><input type="checkbox" style={{ width: "auto" }} checked={cod} onChange={e => setCod(e.target.checked)} /> Cash on delivery (Tunisia)</label>
    <p className="sub">Online card/local payment providers are not configured. They require a merchant account and credentials; see documentation/PAYMENTS.md.</p><button onClick={() => save("payments", { ...pay, cod: { enabled: cod } })}>Save</button></div>
    <div className="panel"><h2 style={{ marginTop: 0 }}>WhatsApp ordering</h2><Field label="Business WhatsApp number" help="International format, e.g. +216XXXXXXXX. 'Order via WhatsApp' stays unavailable until set."><input value={wa} onChange={e => setWa(e.target.value)} /></Field><button onClick={() => save("site", { ...f, whatsappNumber: wa })}>Save</button></div></div>);
}
function Languages({ s, save }: any) {
  const [en, setEn] = useState<string[]>(["en", "fr", "ar"]), [def, setDef] = useState("en");
  useEffect(() => { setEn(s.enabled || ["en", "fr", "ar"]); setDef(s.default || "en"); }, [JSON.stringify(s)]);
  const NAMES: any = { en: "English", fr: "Français", ar: "العربية (RTL)" };
  return (<div className="panel"><h2 style={{ marginTop: 0 }}>Storefront languages</h2>{Object.keys(NAMES).map(l => <p key={l}><label><input type="checkbox" style={{ width: "auto" }} checked={en.includes(l)} disabled={l === def} onChange={e => setEn(e.target.checked ? [...en, l] : en.filter(x => x !== l))} /> {NAMES[l]}</label></p>)}
    <Field label="Default language"><select value={def} onChange={e => { setDef(e.target.value); if (!en.includes(e.target.value)) setEn([...en, e.target.value]); }}>{en.map(l => <option key={l} value={l}>{NAMES[l]}</option>)}</select></Field><button onClick={() => save("languages", { enabled: en, default: def })}>Save languages</button></div>);
}
