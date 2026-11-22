"use client";
import { useState } from "react";
import { call } from "@/lib/api";
import { tr } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";
export default function Login() {
  const lang = useLang(), [mode, setMode] = useState<"login" | "register">("login"), [err, setErr] = useState("");
  async function go(e: React.FormEvent<HTMLFormElement>) { e.preventDefault(); setErr(""); const f: any = Object.fromEntries(new FormData(e.currentTarget));
    try { await call("POST", mode === "login" ? "/api/auth/customer/login" : "/api/auth/customer/register", f); const n = new URLSearchParams(location.search).get("next"); location.href = n && n.startsWith("/") ? n : "/account"; } catch (x: any) { setErr(x.message); } }
  return (<main style={{ maxWidth: 420 }}><h1>{tr(mode === "login" ? "login" : "register", lang)}</h1><form onSubmit={go}>
    {mode === "register" && <label>{tr("name", lang)}<input name="name" required /></label>}<label>{tr("email", lang)}<input name="email" type="email" required autoComplete="username" /></label>
    <label>{tr("password", lang)}<input name="password" type="password" minLength={8} required autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>
    {err && <p role="alert" style={{ color: "var(--acc)" }}>{err}</p>}<button className="btn">{tr(mode === "login" ? "login" : "register", lang)}</button></form>
    <p><button className="btn alt" onClick={() => setMode(mode === "login" ? "register" : "login")}>{tr(mode === "login" ? "register" : "login", lang)}</button></p></main>);
}
