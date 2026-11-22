"use client";
import { useLoad, Msg, fdate } from "../_c/ui";
export default function Subscribers() {
  const { data, err } = useLoad<any[]>("/api/admin/subscribers");
  const csv = () => { const b = new Blob(["email,locale,date\n" + (data || []).map(s => `${s.email},${s.locale},${s.createdAt}`).join("\n")], { type: "text/csv" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "subscribers.csv"; a.click(); };
  return (<div><h1>Newsletter subscribers</h1><Msg err={err} /><div className="bar"><span>{data?.length ?? 0} subscribers</span><span className="sp" /><button className="alt" onClick={csv} disabled={!data?.length}>Export CSV</button></div>
    <table><thead><tr><th>Email</th><th>Language</th><th>Date</th></tr></thead><tbody>{data?.map(s => <tr key={s.id}><td>{s.email}</td><td>{s.locale}</td><td>{fdate(s.createdAt)}</td></tr>)}</tbody></table></div>);
}
