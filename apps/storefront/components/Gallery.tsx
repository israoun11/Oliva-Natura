"use client";
import { useState } from "react";
import { img } from "@/lib/api";
import Viewer3D from "./Viewer3D";
// Image gallery with an optional real 3D (GLB) tab. Falls back to photos only when no model exists.
export default function Gallery({ images, glb, labels }: { images: { id: string; url: string; alt?: any }[]; glb?: string; labels: { photos: string; view3d: string } }) {
  const [i, setI] = useState(0), [mode, setMode] = useState<"photo" | "3d">("photo");
  return (<div>
    <div style={{ background: "color-mix(in srgb,var(--fg) 5%,transparent)", aspectRatio: "1", display: "grid", placeItems: "center", overflow: "hidden" }}>
      {mode === "3d" && glb ? <Viewer3D url={glb} /> : images[i] ? <img src={img(images[i].url, 1000)} alt={images[i].alt?.en || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span className="muted">—</span>}</div>
    <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
      {glb && <button className={"thumb" + (mode === "3d" ? " on" : "")} onClick={() => setMode("3d")}>{labels.view3d}</button>}
      {images.map((im, k) => <button key={im.id} className={"thumb" + (mode === "photo" && k === i ? " on" : "")} onClick={() => { setI(k); setMode("photo"); }} aria-label={`${labels.photos} ${k + 1}`}><img src={img(im.url, 120)} alt="" style={{ width: 56, height: 56, objectFit: "cover", display: "block" }} /></button>)}</div></div>);
}
