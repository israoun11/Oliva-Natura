"use client";
import Link from "next/link";
import { useLoad, Msg, money, statusPill, fdate } from "./_c/ui";
export default function Dashboard() {
  const { data: d, err } = useLoad<any>("/api/admin/dashboard");
  if (!d) return <div><h1>Dashboard</h1><Msg err={err} /></div>;
  const days = [...new Set<string>(d.salesSeries.map((s: any) => s.day))];
  const cur = d.salesSeries[0]?.currency || "TND";
  const vals = days.map(day => d.salesSeries.filter((s: any) => s.day === day && s.currency === cur).reduce((a: number, s: any) => a + s.total, 0));
  const max = Math.max(1, ...vals);
  return (<div><h1>Dashboard</h1><p className="sub">Cancelled and refunded orders are excluded from revenue.</p>
    <div className="cards">
      {d.revenueByCurrency.map((r: any) => <div className="card" key={r.currency}><b>{money(r._sum.total || 0, r.currency)}</b><span>Booked revenue {r.currency} (excl. cancelled/refunded)</span></div>)}
      {d.paidByCurrency?.map((r: any) => <div className="card" key={"p" + r.currency}><b>{money(r._sum.total || 0, r.currency)}</b><span>Collected (paid) {r.currency}</span></div>)}
      {!d.revenueByCurrency.length && <div className="card"><b>0</b><span>Revenue</span></div>}
      <div className="card"><b>{d.orders}</b><span>Total orders</span></div><div className="card"><b>{d.pending}</b><span>Pending orders</span></div>
      <div className="card"><b>{d.completed}</b><span>Completed (delivered)</span></div><div className="card"><b>{d.products}</b><span>Products</span></div></div>
    <div className="two"><div className="panel"><h2 style={{ marginTop: 0 }}>Sales, last 30 days ({cur})</h2>
      {vals.length ? <div className="bars" aria-label="Daily sales">{vals.map((v: number, i: number) => <i key={i} title={`${days[i]}: ${money(v, cur)}`} style={{ height: (v / max) * 100 + "%" }} />)}</div> : <p className="sub">No sales yet.</p>}</div>
      <div className="panel"><h2 style={{ marginTop: 0 }}>Sales by country</h2>{d.salesByCountry.map((c: any) => <p key={c.country} style={{ margin: "4px 0" }}>{c.country} — {c._count} orders</p>)}{!d.salesByCountry.length && <p className="sub">No data yet.</p>}</div></div>
    <div className="two"><div className="panel"><h2 style={{ marginTop: 0 }}>Recent orders</h2><table><tbody>{d.recentOrders.map((o: any) => <tr key={o.id}><td><Link href="/admin/orders">{o.number}</Link></td><td>{money(o.total, o.currency)}</td><td>{statusPill(o.status)}</td></tr>)}</tbody></table></div>
      <div className="panel"><h2 style={{ marginTop: 0 }}>Low stock</h2>{d.lowStock.map((p: any) => <p key={p.id} style={{ margin: "4px 0" }}><Link href="/admin/inventory">{p.slug}</Link> — <b>{p.stock}</b> left</p>)}{!d.lowStock.length && <p className="sub">All stocked.</p>}</div></div>
    <div className="two"><div className="panel"><h2 style={{ marginTop: 0 }}>Bestsellers</h2>{d.bestsellers.map((b: any) => <p key={b.productId + b.nameSnapshot} style={{ margin: "4px 0" }}>{b.nameSnapshot} — {b._sum.quantity}</p>)}{!d.bestsellers.length && <p className="sub">No orders yet.</p>}
      <h2>Recent customers</h2>{d.recentCustomers.map((c: any) => <p key={c.id} style={{ margin: "4px 0" }}>{c.name} · {c.email}</p>)}</div>
      <div className="panel"><h2 style={{ marginTop: 0 }}>Recent admin activity</h2>{d.recentAudit.map((a: any) => <p key={a.id} style={{ margin: "4px 0" }}><span className="sub">{fdate(a.createdAt)}</span> {a.admin?.name || "system"}: {a.action} {a.entity}</p>)}</div></div></div>);
}
