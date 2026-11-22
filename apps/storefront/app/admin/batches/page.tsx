"use client";
import { Crud } from "../_c/crud";
import { locText } from "../_c/ui";
export default function Batches() {
  return <Crud title="Product batches" sub="A batch is shown on the public product page only when 'Verified' is ticked." base="/api/admin/batches"
    defaults={{ productId: "", supplierId: null, batchNumber: "", producer: "", origin: "", region: "", harvestDate: null, packagingDate: null, quantity: null, documents: [], verified: false }}
    cols={[{ label: "Batch", render: r => r.batchNumber }, { label: "Product", render: r => locText(r.product?.name) }, { label: "Supplier", render: r => r.supplier?.name }, { label: "Harvest", render: r => r.harvestDate?.slice(0, 10) }, { label: "Verified", render: r => (r.verified ? "Yes" : "No") }]}
    fields={[{ name: "productId", label: "Product", type: "select", optionsFrom: { path: "/api/admin/products", label: r => locText(r.name) } }, { name: "supplierId", label: "Supplier", type: "select", optionsFrom: { path: "/api/admin/suppliers", label: r => r.name } },
      { name: "batchNumber", label: "Batch number", type: "text" }, { name: "producer", label: "Producer", type: "text" }, { name: "origin", label: "Origin", type: "text" }, { name: "region", label: "Region", type: "text" },
      { name: "harvestDate", label: "Harvest date", type: "date" }, { name: "packagingDate", label: "Packaging date", type: "date" }, { name: "quantity", label: "Quantity (units)", type: "number" },
      { name: "documents", label: "Document URLs (lab analyses…)", type: "lines" }, { name: "verified", label: "Verified (publicly visible)", type: "bool" }]}
    prep={f => ({ productId: f.productId, supplierId: f.supplierId || null, batchNumber: f.batchNumber, producer: f.producer || null, origin: f.origin || null, region: f.region || null, harvestDate: f.harvestDate || null, packagingDate: f.packagingDate || null, quantity: f.quantity ?? null, documents: f.documents || [], verified: !!f.verified })} />;
}
