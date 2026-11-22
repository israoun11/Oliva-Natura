"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { call } from "@/lib/api";
import { Msg } from "../_c/ui";
export default function Login() {
  const [err, setErr] = useState(""), r = useRouter();
  async function go(e: React.FormEvent<HTMLFormElement>) { e.preventDefault(); const f = Object.fromEntries(new FormData(e.currentTarget)); try { await call("POST", "/api/auth/admin/login", f); window.location.href = "/admin"; } catch (x: any) { setErr(x.message); } }
  return (<form className="login" onSubmit={go}><h1>OLIVA NATURA</h1><p className="sub">Administration</p>
    <label className="f"><span>Email</span><input name="email" type="email" required autoComplete="username" /></label>
    <label className="f"><span>Password</span><input name="password" type="password" required autoComplete="current-password" /></label>
    <Msg err={err} /><button>Sign in</button></form>);
}
