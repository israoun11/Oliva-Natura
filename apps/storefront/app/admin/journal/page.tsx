"use client";
import { Crud } from "../_c/crud";
import { locText } from "../_c/ui";
const L = { en: "", fr: "", ar: "" };
export default function Journal() {
  return <Crud title="Journal" sub="Articles shown at /journal. Each article supports English, French and Arabic." base="/api/admin/articles" defaults={{ slug: "", title: L, excerpt: L, body: L, category: "", coverUrl: "", published: false }}
    cols={[{ label: "Title", render: r => locText(r.title) }, { label: "Category", render: r => r.category }, { label: "Status", render: r => (r.published ? "Published " + (r.publishedAt || "").slice(0, 10) : "Draft") }]}
    fields={[{ name: "slug", label: "Slug", type: "text" }, { name: "title", label: "Title", type: "loc" }, { name: "excerpt", label: "Excerpt", type: "locarea" }, { name: "body", label: "Body", type: "locarea" }, { name: "category", label: "Category", type: "text" }, { name: "coverUrl", label: "Cover image", type: "image", folder: "journal" }, { name: "published", label: "Published", type: "bool" }]}
    prep={f => ({ slug: f.slug, title: f.title, excerpt: f.excerpt || L, body: f.body, category: f.category || undefined, coverUrl: f.coverUrl || null, published: !!f.published })} />;
}
