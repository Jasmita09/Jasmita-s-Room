import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { canvasTexture } from "./textures.js";

// The view through the window: autumn trees, drifting clouds, hot-air balloons, birds and falling leaves.
// Everything is lit by the time of day (bright by day, dim silhouettes at night).
const stripeTex = (cols) => canvasTexture(64, 16, (g, w, h) => { const n = cols.length * 2; for (let i = 0; i < n; i++) { g.fillStyle = cols[i % cols.length]; g.fillRect((i * w) / n, 0, w / n + 1, h); } });
const PROFILE = [[0.001, -0.47], [0.1, -0.42], [0.24, -0.25], [0.35, -0.02], [0.38, 0.16], [0.33, 0.34], [0.2, 0.47], [0.001, 0.52]].map(([x, y]) => new THREE.Vector2(x, y));
const LATHE = new THREE.LatheGeometry(PROFILE, 20);

function Balloon({ cols, z, y, scale, speed, phase, span }) {
  const g = useRef();
  const tex = useMemo(() => stripeTex(cols), [cols]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * speed + phase, o = g.current; if (!o) return;
    o.position.set(span[0] + (Math.sin(t) * 0.5 + 0.5) * (span[1] - span[0]), y + Math.sin(t * 7.3) * 0.08, z);
    o.rotation.y = t * 2;
  });
  return (
    <group ref={g} scale={scale}>
      <mesh geometry={LATHE}><meshStandardMaterial map={tex} emissive="#ffffff" emissiveMap={tex} roughness={0.7} /></mesh>
      {[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([a, b], i) => (
        <mesh key={i} position={[a * 0.07, -0.55, b * 0.07]} rotation={[b * 0.12, 0, -a * 0.12]}><cylinderGeometry args={[0.006, 0.006, 0.18, 3]} /><meshStandardMaterial color="#3a2a20" emissive="#3a2a20" /></mesh>
      ))}
      <mesh position={[0, -0.68, 0]}><boxGeometry args={[0.13, 0.1, 0.13]} /><meshStandardMaterial color="#8b5a2b" emissive="#8b5a2b" flatShading /></mesh>
      <mesh position={[0, -0.6, 0]}><sphereGeometry args={[0.03, 6, 5]} /><meshBasicMaterial color="#ffb84a" toneMapped={false} /></mesh>
    </group>
  );
}

function Cloud({ z, y, scale, speed, offset }) {
  const g = useRef();
  const puffs = [[0, 0, 0.32], [0.33, -0.05, 0.25], [-0.33, -0.06, 0.24], [0.15, 0.17, 0.22], [-0.16, 0.13, 0.2], [0.55, -0.1, 0.16], [-0.55, -0.1, 0.15]];
  useFrame(({ clock }) => { const o = g.current; if (o) o.position.x = -1.6 + ((clock.elapsedTime * speed + offset) % 6.6); });
  return (
    <group ref={g} position={[0, y, z]} scale={[scale * 1.3, scale * 0.8, scale * 0.6]}>
      {puffs.map(([x, yy, r], i) => <mesh key={i} position={[x, yy, 0]}><icosahedronGeometry args={[r, 1]} /><meshStandardMaterial color="#ffffff" emissive="#ffffff" flatShading transparent /></mesh>)}
    </group>
  );
}

function Birds() {
  const birds = useMemo(() => [[0, 0, 0], [-0.22, 0.08, 1.1], [-0.2, -0.09, 2.3], [-0.42, 0.15, 0.6], [-0.4, -0.16, 1.7]], []);
  const g = useRef(), wings = useRef([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime, o = g.current; if (!o) return;
    o.position.set(-1.2 + ((t * 0.22) % 6.2), 3.85 + Math.sin(t * 0.7) * 0.15, -6.0);
    wings.current.forEach((w, i) => { if (w) w.rotation.z = Math.sin(t * 9 + birds[i >> 1][2]) * 0.6 * (i % 2 ? -1 : 1); });
  });
  return (
    <group ref={g}>
      {birds.map(([x, y], i) => (
        <group key={i} position={[x, y, 0]}>
          {[1, -1].map((sd, j) => (
            <group key={j} ref={(el) => { wings.current[i * 2 + j] = el; }}>
              <mesh position={[sd * 0.045, 0, 0]}><boxGeometry args={[0.09, 0.012, 0.03]} /><meshStandardMaterial color="#2c2024" emissive="#2c2024" /></mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

function Tree({ x, z, h, cols }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h * 0.35, 0]}><cylinderGeometry args={[0.05, 0.09, h * 0.7, 5]} /><meshStandardMaterial color="#4a2e22" emissive="#4a2e22" flatShading /></mesh>
      {[[0, 0.84, 0, 0.19, 0], [0.11, 0.74, 0.05, 0.14, 1], [-0.11, 0.76, -0.04, 0.13, 2], [0.02, 0.98, 0.02, 0.11, 1]].map(([dx, dy, dz, r, c], i) => (
        <mesh key={i} position={[dx * h, dy * h, dz]}><icosahedronGeometry args={[r * h, 0]} /><meshStandardMaterial color={cols[c]} emissive={cols[c]} flatShading /></mesh>
      ))}
    </group>
  );
}

function Leaves() {
  const N = 12, refs = useRef([]);
  const L = useMemo(() => Array.from({ length: N }, (_, i) => ({ x: 0.25 + Math.random() * 2.7, ph: Math.random() * 2.5, sp: 0.18 + Math.random() * 0.14, c: ["#e07b39", "#c2452c", "#e8b34a", "#b8402c"][i % 4] })), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (!m) return; const l = L[i], k = (t * l.sp + l.ph) % 2.6;
      m.position.set(l.x + Math.sin(t * 1.4 + i) * 0.18, 4.5 - k, -4.55 - (i % 3) * 0.2);
      m.rotation.set(t * 2 + i, t * 1.3 + i, Math.sin(t * 2 + i));
    });
  });
  return L.map((l, i) => <mesh key={i} ref={(el) => { refs.current[i] = el; }}><planeGeometry args={[0.07, 0.05]} /><meshStandardMaterial color={l.c} emissive={l.c} side={THREE.DoubleSide} /></mesh>);
}

export function Outside({ sky }) {
  const root = useRef(), dayOnly = useRef(), mats = useRef(null);
  const day = sky.day;
  useFrame(() => {
    const r = root.current; if (!r) return;
    if (!mats.current) { mats.current = []; r.traverse((o) => { if (o.material) mats.current.push(o.material); }); }
    const glow = 0.1 + 0.55 * day;
    mats.current.forEach((m) => { if (m.emissiveIntensity !== undefined) m.emissiveIntensity = glow; if (m.transparent && m.opacity !== undefined && !m.map) m.opacity = 0.35 + 0.6 * day; });
    if (dayOnly.current) dayOnly.current.visible = day > 0.15;
  });
  const A = ["#e07b39", "#c2452c", "#e8b34a"], B = ["#b8402c", "#e8b34a", "#d9682e"], C = ["#e8b34a", "#e07b39", "#8f9a3c"];
  return (
    <group ref={root}>
      <Tree x={0.15} z={-5.2} h={3.0} cols={A} />
      <Tree x={0.85} z={-5.9} h={2.6} cols={C} />
      <Tree x={2.55} z={-5.8} h={2.7} cols={B} />
      <Tree x={3.25} z={-5.15} h={3.05} cols={A} />
      <Tree x={1.65} z={-7.0} h={1.75} cols={C} />
      <Leaves />
      <group ref={dayOnly}>
        <Cloud z={-7.1} y={4.15} scale={0.55} speed={0.05} offset={0.4} />
        <Cloud z={-7.2} y={3.75} scale={0.4} speed={0.035} offset={3.3} />
        <Cloud z={-7.05} y={4.4} scale={0.35} speed={0.06} offset={5.4} />
        <Balloon cols={["#c25934", "#f2c14e", "#7b2d42", "#fdf7f2"]} z={-6.5} y={3.5} scale={0.62} speed={0.045} phase={0} span={[0.55, 2.7]} />
        <Balloon cols={["#3d6e8c", "#fdf7f2", "#e07b39"]} z={-7.0} y={3.95} scale={0.36} speed={0.03} phase={2.2} span={[0.7, 2.8]} />
        <Birds />
      </group>
    </group>
  );
}
