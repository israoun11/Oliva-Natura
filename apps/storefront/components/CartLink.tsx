"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cart } from "@/lib/api";
export default function CartLink({ label }: { label: string }) {
  const [n, setN] = useState(0);
  useEffect(() => { const s = () => setN(cart.read().reduce((a, i) => a + i.quantity, 0)); s(); window.addEventListener("cart", s); return () => window.removeEventListener("cart", s); }, []);
  return <Link href="/cart">{label}{n > 0 && <span className="badge">{n}</span>}</Link>;
}
