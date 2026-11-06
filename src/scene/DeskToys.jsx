import React, { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { bus } from "./bus.js";
import * as THREE from "three";
import { DESK } from "./layout.js";
import { useHover } from "./cursor.js";
import { Bubble } from "./Bubble.jsx";
import { Crisp } from "./PixelComposer.jsx";
import { canvasTexture } from "./textures.js";
import { playSip, playDrawer, playCard } from "../audio/keyClick.js";

// ─── Steaming mug: every click is a sip and a refill with the next seasonal drink ─────────
export const DRINKS = [
  { name: "Black Coffee", color: "#2a160e", line: "Mmm, strong black coffee..." },
  { name: "Matcha Latte", color: "#8db35e", line: "Mmm, creamy matcha latte~" },
  { name: "Hot Cider", color: "#b8641f", line: "Mmm, warm cider..." },
  { name: "Pumpkin Spice", color: "#d9843f", line: "Pumpkin spice season!" }
];
const N = 26;
const steamMat = () => new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, uniforms: { uScale: { value: 38 } },
  vertexShader: "attribute float alpha; varying float vA; uniform float uScale; void main(){ vA = alpha; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = uScale / -mv.z; gl_Position = projectionMatrix * mv; }",
  fragmentShader: "varying float vA; void main(){ gl_FragColor = vec4(1.0, 0.96, 0.9, vA * 0.6); }"
});
export function SteamMug() {
  const [i, setI] = useState(0), [say, setSay] = useState(null);
  const [, bind] = useHover(true, "\u2615 Take a sip");
  const mug = useRef(), tip = useRef(0), timer = useRef();
  const seeds = useMemo(() => Array.from({ length: N }, () => [Math.random(), Math.random() * 6.28, 0.7 + Math.random() * 0.6]), []);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    g.setAttribute("alpha", new THREE.BufferAttribute(new Float32Array(N), 1));
    return g;
  }, []);
  const mat = useMemo(steamMat, []);
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime, a = geo.attributes.position.array, al = geo.attributes.alpha.array;
    seeds.forEach(([o, ph, sp], k) => {
      const u = (o + t * 0.16 * sp) % 1;
      a[k * 3] = Math.sin(u * 8 + ph + t * 1.5) * 0.022 * (0.3 + u); a[k * 3 + 1] = 0.12 + u * 0.34; a[k * 3 + 2] = Math.cos(u * 5 + ph) * 0.014;
      al[k] = Math.sin(u * Math.PI) * (tip.current > 0 ? 0.3 : 1);
    });
    geo.attributes.position.needsUpdate = true; geo.attributes.alpha.needsUpdate = true;
    tip.current = Math.max(0, tip.current - dt * 1.3);
    if (mug.current) { const s = Math.sin(tip.current * Math.PI); mug.current.rotation.z = s * 0.55; mug.current.position.y = s * 0.07; }
  });
  const sip = (e) => {
    e && e.stopPropagation && e.stopPropagation(); playSip(); tip.current = 1;
    const n = (i + 1) % DRINKS.length; setI(n); setSay(DRINKS[i].line);
    clearTimeout(timer.current); timer.current = setTimeout(() => setSay(null), 2600);
  };
  const sipRef = useRef(); sipRef.current = sip;
  React.useEffect(() => bus.on("sip", () => sipRef.current()), []);
  return (
    <group position={[2.75, DESK.top, -2.72]}>
      <group ref={mug} {...bind} onClick={sip}>
        <mesh position={[0, 0.055, 0]}><cylinderGeometry args={[0.055, 0.05, 0.11, 12]} /><meshStandardMaterial color="#c25934" roughness={0.4} /></mesh>
        <mesh position={[0, 0.098, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.049, 12]} /><meshStandardMaterial color={DRINKS[i].color} roughness={0.25} /></mesh>
        <mesh position={[0.062, 0.058, 0]}><torusGeometry args={[0.03, 0.01, 6, 10]} /><meshStandardMaterial color="#c25934" /></mesh>
        <mesh position={[0, 0.12, 0]}><boxGeometry args={[0.2, 0.3, 0.2]} /><meshBasicMaterial visible={false} /></mesh>
      </group>
      <points geometry={geo} material={mat} />
      <Crisp><Bubble text={say} position={[-0.35, 0.7, 0.15]} scale={0.55} /></Crisp>
    </group>
  );
}

// ─── Top desk drawer with college artifacts ───────────────────────────────────────────
const cardTex = (title, lines, ink) => canvasTexture(200, 128, (g, w, h) => {
  g.fillStyle = "#fbf8ef"; g.fillRect(0, 0, w, h);
  g.strokeStyle = "#9cc0e0"; g.lineWidth = 1; for (let y = 34; y < h; y += 13) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  g.strokeStyle = "#e07a7a"; g.beginPath(); g.moveTo(0, 26); g.lineTo(w, 26); g.stroke();
  g.fillStyle = ink; g.font = "700 15px Georgia, serif"; g.fillText(title, 8, 20);
  g.font = "11px Georgia, serif"; lines.forEach((l, k) => g.fillText(l, 8, 44 + k * 13));
}, { pixel: false, hd: 3 });
const stickerTex = (bg, fg, txt, ring = "#fff") => canvasTexture(64, 64, (g, w) => {
  g.fillStyle = ring; g.beginPath(); g.arc(32, 32, 31, 0, 7); g.fill();
  g.fillStyle = bg; g.beginPath(); g.arc(32, 32, 27, 0, 7); g.fill();
  g.fillStyle = fg; g.font = "700 " + (txt.length > 5 ? 11 : 14) + "px Inter, Arial, sans-serif"; g.textAlign = "center"; g.fillText(txt, 32, 37);
}, { pixel: false, hd: 3 });
const cherryTex = () => canvasTexture(96, 64, (g, w, h) => {
  g.fillStyle = "#c2263f"; g.fillRect(0, 0, w, h); g.fillStyle = "#fdf7f2"; g.fillRect(0, 0, w, 10); g.fillRect(0, h - 8, w, 8);
  [[34, 36], [52, 40]].forEach(([cx, cy]) => { g.fillStyle = "#ff5a6e"; g.beginPath(); g.arc(cx, cy, 8, 0, 7); g.fill(); });
  g.strokeStyle = "#3f7a2a"; g.lineWidth = 2; g.beginPath(); g.moveTo(34, 29); g.quadraticCurveTo(44, 14, 56, 18); g.moveTo(52, 33); g.lineTo(56, 18); g.stroke();
  g.fillStyle = "#fff"; g.font = "700 9px Inter, Arial"; g.textAlign = "center"; g.fillText("GUMMY CHERRIES", w / 2, 8.5);
}, { pixel: false, hd: 3 });

export function TopDrawer({ onItems }) {
  const { x, z, depth, width } = DESK, right = x + width / 2;
  const [open, setOpen] = useState(false);
  const g = useRef(), inner = useRef();
  const [, bind] = useHover(true, open ? "Close the drawer" : "\u{1F5C4}\uFE0F Open the top drawer");
  const [, bindIn] = useHover(open, "Look at the college artifacts");
  const T = useMemo(() => ({
    calc: cardTex("Calc I cheat sheet", ["d/dx x\u207F = n\u00B7x\u207F\u207B\u00B9", "d/dx e\u02E3 = e\u02E3,  d/dx ln x = 1/x", "\u222B x\u207F dx = x\u207F\u207A\u00B9/(n+1) + C", "(f\u2218g)\u2032 = f\u2032(g)\u00B7g\u2032", "(fg)\u2032 = f\u2032g + fg\u2032", "lim sin x / x = 1"], "#2a3550"),
    bigo: cardTex("Big-O cheat sheet", ["O(1)        hash lookup", "O(log n)   binary search", "O(n)        linear scan", "O(n log n) merge sort", "O(n\u00B2)       nested loops", "O(2\u207F)       all subsets"], "#7b2d42"),
    st: [stickerTex("#fff000", "#1a1a1a", "DuckDB", "#1a1a1a"), stickerTex("#3572a5", "#ffd43b", "Python"), stickerTex("#ee4c2c", "#fff", "PyTorch"), stickerTex("#1a1a1a", "#ffc93c", "Linux")],
    cherry: cherryTex()
  }), []);
  useFrame((_, dt) => { if (g.current) g.current.position.z = THREE.MathUtils.damp(g.current.position.z, open ? 0.5 : 0, 7, dt); if (inner.current && g.current) inner.current.visible = g.current.position.z > 0.04; });
  const toggle = (e) => { e.stopPropagation(); playDrawer(); setOpen((o) => !o); };
  const peek = (e) => { if (!open) return; e.stopPropagation(); onItems && onItems(); };
  const flat = [-Math.PI / 2, 0, 0], wood = <meshStandardMaterial color="#7a4a2a" />;
  return (
    <group ref={g}>
      <group position={[right - 0.45, 0.77, z + depth / 2 - 0.04]}>
        <group {...bind} onClick={toggle}>
          <mesh><boxGeometry args={[0.78, 0.26, 0.02]} /><meshStandardMaterial color="#9a6038" /></mesh>
          <mesh position={[0, 0, 0.02]}><boxGeometry args={[0.16, 0.025, 0.025]} /><meshStandardMaterial color="#c9a56a" metalness={0.7} roughness={0.3} /></mesh>
        </group>
        <mesh position={[0, -0.11, -0.28]}><boxGeometry args={[0.72, 0.012, 0.54]} />{wood}</mesh>
        {[-1, 1].map((s) => <mesh key={s} position={[s * 0.355, -0.04, -0.28]}><boxGeometry args={[0.012, 0.15, 0.54]} />{wood}</mesh>)}
        <mesh position={[0, -0.04, -0.55]}><boxGeometry args={[0.72, 0.15, 0.012]} />{wood}</mesh>
        <Crisp>
          <group ref={inner} {...bindIn} onClick={peek}>
            <mesh position={[-0.17, -0.098, -0.2]} rotation={[-Math.PI / 2, 0, 0.12]}><planeGeometry args={[0.3, 0.19]} /><meshStandardMaterial map={T.calc} /></mesh>
            <mesh position={[-0.12, -0.095, -0.38]} rotation={[-Math.PI / 2, 0, -0.1]}><planeGeometry args={[0.3, 0.19]} /><meshStandardMaterial map={T.bigo} /></mesh>
            {T.st.map((tx, k) => <mesh key={k} position={[0.08 + (k % 2) * 0.1, -0.096 + k * 0.0004, -0.12 - Math.floor(k / 2) * 0.1]} rotation={[-Math.PI / 2, 0, k * 0.5]}><circleGeometry args={[0.042, 20]} /><meshStandardMaterial map={tx} /></mesh>)}
            <mesh position={[0.24, -0.085, -0.38]} rotation={[0, 0.3, 0]}><boxGeometry args={[0.15, 0.02, 0.1]} /><meshStandardMaterial color="#c2263f" /></mesh>
            <mesh position={[0.24, -0.074, -0.38]} rotation={[-Math.PI / 2, 0, 0.3]}><planeGeometry args={[0.15, 0.1]} /><meshStandardMaterial map={T.cherry} /></mesh>
          </group>
        </Crisp>
      </group>
    </group>
  );
}

// ─── Data Science tarot deck ──────────────────────────────────────────────────────────
const backTex = () => canvasTexture(80, 124, (g, w, h) => {
  g.fillStyle = "#3b1f4a"; g.fillRect(0, 0, w, h);
  g.strokeStyle = "#e3b95a"; g.lineWidth = 3; g.strokeRect(5, 5, w - 10, h - 10); g.lineWidth = 1; g.strokeRect(10, 10, w - 20, h - 20);
  g.fillStyle = "#e3b95a"; g.beginPath(); g.arc(40, 56, 16, 0, 7); g.fill(); g.fillStyle = "#3b1f4a"; g.beginPath(); g.arc(47, 52, 14, 0, 7); g.fill();
  g.fillStyle = "#e3b95a"; [[22, 26], [58, 30], [24, 92], [56, 96], [40, 104]].forEach(([sx, sy]) => g.fillRect(sx - 1, sy - 1, 3, 3));
  g.font = "700 9px Georgia, serif"; g.textAlign = "center"; g.fillText("ORACLE", 40, 88);
}, { pixel: false, hd: 3 });
export function TarotDeck({ onDraw }) {
  const [hover, bind] = useHover(true, "\u{1F52E} Draw today\u2019s Data Science Oracle card");
  const back = useMemo(backTex, []), top = useRef();
  useFrame(({ clock }) => { if (top.current) top.current.position.y = 0.03 + (hover ? 0.025 + Math.sin(clock.elapsedTime * 4) * 0.005 : 0); });
  return (
    <group position={[0.82, DESK.top, -3.34]} rotation={[0, -0.3, 0]} {...bind} onClick={(e) => { e.stopPropagation(); playCard(); onDraw && onDraw(); }}>
      {[0, 1, 2, 3, 4, 5].map((k) => <mesh key={k} position={[(k % 2) * 0.002, 0.002 + k * 0.0045, 0]}><boxGeometry args={[0.13, 0.0045, 0.2]} /><meshStandardMaterial color={k % 2 ? "#e9dcc3" : "#d8c9ad"} /></mesh>)}
      <mesh ref={top} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}><planeGeometry args={[0.13, 0.2]} /><meshStandardMaterial map={back} emissive="#ffffff" emissiveMap={back} emissiveIntensity={0.15} /></mesh>
      <mesh position={[0, 0.06, 0]}><boxGeometry args={[0.2, 0.14, 0.26]} /><meshBasicMaterial visible={false} /></mesh>
    </group>
  );
}
