"use client";
import { Crud } from "../_c/crud";
const ROLES = ["SUPER_ADMIN", "STORE_MANAGER", "CONTENT_EDITOR", "ORDER_MANAGER"].map(v => ({ value: v, label: v.replace("_", " ") }));
export default function Users() {
  return <Crud title="Admin users" sub="Super Admin: everything · Store Manager: catalog, orders, customers, settings · Content Editor: content · Order Manager: orders, customers." base="/api/admin/users" canDelete={false}
    defaults={{ email: "", name: "", role: "CONTENT_EDITOR", password: "", active: true }}
    cols={[{ label: "Name", render: r => r.name }, { label: "Email", render: r => r.email }, { label: "Role", render: r => r.role }, { label: "Active", render: r => (r.active ? "Yes" : "No") }]}
    fields={[{ name: "email", label: "Email", type: "text", createOnly: true }, { name: "name", label: "Name", type: "text" }, { name: "role", label: "Role", type: "select", options: ROLES }, { name: "active", label: "Active", type: "bool" }, { name: "password", label: "Password (min 12 chars; leave empty to keep)", type: "password" }]}
    prep={(f, isNew) => (isNew ? { email: f.email, name: f.name, role: f.role, password: f.password } : { name: f.name, role: f.role, active: !!f.active, ...(f.password ? { password: f.password } : {}) })} />;
}
