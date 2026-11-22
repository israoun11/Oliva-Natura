"use client";
import { useState } from "react";
import { call } from "@/lib/api";
import { useLoad, Msg, money, statusPill, fdate, Field } from "../_c/ui";
const NEXT: Record<string, string[]> = { PENDING: ["CONFIRMED", "CANCELLED"], CONFIRMED: ["PROCESSING", "CANCELLED"], PROCESSING: ["SHIPPED", "CANCELLED"], SHIPPED: ["DELIVERED"], DELIVERED: ["REFUNDED"], CANCELLED: [], REFUNDED: [] };
export default function Orders() {
  const [status, setStatus] = useState(""), [q, setQ] = useState(""), [open, setOpen] = useState<string | null>(null);
  const { data, err, reload } = useLoad<any[]>(`/api/admin/orders?status=${status}&q=${encodeURIComponent(q)}`);
  return (<div><h1>Orders</h1><p className="sub">Cash-on-delivery orders are marked paid automatically when you set them to Delivered.</p><Msg err={err} />
    <div className="bar"><input placeholder="Search number, email, phone…" value={q} onChange={e => setQ(e.target.value)} />
      <select value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option>{Object.keys(NEXT).map(s => <option key={s}>{s}</option>)}</select></div>
    <div className="scroll"><table><thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Total</th><th>Status</th><th>Payment</th></tr></thead><tbody>
      {data?.map(o => <tr key={o.id} className="click" onClick={() => setOpen(o.id)}><td>{o.number}</td><td>{fdate(o.createdAt)}</td><td>{o.email}</td><td>{money(o.total, o.currency)}</td><td>{statusPill(o.status)}</td><td>{o.paymentMethod} {statusPill(o.paymentStatus)}</td></tr>)}
      {data && !data.length && <tr><td colSpan={6} className="sub">No orders.</td></tr>}</tbody></table></div>
    {open && <OrderDetail id={open} onClose={() => { setOpen(null); reload(); }} />}</div>);
}
function OrderDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const { data: o, err, reload } = useLoad<any>(`/api/admin/orders/${id}`);
  const [msg, setMsg] = useState(""), [e2, setE2] = useState(""), [notes, setNotes] = useState<string | null>(null), [ship, setShip] = useState<any>(null);
  async function patch(body: any) { setE2(""); setMsg(""); try { await call("PATCH", `/api/admin/orders/${id}`, body); setMsg("Updated"); reload(); } catch (e: any) { setE2(e.message); } }
  if (!o) return <div className="modal"><div><Msg err={err} /></div></div>;
  const a = o.shippingAddress || {}, s = o.shipments?.[0] || {}, sh = ship ?? { carrier: s.carrier || "", trackingNumber: s.trackingNumber || "" };
  return (<div className="modal" onClick={onClose}><div onClick={e => e.stopPropagation()}>
    <div className="bar"><h2 style={{ margin: 0 }}>{o.number}</h2>{statusPill(o.status)}{statusPill(o.paymentStatus)}<span className="sp" /><button className="alt" onClick={onClose}>Close</button></div>
    <Msg err={e2} ok={msg} />
    <div className="two"><div className="panel"><b>Customer</b><p>{a.name}<br />{o.email}<br />{o.phone}<br />{a.line1} {a.line2}<br />{a.postalCode} {a.city} {a.region}<br />{a.country}</p>{o.customer && <p className="sub">Registered customer: {o.customer.name}</p>}{o.notes && <p><b>Customer note:</b> {o.notes}</p>}</div>
      <div className="panel"><b>Totals ({o.currency})</b><p>Subtotal {money(o.subtotal, o.currency)}<br />Shipping {money(o.shippingFee, o.currency)}<br /><b>Total {money(o.total, o.currency)}</b></p><p className="sub">{o.paymentMethod} · placed {fdate(o.createdAt)}</p></div></div>
    <table><thead><tr><th>Item</th><th>Unit</th><th>Qty</th><th>Line</th></tr></thead><tbody>{o.items.map((i: any) => <tr key={i.id}><td>{i.nameSnapshot}</td><td>{money(i.unitPrice, o.currency)}</td><td>{i.quantity}</td><td>{money(i.unitPrice * i.quantity, o.currency)}</td></tr>)}</tbody></table>
    <h2>Status</h2><div className="bar">{NEXT[o.status].map(n => <button key={n} className={n === "CANCELLED" ? "danger" : ""} onClick={() => confirm(`Set order to ${n}?${n === "CANCELLED" ? " Stock will be returned." : ""}`) && patch({ status: n })}>{n === "CANCELLED" ? "Cancel order" : "Mark " + n.toLowerCase()}</button>)}{!NEXT[o.status].length && <span className="sub">Final status.</span>}
      {o.paymentStatus !== "PAID" && o.status !== "CANCELLED" && <button className="alt" onClick={() => patch({ paymentStatus: "PAID" })}>Mark payment received</button>}</div>
    <h2>Tracking</h2><div className="three"><Field label="Carrier"><input value={sh.carrier} onChange={e => setShip({ ...sh, carrier: e.target.value })} /></Field><Field label="Tracking number"><input value={sh.trackingNumber} onChange={e => setShip({ ...sh, trackingNumber: e.target.value })} /></Field><div style={{ paddingTop: 20 }}><button onClick={() => patch(sh)}>Save tracking</button></div></div>
    <h2>Internal notes</h2><textarea value={notes ?? o.internalNotes ?? ""} onChange={e => setNotes(e.target.value)} /><div className="bar" style={{ marginTop: 8 }}><button onClick={() => patch({ internalNotes: notes ?? o.internalNotes ?? "" })}>Save notes</button></div>
    <h2>Payments</h2>{o.payments.map((p: any) => <p key={p.id} className="sub">{p.provider} · {statusPill(p.status)} · {money(p.amount, p.currency)}</p>)}</div></div>);
}
