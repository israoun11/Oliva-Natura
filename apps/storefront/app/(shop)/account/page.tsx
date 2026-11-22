"use client";
import { useEffect, useState } from "react";
import { call, fmt } from "@/lib/api";
import { tr } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";
const empty = { name: "", phone: "", line1: "", line2: "", city: "", region: "", postalCode: "", country: "TN", isDefault: false };
const FIELDS: [keyof typeof empty, string][] = [["name", "fullName"], ["phone", "phone"], ["line1", "address"], ["line2", "address2"], ["city", "city"], ["region", "region"], ["postalCode", "postal"], ["country", "country"]];
export default function Account() {
  const lang = useLang(), [me, setMe] = useState<any>(null), [tab, setTab] = useState("profile"), [orders, setOrders] = useState<any[]>([]), [addrs, setAddrs] = useState<any[]>([]);
  const [msg, setMsg] = useState(""), [a, setA] = useState<any>(null), [open, setOpen] = useState<any>(null);
  const load = async () => { try { setMe(await call("GET", "/api/me")); setOrders(await call("GET", "/api/me/orders")); setAddrs(await call("GET", "/api/me/addresses")); } catch { location.href = "/login?next=/account"; } };
  useEffect(() => { load(); }, []);
  if (!me) return <main><p className="muted">…</p></main>;
  const run = async (fn: () => Promise<any>) => { setMsg(""); try { await fn(); setMsg(tr("saved", lang)); load(); } catch (e: any) { setMsg(e.message); } };
  return (<main><h1>{tr("account", lang)}</h1><p style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>{["profile", "addresses", "orders"].map(t => <button key={t} className="btn alt" onClick={() => { setTab(t); setMsg(""); }} aria-pressed={tab === t}>{tr(t, lang)}</button>)}
    <button className="btn alt" onClick={async () => { await call("POST", "/api/auth/logout"); location.href = "/"; }}>{tr("logout", lang)}</button></p><p role="status">{msg}</p>
    {tab === "profile" && <div style={{ maxWidth: 440 }}><form onSubmit={e => { e.preventDefault(); const f: any = Object.fromEntries(new FormData(e.currentTarget)); run(() => call("PUT", "/api/me", { name: f.name, phone: f.phone || null, locale: f.locale })); }}>
      <label>{tr("email", lang)}<input value={me.email} disabled /></label><label>{tr("name", lang)}<input name="name" defaultValue={me.name} required /></label><label>{tr("phone", lang)}<input name="phone" defaultValue={me.phone || ""} /></label>
      <label>{tr("language", lang)}<select name="locale" defaultValue={me.locale}><option value="en">English</option><option value="fr">Français</option><option value="ar">العربية</option></select></label><button className="btn">{tr("save", lang)}</button></form>
      <h2 style={{ fontSize: 26, marginTop: 40 }}>{tr("changePassword", lang)}</h2>
      <form onSubmit={e => { e.preventDefault(); const form = e.currentTarget, f: any = Object.fromEntries(new FormData(form)); run(async () => { await call("PUT", "/api/me/password", { current: f.current, next: f.next }); form.reset(); }); }}>
        <label>{tr("currentPassword", lang)}<input name="current" type="password" required autoComplete="current-password" /></label><label>{tr("newPassword", lang)}<input name="next" type="password" minLength={8} required autoComplete="new-password" /></label><button className="btn">{tr("changePassword", lang)}</button></form></div>}
    {tab === "addresses" && <div>{!addrs.length && <p className="muted">{tr("nothingSaved", lang)}</p>}{addrs.map(x => <p key={x.id}>{x.name} {x.line1}, {x.postalCode} {x.city}, {x.country}{x.isDefault && " ★"} <button className="btn alt" onClick={() => setA(x)} aria-label="Edit">✎</button> <button className="btn alt" onClick={() => run(() => call("DELETE", `/api/me/addresses/${x.id}`))}>{tr("delete", lang)}</button></p>)}
      <button className="btn" onClick={() => setA({ ...empty })} aria-label="Add address">+</button>
      {a && <form style={{ maxWidth: 440, marginTop: 20 }} onSubmit={e => { e.preventDefault(); const body = { name: a.name || undefined, phone: a.phone || undefined, line1: a.line1, line2: a.line2 || undefined, city: a.city, region: a.region || undefined, postalCode: a.postalCode || undefined, country: a.country, isDefault: !!a.isDefault }; run(async () => { a.id ? await call("PUT", `/api/me/addresses/${a.id}`, body) : await call("POST", "/api/me/addresses", body); setA(null); }); }}>
        {FIELDS.map(([k, key]) => <label key={k}>{tr(key, lang)}<input value={a[k] || ""} onChange={e => setA({ ...a, [k]: e.target.value })} required={["line1", "city", "country"].includes(k)} maxLength={k === "country" ? 2 : 200} /></label>)}
        <label><input type="checkbox" style={{ width: "auto" }} checked={!!a.isDefault} onChange={e => setA({ ...a, isDefault: e.target.checked })} /> {tr("makeDefault", lang)}</label><button className="btn">{tr("save", lang)}</button></form>}</div>}
    {tab === "orders" && <div>{!orders.length && <p className="muted">{tr("noOrders", lang)}</p>}{orders.map(o => <div key={o.id} style={{ borderTop: "1px solid var(--sand)", padding: "12px 0" }}><b>{o.number}</b> · {o.createdAt.slice(0, 10)} · {tr("s_" + o.status, lang)} · {fmt(o.total, o.currency)} <button className="btn alt" onClick={() => setOpen(open?.id === o.id ? null : o)} aria-expanded={open?.id === o.id}>…</button>
      {open?.id === o.id && <div><ul>{o.items.map((i: any) => <li key={i.id}>{i.nameSnapshot} × {i.quantity} — {fmt(i.unitPrice * i.quantity, o.currency)}</li>)}</ul><p>{tr("shipping", lang)}: {fmt(o.shippingFee, o.currency)} · {tr("total", lang)}: {fmt(o.total, o.currency)}</p>{o.shipments?.[0]?.trackingNumber && <p>{tr("tracking", lang)}: {o.shipments[0].carrier} {o.shipments[0].trackingNumber}</p>}</div>}</div>)}</div>}</main>);
}
