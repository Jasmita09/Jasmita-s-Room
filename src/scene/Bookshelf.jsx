import React, { useMemo, useRef, useState } from "react";
import { playSwitch } from "../audio/keyClick.js";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SHELF, shelfTop } from "./layout.js";
import { rng, paintingTexture, canvasTexture } from "./textures.js";
import { useHover } from "./cursor.js";
import { READING_SHELF } from "../data/readingShelf.js";
import { Crisp } from "./PixelComposer.jsx";
import { JackOLantern } from "./JackOLantern.jsx";

// Terracotta, olive, cream and navy family + a few warm accents.
const BOOK_COLORS = ["#c25934", "#6b6b3a", "#e9dcc3", "#2a3550", "#7b2d42", "#d97d46", "#8b8a52", "#3d4c6e", "#b7a27e", "#a14a2c"];
const BY_ID = Object.fromEntries(READING_SHELF.map((b) => [b.id, b]));
const Steel = () => <meshStandardMaterial color="#1c1b1e" metalness={0.65} roughness={0.42} />;

function Frame() {
  const H = 4.9;
  const items = [];
  [SHELF.x0, SHELF.xm, SHELF.x1].forEach((x, i) => {
    [SHELF.zFront - 0.025, SHELF.zBack + 0.025].forEach((z, j) => {
      items.push(<mesh key={"p" + i + j} position={[x, H / 2, z]}><boxGeometry args={[0.045, H, 0.045]} /><Steel /></mesh>);
    });
  });
  // top rails
  [SHELF.zFront - 0.025, SHELF.zBack + 0.025].forEach((z, j) => {
    items.push(<mesh key={"r" + j} position={[(SHELF.x0 + SHELF.x1) / 2, H - 0.02, z]}><boxGeometry args={[SHELF.x1 - SHELF.x0, 0.04, 0.04]} /><Steel /></mesh>);
  });
  // industrial X-bracing on the back of each bay
  [[SHELF.x0, SHELF.xm], [SHELF.xm, SHELF.x1]].forEach(([a, b], i) => {
    const w = b - a, h = 4.7, len = Math.hypot(w, h), ang = Math.atan2(w, h);
    [ang, -ang].forEach((r, k) => {
      items.push(<mesh key={"x" + i + k} position={[(a + b) / 2, 2.45, SHELF.zBack + 0.012]} rotation={[0, 0, r]}><boxGeometry args={[0.014, len, 0.008]} /><Steel /></mesh>);
    });
  });
  return <group>{items}</group>;
}

function Boards() {
  return (
    <group>
      {SHELF.levels.map((y, i) => (
        <group key={i}>
          <mesh position={[(SHELF.x0 + SHELF.x1) / 2, y, SHELF.zBack + SHELF.depth / 2]}>
            <boxGeometry args={[SHELF.x1 - SHELF.x0 + 0.06, SHELF.board, SHELF.depth]} />
            <meshStandardMaterial color="#a0643a" roughness={0.7} />
          </mesh>
          <mesh position={[(SHELF.x0 + SHELF.x1) / 2, y - 0.03, SHELF.zFront - 0.01]}>
            <boxGeometry args={[SHELF.x1 - SHELF.x0 + 0.06, 0.018, 0.02]} /><Steel />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function BookMesh({ b }) {
  return (
    <group>
      <mesh position={[0, b.h / 2, 0]}><boxGeometry args={[b.w, b.h, b.d]} /><meshStandardMaterial color={b.color} roughness={0.8} /></mesh>
      {Array.from({ length: b.bands }).map((_, k) => (
        <mesh key={k} position={[0, b.h * (0.16 + k * 0.64), b.d / 2 + 0.002]}>
          <boxGeometry args={[b.w * 0.92, 0.016, 0.004]} /><meshStandardMaterial color={b.bandColor} />
        </mesh>
      ))}
    </group>
  );
}

function SpecialBook({ b, y, onBook }) {
  const g = useRef();
  const band = useRef();
  const [hover, bind] = useHover(true, "📖 " + b.special.title + " · click to open");
  const z0 = SHELF.zFront - b.d / 2 - 0.015;
  useFrame(({ clock }) => {
    if (!g.current) return;
    const tz = z0 + (hover ? 0.16 : 0);
    g.current.position.z += (tz - g.current.position.z) * 0.18;
    if (band.current) band.current.emissiveIntensity = hover ? 2.4 : 0.7 + Math.sin(clock.elapsedTime * 2.2 + b.x * 7) * 0.35;
  });
  return (
    <group ref={g} position={[b.x, y, z0]} {...bind} onClick={(e) => { e.stopPropagation(); onBook(b.special); }}>
      <mesh position={[0, b.h / 2, 0]}>
        <boxGeometry args={[b.w, b.h, b.d]} />
        <meshStandardMaterial color={b.color} roughness={0.7} emissive={b.color} emissiveIntensity={hover ? 0.3 : 0.06} />
      </mesh>
      <mesh position={[0, b.h / 2, 0.04]}><boxGeometry args={[b.w * 2, b.h * 1.15, b.d + 0.1]} /><meshBasicMaterial visible={false} /></mesh>
      <mesh position={[0, b.h * 0.84, b.d / 2 + 0.002]}>
        <boxGeometry args={[b.w * 0.94, 0.03, 0.004]} />
        <meshStandardMaterial ref={band} color="#ffd27a" emissive="#ffb84a" emissiveIntensity={0.8} toneMapped={false} />
      </mesh>
      <mesh position={[0, b.h * 0.18, b.d / 2 + 0.002]}><boxGeometry args={[b.w * 0.94, 0.012, 0.004]} /><meshStandardMaterial color="#ffd27a" /></mesh>
      <mesh position={[0, b.h * 0.5, b.d / 2 + 0.002]}><boxGeometry args={[b.w * 0.34, b.h * 0.4, 0.003]} /><meshStandardMaterial color={b.special.accent} /></mesh>
    </group>
  );
}

function BookRow({ x0, x1, level, seed, specials = {}, onBook }) {
  const books = useMemo(() => {
    const r = rng(seed);
    const out = [];
    let x = x0, i = 0;
    for (;;) {
      const sp = specials[i];
      const w = sp ? 0.095 : 0.045 + r() * 0.055;
      if (x + w > x1) break;
      const h = sp ? 0.62 : 0.4 + r() * 0.24;
      const d = sp ? 0.36 : 0.27 + r() * 0.09;
      const color = sp ? BY_ID[sp].color : BOOK_COLORS[(r() * BOOK_COLORS.length) | 0];
      out.push({ i, x: x + w / 2, w, h, d, color, bands: sp ? 0 : r() < 0.6 ? 1 + ((r() * 2) | 0) : 0,
        bandColor: r() < 0.5 ? "#e8c27a" : "#2c2024", special: sp ? BY_ID[sp] : null });
      x += w + (r() < 0.15 ? 0.012 : 0.003);
      i++;
    }
    return out;
  }, [x0, x1, seed]);
  const y = shelfTop(level);
  return (
    <group>
      {books.map((b) => b.special
        ? <SpecialBook key={b.i} b={b} y={y} onBook={onBook} />
        : <group key={b.i} position={[b.x, y, SHELF.zFront - b.d / 2 - 0.015]}><BookMesh b={b} /></group>)}
    </group>
  );
}

function BookStack({ x, level, seed, count = 3, big, withVase }) {
  const items = useMemo(() => {
    const r = rng(seed);
    let y = 0;
    return Array.from({ length: count }, () => {
      const h = big ? 0.07 + r() * 0.03 : 0.045 + r() * 0.03;
      const it = { y: y + h / 2, h, w: (big ? 0.42 : 0.3) + r() * 0.08, d: 0.24 + r() * 0.07, ry: (r() - 0.5) * 0.25, color: BOOK_COLORS[(r() * BOOK_COLORS.length) | 0] };
      y += h;
      return it;
    });
  }, [seed, count, big]);
  const top = items.reduce((a, b) => Math.max(a, b.y + b.h / 2), 0);
  return (
    <group position={[x, shelfTop(level), SHELF.zFront - 0.2]}>
      {items.map((b, i) => (
        <group key={i} position={[0, b.y, 0]} rotation={[0, b.ry, 0]}>
          <mesh><boxGeometry args={[b.w, b.h, b.d]} /><meshStandardMaterial color={b.color} roughness={0.8} /></mesh>
          <mesh position={[0, 0, b.d / 2 - 0.004]}><boxGeometry args={[b.w * 0.94, b.h * 0.7, 0.012]} /><meshStandardMaterial color="#f3e7d2" /></mesh>
        </group>
      ))}
      {withVase && <Vase x={0} y={top} z={0} size={0.7} color="#d97d46" />}
    </group>
  );
}

const VASE_PROFILE = [[0, 0], [0.055, 0], [0.075, 0.03], [0.085, 0.09], [0.075, 0.16], [0.045, 0.22], [0.035, 0.27], [0.045, 0.3]];
function Vase({ x, y, z, level = 0, size = 1, color, branches }) {
  const geo = useMemo(() => new THREE.LatheGeometry(VASE_PROFILE.map(([a, b]) => new THREE.Vector2(a * size, b * size)), 9), [size]);
  const pos = [x, y === undefined ? shelfTop(level) : y, z === undefined ? SHELF.zBack + 0.24 : z];
  return (
    <group position={pos}>
      <mesh geometry={geo}><meshStandardMaterial color={color} roughness={0.35} flatShading side={THREE.DoubleSide} /></mesh>
      {branches && [[-0.28, 0], [0.12, 0.7], [0.32, -0.6]].map(([rz, ry], i) => (
        <group key={i} position={[0, 0.27 * size, 0]} rotation={[0, ry, rz]}>
          <mesh position={[0, 0.18, 0]}><cylinderGeometry args={[0.006, 0.009, 0.36, 4]} /><meshStandardMaterial color="#5a3a24" /></mesh>
          {[0.12, 0.22, 0.31].map((h, j) => (
            <mesh key={j} position={[j % 2 ? 0.03 : -0.03, h, 0]} rotation={[0, 0, j % 2 ? -0.6 : 0.6]}>
              <boxGeometry args={[0.055, 0.028, 0.005]} /><meshStandardMaterial color={["#d97d46", "#c25934", "#e0a040"][j]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function FramedArt({ x, level, variant }) {
  const tex = useMemo(() => paintingTexture(variant), [variant]);
  return (
    <group position={[x, shelfTop(level), SHELF.zBack + 0.1]} rotation={[-0.1, 0, 0]}>
      <mesh position={[0, 0.31, 0]}><boxGeometry args={[0.5, 0.62, 0.03]} /><meshStandardMaterial color="#3b2a22" /></mesh>
      <mesh position={[0, 0.31, 0.016]}><planeGeometry args={[0.42, 0.54]} /><meshStandardMaterial color="#f4ead9" /></mesh>
      <mesh position={[0, 0.31, 0.018]}><planeGeometry args={[0.32, 0.42]} /><meshStandardMaterial map={tex} /></mesh>
    </group>
  );
}

function ReadingLamp({ x, level }) {
  const brass = <meshStandardMaterial color="#b08a4a" metalness={0.6} roughness={0.35} />;
  const [on, setOn] = useState(true);
  const [, bind] = useHover(true, on ? "\u{1F4A1} Click to switch the reading lamp off" : "\u{1F4A1} Click to switch the reading lamp on");
  const shade = useRef(), bulb = useRef(), light = useRef(), lvl = useRef(1);
  useFrame((_, dt) => {
    lvl.current += ((on ? 1 : 0) - lvl.current) * Math.min(1, dt * 14);
    const l = lvl.current;
    if (light.current) light.current.intensity = 2.4 * l;
    if (shade.current) shade.current.emissiveIntensity = 0.05 + 0.85 * l;
    if (bulb.current) bulb.current.emissiveIntensity = 0.02 + 3 * l;
  });
  return (
    <group position={[x, shelfTop(level), SHELF.zBack + 0.24]} {...bind} onClick={(e) => { e.stopPropagation(); setOn(!on); playSwitch(); }}>
      <mesh position={[0, 0.26, 0]}><boxGeometry args={[0.3, 0.52, 0.3]} /><meshBasicMaterial visible={false} /></mesh>
      <mesh position={[0, 0.012, 0]}><cylinderGeometry args={[0.07, 0.08, 0.024, 10]} />{brass}</mesh>
      <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.009, 0.009, 0.38, 6]} />{brass}</mesh>
      <mesh position={[0, 0.42, 0]}><cylinderGeometry args={[0.07, 0.13, 0.14, 10, 1, true]} /><meshStandardMaterial ref={shade} color="#f3dfbf" emissive="#ffc77d" emissiveIntensity={0.9} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 0.4, 0]}><sphereGeometry args={[0.03, 8, 6]} /><meshStandardMaterial ref={bulb} color="#fff2cc" emissive="#ffd28a" emissiveIntensity={3} toneMapped={false} /></mesh>
      <pointLight ref={light} position={[0, 0.36, 0.06]} intensity={2.4} distance={2.4} decay={2} color="#ffc27a" />
    </group>
  );
}

// Only the books I have actually read live on the shelf; empty spots get a "Coming soon" chalkboard.
const readBook = (id, x, i) => ({ i, x, w: 0.095, h: 0.62, d: 0.36, color: BY_ID[id].color, bands: 0, bandColor: "#e8c27a", special: BY_ID[id] });
function Bookend({ x, y, flip }) {
  return (
    <group position={[x, y, SHELF.zFront - 0.2]} scale={[flip ? -1 : 1, 1, 1]}>
      <mesh position={[0.02, 0.006, 0]}><boxGeometry args={[0.06, 0.012, 0.2]} /><Steel /></mesh>
      <mesh position={[0, 0.11, 0]}><boxGeometry args={[0.012, 0.22, 0.2]} /><Steel /></mesh>
      <mesh position={[-0.008, 0.18, 0]}><sphereGeometry args={[0.022, 8, 6]} /><meshStandardMaterial color="#e8772e" roughness={0.6} /></mesh>
    </group>
  );
}
function ReadBooks({ ids, x, level, onBook }) {
  const y = shelfTop(level), gap = 0.11;
  return (
    <group>
      <Bookend x={x - 0.08} y={y} flip />
      {ids.map((id, i) => <SpecialBook key={id} b={readBook(id, x + i * gap, i)} y={y} onBook={onBook} />)}
      <Bookend x={x + (ids.length - 1) * gap + 0.08} y={y} />
    </group>
  );
}
let soonTex = null;
function soonTexture() {
  if (soonTex) return soonTex;
  soonTex = canvasTexture(320, 240, (g, w, h) => {
    g.fillStyle = "#1f2622"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) { g.fillStyle = "rgba(255,255,255," + Math.random() * 0.06 + ")"; g.fillRect(Math.random() * w, Math.random() * h, 3, 1); }
    g.textAlign = "center"; g.fillStyle = "#f4ead9";
    g.font = "700 54px Georgia, 'Times New Roman', serif"; g.fillText("Coming", w / 2, 84); g.fillText("soon", w / 2, 142);
    g.font = "italic 700 24px Georgia, serif"; g.fillStyle = "#ffd29a"; g.fillText("\u2726 my next reads \u2726", w / 2, 186);
    g.strokeStyle = "rgba(244,234,217,0.7)"; g.lineWidth = 3; g.beginPath(); g.moveTo(70, 156); g.quadraticCurveTo(160, 166, 250, 154); g.stroke();
    g.fillStyle = "#e8772e"; g.beginPath(); g.ellipse(w - 42, h - 34, 16, 13, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#4a6b2a"; g.fillRect(w - 44, h - 52, 4, 7);
    g.fillStyle = "#d9cfc4"; g.fillRect(14, h - 22, 40, 8);
  }, { pixel: false, hd: 3 });
  return soonTex;
}
function ComingSoon({ x, level, w = 0.52, h = 0.39 }) {
  const tex = useMemo(soonTexture, []);
  return (
    <Crisp><group position={[x, shelfTop(level), SHELF.zBack + 0.17]} rotation={[-0.12, 0, 0]}>
      <mesh position={[0, h / 2 + 0.025, 0]}><boxGeometry args={[w + 0.05, h + 0.05, 0.025]} /><meshStandardMaterial color="#6b4630" roughness={0.8} /></mesh>
      <mesh position={[0, h / 2 + 0.025, 0.0135]}><planeGeometry args={[w, h]} /><meshStandardMaterial map={tex} roughness={0.95} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.08} /></mesh>
      <mesh position={[0, 0.02, 0.04]}><boxGeometry args={[w * 0.9, 0.02, 0.05]} /><meshStandardMaterial color="#5a3a2c" /></mesh>
    </group></Crisp>
  );
}

export function Bookshelf({ onBook, onShelf }) {
  const b1 = SHELF.x0 + 0.04, b2 = SHELF.xm + 0.03, b2e = SHELF.x1 - 0.04;
  return (
    <group onClick={(e) => { e.stopPropagation(); onShelf && onShelf(); }}>
      <Frame />
      <Boards />
      {/* L0 */}
      <ReadBooks ids={["ai2040"]} x={b1 + 0.16} level={0} onBook={onBook} />
      <ComingSoon x={b1 + 0.78} level={0} w={0.62} />
      <ComingSoon x={b2 + 0.42} level={0} w={0.56} />
      <Vase x={b2 + 1.05} level={0} size={1.6} color="#c25934" branches />
      {/* L1 */}
      <Vase x={b1 + 0.22} level={1} size={1} color="#7b2d42" />
      <ComingSoon x={b1 + 0.8} level={1} w={0.6} />
      <FramedArt x={b2 + 0.38} level={1} variant={0} />
      <JackOLantern position={[b2 + 1.05, shelfTop(1), SHELF.zBack + 0.24]} scale={0.85} seed={3} face="spooky" />
      {/* L2: the middle shelf; the cat's bed sits in the right bay */}
      <ReadBooks ids={["attention"]} x={b1 + 0.16} level={2} onBook={onBook} />
      <ComingSoon x={b1 + 0.8} level={2} w={0.6} />
      <Vase x={b2 + 0.16} level={2} size={0.8} color="#efe3cc" />
      {/* L3 */}
      <ReadingLamp x={b1 + 0.24} level={3} />
      <ComingSoon x={b1 + 0.88} level={3} w={0.56} />
      <ReadBooks ids={["warfield", "duckdb"]} x={b2 + 0.18} level={3} onBook={onBook} />
      <ComingSoon x={b2 + 0.78} level={3} w={0.5} />
      <Vase x={b2e - 0.12} level={3} size={0.9} color="#d97d46" />
      {/* L4 */}
      <FramedArt x={b1 + 0.45} level={4} variant={1} />
      <Vase x={b1 + 1.05} level={4} size={1.2} color="#6b6b3a" />
      <ReadBooks ids={["mapreduce"]} x={b2 + 0.18} level={4} onBook={onBook} />
      <ComingSoon x={b2 + 0.8} level={4} w={0.62} />
      {/* L5 (short top shelf) */}
      <JackOLantern position={[b1 + 0.4, shelfTop(5), SHELF.zBack + 0.24]} scale={0.6} seed={5} face="happy" light={false} />
      <Vase x={b1 + 1.0} level={5} size={0.8} color="#33476b" />
      <Vase x={b2 + 0.5} level={5} size={0.75} color="#c25934" />
      <Vase x={b2 + 0.85} level={5} size={0.6} color="#efe3cc" />
    </group>
  );
}
