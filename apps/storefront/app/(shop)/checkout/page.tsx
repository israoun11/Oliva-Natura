"use client";
import { useEffect, useState } from "react";
import { call, cart, fmt, Item } from "@/lib/api";
import { tr } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";
export default function Checkout() {
  const lang = useLang(), [items, setItems] = useState<Item[]>([]), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const [cfg, setCfg] = useState<{ countries: string[]; cod: boolean } | null>(null), [me, setMe] = useState<any>(null), [addr, setAddr] = useState<any>(null);
  const [key] = useState(() => crypto.randomUUID() + crypto.randomUUID()); // one idempotency key per checkout attempt: double-clicks cannot create two orders
  useEffect(() => { setItems(cart.read()); call("GET", "/api/orders/config").then(setCfg).catch(() => {});
    call("GET", "/api/auth/session").then(async (s: any) => { if (!s.customer) return; setMe(s.customer); const a = await call("GET", "/api/me/addresses"); setAddr(a[0] || null); }).catch(() => {}); }, []);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setErr("");
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    try {
      const o = await call("POST", "/api/orders", { idempotencyKey: key, email: f.email, phone: f.phone || undefined, paymentMethod: "COD",
        address: { name: f.name, line1: f.line1, city: f.city, postalCode: f.postalCode || undefined, country: f.country },
        items: items.map(i => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })) });
      cart.write([]); location.href = `/order/${o.number}?email=${encodeURIComponent(f.email)}`;
    } catch (x: any) { setErr(x.message); setBusy(false); }
  }
  const ready = !!cfg;
  return (<main><h1>{tr("checkout", lang)}</h1>
    <p>{items.map(i => `${i.name} × ${i.quantity}`).join(", ")} — {fmt(items.reduce((s, i) => s + i.unitPrice * i.quantity, 0))}</p>
    {cfg && !cfg.cod && <p role="alert">{tr("unavailable", lang)}</p>}
    {ready && <form onSubmit={submit} style={{ maxWidth: 520 }} key={me?.id || "guest"}>
      <label>{tr("fullName", lang)}<input name="name" required defaultValue={addr?.name || me?.name || ""} /></label><label>{tr("email", lang)}<input name="email" type="email" required defaultValue={me?.email || ""} /></label>
      <label>{tr("phone", lang)}<input name="phone" defaultValue={addr?.phone || me?.phone || ""} /></label><label>{tr("address", lang)}<input name="line1" required defaultValue={addr?.line1 || ""} /></label>
      <label>{tr("city", lang)}<input name="city" required defaultValue={addr?.city || ""} /></label><label>{tr("postal", lang)}<input name="postalCode" defaultValue={addr?.postalCode || ""} /></label>
      <label>{tr("country", lang)}<select name="country" defaultValue={addr?.country || "TN"}>{(cfg!.countries.length ? cfg!.countries : ["TN"]).filter(c => c !== "*").map(c => <option key={c}>{c}</option>)}</select></label>
      <p className="muted">{tr("codNote", lang)}</p>{err && <p role="alert" style={{ color: "var(--acc)" }}>{err}</p>}
      <button className="btn" disabled={busy || !items.length || !cfg!.cod}>{tr("placeOrder", lang)}</button></form>}</main>);
}
