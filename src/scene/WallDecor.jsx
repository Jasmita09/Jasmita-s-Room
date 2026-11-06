import React, { useMemo, useRef, useState } from "react";
import { useHover } from "./cursor.js";
import { bus, ui } from "./bus.js";
import { Bubble } from "./Bubble.jsx";
import { playBoo } from "../audio/keyClick.js";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { canvasTexture, rng } from "./textures.js";
import { Crisp } from "./PixelComposer.jsx";

// ─── Pixel-art Halloween rug ────────────────────────────────────────────────
function pxPumpkin(g, cx, cy, R) {
  for (let dy = -R; dy <= R; dy++) {
    const half = Math.round(Math.sqrt(Math.max(0, 1 - (dy / R) ** 2)) * R * 1.25);
    g.fillStyle = dy < -R * 0.5 ? "#f08a3c" : "#e8772e"; g.fillRect(cx - half, cy + dy, half * 2 + 1, 1);
  }
  g.fillStyle = "#b8501f";
  [-0.5, 0.5].forEach((o) => g.fillRect(Math.round(cx + o * R), cy - R + 2, 1, 2 * R - 3));
  g.fillStyle = "#4a6b2a"; g.fillRect(cx - 1, cy - R - 3, 2, 3); g.fillRect(cx + 1, cy - R - 3, 2, 1);
  g.fillStyle = "#ffd27a";
  const e = Math.max(1, Math.round(R * 0.22)), ey = cy - Math.round(R * 0.3);
  [-1, 1].forEach((sd) => { const ex = cx + sd * Math.round(R * 0.5); for (let i = 0; i <= e; i++) g.fillRect(ex - i, ey + i, 2 * i + 1, 1); });
  const mw = Math.round(R * 1.3), my = cy + Math.round(R * 0.3), mh = Math.max(2, Math.round(R * 0.28));
  g.fillRect(cx - (mw >> 1), my, mw, mh);
  g.fillStyle = "#e8772e";
  for (let x = cx - (mw >> 1) + 2; x < cx + (mw >> 1) - 1; x += 3) g.fillRect(x, my, 1, 1);
}
function pxBat(g, x, y, c = "#0b070b") {
  g.fillStyle = c;
  g.fillRect(x - 1, y - 1, 3, 3); g.fillRect(x - 1, y - 2, 1, 1); g.fillRect(x + 1, y - 2, 1, 1);
  const wing = [[2, -1], [3, -2], [4, -2], [5, -1], [6, 0], [5, 1], [3, 0]];
  wing.forEach(([dx, dy]) => { g.fillRect(x + dx, y + dy, 1, 2); g.fillRect(x - dx, y + dy, 1, 2); });
  g.fillStyle = "#ffb84a"; g.fillRect(x - 1, y - 1, 1, 1); g.fillRect(x + 1, y - 1, 1, 1);
}
export const halloweenRugTexture = () => canvasTexture(96, 64, (g, w, h) => {
  for (let x = 0; x < w; x += 4) for (let y = 0; y < h; y += 4) {
    g.fillStyle = (x / 4 + y / 4) % 2 ? "#e8772e" : "#1a1014"; g.fillRect(x, y, 4, 4);
  }
  g.fillStyle = "#2a1436"; g.fillRect(8, 8, w - 16, h - 16);
  g.fillStyle = "#3b1f4a"; g.fillRect(11, 11, w - 22, h - 22);
  g.fillStyle = "#d97d46"; g.fillRect(10, 10, w - 20, 1); g.fillRect(10, h - 11, w - 20, 1); g.fillRect(10, 10, 1, h - 20); g.fillRect(w - 11, 10, 1, h - 20);
  const r = rng(13);
  for (let i = 0; i < 46; i++) { g.fillStyle = r() < 0.7 ? "#f6c88f" : "#b98fd6"; g.fillRect(13 + ((r() * (w - 26)) | 0), 13 + ((r() * (h - 26)) | 0), 1, 1); }
  // cobweb corners
  g.fillStyle = "#9d8aa8";
  [[12, 12, 1, 1], [w - 13, 12, -1, 1], [12, h - 13, 1, -1], [w - 13, h - 13, -1, -1]].forEach(([x, y, sx, sy]) => {
    for (let i = 0; i < 9; i++) { g.fillRect(x + sx * i, y, 1, 1); g.fillRect(x, y + sy * i, 1, 1); g.fillRect(x + sx * i, y + sy * i, 1, 1); }
    for (let i = 0; i < 6; i++) { g.fillRect(x + sx * 6, y + sy * i, 1, 1); g.fillRect(x + sx * i, y + sy * 6, 1, 1); }
  });
  // crescent moon
  for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) {
    if (dx * dx + dy * dy <= 36 && (dx - 3) ** 2 + (dy + 1) ** 2 > 25) { g.fillStyle = "#fdf0c8"; g.fillRect(w / 2 + dx, 20 + dy, 1, 1); }
  }
  pxPumpkin(g, w / 2, h / 2 + 6, 10);
  pxPumpkin(g, 25, h / 2 + 9, 6);
  pxPumpkin(g, w - 25, h / 2 + 9, 6);
  pxBat(g, 24, 21); pxBat(g, w - 24, 19); pxBat(g, w / 2 - 14, 16); pxBat(g, w / 2 + 15, 24);
});

// ─── 3D decorations ─────────────────────────────────────────────────────────
const WING = (() => {
  const s = new THREE.Shape();
  s.moveTo(0, 0.02); s.quadraticCurveTo(0.12, 0.13, 0.3, 0.12); s.lineTo(0.27, 0.05);
  s.quadraticCurveTo(0.23, -0.01, 0.19, 0.03); s.quadraticCurveTo(0.15, -0.05, 0.1, 0.0);
  s.quadraticCurveTo(0.06, -0.06, 0, -0.03); s.closePath();
  return new THREE.ShapeGeometry(s, 6);
})();
const batMat = new THREE.MeshStandardMaterial({ color: "#140d14", roughness: 0.55, side: THREE.DoubleSide });
const eyeMat = new THREE.MeshStandardMaterial({ color: "#ffb84a", emissive: "#ff9a2e", emissiveIntensity: 2, toneMapped: false });

function Bat({ position, rotation, scale = 1, speed = 1, phase = 0, amp = 0.35 }) {
  const L = useRef(), R = useRef(), body = useRef();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 3 * speed + phase, a = Math.sin(t) * amp;
    if (L.current) L.current.rotation.y = -a;
    if (R.current) R.current.rotation.y = a;
    if (body.current) body.current.position.y = Math.sin(t) * 0.01;
  });
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <group ref={body}>
        <mesh scale={[0.6, 1, 0.5]} material={batMat}><sphereGeometry args={[0.065, 8, 6]} /></mesh>
        <mesh position={[0, 0.085, 0]} material={batMat}><sphereGeometry args={[0.045, 8, 6]} /></mesh>
        {[-1, 1].map((sd) => <mesh key={sd} position={[sd * 0.025, 0.135, 0]} rotation={[0, 0, -sd * 0.25]} material={batMat}><coneGeometry args={[0.015, 0.05, 4]} /></mesh>)}
        {[-1, 1].map((sd) => <mesh key={"e" + sd} position={[sd * 0.017, 0.092, 0.04]} material={eyeMat}><sphereGeometry args={[0.008, 6, 4]} /></mesh>)}
        <group ref={R} position={[0.02, 0.03, 0]}><mesh geometry={WING} material={batMat} /></group>
        <group ref={L} position={[-0.02, 0.03, 0]} scale={[-1, 1, 1]}><mesh geometry={WING} material={batMat} /></group>
      </group>
    </group>
  );
}

// Two bats that loop lazily under the ceiling.
function FlyingBat({ center, radius, height, speed, phase, scale }) {
  const g = useRef();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * speed + phase, o = g.current; if (!o) return;
    o.position.set(center[0] + Math.cos(t) * radius, height + Math.sin(t * 2.3) * 0.18, center[1] + Math.sin(t) * radius * 0.55);
    o.rotation.y = -t + (speed > 0 ? Math.PI : 0);
  });
  return <group ref={g}><Bat scale={scale} speed={2.2} amp={0.75} phase={phase} /></group>;
}

const posterCache = {};
function posterTexture(kind) {
  if (posterCache[kind]) return posterCache[kind];
  const tex = canvasTexture(256, 340, (g, w, h) => {
    const sky = g.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#1d1030"); sky.addColorStop(0.6, kind === "moon" ? "#5a2448" : "#2c2a4a"); sky.addColorStop(1, "#c25934");
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    const r = rng(kind === "moon" ? 3 : 8);
    for (let i = 0; i < 60; i++) { g.fillStyle = "rgba(255,240,210," + (0.3 + r() * 0.7) + ")"; g.fillRect(r() * w, r() * h * 0.6, 1.5, 1.5); }
    const mx = kind === "moon" ? w / 2 : w * 0.72, my = kind === "moon" ? 120 : 70, mr = kind === "moon" ? 72 : 34;
    const glow = g.createRadialGradient(mx, my, mr * 0.6, mx, my, mr * 1.8);
    glow.addColorStop(0, "rgba(255,230,170,0.55)"); glow.addColorStop(1, "rgba(255,230,170,0)");
    g.fillStyle = glow; g.fillRect(0, 0, w, h);
    g.fillStyle = "#fdf0c8"; g.beginPath(); g.arc(mx, my, mr, 0, Math.PI * 2); g.fill();
    g.fillStyle = "rgba(200,170,120,0.35)";
    [[-0.3, -0.2, 0.18], [0.25, 0.15, 0.12], [-0.05, 0.35, 0.1]].forEach(([a, b, c]) => { g.beginPath(); g.arc(mx + a * mr, my + b * mr, c * mr, 0, Math.PI * 2); g.fill(); });
    g.fillStyle = "#140b14";
    if (kind === "moon") {
      // witch-on-broom silhouette across the moon
      g.save(); g.translate(mx - 10, my + 8); g.rotate(-0.18);
      g.fillRect(-70, -2, 120, 4);
      g.beginPath(); g.moveTo(-70, 0); g.lineTo(-96, -12); g.lineTo(-100, 0); g.lineTo(-96, 12); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(-10, 0); g.lineTo(18, 0); g.lineTo(6, -34); g.closePath(); g.fill();
      g.beginPath(); g.arc(8, -40, 9, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.moveTo(-8, -46); g.lineTo(24, -46); g.lineTo(2, -78); g.closePath(); g.fill();
      g.fillRect(-14, -48, 40, 4);
      g.restore();
    } else {
      // haunted house on a hill
      g.beginPath(); g.moveTo(0, h); g.quadraticCurveTo(w * 0.5, h * 0.62, w, h * 0.8); g.lineTo(w, h); g.closePath(); g.fill();
      g.fillRect(70, 170, 100, 90); g.fillRect(150, 140, 30, 60); g.fillRect(84, 140, 28, 40);
      g.beginPath(); g.moveTo(60, 172); g.lineTo(120, 120); g.lineTo(180, 172); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(144, 142); g.lineTo(165, 105); g.lineTo(186, 142); g.closePath(); g.fill();
      g.fillStyle = "#ffc65a"; [[86, 190], [128, 190], [86, 222], [156, 160], [118, 150]].forEach(([x, y]) => g.fillRect(x, y, 14, 16));
      g.fillStyle = "#140b14"; g.fillRect(126, 230, 16, 30);
    }
    g.fillStyle = "#140b14";
    [[40, 50], [205, 200], [60, 210]].forEach(([x, y], i) => {
      if (kind === "moon" && i === 1) return;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x - 10, y - 10, x - 18, y - 4); g.quadraticCurveTo(x - 10, y - 2, x, y + 4);
      g.quadraticCurveTo(x + 10, y - 2, x + 18, y - 4); g.quadraticCurveTo(x + 10, y - 10, x, y); g.fill();
    });
    if (kind === "moon") {
      [[50, 300, 16], [205, 305, 12], [128, 312, 20]].forEach(([x, y, rr]) => {
        g.fillStyle = "#e8772e"; g.beginPath(); g.ellipse(x, y, rr * 1.25, rr, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = "#ffd27a"; g.fillRect(x - rr * 0.6, y - rr * 0.35, rr * 0.35, rr * 0.3); g.fillRect(x + rr * 0.25, y - rr * 0.35, rr * 0.35, rr * 0.3); g.fillRect(x - rr * 0.6, y + rr * 0.2, rr * 1.2, rr * 0.25);
      });
    }
    g.fillStyle = "#fdf7f2"; g.textAlign = "center"; g.lineJoin = "round";
    g.font = "700 30px Georgia, 'Times New Roman', serif";
    g.lineWidth = 6; g.strokeStyle = "#140b14"; g.strokeText(kind === "moon" ? "Happy Halloween" : "Spooky Season", w / 2, kind === "moon" ? 250 : 300);
    g.fillText(kind === "moon" ? "Happy Halloween" : "Spooky Season", w / 2, kind === "moon" ? 250 : 300);
    g.font = "italic 700 17px Georgia, serif"; g.fillStyle = "#ffd9a8";
    g.lineWidth = 4; g.strokeText(kind === "moon" ? "brew something magical" : "est. 2026 \u00b7 Atlanta", w / 2, kind === "moon" ? 272 : 322);
    g.fillText(kind === "moon" ? "brew something magical" : "est. 2026 \u00b7 Atlanta", w / 2, kind === "moon" ? 272 : 322);
  }, { pixel: false, hd: 3 });
  posterCache[kind] = tex;
  return tex;
}

function Poster({ kind, position, rotation, size = [0.8, 1.06] }) {
  const tex = useMemo(() => posterTexture(kind), [kind]);
  return (
    <Crisp><group position={position} rotation={rotation}>
      <mesh><boxGeometry args={[size[0] + 0.08, size[1] + 0.08, 0.03]} /><meshStandardMaterial color="#1c1b1e" metalness={0.4} roughness={0.5} /></mesh>
      <mesh position={[0, 0, 0.016]}><planeGeometry args={size} /><meshStandardMaterial map={tex} roughness={0.7} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.18} /></mesh>
    </group></Crisp>
  );
}

// Sagging string between two wall points with little bats swinging from it.
function BatGarland({ a, b, sag = 0.35, count = 5 }) {
  const { curve, pts } = useMemo(() => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), M = A.clone().lerp(B, 0.5); M.y -= sag;
    const c = new THREE.QuadraticBezierCurve3(A, M, B);
    return { curve: c, pts: Array.from({ length: count }, (_, i) => c.getPoint((i + 1) / (count + 1))) };
  }, [a, b, sag, count]);
  const swing = useRef([]);
  useFrame(({ clock }) => swing.current.forEach((o, i) => { if (o) o.rotation.z = Math.sin(clock.elapsedTime * 1.6 + i * 1.3) * 0.18; }));
  return (
    <group>
      <mesh><tubeGeometry args={[curve, 24, 0.006, 4, false]} /><meshStandardMaterial color="#2c2024" /></mesh>
      {pts.map((p, i) => (
        <group key={i} position={p} ref={(o) => (swing.current[i] = o)}>
          <mesh position={[0, -0.06, 0]}><cylinderGeometry args={[0.002, 0.002, 0.12, 3]} /><meshStandardMaterial color="#2c2024" /></mesh>
          <Bat position={[0, -0.2, 0]} rotation={[0, 0, Math.PI]} scale={0.55} phase={i} amp={0.2} />
        </group>
      ))}
    </group>
  );
}

function Web({ position, rotation, size = 0.7 }) {
  const geo = useMemo(() => {
    const v = [], N = 7, rings = 5, R = size, a0 = -Math.PI / 2, span = Math.PI / 2;
    const at = (i, k) => { const a = a0 + (span * i) / (N - 1), r = (R * k) / rings * (1 - 0.08 * Math.sin(i * 2.1)); return [Math.cos(a) * r, Math.sin(a) * r, 0]; };
    for (let i = 0; i < N; i++) v.push(0, 0, 0, ...at(i, rings));
    for (let k = 1; k <= rings; k++) for (let i = 0; i < N - 1; i++) v.push(...at(i, k), ...at(i + 1, k));
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3)); return g;
  }, [size]);
  const spider = useRef();
  useFrame(({ clock }) => { if (spider.current) spider.current.position.y = -size * 0.55 - 0.18 - Math.sin(clock.elapsedTime * 0.7) * 0.15; });
  return (
    <group position={position} rotation={rotation}>
      <lineSegments geometry={geo}><lineBasicMaterial color="#e9dfd2" transparent opacity={0.55} /></lineSegments>
      <group position={[size * 0.4, 0, 0.02]}>
        <group ref={spider}>
          <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.002, 0.002, 1, 3]} /><meshBasicMaterial color="#e9dfd2" transparent opacity={0.5} /></mesh>
          <mesh><sphereGeometry args={[0.035, 8, 6]} /><meshStandardMaterial color="#140d14" /></mesh>
          <mesh position={[0, -0.045, 0]}><sphereGeometry args={[0.045, 8, 6]} /><meshStandardMaterial color="#140d14" /></mesh>
          {[-1, 1].flatMap((sd) => [0.4, 0.1, -0.2, -0.5].map((a, i) => (
            <mesh key={sd + "_" + i} position={[sd * 0.05, -0.02 + a * 0.04, 0]} rotation={[0, 0, sd * (1.2 + a)]}><cylinderGeometry args={[0.004, 0.004, 0.09, 3]} /><meshStandardMaterial color="#140d14" /></mesh>
          )))}
          {[-1, 1].map((sd) => <mesh key={sd} position={[sd * 0.012, 0.008, 0.032]} material={eyeMat}><sphereGeometry args={[0.006, 5, 4]} /></mesh>)}
        </group>
      </group>
    </group>
  );
}

function Ghost({ position, rotation, string = true }) {
  const g = useRef();
  useFrame(({ clock }) => { const t = clock.elapsedTime, o = g.current; if (!o) return; o.position.y = Math.sin(t * 1.3) * 0.06; o.rotation.z = Math.sin(t * 0.9) * 0.12; });
  const white = <meshStandardMaterial color="#f6f0ea" emissive="#d8d0ff" emissiveIntensity={0.35} roughness={0.6} />;
  return (
    <group position={position} rotation={rotation}>
      {string && <mesh position={[0, 0.25, 0]}><cylinderGeometry args={[0.003, 0.003, 0.5, 3]} /><meshStandardMaterial color="#2c2024" /></mesh>}
      <group ref={g}>
        <mesh position={[0, -0.12, 0]}><sphereGeometry args={[0.15, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />{white}</mesh>
        <mesh position={[0, -0.24, 0]}><cylinderGeometry args={[0.15, 0.18, 0.24, 14, 1, true]} />{white}</mesh>
        {[0, 1, 2, 3, 4, 5].map((i) => { const a = (i / 6) * Math.PI * 2; return <mesh key={i} position={[Math.cos(a) * 0.15, -0.37, Math.sin(a) * 0.15]}><sphereGeometry args={[0.045, 8, 6]} />{white}</mesh>; })}
        {[-1, 1].map((sd) => <mesh key={sd} position={[sd * 0.05, -0.13, 0.14]} scale={[1, 1.4, 0.5]}><sphereGeometry args={[0.02, 8, 6]} /><meshBasicMaterial color="#1a1014" /></mesh>)}
        <mesh position={[0, -0.2, 0.155]} scale={[1, 1.3, 0.5]}><sphereGeometry args={[0.017, 8, 6]} /><meshBasicMaterial color="#1a1014" /></mesh>
        {[-1, 1].map((sd) => <mesh key={"a" + sd} position={[sd * 0.17, -0.2, 0]} rotation={[0, 0, sd * 0.9]}><capsuleGeometry args={[0.03, 0.08, 4, 6]} />{white}</mesh>)}
      </group>
    </group>
  );
}

function Pennants({ text, a, b, sag = 0.18 }) {
  const { curve, flags } = useMemo(() => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), M = A.clone().lerp(B, 0.5); M.y -= sag;
    const c = new THREE.QuadraticBezierCurve3(A, M, B), n = text.length;
    const colors = ["#e8772e", "#3b1f4a", "#1a1014", "#d97d46", "#7b2d42"];
    return {
      curve: c,
      flags: text.split("").map((ch, i) => ({
        p: c.getPoint((i + 0.75) / (n + 0.5)),
        tex: canvasTexture(64, 80, (g, w, h) => {
          g.fillStyle = colors[i % colors.length]; g.beginPath(); g.moveTo(0, 0); g.lineTo(w, 0); g.lineTo(w / 2, h); g.closePath(); g.fill();
          g.fillStyle = i % colors.length === 0 || i % colors.length === 3 ? "#2c2024" : "#fdf7f2";
          g.font = "700 34px Georgia, serif"; g.textAlign = "center"; g.fillText(ch, w / 2, 38);
        }, { pixel: false, hd: 3 })
      }))
    };
  }, [text, a, b, sag]);
  return (
    <Crisp>
      <mesh><tubeGeometry args={[curve, 24, 0.005, 4, false]} /><meshStandardMaterial color="#e9dcc3" /></mesh>
      {flags.map((f, i) => (
        <mesh key={i} position={[f.p.x, f.p.y - 0.12, f.p.z]} rotation={a[0] > 4 ? [0, -Math.PI / 2, 0] : a[0] < -4 ? [0, Math.PI / 2, 0] : [0, 0, 0]}>
          <planeGeometry args={[0.19, 0.24]} /><meshStandardMaterial map={f.tex} transparent alphaTest={0.4} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </Crisp>
  );
}

const cafeTex = () => canvasTexture(256, 96, (g, w, h) => {
  g.fillStyle = "#2c2024"; g.fillRect(0, 0, w, h);
  g.strokeStyle = "#d97d46"; g.lineWidth = 4; g.strokeRect(6, 6, w - 12, h - 12);
  g.fillStyle = "#fdf7f2"; g.font = "700 34px Georgia, serif"; g.textAlign = "center"; g.fillText("Kitty Caf\u00e9", w / 2 - 14, 58);
  g.fillStyle = "#f6c88f";
  const px = w - 40, py = 46; g.beginPath(); g.ellipse(px, py + 8, 10, 8, 0, 0, Math.PI * 2); g.fill();
  [[-10, -6], [-3, -11], [4, -11], [11, -6]].forEach(([dx, dy]) => { g.beginPath(); g.arc(px + dx, py + dy, 4, 0, Math.PI * 2); g.fill(); });
}, { pixel: false, hd: 3 });

// The ghost just drifts around the room. Click it for a happy twirl + a little hello.
const GHOST_PATH = [[4.0, 3.1, -3.2], [3.6, 2.7, -0.6], [1.2, 3.4, 0.2], [-1.6, 3.0, -0.6], [-0.6, 3.6, -2.7], [2.4, 3.8, -2.6]];
const GHOST_LINES = ["wooo~", "hi there!", "happy haunting!", "boo! ...just kidding", "I love this room!", "wheee!", "so cozy in here~", "have you read the blog?"];
function GhostLife() {
  const g = useRef(), body = useRef(), bub = useRef();
  const [say, setSay] = useState(null);
  const [hover, bind] = useHover(true, "\u{1F47B} Say hi to the ghost");
  const curve = useMemo(() => new THREE.CatmullRomCurve3(GHOST_PATH.map((p) => new THREE.Vector3(...p)), true, "centripetal"), []);
  const S = useMemo(() => ({ pos: new THREE.Vector3(...GHOST_PATH[0]), u: 0, yaw: 0, spin: 0, clearAt: 0, now: 0, next: 14 + Math.random() * 10, last: -1 }), []);
  const tgt = useMemo(() => new THREE.Vector3(), []), d = useMemo(() => new THREE.Vector3(), []);
  const pick = () => { let i; do { i = Math.floor(Math.random() * GHOST_LINES.length); } while (i === S.last); S.last = i; return GHOST_LINES[i]; };
  const sayFor = (txt, sec) => { setSay(txt); S.clearAt = S.now + sec; };
  useFrame(({ clock }, raw) => {
    const dt = Math.min(raw, 0.05), t = clock.elapsedTime; S.now = t;
    if (S.clearAt && t > S.clearAt) { S.clearAt = 0; setSay(null); }
    if (t > S.next) { S.next = t + 18 + Math.random() * 14; sayFor(pick(), 2.2); }
    S.u = (S.u + dt * (hover ? 0.003 : 0.016)) % 1; curve.getPointAt(S.u, tgt);
    d.copy(tgt).sub(S.pos); const len = d.length();
    if (len > 1e-4) {
      S.pos.addScaledVector(d, Math.min(len, 1.6 * dt) / len);
      const yawT = hover ? Math.atan2(-S.pos.x, 6 - S.pos.z) : len > 0.02 ? Math.atan2(d.x, d.z) : S.yaw;
      S.yaw += Math.atan2(Math.sin(yawT - S.yaw), Math.cos(yawT - S.yaw)) * Math.min(1, dt * 4);
    }
    if (S.spin > 0) S.spin = Math.max(0, S.spin - dt / 1.1);
    const o = g.current; if (!o) return;
    const hop = S.spin > 0 ? Math.sin((1 - S.spin) * Math.PI) * 0.25 : 0;
    o.position.set(S.pos.x, S.pos.y + Math.sin(t * 1.3) * 0.06 + hop, S.pos.z);
    o.rotation.y = S.yaw + (1 - S.spin) * Math.PI * 2 * (S.spin > 0 ? 1 : 0);
    o.rotation.z = Math.sin(t * 0.9) * 0.08;
    body.current.scale.setScalar(THREE.MathUtils.lerp(body.current.scale.x, 1 + (hover ? 0.1 : 0) + hop * 0.4, 0.2));
    bub.current.position.set(o.position.x, o.position.y + 0.38, o.position.z);
  });
  return (
    <>
      <group ref={bub}><Bubble text={say} scale={0.17} /></group>
      <group ref={g} {...bind} onClick={(e) => { e.stopPropagation(); S.spin = 1; sayFor(pick(), 2); playBoo(); }}>
        <mesh position={[0, -0.2, 0]}><sphereGeometry args={[0.3, 8, 6]} /><meshBasicMaterial visible={false} /></mesh>
        <group ref={body}><Ghost position={[0, 0, 0]} string={false} /></group>
      </group>
    </>
  );
}

export function WallDecor() {
  const cafe = useMemo(cafeTex, []);
  const BZ = -3.975, LX = -4.975, RX = 4.975, toL = [0, Math.PI / 2, 0], toR = [0, -Math.PI / 2, 0];
  return (
    <group>
      {/* back wall, between the shelf and the window */}
      <Poster kind="moon" position={[-1.08, 2.85, BZ]} size={[0.78, 1.04]} />
      <BatGarland a={[-1.85, 4.55, -3.9]} b={[-0.3, 4.5, -3.86]} sag={0.32} count={4} />
      <Crisp>
      <mesh position={[-1.04, 0.95, BZ]}><boxGeometry args={[0.62, 0.24, 0.02]} /><meshStandardMaterial color="#4a2c28" /></mesh>
      <mesh position={[-1.04, 0.95, BZ + 0.012]}><planeGeometry args={[0.58, 0.2]} /><meshStandardMaterial map={cafe} emissive="#ffffff" emissiveMap={cafe} emissiveIntensity={0.15} /></mesh>
      </Crisp>
      <Bat position={[-0.62, 3.75, BZ + 0.03]} rotation={[0, 0, 0.3]} scale={0.8} phase={1} />
      <Bat position={[-1.6, 3.95, BZ + 0.03]} rotation={[0, 0, -0.2]} scale={0.6} phase={2.4} />
      {/* back wall, right of the window (under the clock) */}
      <Crisp><GhostLife /></Crisp>
      <Bat position={[3.55, 1.55, BZ + 0.03]} rotation={[0, 0, 0.25]} scale={0.7} phase={0.5} />
      <Bat position={[4.75, 1.45, BZ + 0.03]} rotation={[0, 0, -0.3]} scale={0.5} phase={3.1} />
      {/* left wall */}
      <Web position={[LX, 4.95, -3.45]} rotation={toL} size={0.75} />
      <Poster kind="house" position={[LX, 2.7, -2.2]} rotation={toL} size={[0.7, 0.93]} />
      <Bat position={[LX + 0.03, 3.75, -1.35]} rotation={[0, Math.PI / 2, 0.3]} scale={0.8} phase={0.2} />
      <Bat position={[LX + 0.03, 4.1, -2.85]} rotation={[0, Math.PI / 2, -0.25]} scale={0.6} phase={1.7} />
      <Bat position={[LX + 0.03, 3.45, -0.6]} rotation={[0, Math.PI / 2, 0.1]} scale={0.55} phase={2.9} />
      <Pennants text="SPOOKY" a={[LX + 0.01, 4.55, -3.3]} b={[LX + 0.01, 4.5, -0.6]} />
      {/* right wall */}
      <Pennants text="BOO!" a={[RX - 0.01, 4.5, -3.4]} b={[RX - 0.01, 4.45, -1.6]} />
      <Web position={[RX, 4.95, -3.98]} rotation={[0, -Math.PI / 2, -Math.PI / 2]} size={0.6} />
      <Bat position={[RX - 0.03, 3.6, -2.4]} rotation={[0, -Math.PI / 2, -0.3]} scale={0.8} phase={0.9} />
      <Bat position={[RX - 0.03, 3.25, -1.6]} rotation={[0, -Math.PI / 2, 0.2]} scale={0.6} phase={2.2} />
      <Bat position={[RX - 0.03, 2.75, -2.9]} rotation={[0, -Math.PI / 2, 0.05]} scale={0.5} phase={3.6} />
      {/* a couple of real bats doing laps near the ceiling */}
      <FlyingBat center={[1.2, -1.6]} radius={1.9} height={4.35} speed={0.55} phase={0} scale={0.7} />
      <FlyingBat center={[-0.4, -1.2]} radius={1.3} height={4.1} speed={-0.7} phase={2} scale={0.55} />
    </group>
  );
}
