import { get, fmt } from "@/lib/api";
import { getLang } from "@/lib/lang";
import { tr } from "@/lib/i18n";
export const dynamic = "force-dynamic";
export default async function Confirmation({ params, searchParams }: { params: { number: string }; searchParams: { email?: string } }) {
  const lang = getLang(), o = await get<any>(`/api/orders/${params.number}?email=${encodeURIComponent(searchParams.email || "")}`);
  if (!o) return <main><h1>{tr("notFound", lang)}</h1></main>;
  return (<main><h1>{tr("thanks", lang)}</h1><p>{tr("order", lang)} <b>{o.number}</b> — {tr("status", lang)}: {tr("s_" + o.status, lang)}, {tr("payment", lang)}: {tr("m_" + o.paymentMethod, lang)} / {tr("p_" + o.paymentStatus, lang)}</p><p>{tr("orderPlaced", lang)}</p>
    <ul>{o.items.map((i: any) => <li key={i.id}>{i.nameSnapshot} × {i.quantity} — {fmt(i.unitPrice * i.quantity, o.currency)}</li>)}</ul>
    <p>{tr("subtotal", lang)}: {fmt(o.subtotal, o.currency)} · {tr("shipping", lang)}: {fmt(o.shippingFee, o.currency)}</p><p><b>{tr("total", lang)}: {fmt(o.total, o.currency)}</b></p></main>);
}
