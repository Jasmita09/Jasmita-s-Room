import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const cache = new Map();
function bubbleTexture(text, ink, bg) {
  const key = text + "|" + ink + "|" + bg;
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement("canvas"); c.width = 1024; c.height = 512;
  const g = c.getContext("2d"); g.scale(2, 2);
  const fam = "'Trebuchet MS', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
  let size = 92;
  g.font = "900 " + size + "px " + fam;
  let tw = g.measureText(text).width;
  if (tw > 400) { size = Math.floor((size * 400) / tw); g.font = "900 " + size + "px " + fam; tw = g.measureText(text).width; }
  const w = Math.max(200, tw + 90), h = 150, x = (512 - w) / 2, y = 14, r = 60;
  g.lineWidth = 10; g.strokeStyle = ink; g.fillStyle = bg; g.lineJoin = "round";
  g.beginPath();
  g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
  g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  g.lineTo(282, y + h); g.lineTo(240, 240); g.lineTo(246, y + h);
  g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r); g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y);
  g.closePath(); g.fill(); g.stroke();
  g.fillStyle = ink; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, 256, y + h / 2 + 4);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  cache.set(key, t);
  return t;
}

// Comic speech bubble that always faces the camera: pops in when `text` is set, shrinks away when it clears.
export function Bubble({ text, position = [0, 0, 0], scale = 0.25, ink = "#2c2024", bg = "#fff8ee" }) {
  const ref = useRef(), s = useRef(0), last = useRef(text);
  if (text) last.current = text;
  const label = last.current;
  const tex = useMemo(() => (label ? bubbleTexture(label, ink, bg) : null), [label, ink, bg]);
  useFrame((_, dt) => {
    const o = ref.current; if (!o) return;
    s.current += ((text ? 1 : 0) - s.current) * (1 - Math.exp(-Math.min(dt, 0.05) * 14));
    const k = s.current * (1 + 0.1 * Math.sin(s.current * Math.PI));
    o.scale.set(scale * 2 * k + 1e-4, scale * k + 1e-4, 1);
    o.visible = s.current > 0.02;
  });
  if (!tex) return null;
  return (
    <sprite ref={ref} position={position} renderOrder={30} scale={[1e-4, 1e-4, 1]}>
      <spriteMaterial map={tex} transparent depthTest={false} depthWrite={false} toneMapped={false} fog={false} />
    </sprite>
  );
}
