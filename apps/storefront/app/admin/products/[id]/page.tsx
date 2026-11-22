"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { call, img } from "@/lib/api";
import { useLoad, Msg, Field, LocInput, MediaPicker, emptyLoc, toMinor, fromMinor, money, fdate, locText } from "../../_c/ui";

const blank = { slug: "", sku: "", name: emptyLoc(), description: emptyLoc(), volumeMl: "", priceTnd: "0", salePriceTnd: "", priceEur: "", salePriceEur: "", lowStockAt: 5, published: false, shippingEligible: true, collectionId: "", categoryId: "", specs: [] as [string, string][], seo: { title: emptyLoc(), description: emptyLoc() } };
const TABS = ["General", "Pricing", "Images", "Variants", "Stock", "SEO & specs"];

export default function ProductEditor() {
  const { id } = useParams<{ id: string }>(), router = useRouter(), isNew = id === "new";
  const { data: p, reload } = useLoad<any>(isNew ? null : `/api/admin/products/${id}`);
  const cols = useLoad<any[]>("/api/admin/collections"), cats = useLoad<any[]>("/api/admin/categories");
  const [f, setF] = useState<any>(blank), [tab, setTab] = useState("General"), [msg, setMsg] = useState(""), [err, setErr] = useState("");
  useEffect(() => { if (!p) return;
    setF({ ...blank, ...p, volumeMl: p.volumeMl ?? "", priceTnd: fromMinor(p.priceTnd, "TND"), salePriceTnd: fromMinor(p.salePriceTnd, "TND"), priceEur: fromMinor(p.priceEur, "EUR"), salePriceEur: fromMinor(p.salePriceEur, "EUR"),
      collectionId: p.collectionId || "", categoryId: p.categoryId || "", description: p.description || emptyLoc(), name: p.name || emptyLoc(),
      specs: Object.entries(p.specs || {}), seo: { title: p.seo?.title || emptyLoc(), description: p.seo?.description || emptyLoc() } }); }, [p]);
  const set = (k: string, v: any) => setF((x: any) => ({ ...x, [k]: v }));
  async function save() {
    setErr(""); setMsg("");
    const body = { slug: f.slug, sku: f.sku, name: f.name, description: f.description, volumeMl: f.volumeMl === "" ? null : +f.volumeMl,
      priceTnd: toMinor(f.priceTnd, "TND") ?? 0, salePriceTnd: toMinor(f.salePriceTnd, "TND"), priceEur: toMinor(f.priceEur, "EUR"), salePriceEur: toMinor(f.salePriceEur, "EUR"),
      lowStockAt: +f.lowStockAt, published: f.published, shippingEligible: f.shippingEligible, collectionId: f.collectionId || null, categoryId: f.categoryId || null,
      specs: Object.fromEntries(f.specs.filter(([k]: any) => k.trim())), seo: f.seo };
    try { if (isNew) { const c = await call("POST", "/api/admin/products", body); router.replace(`/admin/products/${c.id}`); } else { await call("PUT", `/api/admin/products/${id}`, body); setMsg("Saved"); reload(); } } catch (e: any) { setErr(e.message); }
  }
  return (<div><div className="bar"><Link href="/admin/products">← Products</Link></div><h1>{isNew ? "New product" : locText(f.name) || f.slug}</h1>
    <div className="bar"><span className={"pill " + (f.published ? "ok" : "warn")}>{f.published ? "Published" : "Draft"}</span><span className="sp" />
      {!isNew && <Link className="btn alt" href={`/admin/preview/${id}`} target="_blank">Preview</Link>}<button onClick={save}>Save product</button></div>
    <Msg err={err} ok={msg} />
    <div className="tabs">{TABS.map(t => <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)} disabled={isNew && ["Images", "Variants", "Stock"].includes(t)}>{t}</button>)}</div>
    {tab === "General" && <div className="two"><div>
      <Field label="Slug (URL)" help="Lowercase, hyphens. Changing it changes the product URL."><input value={f.slug} onChange={e => set("slug", e.target.value)} /></Field><Field label="SKU"><input value={f.sku} onChange={e => set("sku", e.target.value)} /></Field>
      <LocInput label="Name" value={f.name} onChange={v => set("name", v)} /><LocInput label="Description" value={f.description} onChange={v => set("description", v)} area rows={7} /></div><div>
      <Field label="Volume (ml)"><input type="number" value={f.volumeMl} onChange={e => set("volumeMl", e.target.value)} /></Field>
      <Field label="Collection"><select value={f.collectionId} onChange={e => set("collectionId", e.target.value)}><option value="">—</option>{cols.data?.map(c => <option key={c.id} value={c.id}>{locText(c.name)}</option>)}</select></Field>
      <Field label="Category"><select value={f.categoryId} onChange={e => set("categoryId", e.target.value)}><option value="">—</option>{cats.data?.map(c => <option key={c.id} value={c.id}>{locText(c.name)}</option>)}</select></Field>
      <Field label="Status"><select value={f.published ? "1" : "0"} onChange={e => set("published", e.target.value === "1")}><option value="0">Draft (hidden)</option><option value="1">Published (visible in shop)</option></select></Field>
      <Field label="Shipping eligibility"><label><input type="checkbox" style={{ width: "auto" }} checked={f.shippingEligible} onChange={e => set("shippingEligible", e.target.checked)} /> Can be shipped / ordered</label></Field></div></div>}
    {tab === "Pricing" && <div className="two"><div className="panel"><h2 style={{ marginTop: 0 }}>Tunisia (TND)</h2><Field label="Price (TND)" help="3 decimals, e.g. 24.500"><input type="number" step="0.001" value={f.priceTnd} onChange={e => set("priceTnd", e.target.value)} /></Field>
      <Field label="Sale price (TND)" help="Optional. Only applies if lower than the price."><input type="number" step="0.001" value={f.salePriceTnd} onChange={e => set("salePriceTnd", e.target.value)} /></Field></div>
      <div className="panel"><h2 style={{ marginTop: 0 }}>International (EUR)</h2><Field label="Price (EUR)" help="Leave empty if not sold internationally."><input type="number" step="0.01" value={f.priceEur} onChange={e => set("priceEur", e.target.value)} /></Field>
      <Field label="Sale price (EUR)"><input type="number" step="0.01" value={f.salePriceEur} onChange={e => set("salePriceEur", e.target.value)} /></Field></div></div>}
    {tab === "SEO & specs" && <div className="two"><div><LocInput label="SEO title" value={f.seo.title} onChange={v => set("seo", { ...f.seo, title: v })} /><LocInput label="SEO description" value={f.seo.description} onChange={v => set("seo", { ...f.seo, description: v })} area rows={3} /></div>
      <div><h2 style={{ marginTop: 0 }}>Verified specifications</h2><p className="sub">Only enter facts you have verified (e.g. acidity from a lab report). They are shown publicly.</p>
        {f.specs.map(([k, v]: any, i: number) => <div key={i} className="bar"><input placeholder="Label" value={k} onChange={e => set("specs", f.specs.map((s: any, j: number) => j === i ? [e.target.value, s[1]] : s))} /><input placeholder="Value" value={v} onChange={e => set("specs", f.specs.map((s: any, j: number) => j === i ? [s[0], e.target.value] : s))} /><button className="danger" onClick={() => set("specs", f.specs.filter((_: any, j: number) => j !== i))}>×</button></div>)}
        <button className="alt" onClick={() => set("specs", [...f.specs, ["", ""]])}>+ Add specification</button></div></div>}
    {!isNew && p && tab === "Images" && <Images p={p} reload={reload} />}
    {!isNew && p && tab === "Variants" && <Variants p={p} reload={reload} />}
    {!isNew && p && tab === "Stock" && <Stock p={p} reload={reload} />}</div>);
}
function Images({ p, reload }: { p: any; reload: () => void }) {
  const [pick, setPick] = useState(false), [e, setE] = useState("");
  const run = async (fn: () => Promise<any>) => { setE(""); try { await fn(); reload(); } catch (x: any) { setE(x.message); } };
  const move = (i: number, d: number) => { const ids = p.images.map((x: any) => x.id); const j = i + d; if (j < 0 || j >= ids.length) return; [ids[i], ids[j]] = [ids[j], ids[i]]; run(() => call("PUT", `/api/admin/products/${p.id}/images/order`, { ids })); };
  return (<div><p className="sub">The first image is the main photo. Upload real product photography; images are stored in Cloudinary.</p><Msg err={e} />
    <div className="mgrid">{p.images.map((im: any, i: number) => <div key={im.id} className="mitem"><img src={img(im.url, 300)} alt="" /><div><button className="alt" disabled={i === 0} onClick={() => move(i, -1)}>←</button> <button className="alt" disabled={i === p.images.length - 1} onClick={() => move(i, 1)}>→</button> <button className="danger" onClick={() => run(() => call("DELETE", `/api/admin/products/${p.id}/images/${im.id}`))}>Remove</button></div></div>)}</div>
    <div className="bar" style={{ marginTop: 14 }}><button onClick={() => setPick(true)}>Add images from library / upload</button></div>
    {pick && <MediaPicker folder="products" multiple onClose={() => setPick(false)} onPick={async a => { for (const m of a) await run(() => call("POST", `/api/admin/products/${p.id}/images`, { mediaId: m.id })); }} />}</div>);
}
function Variants({ p, reload }: { p: any; reload: () => void }) {
  const [e, setE] = useState(""), [n, setN] = useState<any>({ label: emptyLoc(), price: "", stock: 0 });
  const run = async (fn: () => Promise<any>) => { setE(""); try { await fn(); reload(); } catch (x: any) { setE(x.message); } };
  return (<div><p className="sub">If a product has variants, customers must pick one; each variant has its own stock. Initial stock is set when created; change it later in the Stock tab.</p><Msg err={e} />
    <table><thead><tr><th>Label</th><th>Price override (TND)</th><th>Stock</th><th /></tr></thead><tbody>{p.variants.map((v: any) => <tr key={v.id}><td>{locText(v.label)}</td><td>{v.priceTnd != null ? money(v.priceTnd, "TND") : "uses product price"}</td><td>{v.stock}</td><td><button className="danger" onClick={() => confirm("Delete variant?") && run(() => call("DELETE", `/api/admin/variants/${v.id}`))}>Delete</button></td></tr>)}</tbody></table>
    <h2>Add variant</h2><LocInput label="Label" value={n.label} onChange={v => setN({ ...n, label: v })} /><div className="three"><Field label="Price override (TND, optional)"><input type="number" step="0.001" value={n.price} onChange={e => setN({ ...n, price: e.target.value })} /></Field><Field label="Initial stock"><input type="number" min={0} value={n.stock} onChange={e => setN({ ...n, stock: +e.target.value })} /></Field></div>
    <button onClick={() => run(async () => { await call("POST", `/api/admin/products/${p.id}/variants`, { label: n.label, priceTnd: toMinor(n.price, "TND"), stock: n.stock }); setN({ label: emptyLoc(), price: "", stock: 0 }); })}>Add variant</button></div>);
}
function Stock({ p, reload }: { p: any; reload: () => void }) {
  const [delta, setDelta] = useState(0), [reason, setReason] = useState("RESTOCK"), [target, setTarget] = useState(""), [e, setE] = useState("");
  const mv = useLoad<any[]>(`/api/admin/products/${p.id}/movements`);
  async function adjust() { setE(""); try { await call("POST", target ? `/api/admin/variants/${target}/stock` : `/api/admin/products/${p.id}/stock`, { delta, reason }); setDelta(0); reload(); mv.reload(); } catch (x: any) { setE(x.message); } }
  return (<div><p>Product stock: <b>{p.stock}</b> {p.variants.map((v: any) => <span key={v.id}> · {locText(v.label)}: <b>{v.stock}</b></span>)}</p><Msg err={e} />
    <div className="three"><Field label="Adjust"><select value={target} onChange={e => setTarget(e.target.value)}><option value="">Product stock</option>{p.variants.map((v: any) => <option key={v.id} value={v.id}>Variant: {locText(v.label)}</option>)}</select></Field>
      <Field label="Change (+ add / − remove)"><input type="number" value={delta} onChange={e => setDelta(+e.target.value)} /></Field><Field label="Reason"><select value={reason} onChange={e => setReason(e.target.value)}><option>RESTOCK</option><option>ADJUSTMENT</option><option>DAMAGED</option><option>RETURN</option></select></Field></div>
    <button disabled={!delta} onClick={adjust}>Apply adjustment</button>
    <Field label="Low-stock warning at"><span className="help">Edit on the General save (currently {p.lowStockAt}).</span></Field>
    <h2>History</h2><table><tbody>{mv.data?.map(m => <tr key={m.id}><td>{fdate(m.createdAt)}</td><td>{m.delta > 0 ? "+" : ""}{m.delta}</td><td>{m.reason}</td><td>{m.ref}</td></tr>)}</tbody></table></div>);
}
