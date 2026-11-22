"use client";
import { call } from "@/lib/api";
import { useLoad, Msg, fdate } from "../_c/ui";
export default function Messages() {
  const { data, err, reload } = useLoad<any[]>("/api/admin/messages");
  return (<div><h1>Contact messages</h1><Msg err={err} />{data?.map(m => <div key={m.id} className="panel" style={{ opacity: m.read ? .6 : 1 }}><div className="bar"><b>{m.name}</b><a href={`mailto:${m.email}`}>{m.email}</a><span className="sub">{fdate(m.createdAt)}</span><span className="sp" />
    <button className="alt" onClick={async () => { await call("PATCH", `/api/admin/messages/${m.id}`, { read: !m.read }); reload(); }}>{m.read ? "Mark unread" : "Mark read"}</button></div><p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{m.message}</p></div>)}{data && !data.length && <p className="sub">No messages.</p>}</div>);
}
