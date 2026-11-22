"use client";
import { useLoad, Msg, fdate } from "../_c/ui";
export default function Audit() {
  const { data, err } = useLoad<any[]>("/api/admin/audit");
  return (<div><h1>Audit log</h1><Msg err={err} /><div className="scroll"><table><thead><tr><th>When</th><th>Admin</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead><tbody>{data?.map(a => <tr key={a.id}><td>{fdate(a.createdAt)}</td><td>{a.admin?.name || "—"}</td><td>{a.action}</td><td>{a.entity} {a.entityId?.slice(0, 8)}</td><td className="sub">{a.meta ? JSON.stringify(a.meta).slice(0, 120) : ""}</td></tr>)}</tbody></table></div></div>);
}
