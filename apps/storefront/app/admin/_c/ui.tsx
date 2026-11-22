"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { call, img } from "@/lib/api";

export const AdminCtx = createContext<{ me: any }>({ me: null });
export const useMe = () => useContext(AdminCtx).me;
export const LANGS = ["en", "fr", "ar"] as const;
export const emptyLoc = () => ({ en: "", fr: "", ar: "" });
export const toMinor = (v: string | number | null | undefined, cur: "TND" | "EUR") => (v === "" || v == null || isNaN(+v) ? null : Math.round(+v * (cur === "TND" ? 1000 : 100)));
export const fromMinor = (v: number | null | undefined, cur: "TND" | "EUR") => (v == null ? "" : String(v / (cur === "TND" ? 1000 : 100)));
export const money = (v: number, cur: string) => (v / (cur === "TND" ? 1000 : 100)).toFixed(cur === "TND" ? 3 : 2) + " " + cur;
export const locText = (v: any) => (v && (v.en || v.fr || v.ar)) || "";
export const fdate = (d: string) => new Date(d).toLocaleString();

export function useLoad<T = any>(path: string | null, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null), [err, setErr] = useState(""), [loading, setLoading] = useState(true);
  const reload = useCallback(async () => { if (!path) return; setLoading(true); try { setData(await call("GET", path)); setErr(""); } catch (e: any) { setErr(e.message); } setLoading(false); }, [path]);
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [reload, ...deps]);
  return { data, err, loading, reload, setData };
}
export function Msg({ err, ok }: { err?: string; ok?: string }) { return err ? <p className="err" role="alert">{err}</p> : ok ? <p className="okmsg" role="status">{ok}</p> : null; }
export function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return <label className="f"><span>{label}</span>{children}{help && <div className="help">{help}</div>}</label>;
}
export function LocInput({ label, value, onChange, area, rows }: { label: string; value: any; onChange: (v: any) => void; area?: boolean; rows?: number }) {
  const v = { ...emptyLoc(), ...(value || {}) };
  return (<div className="f"><span style={{ display: "block", fontSize: 12, color: "var(--mut)", marginBottom: 4 }}>{label}</span><div className="loc">
    {LANGS.map(l => <div key={l}><em>{l.toUpperCase()}</em>{area
      ? <textarea dir={l === "ar" ? "rtl" : "ltr"} rows={rows || 5} value={v[l]} onChange={e => onChange({ ...v, [l]: e.target.value })} />
      : <input dir={l === "ar" ? "rtl" : "ltr"} value={v[l]} onChange={e => onChange({ ...v, [l]: e.target.value })} />}</div>)}</div></div>);
}

// ---- Media library modal + image field (real Cloudinary uploads via /api/admin/media)
export function MediaPicker({ folder, multiple, onPick, onClose }: { folder: string; multiple?: boolean; onPick: (assets: any[]) => void; onClose: () => void }) {
  const { data, err, reload } = useLoad<any[]>(`/api/admin/media?folder=${folder}`);
  const [sel, setSel] = useState<any[]>([]), [busy, setBusy] = useState(false), [e2, setE2] = useState("");
  async function up(files: FileList | null) {
    if (!files?.length) return; setBusy(true); setE2("");
    try { const fd = new FormData(); [...files].forEach(f => fd.append("files", f)); await call("POST", `/api/admin/media?folder=${folder}`, fd); await reload(); } catch (e: any) { setE2(e.message); }
    setBusy(false);
  }
  const toggle = (a: any) => setSel(s => multiple ? (s.find(x => x.id === a.id) ? s.filter(x => x.id !== a.id) : [...s, a]) : [a]);
  return (<div className="modal" onClick={onClose}><div onClick={e => e.stopPropagation()}>
    <div className="bar"><h2 style={{ margin: 0 }}>Media library — {folder}</h2><span className="sp" />
      <label className="btn alt" style={{ cursor: "pointer" }}>{busy ? "Uploading…" : "Upload images"}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden disabled={busy} onChange={e => { up(e.target.files); e.target.value = ""; }} /></label>
      <button className="alt" onClick={onClose}>Close</button></div>
    <Msg err={e2 || err} />
    <div className="mgrid">{data?.map(a => <div key={a.id} className={"mitem" + (sel.find(x => x.id === a.id) ? " sel" : "")} onClick={() => toggle(a)} style={{ cursor: "pointer" }}><img src={img(a.url, 300)} alt="" /><div>{a.width}×{a.height}</div></div>)}</div>
    {data && !data.length && <p className="sub">No images yet. Upload some above (needs Cloudinary credentials in the API .env).</p>}
    <div className="bar" style={{ marginTop: 16 }}><span className="sp" /><button disabled={!sel.length} onClick={() => { onPick(sel); onClose(); }}>Use selected ({sel.length})</button></div></div></div>);
}
export function ImageField({ label, value, onChange, folder }: { label: string; value: string | null | undefined; onChange: (url: string) => void; folder: string }) {
  const [open, setOpen] = useState(false);
  return (<div className="f"><span style={{ display: "block", fontSize: 12, color: "var(--mut)", marginBottom: 4 }}>{label}</span>
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>{value ? <img src={img(value, 160)} alt="" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 4 }} /> : <div style={{ width: 72, height: 72, border: "1px dashed var(--line)", borderRadius: 4 }} />}
      <button type="button" className="alt" onClick={() => setOpen(true)}>{value ? "Change" : "Choose image"}</button>{value && <button type="button" className="danger" onClick={() => onChange("")}>Remove</button>}</div>
    {open && <MediaPicker folder={folder} onPick={a => onChange(a[0].url)} onClose={() => setOpen(false)} />}</div>);
}
export const statusPill = (s: string) => <span className={"pill " + (["DELIVERED", "PAID", "CONFIRMED"].includes(s) ? "ok" : ["CANCELLED", "FAILED", "REFUNDED"].includes(s) ? "bad" : ["PENDING", "UNPAID"].includes(s) ? "warn" : "")}>{s}</span>;
