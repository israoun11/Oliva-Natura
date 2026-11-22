"use client";
import { useState } from "react";
import { Crud } from "../_c/crud";
import { locText } from "../_c/ui";
const L = { en: "", fr: "", ar: "" };
export default function Collections() {
  const [tab, setTab] = useState("Collections");
  return (<div><div className="tabs">{["Collections", "Categories"].map(t => <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>{t}</button>)}</div>
    {tab === "Collections" ? <Crud key="c" title="Collections" base="/api/admin/collections" defaults={{ slug: "", name: L, description: L, imageUrl: "", sort: 0, published: true }}
      cols={[{ label: "Name", render: r => locText(r.name) }, { label: "Slug", render: r => r.slug }, { label: "Order", render: r => r.sort }, { label: "Visible", render: r => (r.published ? "Yes" : "No") }]}
      fields={[{ name: "slug", label: "Slug", type: "text" }, { name: "name", label: "Name", type: "loc" }, { name: "description", label: "Description", type: "locarea" }, { name: "imageUrl", label: "Image", type: "image", folder: "products" }, { name: "sort", label: "Sort order", type: "number" }, { name: "published", label: "Visible in shop", type: "bool" }]}
      prep={f => ({ slug: f.slug, name: f.name, description: f.description || L, imageUrl: f.imageUrl || null, sort: +f.sort || 0, published: !!f.published })} />
    : <Crud key="k" title="Categories" base="/api/admin/categories" defaults={{ slug: "", name: L, sort: 0 }}
      cols={[{ label: "Name", render: r => locText(r.name) }, { label: "Slug", render: r => r.slug }, { label: "Order", render: r => r.sort }]}
      fields={[{ name: "slug", label: "Slug", type: "text" }, { name: "name", label: "Name", type: "loc" }, { name: "sort", label: "Sort order", type: "number" }]}
      prep={f => ({ slug: f.slug, name: f.name, sort: +f.sort || 0 })} />}</div>);
}
