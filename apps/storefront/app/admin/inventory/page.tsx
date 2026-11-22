"use client";
import Link from "next/link";
import { useLoad, Msg, locText } from "../_c/ui";
export default function Inventory() {
  const { data, err } = useLoad<any[]>("/api/admin/products");
  return (<div><h1>Inventory</h1><p className="sub">Click a product to adjust stock and see its movement history (Stock tab).</p><Msg err={err} />
    <div className="scroll"><table><thead><tr><th>Product</th><th>SKU</th><th>Stock</th><th>Warn at</th><th>Variants</th></tr></thead><tbody>{data?.map(p => { const low = p.stock <= p.lowStockAt; return <tr key={p.id}>
      <td><Link href={`/admin/products/${p.id}`}>{locText(p.name)}</Link></td><td>{p.sku}</td><td>{p.stock} {low && <span className="pill bad">Low</span>}</td><td>{p.lowStockAt}</td><td>{p.variants?.length ?? ""}</td></tr>; })}</tbody></table></div></div>);
}
