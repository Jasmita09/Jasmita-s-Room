import React, { useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { bus } from "./bus.js";
import * as THREE from "three";
import { canvasTexture } from "./textures.js";

const FACES = {
  classic: {
    eyes: [[[-0.105, 0.03], [-0.035, 0.03], [-0.07, 0.09]], [[0.035, 0.03], [0.105, 0.03], [0.07, 0.09]]],
    nose: [[-0.02, -0.005], [0.02, -0.005], [0, 0.03]],
    mouth: [[-0.12, -0.03], [-0.06, -0.045], [-0.045, -0.072], [-0.025, -0.045], [0.025, -0.045], [0.045, -0.072], [0.06, -0.045], [0.12, -0.03], [0.08, -0.1], [0, -0.125], [-0.08, -0.1]]
  },
  happy: {
    eyes: [[[-0.1, 0.035], [-0.04, 0.035], [-0.07, 0.085]], [[0.04, 0.035], [0.1, 0.035], [0.07, 0.085]]],
    nose: [[-0.015, 0.0], [0.015, 0.0], [0, 0.025]],
    mouth: [[-0.11, -0.02], [-0.03, -0.05], [0.03, -0.05], [0.11, -0.02], [0.06, -0.09], [0, -0.105], [-0.06, -0.09]]
  },
  spooky: {
    eyes: [[[-0.11, 0.07], [-0.03, 0.03], [-0.09, 0.02]], [[0.03, 0.03], [0.11, 0.07], [0.09, 0.02]]],
    nose: [[-0.018, -0.01], [0.018, -0.01], [0, 0.02]],
    mouth: [[-0.11, -0.05], [-0.07, -0.03], [-0.05, -0.06], [-0.02, -0.03], [0.02, -0.06], [0.05, -0.03], [0.07, -0.06], [0.11, -0.05], [0.07, -0.11], [-0.07, -0.11]]
  }
};
const R = 0.2, SQUASH = 0.8, RIBS = 10;

let SHELL = null;
function shellGeometry() {
  if (SHELL) return SHELL;
  const g = new THREE.SphereGeometry(R, 40, 16);
  const p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const phi = Math.atan2(v.z, -v.x);
    const rib = 1 - 0.075 * (0.5 - 0.5 * Math.cos(RIBS * (phi - Math.PI / 2)));
    const yn = v.y / R;
    p.setXYZ(i, v.x * rib, v.y * SQUASH - (yn > 0.8 ? (yn - 0.8) * 0.12 : 0) + (yn < -0.85 ? (-0.85 - yn) * 0.08 : 0), v.z * rib);
  }
  g.computeVertexNormals();
  return (SHELL = g);
}

// Carved face painted into the pumpkin's own UVs: dark carved rims + bright cut-outs (emissive map).
function faceTextures(face) {
  const f = FACES[face] || FACES.classic;
  const shapes = [...f.eyes, f.nose, f.mouth];
  const path = (g, pts) => { g.beginPath(); pts.forEach(([x, y], i) => { const a = 32 + x * 118, b = 33 - y * 112; if (i) g.lineTo(a, b); else g.moveTo(a, b); }); g.closePath(); };
  const skin = canvasTexture(128, 64, (g, w, h) => {
    g.fillStyle = "#d8661f"; g.fillRect(0, 0, w, h);
    for (let k = 0; k < RIBS; k++) { const x = (k / RIBS) * w; g.fillStyle = "#a9461a"; g.fillRect(x - 1, 0, 2, h); g.fillStyle = "#ec8a3c"; g.fillRect(x + 5, 8, 2, h - 16); }
    g.strokeStyle = "#5a240c"; g.lineWidth = 1.5; g.beginPath();
    for (let x = 0; x <= w; x += 4) g.lineTo(x, 11 + ((x / 4) % 2) * 2);
    g.stroke();
    shapes.forEach((s) => { path(g, s); g.lineWidth = 3; g.strokeStyle = "#5c2209"; g.stroke(); g.fillStyle = "#ffd36b"; g.fill(); });
  });
  const glow = canvasTexture(128, 64, (g, w, h) => {
    g.fillStyle = "#000"; g.fillRect(0, 0, w, h);
    shapes.forEach((s) => { path(g, s); g.lineWidth = 3; g.strokeStyle = "#6a2604"; g.stroke(); g.fillStyle = "#ffb347"; g.fill(); });
  });
  return [skin, glow];
}

// Ribbed carved pumpkin; the flickering candle light sits INSIDE the shell so only the cut-outs glow.
const _purple = new THREE.Color("#a35cff");
export function JackOLantern({ position, rotation = [0, 0, 0], scale = 1, seed = 0, face = "classic", light = true, intensity = 2.4 }) {
  const lightRef = useRef();
  const dip = useRef(0), purple = useRef(0);
  useEffect(() => bus.on("witching", () => { purple.current = 5; }), []);
  const geo = useMemo(shellGeometry, []);
  const mat = useMemo(() => {
    const [map, glow] = faceTextures(face);
    return new THREE.MeshStandardMaterial({ map, emissiveMap: glow, emissive: new THREE.Color("#ffffff"), emissiveIntensity: 1.2, roughness: 0.62, flatShading: true });
  }, [face]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + seed * 3.7;
    let f = 0.82 + 0.09 * Math.sin(t * 11.3) + 0.06 * Math.sin(t * 23.1 + seed) + 0.05 * Math.sin(t * 5.3 + 1.7) + (Math.random() - 0.5) * 0.06;
    if (Math.random() < 0.01) dip.current = 0.45;
    dip.current *= 0.92;
    f -= dip.current * 0.5;
    purple.current = Math.max(0, purple.current - 1 / 60);
    const pw = Math.min(1, purple.current);
    mat.emissive.setRGB(1 - pw * 0.45, 1 - pw * 0.85, 1); if (pw > 0) f *= 1.25;
    if (lightRef.current) lightRef.current.color.set("#ff9b3d").lerp(_purple, pw);
    mat.emissiveIntensity = 0.75 + f * 0.75;
    if (lightRef.current) lightRef.current.intensity = intensity * scale * f;
  });
  const cy = R * SQUASH;
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={geo} material={mat} position={[0, cy, 0]} />
      <mesh position={[0.008, cy * 2 + 0.02, 0]} rotation={[0.1, 0, 0.22]}><cylinderGeometry args={[0.016, 0.026, 0.085, 6]} /><meshStandardMaterial color="#5b5a2a" flatShading roughness={0.8} /></mesh>
      <mesh position={[0.05, cy * 2, 0.02]} rotation={[Math.PI / 2, 0, 0.4]}><torusGeometry args={[0.03, 0.005, 4, 10, Math.PI * 1.3]} /><meshStandardMaterial color="#6b7a3a" /></mesh>
      {light && <pointLight ref={lightRef} position={[0, cy + 0.02, 0.05]} color="#ff9b3d" distance={2.6} decay={2} intensity={intensity} />}
    </group>
  );
}
