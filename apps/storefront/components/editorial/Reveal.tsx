"use client";
import { useEffect, useRef } from "react";
// Gentle scroll-reveal. Without JS, with reduced motion, or without IntersectionObserver everything simply stays visible.
export default function Reveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    el.classList.add("ed-ready");
    const io = new IntersectionObserver((es: IntersectionObserverEntry[]) => es.forEach((e: IntersectionObserverEntry) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.12 });
    el.querySelectorAll(".ed-r").forEach((n: Element) => io.observe(n));
    return () => io.disconnect();
  }, []);
  return <div ref={ref}>{children}</div>;
}
