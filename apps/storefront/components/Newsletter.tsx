"use client";
import { useState } from "react";
import { call } from "@/lib/api";
import { tr, Lang } from "@/lib/i18n";
export default function Newsletter({ lang }: { lang: Lang }) {
  const [m, setM] = useState("");
  return (<form onSubmit={async e => { e.preventDefault(); const email = new FormData(e.currentTarget).get("email"); try { await call("POST", "/api/newsletter", { email, locale: lang }); setM("✓"); } catch { setM("!"); } }} style={{ display: "flex", gap: 8, maxWidth: 360 }}>
    <input name="email" type="email" required placeholder={tr("email", lang)} aria-label={tr("email", lang)} style={{ margin: 0 }} /><button className="btn">{tr("subscribe", lang)}</button><span role="status">{m}</span></form>);
}
