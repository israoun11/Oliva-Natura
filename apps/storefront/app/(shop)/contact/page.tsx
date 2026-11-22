"use client";
import { useEffect, useState } from "react";
import { call } from "@/lib/api";
import { tr } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";
export default function Contact() {
  const lang = useLang(), [m, setM] = useState(""), [site, setSite] = useState<any>({});
  useEffect(() => { call("GET", "/api/settings/public").then(s => setSite(s.site || {})).catch(() => {}); }, []);
  return (<main><h1>{tr("contact", lang)}</h1>
    <p className="muted">{site.email && <a href={`mailto:${site.email}`}>{site.email}</a>} {site.phone && <> · <a href={`tel:${site.phone}`}>{site.phone}</a></>} {site.address && <> · {site.address}</>}</p>
    <form onSubmit={async e => { e.preventDefault(); const f = Object.fromEntries(new FormData(e.currentTarget)); try { await call("POST", "/api/contact", f); setM(tr("sent", lang)); (e.target as HTMLFormElement).reset(); } catch (x: any) { setM(x.message); } }} style={{ maxWidth: 520 }}>
      <label>{tr("name", lang)}<input name="name" required /></label><label>{tr("email", lang)}<input name="email" type="email" required /></label><label>{tr("message", lang)}<textarea name="message" rows={6} required /></label>
      <button className="btn">{tr("send", lang)}</button><p role="status">{m}</p></form></main>);
}
