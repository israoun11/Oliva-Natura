"use client";
import { useState } from "react";
import { call } from "@/lib/api";
import { useLoad, Msg, Field, LocInput, ImageField, emptyLoc } from "./ui";

export type FieldDef = { name: string; label: string; type: "text" | "number" | "bool" | "loc" | "locarea" | "textarea" | "select" | "image" | "date" | "password" | "lines";
  options?: { value: string; label: string }[]; optionsFrom?: { path: string; label: (r: any) => string }; folder?: string; help?: string; createOnly?: boolean; };
export type Col = { label: string; render: (r: any) => React.ReactNode };

export function Crud({ title, sub, base, cols, fields, defaults, canDelete = true, canCreate = true, prep }: {
  title: string; sub?: string; base: string; cols: Col[]; fields: FieldDef[]; defaults: any; canDelete?: boolean; canCreate?: boolean; prep?: (f: any, isNew: boolean) => any }) {
  const { data, err, reload } = useLoad<any[]>(base);
  const [form, setForm] = useState<any>(null), [msg, setMsg] = useState(""), [e2, setE2] = useState(""), [q, setQ] = useState("");
  const rows = (data || []).filter(r => !q || JSON.stringify(r).toLowerCase().includes(q.toLowerCase()));
  async function save() {
    setE2(""); setMsg("");
    try { const isNew = !form.id; const body = prep ? prep(form, isNew) : form;
      isNew ? await call("POST", base, body) : await call("PUT", `${base}/${form.id}`, body);
      setForm(null); setMsg("Saved"); reload(); } catch (e: any) { setE2(e.message); }
  }
  async function del(r: any) { if (!confirm("Delete this item?")) return; try { await call("DELETE", `${base}/${r.id}`); setMsg("Deleted"); reload(); } catch (e: any) { setMsg(""); setE2(e.message); } }
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  return (<div><h1>{title}</h1><p className="sub">{sub}</p><Msg err={err || (!form ? e2 : "")} ok={msg} />
    <div className="bar"><input placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} /><span className="sp" />{canCreate && <button onClick={() => { setE2(""); setForm({ ...defaults }); }}>+ New</button>}</div>
    <div className="scroll"><table><thead><tr>{cols.map(c => <th key={c.label}>{c.label}</th>)}<th /></tr></thead><tbody>
      {rows.map(r => <tr key={r.id}>{cols.map(c => <td key={c.label}>{c.render(r)}</td>)}<td style={{ whiteSpace: "nowrap", textAlign: "right" }}><button className="alt" onClick={() => { setE2(""); setForm({ ...r }); }}>Edit</button>{canDelete && <> <button className="danger" onClick={() => del(r)}>Delete</button></>}</td></tr>)}
      {!rows.length && <tr><td colSpan={cols.length + 1} className="sub">Nothing here yet.</td></tr>}</tbody></table></div>
    {form && <div className="modal" onClick={() => setForm(null)}><div onClick={e => e.stopPropagation()}><h2 style={{ marginTop: 0 }}>{form.id ? "Edit" : "New"} {title.toLowerCase()}</h2>
      {fields.filter(f => !(f.createOnly && form.id)).map(f => <FieldEditor key={f.name} f={f} value={form[f.name]} onChange={v => set(f.name, v)} />)}
      <Msg err={e2} /><div className="bar"><button onClick={save}>Save</button><button className="alt" onClick={() => setForm(null)}>Cancel</button></div></div></div>}</div>);
}
function FieldEditor({ f, value, onChange }: { f: FieldDef; value: any; onChange: (v: any) => void }) {
  const from = useLoad<any[]>(f.optionsFrom?.path || null);
  const opts = f.options || (from.data || []).map(r => ({ value: r.id, label: f.optionsFrom!.label(r) }));
  switch (f.type) {
    case "loc": return <LocInput label={f.label} value={value ?? emptyLoc()} onChange={onChange} />;
    case "locarea": return <LocInput label={f.label} value={value ?? emptyLoc()} onChange={onChange} area rows={8} />;
    case "image": return <ImageField label={f.label} value={value} onChange={onChange} folder={f.folder || "general"} />;
    case "bool": return <Field label={f.label} help={f.help}><input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)} style={{ width: "auto" }} /></Field>;
    case "number": return <Field label={f.label} help={f.help}><input type="number" value={value ?? ""} onChange={e => onChange(e.target.value === "" ? null : +e.target.value)} /></Field>;
    case "textarea": return <Field label={f.label} help={f.help}><textarea value={value ?? ""} onChange={e => onChange(e.target.value)} /></Field>;
    case "select": return <Field label={f.label} help={f.help}><select value={value ?? ""} onChange={e => onChange(e.target.value || null)}><option value="">—</option>{opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>;
    case "date": return <Field label={f.label}><input type="date" value={value ? String(value).slice(0, 10) : ""} onChange={e => onChange(e.target.value || null)} /></Field>;
    case "lines": return <Field label={f.label} help={f.help || "One URL per line"}><textarea value={(value || []).join("\n")} onChange={e => onChange(e.target.value.split("\n").map(s => s.trim()).filter(Boolean))} /></Field>;
    case "password": return <Field label={f.label} help={f.help}><input type="password" autoComplete="new-password" value={value ?? ""} onChange={e => onChange(e.target.value)} /></Field>;
    default: return <Field label={f.label} help={f.help}><input value={value ?? ""} onChange={e => onChange(e.target.value)} /></Field>;
  }
}
