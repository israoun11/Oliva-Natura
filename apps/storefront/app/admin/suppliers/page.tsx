"use client";
import { Crud } from "../_c/crud";
export default function Suppliers() {
  return <Crud title="Suppliers" sub="Verified supplier/producer information for traceability. Only enter confirmed facts." base="/api/admin/suppliers" defaults={{ name: "", contact: "", region: "", notes: "" }}
    cols={[{ label: "Name", render: r => r.name }, { label: "Region", render: r => r.region }, { label: "Contact", render: r => r.contact }]}
    fields={[{ name: "name", label: "Name", type: "text" }, { name: "contact", label: "Contact", type: "text" }, { name: "region", label: "Region", type: "text" }, { name: "notes", label: "Notes", type: "textarea" }]}
    prep={f => ({ name: f.name, contact: f.contact || null, region: f.region || null, notes: f.notes || null })} />;
}
