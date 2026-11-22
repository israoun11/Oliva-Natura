"use client";
import { useState } from "react";
import { useLoad, Msg, money, statusPill, fdate } from "../_c/ui";
export default function Customers() {
  const [q, setQ] = useState(""), [open, setOpen] = useState<string | null>(null);
  const { data, err } = useLoad<any[]>(`/api/admin/customers?q=${encodeURIComponent(q)}`);
  const det = useLoad<any>(open ? `/api/admin/customers/${open}` : null, [open]);
  return (<div><h1>Customers</h1><Msg err={err} /><div className="bar"><input placeholder="Search name or email…" value={q} onChange={e => setQ(e.target.value)} /></div>
    <div className="scroll"><table><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Orders</th><th>Joined</th></tr></thead><tbody>{data?.map(c => <tr key={c.id} className="click" onClick={() => setOpen(c.id)}><td>{c.name}</td><td>{c.email}</td><td>{c.phone}</td><td>{c._count.orders}</td><td>{fdate(c.createdAt)}</td></tr>)}
      {data && !data.length && <tr><td colSpan={5} className="sub">No customers.</td></tr>}</tbody></table></div>
    {open && <div className="modal" onClick={() => setOpen(null)}><div onClick={e => e.stopPropagation()}>{det.data ? <>
      <div className="bar"><h2 style={{ margin: 0 }}>{det.data.name}</h2><span className="sp" /><button className="alt" onClick={() => setOpen(null)}>Close</button></div>
      <p>{det.data.email} · {det.data.phone || "no phone"} · language {det.data.locale}</p>
      <h2>Addresses</h2>{det.data.addresses.map((a: any) => <p key={a.id}>{a.line1}, {a.postalCode} {a.city}, {a.country}{a.isDefault && " (default)"}</p>)}{!det.data.addresses.length && <p className="sub">None saved.</p>}
      <h2>Orders</h2><table><tbody>{det.data.orders.map((o: any) => <tr key={o.id}><td>{o.number}</td><td>{fdate(o.createdAt)}</td><td>{money(o.total, o.currency)}</td><td>{statusPill(o.status)}</td></tr>)}</tbody></table></> : <Msg err={det.err} />}</div></div>}</div>);
}
