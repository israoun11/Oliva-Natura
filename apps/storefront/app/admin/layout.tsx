"use client";
import "./admin.css";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { call } from "@/lib/api";
import { AdminCtx } from "./_c/ui";

const NAV: { h: string; items: [string, string, string][] }[] = [
  { h: "Overview", items: [["/admin", "Dashboard", "orders"]] },
  { h: "Shop", items: [["/admin/orders", "Orders", "orders"], ["/admin/products", "Products", "catalog"], ["/admin/inventory", "Inventory", "catalog"], ["/admin/collections", "Collections & categories", "catalog"], ["/admin/customers", "Customers", "customers"]] },
  { h: "Traceability", items: [["/admin/suppliers", "Suppliers", "catalog"], ["/admin/batches", "Product batches", "catalog"]] },
  { h: "Content", items: [["/admin/content", "Pages & homepage", "content"], ["/admin/journal", "Journal", "content"], ["/admin/media", "Media library", "content"], ["/admin/messages", "Messages", "content"], ["/admin/subscribers", "Newsletter", "content"]] },
  { h: "System", items: [["/admin/settings", "Settings", "settings"], ["/admin/users", "Admin users", "users"], ["/admin/audit", "Audit log", "users"]] },
];
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<any>(undefined), path = usePathname(), router = useRouter();
  const isLogin = path === "/admin/login";
  useEffect(() => { if (!isLogin) call("GET", "/api/admin/me").then(setMe).catch(() => setMe(null)); }, [isLogin]);
  useEffect(() => { if (me === null && !isLogin) router.replace("/admin/login"); }, [me, isLogin, router]);
  if (isLogin) return <div className="adm solo" dir="ltr" lang="en">{children}</div>;
  if (!me) return <div className="adm solo" dir="ltr" lang="en"><p className="sub" style={{ padding: 30 }}>Loading…</p></div>;
  return (<AdminCtx.Provider value={{ me }}><div className="adm" dir="ltr" lang="en"><aside><div className="logo">OLIVA NATURA<small>ADMIN · {me.role.replace("_", " ")}</small></div>
    {NAV.map(g => { const items = g.items.filter(i => me.perms.includes(i[2])); return items.length ? <div key={g.h}><h6>{g.h}</h6>{items.map(([h, l]) => <Link key={h} href={h} className={path === h || (h !== "/admin" && path.startsWith(h)) ? "on" : ""}>{l}</Link>)}</div> : null; })}
    <h6>Account</h6><a href="/" target="_blank">View storefront ↗</a>
    <a href="#" onClick={async e => { e.preventDefault(); await call("POST", "/api/auth/logout"); router.replace("/admin/login"); setMe(null); }}>Sign out ({me.name})</a></aside>
    <div className="main">{children}</div></div></AdminCtx.Provider>);
}
