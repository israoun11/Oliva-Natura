"use client";
import { useEffect, useRef, useState } from "react";
// Real GLB/GLTF viewer. three + GLTFLoader + OrbitControls are loaded on demand (kept out of the main bundle).
export default function Viewer3D({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement>(null), [err, setErr] = useState("");
  useEffect(() => {
    let stop = false, cleanup = () => {};
    (async () => {
      try {
        const THREE: any = await import("three");
        const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
        const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
        const el = ref.current!; if (!el || stop) return;
        const w = el.clientWidth, h = el.clientHeight;
        const r = new THREE.WebGLRenderer({ antialias: true, alpha: true }); r.setPixelRatio(Math.min(devicePixelRatio, 2)); r.setSize(w, h); r.outputEncoding = THREE.sRGBEncoding; el.appendChild(r.domElement);
        const s = new THREE.Scene(), c = new THREE.PerspectiveCamera(32, w / h, 0.1, 100);
        s.add(new THREE.HemisphereLight(0xfff3df, 0x56664a, 1)); const k = new THREE.DirectionalLight(0xffffff, 1.6); k.position.set(4, 6, 6); s.add(k);
        const gltf: any = await new GLTFLoader().loadAsync(url); if (stop) return;
        const box = new THREE.Box3().setFromObject(gltf.scene), size = box.getSize(new THREE.Vector3()), ctr = box.getCenter(new THREE.Vector3());
        gltf.scene.position.sub(ctr); s.add(gltf.scene); const d = Math.max(size.x, size.y, size.z) * 2.6; c.position.set(0, 0, d);
        const ctl = new OrbitControls(c, r.domElement); ctl.enableZoom = false; ctl.autoRotate = !matchMedia("(prefers-reduced-motion: reduce)").matches; ctl.autoRotateSpeed = 2;
        let raf = 0; const loop = () => { raf = requestAnimationFrame(loop); ctl.update(); r.render(s, c); }; loop();
        cleanup = () => { cancelAnimationFrame(raf); ctl.dispose(); r.dispose(); r.domElement.remove(); };
      } catch (e: any) { setErr("3D model could not be loaded."); }
    })();
    return () => { stop = true; cleanup(); };
  }, [url]);
  return <div ref={ref} style={{ width: "100%", height: "100%" }} aria-label="3D product viewer">{err && <p className="muted">{err}</p>}</div>;
}
