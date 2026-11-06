import React, { useMemo, useRef, useState } from "react";
import { Bubble } from "./Bubble.jsx";
import { Crisp } from "./PixelComposer.jsx";
import { playSwitch, playChime } from "../audio/keyClick.js";
import { useFrame, useThree } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { skylineTexture, floorTexture, rugTexture } from "./textures.js";
import { JackOLantern } from "./JackOLantern.jsx";
import { useSkyTexture } from "./skyClock.js";
import { halloweenRugTexture } from "./WallDecor.jsx";
import { useHover } from "./cursor.js";
import { bus } from "./bus.js";

const WALL = "#7d4f4c";
const FRAME = "#3a2420";
const WIN = { x0: 0.1, x1: 3.1, y0: 2.2, y1: 4.3 };

function BackWall() {
  const pieces = [
    [(-5 + WIN.x0) / 2, 2.5, WIN.x0 + 5, 5],
    [(WIN.x1 + 5) / 2, 2.5, 5 - WIN.x1, 5],
    [(WIN.x0 + WIN.x1) / 2, WIN.y0 / 2, WIN.x1 - WIN.x0, WIN.y0],
    [(WIN.x0 + WIN.x1) / 2, (WIN.y1 + 5) / 2, WIN.x1 - WIN.x0, 5 - WIN.y1]
  ];
  return pieces.map(([x, y, w, h], i) => (
    <mesh key={i} position={[x, y, -4.05]}><boxGeometry args={[w, h, 0.1]} /><meshStandardMaterial color={WALL} roughness={0.95} /></mesh>
  ));
}

// Click either curtain to draw both closed (or open them again).
function Curtain({ x, side, closed, onToggle }) {
  const g = useRef(), folds = useRef([]), t = useRef(closed ? 1 : 0);
  const [, bind] = useHover(true, closed ? "Click to open the curtains" : "Click to close the curtains");
  const cx = side < 0 ? 0.78 : 2.42;
  useFrame(({ clock }, dt) => {
    t.current += ((closed ? 1 : 0) - t.current) * Math.min(1, dt * 3.2);
    const k = t.current, o = g.current; if (!o) return;
    o.position.x = x + (cx - x) * k;
    o.position.z = -3.86 + 0.21 * k;
    folds.current.forEach((f, i) => {
      if (!f) return;
      f.position.x = (i - 1.5) * (0.11 + 0.31 * k);
      f.scale.x = 1 + 1.9 * k;
      f.rotation.z = Math.sin(clock.elapsedTime * 1.2 + i * 1.7) * 0.008;
    });
  });
  return (
    <group ref={g} position={[x, 3.15, -3.86]} {...bind} onClick={(e) => { e.stopPropagation(); onToggle && onToggle(); }}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} ref={(el) => { folds.current[i] = el; }} position={[(i - 1.5) * 0.11, 0, i % 2 ? 0.03 : 0]}>
          <cylinderGeometry args={[0.07, 0.08, 2.7, 6]} />
          <meshStandardMaterial color={i % 2 ? "#6a2538" : "#7b2d42"} flatShading roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

const LIGHT_MODES = ["warm", "twinkle", "spooky", "off"];
const LIGHT_PAL = { warm: ["#ffcf7a", "#ff8f5a", "#fdf7f2"], twinkle: ["#ffcf7a", "#ff8f5a", "#fdf7f2"], spooky: ["#a35cff", "#7dff6a", "#ff7a1a"], off: ["#5a4a40", "#5a4a40", "#5a4a40"] };
function StringLights() {
  const [mode, setMode] = useState(0);
  const [hover, bind] = useHover(true, "\u2728 Click to change the fairy lights");
  const mats = useRef([]);
  const col = useMemo(() => new THREE.Color(), []);
  const bulbs = useMemo(() => {
    const out = [];
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      out.push([-0.3 + t * 3.8, 4.48 - Math.sin(t * Math.PI) * 0.16, -3.84]);
    }
    return out;
  }, []);
  const wire = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(bulbs.map((b) => new THREE.Vector3(b[0], b[1] + 0.03, b[2]))), 40, 0.006, 4), [bulbs]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime, m = LIGHT_MODES[mode], pal = LIGHT_PAL[m];
    mats.current.forEach((mat, i) => {
      if (!mat) return;
      let k = 2.2;
      if (m === "twinkle") k = 0.4 + 2.4 * Math.max(0, Math.sin(t * (1.7 + (i % 5) * 0.45) + i * 2.1)) ** 2;
      if (m === "spooky") { const ph = (t * 2.2 - i * 0.45) % 3; k = ph < 1 ? 3.0 : 0.6; }
      if (m === "off") k = 0;
      col.set(pal[i % 3]); mat.color.copy(col); mat.emissive.copy(col);
      mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, k + (hover && m !== "off" ? 0.4 : 0), 0.25);
    });
  });
  return (
    <group>
      <mesh geometry={wire}><meshStandardMaterial color="#2a1a1e" /></mesh>
      {bulbs.map((p, i) => (
        <mesh key={i} position={p}><sphereGeometry args={[0.028, 6, 5]} /><meshStandardMaterial ref={(el) => (mats.current[i] = el)} color="#ffcf7a" emissive="#ffcf7a" emissiveIntensity={2.2} toneMapped={false} /></mesh>
      ))}
      <mesh position={[1.6, 4.42, -3.8]} {...bind} onClick={(e) => { e.stopPropagation(); playSwitch(); setMode((v) => (v + 1) % LIGHT_MODES.length); }}>
        <boxGeometry args={[4.0, 0.3, 0.16]} /><meshBasicMaterial visible={false} />
      </mesh>
    </group>
  );
}

function WallClock() {
  const hr = useRef(); const mn = useRef(); const sw = useRef(0);
  const [say, setSay] = useState(null);
  const [, bind] = useHover(true, "\u{1F570}\uFE0F What time is it?");
  const timer = useRef();
  useFrame((_, dt) => {
    const d = new Date();
    const m = d.getMinutes() + d.getSeconds() / 60;
    const h = (d.getHours() % 12) + m / 60;
    sw.current = Math.max(0, sw.current - dt);
    const wob = Math.sin(sw.current * 18) * sw.current * 0.25;
    if (mn.current) mn.current.rotation.z = -(m / 60) * Math.PI * 2 + wob;
    if (hr.current) hr.current.rotation.z = -(h / 12) * Math.PI * 2 - wob;
  });
  const ring = (e) => {
    e.stopPropagation(); playChime(); sw.current = 1;
    const d = new Date(), hh = d.getHours(), h12 = hh % 12 || 12, mm = String(d.getMinutes()).padStart(2, "0");
    const part = hh < 5 ? "witching hour!" : hh < 12 ? "good morning!" : hh < 17 ? "good afternoon!" : hh < 21 ? "good evening!" : "spooky night~";
    setSay(`${h12}:${mm} ${hh < 12 ? "AM" : "PM"} \u00b7 ${part}`);
    clearTimeout(timer.current); timer.current = setTimeout(() => setSay(null), 2600);
  };
  return (
    <group position={[4.1, 3.5, -3.97]}>
      <group {...bind} onClick={ring}>
      <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.3, 0.3, 0.05, 16]} /><meshStandardMaterial color="#2c2024" /></mesh>
      <mesh position={[0, 0, 0.027]}><circleGeometry args={[0.26, 16]} /><meshStandardMaterial color="#f4ead9" /></mesh>
      </group>
      <group ref={hr} position={[0, 0, 0.03]}><mesh position={[0, 0.07, 0]}><boxGeometry args={[0.02, 0.14, 0.005]} /><meshStandardMaterial color="#2c2024" /></mesh></group>
      <group ref={mn} position={[0, 0, 0.034]}><mesh position={[0, 0.1, 0]}><boxGeometry args={[0.012, 0.2, 0.005]} /><meshStandardMaterial color="#c25934" /></mesh></group>
      <Crisp><Bubble text={say} position={[-0.8, -0.42, 0.3]} scale={0.5} /></Crisp>
    </group>
  );
}

function RugClick({ children }) {
  const [, bind] = useHover(true, "\u{1F9F6} Drop a yarn ball for the kitty");
  const drop = (e) => {
    e.stopPropagation();
    let x = THREE.MathUtils.clamp(e.point.x, -1.5, 2.3), z = THREE.MathUtils.clamp(e.point.z, -2.1, 0.3);
    if (Math.hypot(x - 1.75, z + 2.0) < 0.65) z = -1.3;
    bus.emit("yarn", { x, z });
  };
  return <group {...bind} onClick={drop}>{children}</group>;
}

export function Room({ sky, curtainsClosed = false, onCurtains }) {
  const dpr = useThree((st) => st.viewport.dpr);
  const skyTex = useSkyTexture(sky);
  const floor = useMemo(floorTexture, []);
  const rug = useMemo(halloweenRugTexture, []);
  const cx = (WIN.x0 + WIN.x1) / 2, cy = (WIN.y0 + WIN.y1) / 2;
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 1.5]}><planeGeometry args={[10, 11]} /><meshStandardMaterial map={floor} roughness={0.9} /></mesh>
      <RugClick><mesh rotation-x={-Math.PI / 2} position={[0.4, 0.005, -0.9]}><planeGeometry args={[4.2, 2.8]} /><meshStandardMaterial map={rug} roughness={1} /></mesh></RugClick>
      <mesh rotation-x={Math.PI / 2} position={[0, 5, 1.5]}><planeGeometry args={[10, 11]} /><meshStandardMaterial color="#3e2a30" /></mesh>
      <mesh rotation-y={Math.PI / 2} position={[-5, 2.5, 1.5]}><planeGeometry args={[11, 5]} /><meshStandardMaterial color={WALL} roughness={0.95} /></mesh>
      <mesh rotation-y={-Math.PI / 2} position={[5, 2.5, 1.5]}><planeGeometry args={[11, 5]} /><meshStandardMaterial color={WALL} roughness={0.95} /></mesh>
      <BackWall />
      <mesh position={[0, 0.06, -3.98]}><boxGeometry args={[10, 0.12, 0.04]} /><meshStandardMaterial color="#4a2c28" /></mesh>
      <mesh position={[-4.98, 0.06, 1.5]}><boxGeometry args={[0.04, 0.12, 11]} /><meshStandardMaterial color="#4a2c28" /></mesh>

      {/* window: sky, frame, muntins, sill */}
      <mesh position={[1.6, 3.2, -7.5]}><planeGeometry args={[14, 5.6]} /><meshBasicMaterial map={skyTex} fog={false} toneMapped={false} /></mesh>
      {[[cx, WIN.y1, WIN.x1 - WIN.x0 + 0.16, 0.08], [cx, WIN.y0, WIN.x1 - WIN.x0 + 0.16, 0.08], [cx, cy, WIN.x1 - WIN.x0, 0.04]].map(([x, y, w, h], i) => (
        <mesh key={"h" + i} position={[x, y, -4.0]}><boxGeometry args={[w, h, 0.14]} /><meshStandardMaterial color={FRAME} /></mesh>
      ))}
      {[[WIN.x0, 0.08], [WIN.x1, 0.08], [cx, 0.04]].map(([x, w], i) => (
        <mesh key={"v" + i} position={[x, cy, -4.0]}><boxGeometry args={[w, WIN.y1 - WIN.y0, 0.14]} /><meshStandardMaterial color={FRAME} /></mesh>
      ))}
      <mesh position={[cx, WIN.y0 - 0.02, -3.86]}><boxGeometry args={[3.4, 0.06, 0.3]} /><meshStandardMaterial color="#5a3a2c" /></mesh>
      <JackOLantern position={[2.55, WIN.y0 + 0.01, -3.85]} scale={0.55} seed={9} face="happy" light={false} />
      <mesh position={[cx, 4.56, -3.86]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.02, 0.02, 4.2, 6]} /><meshStandardMaterial color="#1c1b1e" metalness={0.6} /></mesh>
      <Curtain x={-0.22} side={-1} closed={curtainsClosed} onToggle={onCurtains} />
      <Curtain x={3.42} side={1} closed={curtainsClosed} onToggle={onCurtains} />
      <StringLights />
      <WallClock />

      {/* floating dust in the amber light */}
      <Sparkles count={170} scale={[9.5, 4.6, 8]} position={[0, 2.4, 0]} size={1.1 / dpr} speed={0.22} opacity={0.55} color="#f6c88f" noise={0.8} />
    </group>
  );
}
