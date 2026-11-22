"use client";
import { useState } from "react";
import { call, img } from "@/lib/api";
import { useLoad, Msg, LocInput } from "../_c/ui";
const FOLDERS = ["products", "journal", "home", "cms", "general"];
export default function Media() {
  const [folder, setFolder] = useState("products"), [msg, setMsg] = useState(""), [e, setE] = useState(""), [edit, setEdit] = useState<any>(null);
  const st = useLoad<any>("/api/admin/media/status"), { data, err, reload } = useLoad<any[]>(`/api/admin/media?folder=${folder}`, [folder]);
  const run = async (fn: () => Promise<any>, ok: string) => { setE(""); setMsg(""); try { await fn(); setMsg(ok); reload(); } catch (x: any) { setE(x.message); } };
  const upload = (files: FileList | null) => { if (!files?.length) return; const fd = new FormData(); [...files].forEach(f => fd.append("files", f)); run(() => call("POST", `/api/admin/media?folder=${folder}`, fd), "Uploaded"); };
  const replace = (a: any, f?: File) => { if (!f) return; const fd = new FormData(); fd.append("file", f); run(() => call("PUT", `/api/admin/media/${a.id}/replace`, fd), "Replaced (same URL; CDN cache refreshes shortly)"); };
  return (<div><h1>Media library</h1><p className="sub">Images are uploaded to Cloudinary. JPEG, PNG, WebP, AVIF up to {st.data?.maxMb ?? 8} MB each.</p>
    {st.data && !st.data.configured && <p className="err">Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in apps/api/.env and restart the API. Uploads will fail until then.</p>}
    <Msg err={e || err} ok={msg} /><div className="bar"><select value={folder} onChange={e => setFolder(e.target.value)}>{FOLDERS.map(f => <option key={f}>{f}</option>)}</select><span className="sp" />
      <label className="btn" style={{ cursor: "pointer" }}>Upload images<input type="file" hidden multiple accept="image/jpeg,image/png,image/webp,image/avif" onChange={e => { upload(e.target.files); e.target.value = ""; }} /></label></div>
    <div className="mgrid">{data?.map(a => <div key={a.id} className="mitem"><img src={img(a.url, 300)} alt={a.alt?.en || ""} /><div>{a.width}×{a.height} · {Math.round((a.bytes || 0) / 1024)} KB<br />
      <button className="alt" onClick={() => navigator.clipboard.writeText(a.url)}>Copy URL</button> <button className="alt" onClick={() => setEdit(a)}>Alt text</button><br />
      <label className="btn alt" style={{ cursor: "pointer", marginTop: 4 }}>Replace<input type="file" hidden accept="image/jpeg,image/png,image/webp,image/avif" onChange={e => { replace(a, e.target.files?.[0]); e.target.value = ""; }} /></label>{" "}
      <button className="danger" onClick={() => confirm("Delete this image permanently? It is also removed from any product galleries.") && run(() => call("DELETE", `/api/admin/media/${a.id}`), "Deleted")}>Delete</button></div></div>)}</div>
    {data && !data.length && <p className="sub">No images in this folder.</p>}
    {edit && <div className="modal" onClick={() => setEdit(null)}><div onClick={e => e.stopPropagation()}><h2 style={{ marginTop: 0 }}>Alt text</h2><LocInput label="Describe the image" value={edit.alt} onChange={v => setEdit({ ...edit, alt: v })} />
      <div className="bar"><button onClick={() => { run(() => call("PATCH", `/api/admin/media/${edit.id}`, { alt: edit.alt }), "Saved"); setEdit(null); }}>Save</button><button className="alt" onClick={() => setEdit(null)}>Cancel</button></div></div></div>}</div>);
}
